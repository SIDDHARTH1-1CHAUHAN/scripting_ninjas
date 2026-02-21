from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
import asyncio

from ...services.cargo_service import cargo_service

router = APIRouter(prefix="/cargo", tags=["Cargo Tracking"])


@router.get("/track/{container_id}")
async def track_shipment(container_id: str):
    """Track a shipment by container ID"""
    result = await cargo_service.track_shipment(container_id)
    if not result:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return result


@router.get("/shipments")
async def list_shipments():
    """List all tracked shipments"""
    return await cargo_service.get_all_shipments()


@router.get("/search")
async def search_shipments(q: str):
    """Search shipments by container ID, B/L, or vessel name"""
    if len(q) < 3:
        raise HTTPException(status_code=400, detail="Query must be at least 3 characters")
    return await cargo_service.search_shipments(q)


@router.websocket("/ws/track/{container_id}")
async def websocket_tracking(websocket: WebSocket, container_id: str):
    """Real-time tracking updates via WebSocket"""
    await websocket.accept()

    try:
        while True:
            # Get updated position
            result = await cargo_service.track_shipment(container_id)

            if result:
                # Send position update
                await websocket.send_json(
                    {
                        "type": "position_update",
                        "data": {
                            "container_id": result.shipment.container_id,
                            "latitude": result.current_position.latitude,
                            "longitude": result.current_position.longitude,
                            "location_name": result.current_position.location_name,
                            "speed_knots": result.current_position.speed_knots,
                            "heading": result.current_position.heading,
                            "progress_percent": result.progress_percent,
                            "eta": result.shipment.eta.isoformat(),
                            "timestamp": result.current_position.timestamp.isoformat(),
                        },
                    }
                )

            # Update every 10 seconds (simulated real-time)
            await asyncio.sleep(10)

    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close(code=1000)
