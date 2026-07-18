"""
WebSocket endpoint for real-time auction bidding.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.core import decode_token
from app.core.websocket_manager import manager
from app.models.user import User
from app.models.transporter import Transporter

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/auction/{auction_id}")
async def auction_websocket(
    websocket: WebSocket,
    auction_id: str,
    token: str = Query(...),
):
    """
    WebSocket connection for real-time auction updates.
    Connect with: ws://host/ws/auction/{auction_id}?token=JWT_TOKEN
    """
    db = SessionLocal()
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return

        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return

        transporter_id = None
        if user.role == "transporter":
            transporter = db.query(Transporter).filter(Transporter.user_id == user.id).first()
            transporter_id = transporter.id if transporter else None

        await manager.connect(websocket, auction_id, user.id, user.role, transporter_id)

        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "data": {
                "auction_id": auction_id,
                "user_id": user.id,
                "role": user.role,
                "active_connections": manager.get_connection_count(auction_id),
            },
        })

        # Broadcast updated connection count
        await manager.broadcast_to_auction(auction_id, {
            "type": "connection_count",
            "data": {"count": manager.get_connection_count(auction_id)},
        })

        try:
            while True:
                data = await websocket.receive_json()

                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            manager.disconnect(websocket, auction_id)
            await manager.broadcast_to_auction(auction_id, {
                "type": "connection_count",
                "data": {"count": manager.get_connection_count(auction_id)},
            })
    except Exception:
        try:
            await websocket.close(code=4000, reason="Connection error")
        except Exception:
            pass
        manager.disconnect(websocket, auction_id)
    finally:
        db.close()
