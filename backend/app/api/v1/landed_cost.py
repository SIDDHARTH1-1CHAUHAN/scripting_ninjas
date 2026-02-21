from fastapi import APIRouter

from ...services.landed_cost_service import landed_cost_service, LandedCostRequest

router = APIRouter(prefix="/landed-cost", tags=["Landed Cost"])


@router.post("/calculate")
async def calculate_landed_cost(request: LandedCostRequest):
    return await landed_cost_service.calculate(request)
