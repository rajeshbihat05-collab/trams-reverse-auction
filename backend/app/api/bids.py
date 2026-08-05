"""
Bid API endpoints: submit, update, get bids, get auction results.
"""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.core.exceptions import (
    NotFoundException, BadRequestException, ForbiddenException,
    AuctionClosedException, BidNotAllowedException
)
from app.core.websocket_manager import manager
from app.dependencies import get_current_user, get_admin_user, log_audit
from app.models.user import User
from app.models.auction import Auction, AuctionInvite
from app.models.bid import Bid, BidHistory, AuctionResult
from app.models.transporter import Transporter
from app.models.notification import Notification
from app.schemas.bid import (
    BidCreate, BidUpdate, BidResponse, BidListResponse,
    BidHistoryResponse, BidRankResponse, AuctionResultResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/bids", tags=["Bids"])


@router.post("", response_model=BidResponse)
async def submit_bid(
    data: BidCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "transporter":
        raise ForbiddenException("Only transporters can submit bids")

    transporter = db.query(Transporter).filter(Transporter.user_id == current_user.id).first()
    if not transporter:
        raise NotFoundException("Transporter profile not found")

    auction = db.query(Auction).filter(Auction.id == data.auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if auction.status not in ("live", "published"):
        raise AuctionClosedException()

    now = datetime.now(timezone.utc)
    if auction.closing_time:
        closing = auction.closing_time.replace(tzinfo=timezone.utc) if auction.closing_time.tzinfo is None else auction.closing_time
        if closing <= now:
            auction.status = "closed"
            db.commit()
            raise AuctionClosedException()

    invite = db.query(AuctionInvite).filter(
        AuctionInvite.auction_id == data.auction_id,
        AuctionInvite.transporter_id == transporter.id,
    ).first()
    if not invite:
        raise BidNotAllowedException()

    # Check reserve price
    if auction.reserve_price and data.amount > float(auction.reserve_price):
        raise BadRequestException(
            f"Bid amount cannot exceed reserve price of ₹{float(auction.reserve_price):,.2f}"
        )

    # Check for existing bid (Reverse Auction Rule: Must be strictly lower than previous bid)
    existing_bid = db.query(Bid).filter(
        Bid.auction_id == data.auction_id,
        Bid.transporter_id == transporter.id,
        Bid.is_latest == True,
    ).first()

    if existing_bid:
        if data.amount >= float(existing_bid.amount):
            raise BadRequestException(
                f"In a reverse auction, your new bid (₹{data.amount:,.2f}) must be lower than your previous active rate (₹{float(existing_bid.amount):,.2f})"
            )

        # Update existing bid
        old_amount = float(existing_bid.amount)
        history = BidHistory(
            bid_id=existing_bid.id,
            old_amount=old_amount,
            new_amount=data.amount,
            revision_number=existing_bid.revision_number + 1,
        )
        db.add(history)

        existing_bid.amount = data.amount
        existing_bid.remarks = data.remarks
        existing_bid.revision_number += 1
        existing_bid.submitted_at = now
        db.flush()
        bid = existing_bid
    else:
        bid = Bid(
            auction_id=data.auction_id,
            transporter_id=transporter.id,
            amount=data.amount,
            remarks=data.remarks,
            revision_number=1,
            is_latest=True,
        )
        db.add(bid)
        db.flush()

        history = BidHistory(
            bid_id=bid.id,
            old_amount=None,
            new_amount=data.amount,
            revision_number=1,
        )
        db.add(history)

        auction.total_bids += 1
        transporter.total_bids += 1

        invite.status = "participated"

    # Anti-Sniping Check: if bid submitted within 2 minutes (120s) of closing time, auto extend by 3 minutes
    if auction.closing_time:
        closing = auction.closing_time.replace(tzinfo=timezone.utc) if auction.closing_time.tzinfo is None else auction.closing_time
        time_left_secs = (closing - now).total_seconds()
        if 0 < time_left_secs < 120:
            new_closing = now + timedelta(minutes=3)
            auction.closing_time = new_closing
            db.flush()
            await manager.send_auction_status(auction.id, "extended", {
                "auction_id": auction.id,
                "closing_time": new_closing.isoformat(),
                "extended_by_minutes": 3,
                "reason": "Anti-sniping auto-extension"
            })

    db.commit()
    db.refresh(bid)

    # Calculate current rankings and lowest bid for WebSocket update
    all_bids = (
        db.query(Bid)
        .filter(Bid.auction_id == auction.id, Bid.is_latest == True)
        .order_by(Bid.amount.asc())
        .all()
    )
    lowest_bid = float(all_bids[0].amount) if all_bids else float(bid.amount)
    rank = 1
    for idx, b in enumerate(all_bids, 1):
        if b.transporter_id == transporter.id:
            rank = idx
            break

    # Notify via WebSocket
    bid_data = {
        "bid_id": bid.id,
        "auction_id": auction.id,
        "auction_number": auction.auction_number,
        "transporter_id": transporter.id,
        "company_name": transporter.company_name,
        "amount": float(bid.amount),
        "revision_number": bid.revision_number,
        "submitted_at": bid.submitted_at.isoformat(),
        "total_bids": auction.total_bids,
        "lowest_bid": lowest_bid,
        "rank": rank,
    }

    await manager.send_bid_update(auction.id, bid_data, transporter.id)

    # Create notification for admin
    admin_users = db.query(User).filter(User.role.in_(["admin", "manager"])).all()
    for admin in admin_users:
        notif = Notification(
            user_id=admin.id,
            title=f"New Bid on {auction.auction_number}",
            message=f"{transporter.company_name} submitted ₹{float(bid.amount):,.2f} (Rev {bid.revision_number})",
            type="bid_received",
            reference_id=auction.id,
            reference_type="auction",
        )
        db.add(notif)
    db.commit()

    log_audit(
        db, current_user.id, "SUBMIT_BID", "bid", bid.id,
        f"Bid ₹{float(bid.amount):,.2f} on auction {auction.auction_number}",
        ip_address=request.client.host if request.client else None,
    )

    return BidResponse(
        id=bid.id,
        auction_id=bid.auction_id,
        transporter_id=bid.transporter_id,
        company_name=transporter.company_name,
        amount=float(bid.amount),
        currency=bid.currency,
        remarks=bid.remarks,
        revision_number=bid.revision_number,
        is_latest=bid.is_latest,
        submitted_at=bid.submitted_at,
    )


@router.get("/auction/{auction_id}", response_model=BidListResponse)
async def get_auction_bids(
    auction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise NotFoundException("Auction not found")

    if current_user.role in ("admin", "manager"):
        bids = (
            db.query(Bid)
            .filter(Bid.auction_id == auction_id, Bid.is_latest == True)
            .order_by(Bid.amount.asc())
            .all()
        )
    else:
        transporter = db.query(Transporter).filter(Transporter.user_id == current_user.id).first()
        if not transporter:
            return BidListResponse(bids=[], total=0)
        bids = (
            db.query(Bid)
            .filter(
                Bid.auction_id == auction_id,
                Bid.transporter_id == transporter.id,
                Bid.is_latest == True,
            )
            .all()
        )

    bid_responses = []
    for b in bids:
        t = db.query(Transporter).filter(Transporter.id == b.transporter_id).first()
        bid_responses.append(BidResponse(
            id=b.id,
            auction_id=b.auction_id,
            transporter_id=b.transporter_id,
            company_name=t.company_name if t else None,
            amount=float(b.amount),
            currency=b.currency,
            remarks=b.remarks,
            revision_number=b.revision_number,
            is_latest=b.is_latest,
            submitted_at=b.submitted_at,
        ))

    lowest = min((float(b.amount) for b in bids), default=None)
    highest = max((float(b.amount) for b in bids), default=None)

    return BidListResponse(
        bids=bid_responses,
        total=len(bid_responses),
        lowest_bid=lowest,
        highest_bid=highest,
    )


@router.get("/auction/{auction_id}/history/{transporter_id}", response_model=list[BidHistoryResponse])
async def get_bid_history(
    auction_id: str,
    transporter_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    bid = db.query(Bid).filter(
        Bid.auction_id == auction_id,
        Bid.transporter_id == transporter_id,
        Bid.is_latest == True,
    ).first()
    if not bid:
        return []

    history = (
        db.query(BidHistory)
        .filter(BidHistory.bid_id == bid.id)
        .order_by(BidHistory.revision_number.desc())
        .all()
    )

    return [
        BidHistoryResponse(
            id=h.id,
            old_amount=float(h.old_amount) if h.old_amount else None,
            new_amount=float(h.new_amount),
            revision_number=h.revision_number,
            changed_at=h.changed_at,
        )
        for h in history
    ]


@router.get("/auction/{auction_id}/rankings", response_model=list[BidRankResponse])
async def get_bid_rankings(
    auction_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    bids = (
        db.query(Bid)
        .filter(Bid.auction_id == auction_id, Bid.is_latest == True)
        .order_by(Bid.amount.asc())
        .all()
    )

    rankings = []
    for rank, bid in enumerate(bids, 1):
        t = db.query(Transporter).filter(Transporter.id == bid.transporter_id).first()
        rankings.append(BidRankResponse(
            rank=rank,
            transporter_id=bid.transporter_id,
            company_name=t.company_name if t else "Unknown",
            amount=float(bid.amount),
            revision_count=bid.revision_number,
            submitted_at=bid.submitted_at,
        ))

    return rankings


@router.get("/auction/{auction_id}/result", response_model=AuctionResultResponse)
async def get_auction_result(
    auction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.query(AuctionResult).filter(AuctionResult.auction_id == auction_id).first()
    if not result:
        raise NotFoundException("Auction result not found")

    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    winner = db.query(Transporter).filter(Transporter.id == result.winner_id).first()
    awarder = db.query(User).filter(User.id == result.awarded_by).first()

    rankings = []
    if current_user.role in ("admin", "manager"):
        bids = (
            db.query(Bid)
            .filter(Bid.auction_id == auction_id, Bid.is_latest == True)
            .order_by(Bid.amount.asc())
            .all()
        )
        for rank, bid in enumerate(bids, 1):
            t = db.query(Transporter).filter(Transporter.id == bid.transporter_id).first()
            rankings.append(BidRankResponse(
                rank=rank,
                transporter_id=bid.transporter_id,
                company_name=t.company_name if t else "Unknown",
                amount=float(bid.amount),
                revision_count=bid.revision_number,
                submitted_at=bid.submitted_at,
            ))

    return AuctionResultResponse(
        id=result.id,
        auction_id=result.auction_id,
        auction_number=auction.auction_number if auction else None,
        winner_id=result.winner_id,
        winner_company=winner.company_name if winner else None,
        awarded_by=result.awarded_by,
        awarder_name=awarder.full_name if awarder else None,
        winning_amount=float(result.winning_amount),
        award_status=result.award_status,
        remarks=result.remarks,
        awarded_at=result.awarded_at,
        rankings=rankings,
    )


@router.get("/my-bids", response_model=BidListResponse)
async def get_my_bids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transporter = db.query(Transporter).filter(Transporter.user_id == current_user.id).first()
    if not transporter:
        return BidListResponse(bids=[], total=0)

    bids = (
        db.query(Bid)
        .filter(Bid.transporter_id == transporter.id, Bid.is_latest == True)
        .order_by(Bid.submitted_at.desc())
        .all()
    )

    bid_responses = []
    for b in bids:
        bid_responses.append(BidResponse(
            id=b.id,
            auction_id=b.auction_id,
            transporter_id=b.transporter_id,
            company_name=transporter.company_name,
            amount=float(b.amount),
            currency=b.currency,
            remarks=b.remarks,
            revision_number=b.revision_number,
            is_latest=b.is_latest,
            submitted_at=b.submitted_at,
        ))

    return BidListResponse(bids=bid_responses, total=len(bid_responses))
