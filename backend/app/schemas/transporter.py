"""
Transporter, Vehicle, Driver schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TransporterCreate(BaseModel):
    company_name: str = Field(..., min_length=2)
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class TransporterUpdate(BaseModel):
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    is_verified: Optional[bool] = None


class TransporterResponse(BaseModel):
    id: str
    user_id: str
    company_name: str
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    rating: float
    total_bids: int
    total_wins: int
    is_verified: bool
    created_at: datetime
    user_email: Optional[str] = None
    user_phone: Optional[str] = None

    class Config:
        from_attributes = True


class TransporterListResponse(BaseModel):
    transporters: list[TransporterResponse]
    total: int
    page: int
    page_size: int


class VehicleCreate(BaseModel):
    vehicle_number: str = Field(..., min_length=2)
    vehicle_type: str = Field(..., min_length=2)
    capacity_tons: Optional[float] = None
    make_model: Optional[str] = None
    year: Optional[int] = None
    body_type: Optional[str] = None


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    capacity_tons: Optional[float] = None
    make_model: Optional[str] = None
    year: Optional[int] = None
    body_type: Optional[str] = None
    is_active: Optional[bool] = None


class VehicleResponse(BaseModel):
    id: str
    transporter_id: str
    vehicle_number: str
    vehicle_type: str
    capacity_tons: Optional[float] = None
    make_model: Optional[str] = None
    year: Optional[int] = None
    body_type: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    vehicles: list[VehicleResponse]
    total: int


class DriverCreate(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    address: Optional[str] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class DriverResponse(BaseModel):
    id: str
    transporter_id: str
    name: str
    phone: str
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DriverListResponse(BaseModel):
    drivers: list[DriverResponse]
    total: int
