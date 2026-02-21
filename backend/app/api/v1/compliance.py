from fastapi import APIRouter

from ...services.compliance_service import compliance_service, ComplianceRequest

router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.post("/check")
async def check_compliance(request: ComplianceRequest):
    return await compliance_service.check_compliance(request)
