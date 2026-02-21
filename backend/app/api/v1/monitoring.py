from fastapi import APIRouter
import httpx
from datetime import datetime
import os

try:
    import psutil
except Exception:  # pragma: no cover - optional dependency
    psutil = None

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@router.get("/health/detailed")
async def detailed_health():
    hs_classifier_url = os.getenv("HS_CLASSIFIER_URL", "http://localhost:8001")
    route_optimizer_url = os.getenv("ROUTE_OPTIMIZER_URL", "http://localhost:8002")

    services = {
        "main_backend": True,
        "hs_classifier": await check_service(f"{hs_classifier_url}/health"),
        "route_optimizer": await check_service(f"{route_optimizer_url}/health"),
    }

    if psutil is not None:
        metrics = {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "timestamp": datetime.utcnow().isoformat(),
        }
    else:
        metrics = {
            "cpu_percent": None,
            "memory_percent": None,
            "timestamp": datetime.utcnow().isoformat(),
        }

    return {
        "status": "healthy" if all(services.values()) else "degraded",
        "services": services,
        "metrics": metrics,
    }


async def check_service(url: str) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=2.0)
            return r.status_code == 200
    except Exception:
        return False


@router.get("/metrics")
async def get_metrics():
    if psutil is None:
        return {
            "cpu": None,
            "memory": None,
            "disk": None,
        }
    return {
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory()._asdict(),
        "disk": psutil.disk_usage("/")._asdict(),
    }
