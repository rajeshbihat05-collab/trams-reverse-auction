"""
Bid schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BidCreate(BaseModel):
    auction_id: str
    amount: float = Field(..., gt=0)
    remarks: Optional[str] = None


class BidUpdate(BaseModel):
    amount: float = Field(..., gt=0)
    remarks: Optional[str] = None


class BidResponse(BaseModel):
    id: str
    auction_id: str
    transporter_id: str
    company_name: Optional[str] = None
    amount: float
    currency: str
    remarks: Optional[str] = None
    revision_number: int
    is_latest: bool
    submitted_at: datetime

    class Config:
        from_attributes = True


class BidListResponse(BaseModel):
    bids: list[BidResponse]
    total: int
    lowest_bid: Optional[float] = None
    highest_bid: Optional[float] = None


class BidHistoryResponse(BaseModel):
    id: str
    old_amount: Optional[float] = None
    new_amount: float
    revision_number: int
    changed_at: datetime

    class Config:
        from_attributes = True


class BidRankResponse(BaseModel):
    rank: int
    transporter_id: str
    company_name: str
    amount: float
    revision_count: int
    submitted_at: datetime


class AuctionResultResponse(BaseModel):
    id: str
    auction_id: str
    auction_number: Optional[str] = None
    winner_id: str
    winner_company: Optional[str] = None
    awarded_by: str
    awarder_name: Optional[str] = None
    winning_amount: float
    award_status: str
    remarks: Optional[str] = None
    awarded_at: datetime
    rankings: list[BidRankResponse] = []

    class Config:
        from_attributes = True
