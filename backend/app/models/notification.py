"""
Notification model.
"""

import enum

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import generate_uuid, utcnow


class NotificationType(str, enum.Enum):
    AUCTION_LIVE = "auction_live"
    AUCTION_CLOSING = "auction_closing"
    AUCTION_CLOSED = "auction_closed"
    BID_RECEIVED = "bid_received"
    BID_UPDATE = "bid_update"
    WINNER = "winner"
    AWARD = "award"
    DOCUMENT = "document"
    SYSTEM = "system"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default=NotificationType.SYSTEM.value, nullable=False)
    channel = Column(String(20), default=NotificationChannel.IN_APP.value, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    reference_id = Column(String(36), nullable=True)
    reference_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.title} -> {self.user_id}>"
