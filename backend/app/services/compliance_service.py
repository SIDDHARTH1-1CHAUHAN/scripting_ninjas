from pydantic import BaseModel
from typing import Optional

from .compliance_document_service import compliance_document_service
from .live_data_service import live_data_service


class ComplianceRequest(BaseModel):
    hs_code: str
    origin_country: str
    destination_country: str
    supplier_name: Optional[str] = None
    product_description: Optional[str] = None
    compliance_case_id: Optional[str] = None


class ComplianceResult(BaseModel):
    overall_risk_score: int
    risk_level: str
    checks: list[dict]
    required_documents: list[dict]
    warnings: list[str]
    compliance_case_id: Optional[str] = None


class ComplianceService:
    """Trade compliance checking service"""

    async def check_compliance(self, request: ComplianceRequest) -> ComplianceResult:
        """Run compliance checks"""
        checks = []
        warnings = []
        risk_score = 100

        # OFAC Screening
        ofac_result = await self._check_ofac(request.supplier_name)
        checks.append(ofac_result)
        if ofac_result["status"] in {"BLOCKED", "POTENTIAL_MATCH"}:
            risk_score -= 50

        # Geopolitical route risk for origin -> destination lane.
        route_risk = await live_data_service.get_country_route_risk(
            request.origin_country, request.destination_country
        )
        route_status = route_risk.get("status", "CLEAR")
        if route_status in {"WARNING", "BLOCKED"}:
            checks.append(
                {
                    "category": "Geopolitical Route Risk",
                    "status": route_status,
                    "details": route_risk.get(
                        "details", "Country-pair route has elevated geopolitical risk"
                    ),
                    "action_required": route_risk.get(
                        "action_required", "Perform enhanced compliance review"
                    ),
                    "source": route_risk.get("source", "Country route risk model"),
                }
            )
            risk_score -= max(0, int(route_risk.get("score_penalty", 0)))
            warnings.append(
                route_risk.get(
                    "details",
                    "Route has elevated geopolitical risk",
                )
            )

        # Section 301 check
        section_301 = await live_data_service.get_section_301_status(
            request.hs_code, request.origin_country
        )
        if request.destination_country == "US" and section_301.get("applies"):
            checks.append(
                {
                    "category": "Section 301 Tariffs",
                    "status": "WARNING",
                    "details": section_301.get("message", "Additional tariffs may apply"),
                    "action_required": "Verify tariff rate for HS code",
                }
            )
            risk_score -= 10
            warnings.append(section_301.get("message", "Section 301 tariffs may apply"))

        # Special documentation requirements
        special_requirements = live_data_service.get_special_requirements(request.hs_code)
        if special_requirements:
            checks.append(
                {
                    "category": "Special Documentation",
                    "status": "ACTION_REQUIRED",
                    "details": f"Additional documents required for HS {request.hs_code[:4]}",
                    "documents": special_requirements,
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
        required_docs = list(live_data_service.get_base_required_documents())

        # Add special requirements
        if special_requirements:
            for doc in special_requirements:
                required_docs.append({"name": doc, "status": "required"})

        # Persist case and merge uploaded document statuses from storage.
        compliance_case_id = await compliance_document_service.sync_case_requirements(
            compliance_case_id=request.compliance_case_id or "",
            request_payload=request.model_dump(),
            required_documents=required_docs,
        )
        if compliance_case_id:
            try:
                required_docs = await compliance_document_service.get_document_statuses(
                    compliance_case_id
                )
            except Exception:
                # Keep calculation resilient even if storage is temporarily unavailable.
                pass

        return ComplianceResult(
            overall_risk_score=max(0, risk_score),
            risk_level=risk_level,
            checks=checks,
            required_documents=required_docs,
            warnings=warnings,
            compliance_case_id=compliance_case_id,
        )

    async def _check_ofac(self, entity_name: Optional[str]) -> dict:
        """Check entity against OFAC SDN list"""
        if not entity_name:
            return {
                "category": "OFAC Sanctions",
                "status": "SKIPPED",
                "details": "No supplier name provided",
            }

        result = await live_data_service.screen_ofac(entity_name)
        status = result.get("status", "CLEAR")
        mapped_status = "BLOCKED" if status == "POTENTIAL_MATCH" else status

        return {
            "category": "OFAC Sanctions",
            "status": mapped_status,
            "details": result.get("message", "No matches found in screening"),
            "checked_entities": [entity_name],
            "source": result.get("source", "Simplified OFAC keyword screening"),
        }


compliance_service = ComplianceService()
