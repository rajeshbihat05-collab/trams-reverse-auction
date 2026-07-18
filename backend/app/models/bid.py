"""
Bid, BidHistory, and AuctionResult models.
"""

import enum

from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, ForeignKey,
    Text, Numeric
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import generate_uuid, utcnow


class AwardStatus(str, enum.Enum):
    AUTO_L1 = "auto_l1"
    MANUAL = "manual"
    NEGOTIATED = "negotiated"


class Bid(Base):
    __tablename__ = "bids"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auction_id = Column(String(36), ForeignKey("auctions.id", ondelete="CASCADE"), nullable=False, index=True)
    transporter_id = Column(String(36), ForeignKey("transporters.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(5), default="INR", nullable=False)
    remarks = Column(Text, nullable=True)
    revision_number = Column(Integer, default=1, nullable=False)
    is_latest = Column(Boolean, default=True, nullable=False)
    submitted_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    auction = relationship("Auction", back_populates="bids")
    transporter = relationship("Transporter", back_populates="bids")
    history = relationship("BidHistory", back_populates="bid", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Bid {self.amount} {self.currency} by transporter={self.transporter_id}>"


class BidHistory(Base):
    __tablename__ = "bid_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    bid_id = Column(String(36), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False)
    old_amount = Column(Numeric(12, 2), nullable=True)
    new_amount = Column(Numeric(12, 2), nullable=False)
    revision_number = Column(Integer, nullable=False)
    changed_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    bid = relationship("Bid", back_populates="history")

    def __repr__(self):
        return f"<BidHistory rev={self.revision_number} {self.old_amount} -> {self.new_amount}>"


class AuctionResult(Base):
    __tablename__ = "auction_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auction_id = Column(String(36), ForeignKey("auctions.id", ondelete="CASCADE"), unique=True, nullable=False)
    winner_id = Column(String(36), ForeignKey("transporters.id"), nullable=False)
    awarded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    winning_amount = Column(Numeric(12, 2), nullable=False)
    award_status = Column(String(20), default=AwardStatus.AUTO_L1.value, nullable=False)
    remarks = Column(Text, nullable=True)
    awarded_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    auction = relationship("Auction", back_populates="result")
    winner = relationship("Transporter", foreign_keys=[winner_id])
    awarder = relationship("User", foreign_keys=[awarded_by])

    def __repr__(self):
        return f"<AuctionResult auction={self.auction_id} winner={self.winner_id}>"
