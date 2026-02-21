from pydantic import BaseModel
from typing import Optional


class ComplianceRequest(BaseModel):
    hs_code: str
    origin_country: str
    destination_country: str
    supplier_name: Optional[str] = None
    product_description: Optional[str] = None


class ComplianceResult(BaseModel):
    overall_risk_score: int
    risk_level: str
    checks: list[dict]
    required_documents: list[dict]
    warnings: list[str]


class ComplianceService:
    """Trade compliance checking service"""

    # OFAC SDN list (sample - use real API in production)
    SAMPLE_SDN_ENTITIES = [
        "IRAN SHIPPING LINES",
        "NORTH KOREA TRADING CO",
        "BLOCKED ENTITY LLC",
    ]

    # HS codes requiring special documentation
    SPECIAL_REQUIREMENTS = {
        "8504": ["UN38.3 Test Summary", "MSDS", "Battery Declaration"],
        "8506": ["UN38.3 Test Summary", "MSDS"],
        "8471": ["FCC Declaration"],
        "2825": ["EPA Certificate"],
    }

    async def check_compliance(self, request: ComplianceRequest) -> ComplianceResult:
        """Run compliance checks"""
        checks = []
        warnings = []
        risk_score = 100

        # OFAC Screening
        ofac_result = await self._check_ofac(request.supplier_name)
        checks.append(ofac_result)
        if ofac_result["status"] != "CLEAR":
            risk_score -= 50

        # Section 301 check
        if request.origin_country == "CN" and request.destination_country == "US":
            checks.append(
                {
                    "category": "Section 301 Tariffs",
                    "status": "WARNING",
                    "details": "Product may be subject to additional tariffs",
                    "action_required": "Verify tariff rate for HS code",
                }
            )
            risk_score -= 10
            warnings.append("Section 301 tariffs may apply")

        # Special documentation requirements
        hs_prefix = request.hs_code[:4]
        if hs_prefix in self.SPECIAL_REQUIREMENTS:
            checks.append(
                {
                    "category": "Special Documentation",
                    "status": "ACTION_REQUIRED",
                    "details": f"Additional documents required for HS {hs_prefix}",
                    "documents": self.SPECIAL_REQUIREMENTS[hs_prefix],
                }
            )
            risk_score -= 15

        # Determine risk level
        if risk_score >= 80:
            risk_level = "LOW"
        elif risk_score >= 50:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        # Required documents
        required_docs = [
            {"name": "Commercial Invoice", "status": "required"},
            {"name": "Bill of Lading", "status": "required"},
            {"name": "Packing List", "status": "required"},
            {"name": "Certificate of Origin", "status": "recommended"},
        ]

        # Add special requirements
        if hs_prefix in self.SPECIAL_REQUIREMENTS:
            for doc in self.SPECIAL_REQUIREMENTS[hs_prefix]:
                required_docs.append({"name": doc, "status": "required"})

        return ComplianceResult(
            overall_risk_score=max(0, risk_score),
            risk_level=risk_level,
            checks=checks,
            required_documents=required_docs,
            warnings=warnings,
        )

    async def _check_ofac(self, entity_name: Optional[str]) -> dict:
        """Check entity against OFAC SDN list"""
        if not entity_name:
            return {
                "category": "OFAC Sanctions",
                "status": "SKIPPED",
                "details": "No supplier name provided",
            }

        # Simple check (use real OFAC API in production)
        entity_upper = entity_name.upper()
        for sdn in self.SAMPLE_SDN_ENTITIES:
            if sdn in entity_upper:
                return {
                    "category": "OFAC Sanctions",
                    "status": "BLOCKED",
                    "details": f"Entity matches SDN list: {sdn}",
                }

        return {
            "category": "OFAC Sanctions",
            "status": "CLEAR",
            "details": "No matches found in SDN list",
            "checked_entities": [entity_name],
        }


compliance_service = ComplianceService()
