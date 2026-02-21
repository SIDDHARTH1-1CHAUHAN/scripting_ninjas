from fastapi import APIRouter

from .health import router as health_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])


@api_router.post("/classify")
async def classify_placeholder():
    return {"message": "Classification service coming in Phase 2"}


@api_router.post("/landed-cost")
async def landed_cost_placeholder():
    return {"message": "Landed cost service coming in Phase 4"}
