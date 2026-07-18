"""
Notification schemas.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    channel: str
    is_read: bool
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread_count: int
