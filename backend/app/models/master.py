"""
Master data models: Route, Material, Branch, Customer.
"""

from sqlalchemy import (
    Column, String, Boolean, DateTime, Float, Text
)

from app.database import Base
from app.models.user import generate_uuid, utcnow


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    distance_km = Column(Float, nullable=True)
    estimated_hours = Column(Float, nullable=True)
    route_code = Column(String(20), nullable=True, unique=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    def __repr__(self):
        return f"<Route {self.origin} -> {self.destination}>"


class Material(Base):
    __tablename__ = "materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    unit = Column(String(20), nullable=True)
    hsn_code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    def __repr__(self):
        return f"<Material {self.name}>"


class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    branch_code = Column(String(20), nullable=True, unique=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    def __repr__(self):
        return f"<Branch {self.name}>"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    customer_code = Column(String(20), nullable=True, unique=True)
    contact_person = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    gst_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    def __repr__(self):
        return f"<Customer {self.name}>"
