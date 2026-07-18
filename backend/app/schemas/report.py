"""
Report and settings schemas.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DashboardStats(BaseModel):
    total_auctions: int = 0
    live_auctions: int = 0
    closed_auctions: int = 0
    awarded_auctions: int = 0
    pending_auctions: int = 0
    draft_auctions: int = 0
    cancelled_auctions: int = 0
    total_transporters: int = 0
    verified_transporters: int = 0
    todays_auctions: int = 0
    live_bid_count: int = 0
    total_savings: float = 0
    avg_bid_reduction: float = 0


class TransporterDashboardStats(BaseModel):
    available_auctions: int = 0
    active_bids: int = 0
    won_auctions: int = 0
    lost_auctions: int = 0
    total_bids: int = 0
    pending_documents: int = 0
    total_vehicles: int = 0
    total_drivers: int = 0


class RecentActivity(BaseModel):
    id: str
    action: str
    description: str
    user_name: Optional[str] = None
    entity_type: Optional[str] = None
    created_at: datetime


class ChartData(BaseModel):
    label: str
    value: float


class MonthlyReport(BaseModel):
    month: str
    total_auctions: int
    total_bids: int
    awarded_auctions: int
    total_value: float
    avg_savings_percent: float


class SettingsResponse(BaseModel):
    id: str
    company_name: str
    logo_path: Optional[str] = None
    tagline: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    currency: str
    timezone: str
    date_format: str
    bid_auto_close: bool
    maintenance_mode: bool
    email_host: Optional[str] = None
    email_port: Optional[int] = None
    sms_api_key: Optional[str] = None
    whatsapp_api_key: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    tagline: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    bid_auto_close: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    email_host: Optional[str] = None
    email_port: Optional[int] = None
    email_user: Optional[str] = None
    email_password: Optional[str] = None
    sms_api_key: Optional[str] = None
    sms_api_url: Optional[str] = None
    whatsapp_api_key: Optional[str] = None
    whatsapp_api_url: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
