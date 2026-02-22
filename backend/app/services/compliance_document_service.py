from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, UploadFile

from ..core.database import get_mongo

try:
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket
except Exception:  # pragma: no cover - optional dependency
    AsyncIOMotorGridFSBucket = None


class ComplianceDocumentService:
    """Persist compliance cases and document uploads in MongoDB/GridFS."""

    MAX_UPLOAD_BYTES = 10 * 1024 * 1024

    def _collection(self):
        db = get_mongo()
        return db["compliance_cases"] if db is not None else None

    def _gridfs(self):
        db = get_mongo()
        if db is None or AsyncIOMotorGridFSBucket is None:
            return None
        return AsyncIOMotorGridFSBucket(db, bucket_name="compliance_docs")

    def _to_object_id(self, value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception as exc:  # pragma: no cover - invalid IDs
            raise HTTPException(status_code=400, detail="Invalid compliance_case_id") from exc

    async def create_case(self, request_payload: dict, required_documents: list[dict]) -> Optional[str]:
        collection = self._collection()
        if collection is None:
            return None

        now = datetime.now(timezone.utc)
        normalized_docs = []
        for doc in required_documents:
            name = str(doc.get("name", "")).strip()
            if not name:
                continue
            normalized_docs.append(
                {
                    "name": name,
                    "required": str(doc.get("status", "")).lower() == "required",
                }
            )

        payload = {
            "hs_code": request_payload.get("hs_code"),
            "origin_country": request_payload.get("origin_country"),
            "destination_country": request_payload.get("destination_country"),
            "supplier_name": request_payload.get("supplier_name"),
            "product_description": request_payload.get("product_description"),
            "required_documents": normalized_docs,
            "uploaded_documents": [],
            "created_at": now,
            "updated_at": now,
        }
        result = await collection.insert_one(payload)
        return str(result.inserted_id)

    async def get_case(self, compliance_case_id: str) -> Optional[dict]:
        collection = self._collection()
        if collection is None:
            return None
        object_id = self._to_object_id(compliance_case_id)
        case = await collection.find_one({"_id": object_id})
        return case

    async def sync_case_requirements(
        self,
        compliance_case_id: str,
        request_payload: dict,
        required_documents: list[dict],
    ) -> Optional[str]:
        collection = self._collection()
        if collection is None:
            return None

        if not compliance_case_id:
            return await self.create_case(request_payload, required_documents)

        case = await self.get_case(compliance_case_id)
        if case is None:
            return await self.create_case(request_payload, required_documents)

        required_index = {}
        existing_order = []
        for doc in case.get("required_documents", []):
            name = str(doc.get("name", "")).strip()
            if not name:
                continue
            existing_order.append(name)
            required_index[name] = bool(doc.get("required", True))

        incoming_order = []
        for doc in required_documents:
            name = str(doc.get("name", "")).strip()
            if not name:
                continue
            incoming_order.append(name)
            is_required = str(doc.get("status", "")).lower() == "required"
            if name in required_index:
                required_index[name] = required_index[name] or is_required
            else:
                required_index[name] = is_required

        merged_required = []
        seen = set()
        for name in existing_order + incoming_order:
            if name in seen:
                continue
            seen.add(name)
            merged_required.append(
                {
                    "name": name,
                    "required": required_index.get(name, True),
                }
            )

        await collection.update_one(
            {"_id": case["_id"]},
            {
                "$set": {
                    "hs_code": request_payload.get("hs_code"),
                    "origin_country": request_payload.get("origin_country"),
                    "destination_country": request_payload.get("destination_country"),
                    "supplier_name": request_payload.get("supplier_name"),
                    "product_description": request_payload.get("product_description"),
                    "required_documents": merged_required,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return compliance_case_id

    async def upload_document(
        self,
        compliance_case_id: str,
        document_name: str,
        file: UploadFile,
    ) -> dict:
        collection = self._collection()
        gridfs = self._gridfs()
        if collection is None or gridfs is None:
            raise HTTPException(status_code=503, detail="Document storage unavailable")

        case = await self.get_case(compliance_case_id)
        if case is None:
            raise HTTPException(status_code=404, detail="Compliance case not found")

        clean_doc_name = (document_name or "").strip()
        if not clean_doc_name:
            raise HTTPException(status_code=400, detail="document_name is required")

        content = await file.read(self.MAX_UPLOAD_BYTES + 1)
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if len(content) > self.MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds 10MB limit")

        now = datetime.now(timezone.utc)
        file_id = await gridfs.upload_from_stream(
            file.filename or clean_doc_name,
            content,
            metadata={
                "compliance_case_id": compliance_case_id,
                "document_name": clean_doc_name,
                "content_type": file.content_type or "application/octet-stream",
                "uploaded_at": now.isoformat(),
            },
        )

        uploaded_meta = {
            "name": clean_doc_name,
            "file_id": str(file_id),
            "filename": file.filename or clean_doc_name,
            "content_type": file.content_type or "application/octet-stream",
            "size_bytes": len(content),
            "uploaded_at": now,
        }

        await collection.update_one(
            {"_id": case["_id"]},
            {
                "$pull": {"uploaded_documents": {"name": clean_doc_name}},
            },
        )
        await collection.update_one(
            {"_id": case["_id"]},
            {
                "$push": {"uploaded_documents": uploaded_meta},
                "$set": {"updated_at": now},
            },
        )

        return {
            "compliance_case_id": compliance_case_id,
            "document": {
                "name": clean_doc_name,
                "filename": uploaded_meta["filename"],
                "content_type": uploaded_meta["content_type"],
                "size_bytes": uploaded_meta["size_bytes"],
                "uploaded_at": now.isoformat(),
                "status": "uploaded",
            },
        }

    async def get_document_statuses(self, compliance_case_id: str) -> list[dict]:
        case = await self.get_case(compliance_case_id)
        if case is None:
            raise HTTPException(status_code=404, detail="Compliance case not found")

        required_docs = case.get("required_documents", [])
        uploaded_docs = case.get("uploaded_documents", [])
        uploaded_index = {
            str(item.get("name", "")).strip(): item for item in uploaded_docs
        }

        statuses = []
        for doc in required_docs:
            name = str(doc.get("name", "")).strip()
            if not name:
                continue
            uploaded = uploaded_index.get(name)
            if uploaded:
                statuses.append(
                    {
                        "name": name,
                        "status": "uploaded",
                        "filename": uploaded.get("filename", ""),
                        "uploaded_at": (
                            uploaded.get("uploaded_at").isoformat()
                            if hasattr(uploaded.get("uploaded_at"), "isoformat")
                            else str(uploaded.get("uploaded_at", ""))
                        ),
                    }
                )
            else:
                statuses.append(
                    {
                        "name": name,
                        "status": "required" if bool(doc.get("required", True)) else "recommended",
                    }
                )
        return statuses


compliance_document_service = ComplianceDocumentService()
