from fastapi import APIRouter, File, Form, UploadFile

from ...services.compliance_document_service import compliance_document_service
from ...services.compliance_service import compliance_service, ComplianceRequest

router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.post("/check")
async def check_compliance(request: ComplianceRequest):
    return await compliance_service.check_compliance(request)


@router.post("/documents/upload")
async def upload_compliance_document(
    compliance_case_id: str = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...),
):
    return await compliance_document_service.upload_document(
        compliance_case_id=compliance_case_id,
        document_name=document_name,
        file=file,
    )


@router.get("/documents/{compliance_case_id}")
async def get_compliance_documents(compliance_case_id: str):
    documents = await compliance_document_service.get_document_statuses(compliance_case_id)
    return {"compliance_case_id": compliance_case_id, "documents": documents}
