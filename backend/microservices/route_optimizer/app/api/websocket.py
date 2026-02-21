from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from typing import List


router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/ws/route-updates")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket for real-time route calculation updates."""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_json()

            await websocket.send_json(
                {
                    "type": "progress",
                    "message": "Fetching port congestion data...",
                    "progress": 25,
                }
            )
            await asyncio.sleep(0.5)

            await websocket.send_json(
                {
                    "type": "progress",
                    "message": "Calculating route options...",
                    "progress": 50,
                }
            )
            await asyncio.sleep(0.5)

            await websocket.send_json(
                {
                    "type": "progress",
                    "message": "Optimizing for cost and time...",
                    "progress": 75,
                }
            )
            await asyncio.sleep(0.5)

            await websocket.send_json(
                {
                    "type": "complete",
                    "message": "Route calculation complete",
                    "progress": 100,
                }
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
