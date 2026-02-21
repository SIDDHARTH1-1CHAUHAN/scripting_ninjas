from fastapi import APIRouter

from ..services.port_data import port_service
from ..services.route_service import RouteRequest, route_service


router = APIRouter()


@router.post("/api/routes/compare")
async def compare_routes(request: RouteRequest) -> dict:
    """Compare shipping routes."""
    routes = await route_service.compare_routes(request)
    return {
        "origin": request.origin_port,
        "destination": request.destination_port,
        "routes": [route.model_dump() for route in routes],
        "recommended_route_id": next((route.id for route in routes if route.recommended), None),
    }


@router.get("/api/ports/congestion")
async def get_port_congestion() -> dict:
    """Get all port congestion data."""
    ports = await port_service.get_all_ports()
    return {"ports": ports}


@router.get("/api/ports/{port_code}/congestion")
async def get_single_port_congestion(port_code: str) -> dict:
    """Get congestion for specific port."""
    data = await port_service.get_congestion(port_code.upper())
    return data
