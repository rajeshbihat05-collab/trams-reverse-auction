"""
Dashboard API endpoints for Admin and Transporter dashboards.
"""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models.user import User
from app.models.auction import Auction
from app.models.bid import Bid, AuctionResult
from app.models.transporter import Transporter
from app.models.document import Document
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.transporter import Vehicle, Driver
from app.schemas.report import (
    DashboardStats, TransporterDashboardStats, RecentActivity, ChartData
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/admin", response_model=DashboardStats)
async def admin_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total = db.query(func.count(Auction.id)).scalar() or 0
    live = db.query(func.count(Auction.id)).filter(Auction.status == "live").scalar() or 0
    closed = db.query(func.count(Auction.id)).filter(Auction.status == "closed").scalar() or 0
    awarded = db.query(func.count(Auction.id)).filter(Auction.status == "awarded").scalar() or 0
    published = db.query(func.count(Auction.id)).filter(Auction.status == "published").scalar() or 0
    draft = db.query(func.count(Auction.id)).filter(Auction.status == "draft").scalar() or 0
    cancelled = db.query(func.count(Auction.id)).filter(Auction.status == "cancelled").scalar() or 0

    total_transporters = db.query(func.count(Transporter.id)).scalar() or 0
    verified_transporters = db.query(func.count(Transporter.id)).filter(
        Transporter.is_verified == True
    ).scalar() or 0

    todays = db.query(func.count(Auction.id)).filter(
        Auction.created_at >= today_start
    ).scalar() or 0

    live_bids = db.query(func.count(Bid.id)).filter(Bid.is_latest == True).scalar() or 0

    # Calculate total savings from awarded auctions
    results = db.query(AuctionResult).all()
    total_savings = 0.0
    total_reserve = 0.0
    for r in results:
        auction = db.query(Auction).filter(Auction.id == r.auction_id).first()
        if auction and auction.reserve_price:
            savings = float(auction.reserve_price) - float(r.winning_amount)
            if savings > 0:
                total_savings += savings
                total_reserve += float(auction.reserve_price)

    avg_reduction = (total_savings / total_reserve * 100) if total_reserve > 0 else 0

    return DashboardStats(
        total_auctions=total,
        live_auctions=live,
        closed_auctions=closed,
        awarded_auctions=awarded,
        pending_auctions=published,
        draft_auctions=draft,
        cancelled_auctions=cancelled,
        total_transporters=total_transporters,
        verified_transporters=verified_transporters,
        todays_auctions=todays,
        live_bid_count=live_bids,
        total_savings=round(total_savings, 2),
        avg_bid_reduction=round(avg_reduction, 2),
    )


@router.get("/transporter", response_model=TransporterDashboardStats)
async def transporter_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transporter = db.query(Transporter).filter(Transporter.user_id == current_user.id).first()
    if not transporter:
        return TransporterDashboardStats()

    from app.models.auction import AuctionInvite
    available = db.query(func.count(AuctionInvite.id)).filter(
        AuctionInvite.transporter_id == transporter.id,
        AuctionInvite.status.in_(["invited", "viewed"]),
    ).scalar() or 0

    active_bids = db.query(func.count(Bid.id)).filter(
        Bid.transporter_id == transporter.id,
        Bid.is_latest == True,
    ).join(Auction).filter(Auction.status.in_(["live", "published"])).scalar() or 0

    won = db.query(func.count(AuctionResult.id)).filter(
        AuctionResult.winner_id == transporter.id
    ).scalar() or 0

    total_bid_count = db.query(func.count(Bid.id)).filter(
        Bid.transporter_id == transporter.id, Bid.is_latest == True
    ).scalar() or 0

    lost = total_bid_count - won - active_bids
    if lost < 0:
        lost = 0

    pending_docs = db.query(func.count(Document.id)).filter(
        Document.transporter_id == transporter.id,
        Document.status == "pending",
    ).scalar() or 0

    vehicles = db.query(func.count(Vehicle.id)).filter(
        Vehicle.transporter_id == transporter.id,
        Vehicle.is_active == True,
    ).scalar() or 0

    drivers = db.query(func.count(Driver.id)).filter(
        Driver.transporter_id == transporter.id,
        Driver.is_active == True,
    ).scalar() or 0

    return TransporterDashboardStats(
        available_auctions=available,
        active_bids=active_bids,
        won_auctions=won,
        lost_auctions=lost,
        total_bids=total_bid_count,
        pending_documents=pending_docs,
        total_vehicles=vehicles,
        total_drivers=drivers,
    )


@router.get("/recent-activity", response_model=list[RecentActivity])
async def recent_activity(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(20)
        .all()
    )

    activities = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        activities.append(RecentActivity(
            id=log.id,
            action=log.action,
            description=log.description or f"{log.action} on {log.entity_type or 'system'}",
            user_name=user.full_name if user else "System",
            entity_type=log.entity_type,
            created_at=log.created_at,
        ))

    return activities


@router.get("/charts/auctions-by-status", response_model=list[ChartData])
async def auctions_by_status(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(Auction.status, func.count(Auction.id))
        .group_by(Auction.status)
        .all()
    )
    return [ChartData(label=status, value=count) for status, count in results]


@router.get("/charts/monthly-auctions", response_model=list[ChartData])
async def monthly_auctions(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    auctions = db.query(Auction).filter(Auction.created_at >= six_months_ago).all()

    monthly = {}
    for a in auctions:
        key = a.created_at.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + 1

    return [ChartData(label=k, value=v) for k, v in sorted(monthly.items())]


@router.get("/charts/top-transporters", response_model=list[ChartData])
async def top_transporters(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(Transporter.company_name, func.count(AuctionResult.id))
        .join(AuctionResult, AuctionResult.winner_id == Transporter.id)
        .group_by(Transporter.company_name)
        .order_by(func.count(AuctionResult.id).desc())
        .limit(10)
        .all()
    )
    return [ChartData(label=name, value=count) for name, count in results]
