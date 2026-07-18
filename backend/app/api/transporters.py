"""
Transporter management API endpoints.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.core.exceptions import NotFoundException, ConflictException
from app.dependencies import get_current_user, get_admin_user, log_audit
from app.models.user import User
from app.models.transporter import Transporter, Vehicle, Driver
from app.schemas.transporter import (
    TransporterUpdate, TransporterResponse, TransporterListResponse,
    VehicleCreate, VehicleUpdate, VehicleResponse, VehicleListResponse,
    DriverCreate, DriverUpdate, DriverResponse, DriverListResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/transporters", tags=["Transporters"])


def transporter_to_response(t: Transporter, db: Session) -> TransporterResponse:
    user = db.query(User).filter(User.id == t.user_id).first()
    return TransporterResponse(
        id=t.id,
        user_id=t.user_id,
        company_name=t.company_name,
        gst_number=t.gst_number,
        pan_number=t.pan_number,
        address=t.address,
        city=t.city,
        state=t.state,
        pincode=t.pincode,
        rating=t.rating,
        total_bids=t.total_bids,
        total_wins=t.total_wins,
        is_verified=t.is_verified,
        created_at=t.created_at,
        user_email=user.email if user else None,
        user_phone=user.phone if user else None,
    )


@router.get("", response_model=TransporterListResponse)
async def list_transporters(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    verified: Optional[bool] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(Transporter)

    if search:
        query = query.filter(
            or_(
                Transporter.company_name.ilike(f"%{search}%"),
                Transporter.gst_number.ilike(f"%{search}%"),
                Transporter.city.ilike(f"%{search}%"),
            )
        )

    if verified is not None:
        query = query.filter(Transporter.is_verified == verified)

    total = query.count()
    transporters = (
        query.order_by(Transporter.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TransporterListResponse(
        transporters=[transporter_to_response(t, db) for t in transporters],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/all", response_model=list[TransporterResponse])
async def list_all_transporters(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    transporters = db.query(Transporter).filter(Transporter.is_verified == True).all()
    return [transporter_to_response(t, db) for t in transporters]


@router.get("/{transporter_id}", response_model=TransporterResponse)
async def get_transporter(
    transporter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = db.query(Transporter).filter(Transporter.id == transporter_id).first()
    if not t:
        raise NotFoundException("Transporter not found")
    return transporter_to_response(t, db)


@router.put("/{transporter_id}", response_model=TransporterResponse)
async def update_transporter(
    transporter_id: str,
    data: TransporterUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = db.query(Transporter).filter(Transporter.id == transporter_id).first()
    if not t:
        raise NotFoundException("Transporter not found")

    if current_user.role == "transporter" and t.user_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Cannot edit other transporter's profile")

    update_data = data.model_dump(exclude_unset=True)

    if "is_verified" in update_data and current_user.role not in ("admin", "manager"):
        del update_data["is_verified"]

    for field, value in update_data.items():
        setattr(t, field, value)

    db.commit()
    db.refresh(t)

    log_audit(
        db, current_user.id, "UPDATE_TRANSPORTER", "transporter", t.id,
        f"Updated transporter {t.company_name}",
        ip_address=request.client.host if request.client else None,
    )

    return transporter_to_response(t, db)


@router.post("/{transporter_id}/verify", response_model=MessageResponse)
async def verify_transporter(
    transporter_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    t = db.query(Transporter).filter(Transporter.id == transporter_id).first()
    if not t:
        raise NotFoundException("Transporter not found")

    t.is_verified = True
    db.commit()

    log_audit(
        db, current_user.id, "VERIFY_TRANSPORTER", "transporter", t.id,
        f"Verified transporter {t.company_name}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message=f"Transporter {t.company_name} verified")


# =================== Vehicles ===================

@router.get("/{transporter_id}/vehicles", response_model=VehicleListResponse)
async def list_vehicles(
    transporter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicles = db.query(Vehicle).filter(Vehicle.transporter_id == transporter_id).all()
    return VehicleListResponse(
        vehicles=[VehicleResponse.model_validate(v) for v in vehicles],
        total=len(vehicles),
    )


@router.post("/{transporter_id}/vehicles", response_model=VehicleResponse)
async def create_vehicle(
    transporter_id: str,
    data: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Vehicle).filter(Vehicle.vehicle_number == data.vehicle_number).first()
    if existing:
        raise ConflictException("Vehicle number already registered")

    vehicle = Vehicle(transporter_id=transporter_id, **data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return VehicleResponse.model_validate(vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: str,
    data: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise NotFoundException("Vehicle not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return VehicleResponse.model_validate(vehicle)


@router.delete("/vehicles/{vehicle_id}", response_model=MessageResponse)
async def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise NotFoundException("Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return MessageResponse(message="Vehicle deleted")


# =================== Drivers ===================

@router.get("/{transporter_id}/drivers", response_model=DriverListResponse)
async def list_drivers(
    transporter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    drivers = db.query(Driver).filter(Driver.transporter_id == transporter_id).all()
    return DriverListResponse(
        drivers=[DriverResponse.model_validate(d) for d in drivers],
        total=len(drivers),
    )


@router.post("/{transporter_id}/drivers", response_model=DriverResponse)
async def create_driver(
    transporter_id: str,
    data: DriverCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = Driver(transporter_id=transporter_id, **data.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return DriverResponse.model_validate(driver)


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: str,
    data: DriverUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise NotFoundException("Driver not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return DriverResponse.model_validate(driver)


@router.delete("/drivers/{driver_id}", response_model=MessageResponse)
async def delete_driver(
    driver_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise NotFoundException("Driver not found")
    db.delete(driver)
    db.commit()
    return MessageResponse(message="Driver deleted")


@router.delete("/{transporter_id}", response_model=MessageResponse)
async def delete_transporter(
    transporter_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    from app.models.audit import AuditLog
    from app.models.bid import AuctionResult

    t = db.query(Transporter).filter(Transporter.id == transporter_id).first()
    if not t:
        raise NotFoundException("Transporter not found")

    # Check if transporter has won any auctions to prevent database constraint error
    has_won = db.query(AuctionResult).filter(AuctionResult.winner_id == transporter_id).first()
    if has_won:
        raise ConflictException(
            f"Cannot delete transporter '{t.company_name}' because they have won one or more auctions. "
            "Please deactivate their account instead."
        )

    company_name = t.company_name
    user_id = t.user_id

    # Nullify user_id in audit logs to prevent foreign key errors
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({AuditLog.user_id: None})

    # Delete the associated user which will cascade delete the transporter record
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
    else:
        db.delete(t)

    db.commit()

    log_audit(
        db, current_user.id, "DELETE_TRANSPORTER", "transporter", transporter_id,
        f"Deleted transporter {company_name}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message=f"Transporter {company_name} deleted successfully")


