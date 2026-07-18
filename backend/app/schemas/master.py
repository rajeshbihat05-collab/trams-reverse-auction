"""
Master data schemas: Route, Material, Branch, Customer.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Routes
class RouteCreate(BaseModel):
    origin: str = Field(..., min_length=2)
    destination: str = Field(..., min_length=2)
    distance_km: Optional[float] = None
    estimated_hours: Optional[float] = None
    route_code: Optional[str] = None


class RouteUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    distance_km: Optional[float] = None
    estimated_hours: Optional[float] = None
    is_active: Optional[bool] = None


class RouteResponse(BaseModel):
    id: str
    origin: str
    destination: str
    distance_km: Optional[float] = None
    estimated_hours: Optional[float] = None
    route_code: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Materials
class MaterialCreate(BaseModel):
    name: str = Field(..., min_length=2)
    category: Optional[str] = None
    unit: Optional[str] = None
    hsn_code: Optional[str] = None


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    hsn_code: Optional[str] = None
    is_active: Optional[bool] = None


class MaterialResponse(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    unit: Optional[str] = None
    hsn_code: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Branches
class BranchCreate(BaseModel):
    name: str = Field(..., min_length=2)
    branch_code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class BranchResponse(BaseModel):
    id: str
    name: str
    branch_code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Customers
class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2)
    customer_code: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    customer_code: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
