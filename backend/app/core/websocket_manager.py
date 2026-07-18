"""
WebSocket connection manager for real-time auction bidding.
Handles per-auction rooms with role-based message filtering.
"""

import json
from typing import Optional
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections organized by auction rooms."""

    def __init__(self):
        # auction_id -> list of (websocket, user_id, role, transporter_id)
        self.active_connections: dict[str, list[tuple[WebSocket, str, str, Optional[str]]]] = {}

    async def connect(
        self, websocket: WebSocket, auction_id: str,
        user_id: str, role: str, transporter_id: Optional[str] = None
    ):
        await websocket.accept()
        if auction_id not in self.active_connections:
            self.active_connections[auction_id] = []
        self.active_connections[auction_id].append((websocket, user_id, role, transporter_id))

    def disconnect(self, websocket: WebSocket, auction_id: str):
        if auction_id in self.active_connections:
            self.active_connections[auction_id] = [
                conn for conn in self.active_connections[auction_id]
                if conn[0] != websocket
            ]
            if not self.active_connections[auction_id]:
                del self.active_connections[auction_id]

    async def broadcast_to_auction(self, auction_id: str, message: dict):
        """Send message to all connections in an auction room."""
        if auction_id not in self.active_connections:
            return
        disconnected = []
        for ws, user_id, role, transporter_id in self.active_connections[auction_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws, auction_id)

    async def send_bid_update(
        self, auction_id: str, bid_data: dict,
        bidder_transporter_id: str
    ):
        """
        Send bid updates with role-based filtering:
        - Admin sees full bid details (transporter name, amount, all bids)
        - Transporters see only their own bid confirmation
        - Other transporters see only 'new bid received' without details
        """
        if auction_id not in self.active_connections:
            return

        disconnected = []
        for ws, user_id, role, transporter_id in self.active_connections[auction_id]:
            try:
                if role == "admin" or role == "manager":
                    # Admin sees everything
                    await ws.send_json({
                        "type": "bid_update",
                        "data": bid_data,
                        "full_access": True,
                    })
                elif transporter_id == bidder_transporter_id:
                    # Bidding transporter sees their own bid confirmation
                    await ws.send_json({
                        "type": "bid_confirmed",
                        "data": {
                            "amount": bid_data.get("amount"),
                            "revision": bid_data.get("revision_number"),
                            "submitted_at": bid_data.get("submitted_at"),
                        },
                    })
                else:
                    # Other transporters only see that a new bid happened
                    await ws.send_json({
                        "type": "bid_activity",
                        "data": {
                            "message": "A new bid has been submitted",
                            "total_bids": bid_data.get("total_bids", 0),
                        },
                    })
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws, auction_id)

    async def send_auction_status(self, auction_id: str, status: str, data: dict = None):
        """Broadcast auction status changes (closing, closed, awarded)."""
        message = {
            "type": "auction_status",
            "status": status,
            "data": data or {},
        }
        await self.broadcast_to_auction(auction_id, message)

    def get_connection_count(self, auction_id: str) -> int:
        return len(self.active_connections.get(auction_id, []))

    def get_total_connections(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())


# Singleton instance
manager = ConnectionManager()
