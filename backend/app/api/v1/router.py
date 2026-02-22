from fastapi import APIRouter

from .assistant import router as assistant_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .business import router as business_router
from .cargo import router as cargo_router
from .compliance import router as compliance_router
from .forex import router as forex_router
from .health import router as health_router
from .landed_cost import router as landed_cost_router
from .monitoring import router as monitoring_router
from .payments import router as payments_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router)
api_router.include_router(landed_cost_router)
api_router.include_router(compliance_router)
api_router.include_router(assistant_router)
api_router.include_router(business_router)
api_router.include_router(cargo_router)
api_router.include_router(forex_router)
api_router.include_router(payments_router)
api_router.include_router(analytics_router)
api_router.include_router(monitoring_router)
