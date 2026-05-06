"""
WebSocket endpoints for real-time activity updates
"""
import asyncio
import json
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models import ActivityLog, User, ActivityType
from sqlalchemy import select

router = APIRouter(prefix="/ws", tags=["websocket"])

# Store connected clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()


@router.websocket("/activity")
async def activity_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time activity updates.
    Broadcasts new activity events to all connected clients.
    """
    await manager.connect(websocket)
    try:
        # Send initial connection message
        await websocket.send_json({"type": "connected", "message": "WebSocket connected"})
        
        while True:
            # Non-blocking wait for client messages with timeout
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                # Send keep-alive every 30 seconds
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


async def broadcast_new_activity(
    activity_type: str,
    user_name: str,
    repo_name: str,
    message: str,
    timestamp: str
):
    """
    Broadcast a new activity event to all connected clients.
    Called from webhook handlers when new activity is logged.
    """
    await manager.broadcast({
        "type": "new_activity",
        "activity_type": activity_type,
        "user_name": user_name,
        "repo_name": repo_name,
        "message": message,
        "timestamp": timestamp
    })


async def broadcast_stats_update():
    """
    Broadcast that stats have been updated.
    Clients should refresh their data.
    """
    await manager.broadcast({
        "type": "stats_updated"
    })


@router.get("/test-broadcast")
async def test_broadcast():
    """Test endpoint to verify WebSocket broadcasting works."""
    await broadcast_new_activity(
        activity_type="commit",
        user_name="test_user",
        repo_name="test_repo",
        message="Test message",
        timestamp="2024-01-01T00:00:00"
    )
    return {"status": "broadcast sent"}


@router.get("/connections")
async def get_connections_count():
    """Get number of active WebSocket connections."""
    return {"connections": len(manager.active_connections)}
