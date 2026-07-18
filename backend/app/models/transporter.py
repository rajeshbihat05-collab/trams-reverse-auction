"""
Transporter, Vehicle, and Driver models.
"""

from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Integer, ForeignKey, Text
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import generate_uuid, utcnow


class Transporter(Base):
    __tablename__ = "transporters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    gst_number = Column(String(20), nullable=True)
    pan_number = Column(String(15), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    rating = Column(Float, default=0.0, nullable=False)
    total_bids = Column(Integer, default=0, nullable=False)
    total_wins = Column(Integer, default=0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="transporter")
    vehicles = relationship("Vehicle", back_populates="transporter", cascade="all, delete-orphan")
    drivers = relationship("Driver", back_populates="transporter", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="transporter", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="transporter")
    auction_invites = relationship("AuctionInvite", back_populates="transporter")

    def __repr__(self):
        return f"<Transporter {self.company_name}>"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transporter_id = Column(String(36), ForeignKey("transporters.id", ondelete="CASCADE"), nullable=False)
    vehicle_number = Column(String(20), nullable=False, unique=True)
    vehicle_type = Column(String(50), nullable=False)
    capacity_tons = Column(Float, nullable=True)
    make_model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    body_type = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    transporter = relationship("Transporter", back_populates="vehicles")

    def __repr__(self):
        return f"<Vehicle {self.vehicle_number}>"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transporter_id = Column(String(36), ForeignKey("transporters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    license_number = Column(String(30), nullable=True)
    license_expiry = Column(DateTime, nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    transporter = relationship("Transporter", back_populates="drivers")

    def __repr__(self):
        return f"<Driver {self.name}>"
