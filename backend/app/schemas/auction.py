"""
Auction schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AuctionCreate(BaseModel):
    pickup_location: str = Field(..., min_length=2)
    pickup_postal_code: Optional[str] = None
    destination: str = Field(..., min_length=2)
    destination_postal_code: Optional[str] = None
    distance_km: Optional[float] = None
    vehicle_type: str = Field(..., min_length=2)
    vehicle_capacity: Optional[str] = None
    vehicle_length: Optional[str] = None
    vehicle_width: Optional[str] = None
    material_type: str = Field(..., min_length=2)
    expected_weight: Optional[float] = None
    loading_date: datetime
    reporting_time: Optional[str] = None
    unloading_point: Optional[str] = None
    closing_time: datetime
    reserve_price: Optional[float] = None
    special_instructions: Optional[str] = None
    terms_conditions: Optional[str] = None
    auto_notify: bool = True
    invited_transporter_ids: list[str] = []


class AuctionUpdate(BaseModel):
    pickup_location: Optional[str] = None
    pickup_postal_code: Optional[str] = None
    destination: Optional[str] = None
    destination_postal_code: Optional[str] = None
    distance_km: Optional[float] = None
    vehicle_type: Optional[str] = None
    vehicle_capacity: Optional[str] = None
    vehicle_length: Optional[str] = None
    vehicle_width: Optional[str] = None
    material_type: Optional[str] = None
    expected_weight: Optional[float] = None
    loading_date: Optional[datetime] = None
    reporting_time: Optional[str] = None
    unloading_point: Optional[str] = None
    closing_time: Optional[datetime] = None
    reserve_price: Optional[float] = None
    special_instructions: Optional[str] = None
    terms_conditions: Optional[str] = None
    auto_notify: Optional[bool] = None


class AuctionResponse(BaseModel):
    id: str
    auction_number: str
    created_by: str
    creator_name: Optional[str] = None
    pickup_location: str
    pickup_postal_code: Optional[str] = None
    destination: str
    destination_postal_code: Optional[str] = None
    distance_km: Optional[float] = None
    vehicle_type: str
    vehicle_capacity: Optional[str] = None
    vehicle_length: Optional[str] = None
    vehicle_width: Optional[str] = None
    material_type: str
    expected_weight: Optional[float] = None
    loading_date: datetime
    reporting_time: Optional[str] = None
    unloading_point: Optional[str] = None
    start_time: Optional[datetime] = None
    closing_time: datetime
    reserve_price: Optional[float] = None
    bid_type: str
    special_instructions: Optional[str] = None
    terms_conditions: Optional[str] = None
    status: str
    auto_notify: bool
    total_bids: int
    created_at: datetime

    class Config:
        from_attributes = True


class AuctionListResponse(BaseModel):
    auctions: list[AuctionResponse]
    total: int
    page: int
    page_size: int


class AuctionPublishRequest(BaseModel):
    transporter_ids: list[str] = []


class AuctionAwardRequest(BaseModel):
    transporter_id: str
    amount: float
    award_status: str = "auto_l1"
    remarks: Optional[str] = None


class AuctionInviteResponse(BaseModel):
    id: str
    transporter_id: str
    company_name: Optional[str] = None
    status: str
    invited_at: datetime

    class Config:
        from_attributes = True


class AuctionDetailResponse(AuctionResponse):
    invites: list[AuctionInviteResponse] = []
    attachments: list["AttachmentResponse"] = []


class AttachmentResponse(BaseModel):
    id: str
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


AuctionDetailResponse.model_rebuild()
