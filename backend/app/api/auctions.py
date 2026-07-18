"""
Auction CRUD API + lifecycle endpoints: publish, close, award, cancel.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.core import generate_auction_number
from app.core.notification_service import send_email_notification, send_whatsapp_notification
from app.core.exceptions import (
    NotFoundException, BadRequestException, ForbiddenException
)
from app.dependencies import get_current_user, get_admin_user, log_audit
from app.models.user import User
from app.models.auction import Auction, AuctionInvite, AuctionStatus
from app.models.bid import Bid, AuctionResult
from app.models.transporter import Transporter
from app.models.notification import Notification
from app.schemas.auction import (
    AuctionCreate, AuctionUpdate, AuctionResponse, AuctionListResponse,
    AuctionDetailResponse, AuctionPublishRequest, AuctionAwardRequest,
    AuctionInviteResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/auctions", tags=["Auctions"])


def auction_to_response(auction: Auction, db: Session) -> AuctionResponse:
    creator = db.query(User).filter(User.id == auction.created_by).first()
    return AuctionResponse(
        id=auction.id,
        auction_number=auction.auction_number,
        created_by=auction.created_by,
        creator_name=creator.full_name if creator else None,
        pickup_location=auction.pickup_location,
        pickup_postal_code=auction.pickup_postal_code,
        destination=auction.destination,
        destination_postal_code=auction.destination_postal_code,
        distance_km=auction.distance_km,
        vehicle_type=auction.vehicle_type,
        vehicle_capacity=auction.vehicle_capacity,
        vehicle_length=auction.vehicle_length,
        vehicle_width=auction.vehicle_width,
        material_type=auction.material_type,
        expected_weight=auction.expected_weight,
        loading_date=auction.loading_date,
        reporting_time=auction.reporting_time,
        unloading_point=auction.unloading_point,
        start_time=auction.start_time,
        closing_time=auction.closing_time,
        reserve_price=float(auction.reserve_price) if auction.reserve_price else None,
        bid_type=auction.bid_type,
        special_instructions=auction.special_instructions,
        terms_conditions=auction.terms_conditions,
        status=auction.status,
        auto_notify=auction.auto_notify,
        total_bids=auction.total_bids,
        created_at=auction.created_at,
    )


@router.get("", response_model=AuctionListResponse)
async def list_auctions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Auction)

    if current_user.role == "transporter":
        transporter = db.query(Transporter).filter(Transporter.user_id == current_user.id).first()
        if transporter:
            query = query.join(AuctionInvite).filter(
                AuctionInvite.transporter_id == transporter.id,
                Auction.status.in_(["published", "live", "closed", "awarded"]),
            )
        else:
            return AuctionListResponse(auctions=[], total=0, page=page, page_size=page_size)

    if status:
        query = query.filter(Auction.status == status)

    if search:
        query = query.filter(
            or_(
                Auction.auction_number.ilike(f"%{search}%"),
                Auction.pickup_location.ilike(f"%{search}%"),
                Auction.destination.ilike(f"%{search}%"),
                Auction.material_type.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    auctions = (
        query.order_by(Auction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return AuctionListResponse(
        auctions=[auction_to_response(a, db) for a in auctions],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{auction_id}", response_model=AuctionDetailResponse)
async def get_auction(
    auction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if current_user.role == "transporter":
        transporter = db.query(Transporter).filter(Transporter.user_id == current_user.id).first()
        if transporter:
            invite = db.query(AuctionInvite).filter(
                AuctionInvite.auction_id == auction_id,
                AuctionInvite.transporter_id == transporter.id,
            ).first()
            if not invite:
                raise ForbiddenException("You are not invited to this auction")
            if invite.status == "invited":
                invite.status = "viewed"
                db.commit()

    response = auction_to_response(auction, db)
    invites = []
    if current_user.role in ("admin", "manager"):
        for inv in auction.invites:
            t = db.query(Transporter).filter(Transporter.id == inv.transporter_id).first()
            invites.append(AuctionInviteResponse(
                id=inv.id,
                transporter_id=inv.transporter_id,
                company_name=t.company_name if t else None,
                status=inv.status,
                invited_at=inv.invited_at,
            ))

    return AuctionDetailResponse(
        **response.model_dump(),
        invites=invites,
        attachments=[],
    )


@router.post("", response_model=AuctionResponse)
async def create_auction(
    data: AuctionCreate,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = Auction(
        auction_number=generate_auction_number(),
        created_by=current_user.id,
        pickup_location=data.pickup_location,
        pickup_postal_code=data.pickup_postal_code,
        destination=data.destination,
        destination_postal_code=data.destination_postal_code,
        distance_km=data.distance_km,
        vehicle_type=data.vehicle_type,
        vehicle_capacity=data.vehicle_capacity,
        vehicle_length=data.vehicle_length,
        vehicle_width=data.vehicle_width,
        material_type=data.material_type,
        expected_weight=data.expected_weight,
        loading_date=data.loading_date,
        reporting_time=data.reporting_time,
        unloading_point=data.unloading_point,
        closing_time=data.closing_time,
        reserve_price=data.reserve_price,
        special_instructions=data.special_instructions,
        terms_conditions=data.terms_conditions,
        auto_notify=data.auto_notify,
        status=AuctionStatus.DRAFT.value,
    )
    db.add(auction)
    db.flush()

    for tid in data.invited_transporter_ids:
        invite = AuctionInvite(auction_id=auction.id, transporter_id=tid)
        db.add(invite)

    db.commit()
    db.refresh(auction)

    log_audit(
        db, current_user.id, "CREATE_AUCTION", "auction", auction.id,
        f"Created auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return auction_to_response(auction, db)


@router.put("/{auction_id}", response_model=AuctionResponse)
async def update_auction(
    auction_id: str,
    data: AuctionUpdate,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status not in ("draft", "published"):
        raise BadRequestException("Cannot edit auction in current status")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(auction, field, value)

    db.commit()
    db.refresh(auction)

    log_audit(
        db, current_user.id, "UPDATE_AUCTION", "auction", auction.id,
        f"Updated auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return auction_to_response(auction, db)


@router.post("/{auction_id}/publish", response_model=MessageResponse)
async def publish_auction(
    auction_id: str,
    data: AuctionPublishRequest,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status != "draft":
        raise BadRequestException("Only draft auctions can be published")

    # Add additional invites
    for tid in data.transporter_ids:
        existing = db.query(AuctionInvite).filter(
            AuctionInvite.auction_id == auction_id,
            AuctionInvite.transporter_id == tid,
        ).first()
        if not existing:
            db.add(AuctionInvite(auction_id=auction_id, transporter_id=tid))

    auction.status = AuctionStatus.LIVE.value
    auction.start_time = datetime.now(timezone.utc)

    # Send notifications to all invited transporters
    if auction.auto_notify:
        invites = db.query(AuctionInvite).filter(AuctionInvite.auction_id == auction_id).all()
        for invite in invites:
            transporter = db.query(Transporter).filter(Transporter.id == invite.transporter_id).first()
            if transporter:
                message_text = f"You are invited to bid on auction {auction.auction_number}. Route: {auction.pickup_location} to {auction.destination}. Material: {auction.material_type}. Closing: {auction.closing_time.strftime('%d/%m/%Y %H:%M')}"
                notification = Notification(
                    user_id=transporter.user_id,
                    title=f"New Auction: {auction.auction_number}",
                    message=message_text,
                    type="auction_live",
                    reference_id=auction.id,
                    reference_type="auction",
                )
                db.add(notification)

                # Send email and WhatsApp
                t_user = db.query(User).filter(User.id == transporter.user_id).first()
                if t_user:
                    if t_user.email:
                        send_email_notification(
                            t_user.email,
                            f"New Auction Invitation: {auction.auction_number}",
                            message_text
                        )
                    if t_user.phone:
                        send_whatsapp_notification(
                            t_user.phone,
                            f"New Auction: {auction.auction_number}\nRoute: {auction.pickup_location} to {auction.destination}\nClosing: {auction.closing_time.strftime('%d/%m/%Y %H:%M')}"
                        )

    db.commit()

    log_audit(
        db, current_user.id, "PUBLISH_AUCTION", "auction", auction.id,
        f"Published auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message=f"Auction {auction.auction_number} published successfully")


@router.post("/{auction_id}/close", response_model=MessageResponse)
async def close_auction(
    auction_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status not in ("live", "published"):
        raise BadRequestException("Only live auctions can be closed")

    auction.status = AuctionStatus.CLOSED.value
    db.commit()

    log_audit(
        db, current_user.id, "CLOSE_AUCTION", "auction", auction.id,
        f"Closed auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message=f"Auction {auction.auction_number} closed")


@router.post("/{auction_id}/award", response_model=MessageResponse)
async def award_auction(
    auction_id: str,
    data: AuctionAwardRequest,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status != "closed":
        raise BadRequestException("Only closed auctions can be awarded")

    existing = db.query(AuctionResult).filter(AuctionResult.auction_id == auction_id).first()
    if existing:
        raise BadRequestException("Auction already awarded")

    result = AuctionResult(
        auction_id=auction_id,
        winner_id=data.transporter_id,
        awarded_by=current_user.id,
        winning_amount=data.amount,
        award_status=data.award_status,
        remarks=data.remarks,
    )
    db.add(result)

    auction.status = AuctionStatus.AWARDED.value

    # Update transporter stats
    winner = db.query(Transporter).filter(Transporter.id == data.transporter_id).first()
    if winner:
        winner.total_wins += 1
        # Notify winner
        message_text = f"You have won auction {auction.auction_number} with bid amount ₹{data.amount:,.2f}. Route: {auction.pickup_location} to {auction.destination}."
        notification = Notification(
            user_id=winner.user_id,
            title=f"Congratulations! Auction {auction.auction_number} Awarded",
            message=message_text,
            type="winner",
            reference_id=auction.id,
            reference_type="auction",
        )
        db.add(notification)

        # Send email and WhatsApp
        w_user = db.query(User).filter(User.id == winner.user_id).first()
        if w_user:
            if w_user.email:
                send_email_notification(
                    w_user.email,
                    f"Congratulations! You won Auction: {auction.auction_number}",
                    message_text
                )
            if w_user.phone:
                send_whatsapp_notification(
                    w_user.phone,
                    f"Congratulations! You won TRAMS Auction: {auction.auction_number}\nAmount: ₹{data.amount:,.2f}\nRoute: {auction.pickup_location} to {auction.destination}"
                )

    db.commit()

    log_audit(
        db, current_user.id, "AWARD_AUCTION", "auction", auction.id,
        f"Awarded auction {auction.auction_number} to transporter {data.transporter_id}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message=f"Auction {auction.auction_number} awarded successfully")


@router.post("/{auction_id}/cancel", response_model=MessageResponse)
async def cancel_auction(
    auction_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status == "awarded":
        raise BadRequestException("Cannot cancel an awarded auction")

    auction.status = AuctionStatus.CANCELLED.value
    db.commit()

    log_audit(
        db, current_user.id, "CANCEL_AUCTION", "auction", auction.id,
        f"Cancelled auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message=f"Auction {auction.auction_number} cancelled")


@router.delete("/{auction_id}", response_model=MessageResponse)
async def delete_auction(
    auction_id: str,
    request: Request,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status not in ("draft", "cancelled"):
        raise BadRequestException("Only draft or cancelled auctions can be deleted")

    db.delete(auction)
    db.commit()

    log_audit(
        db, current_user.id, "DELETE_AUCTION", "auction", auction.id,
        f"Deleted auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message="Auction deleted")
