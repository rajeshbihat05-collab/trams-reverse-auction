"""
Auction, AuctionInvite, and AuctionAttachment models.
"""

import enum

from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Integer, ForeignKey,
    Text, Numeric, Time
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import generate_uuid, utcnow


class AuctionStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    LIVE = "live"
    CLOSED = "closed"
    AWARDED = "awarded"
    CANCELLED = "cancelled"


class InviteStatus(str, enum.Enum):
    INVITED = "invited"
    VIEWED = "viewed"
    PARTICIPATED = "participated"
    DECLINED = "declined"


class Auction(Base):
    __tablename__ = "auctions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auction_number = Column(String(20), unique=True, nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)

    # Location details
    pickup_location = Column(String(500), nullable=False)
    pickup_postal_code = Column(String(20), nullable=True)
    destination = Column(String(500), nullable=False)
    destination_postal_code = Column(String(20), nullable=True)
    distance_km = Column(Float, nullable=True)

    # Vehicle requirements
    vehicle_type = Column(String(100), nullable=False)
    vehicle_capacity = Column(String(50), nullable=True)

    # Material details
    material_type = Column(String(200), nullable=False)
    expected_weight = Column(Float, nullable=True)

    # Schedule
    loading_date = Column(DateTime, nullable=False)
    reporting_time = Column(String(10), nullable=True)
    unloading_point = Column(String(500), nullable=True)

    # Auction settings
    start_time = Column(DateTime, nullable=True)
    closing_time = Column(DateTime, nullable=False)
    reserve_price = Column(Numeric(12, 2), nullable=True)
    bid_type = Column(String(20), default="reverse", nullable=False)

    # Content
    special_instructions = Column(Text, nullable=True)
    terms_conditions = Column(Text, nullable=True)

    # Status
    status = Column(String(20), default=AuctionStatus.DRAFT.value, nullable=False, index=True)
    auto_notify = Column(Boolean, default=True, nullable=False)
    total_bids = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    invites = relationship("AuctionInvite", back_populates="auction", cascade="all, delete-orphan")
    attachments = relationship("AuctionAttachment", back_populates="auction", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="auction", cascade="all, delete-orphan")
    result = relationship("AuctionResult", back_populates="auction", uselist=False)

    def __repr__(self):
        return f"<Auction {self.auction_number} [{self.status}]>"


class AuctionInvite(Base):
    __tablename__ = "auction_invites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auction_id = Column(String(36), ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False)
    transporter_id = Column(String(36), ForeignKey("transporters.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default=InviteStatus.INVITED.value, nullable=False)
    invited_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    auction = relationship("Auction", back_populates="invites")
    transporter = relationship("Transporter", back_populates="auction_invites")

    def __repr__(self):
        return f"<AuctionInvite auction={self.auction_id} transporter={self.transporter_id}>"


class AuctionAttachment(Base):
    __tablename__ = "auction_attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auction_id = Column(String(36), ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    auction = relationship("Auction", back_populates="attachments")

    def __repr__(self):
        return f"<AuctionAttachment {self.file_name}>"
