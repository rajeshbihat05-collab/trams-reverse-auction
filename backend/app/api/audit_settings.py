"""
Audit log API and Settings API endpoints.
"""

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.core.exceptions import NotFoundException
from app.dependencies import get_admin_user, log_audit
from app.models.user import User
from app.models.audit import AuditLog
from app.models.settings import CompanySettings
from app.schemas.report import (
    AuditLogResponse, AuditLogListResponse, SettingsResponse, SettingsUpdate
)

router = APIRouter(tags=["Audit & Settings"])


# =================== Audit Logs ===================
@router.get("/api/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if start_date:
        query = query.filter(AuditLog.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(AuditLog.created_at <= datetime.fromisoformat(end_date))
    if search:
        query = query.filter(
            or_(AuditLog.description.ilike(f"%{search}%"), AuditLog.action.ilike(f"%{search}%"))
        )

    total = query.count()
    logs = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    log_responses = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        log_responses.append(AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=user.full_name if user else None,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            description=log.description,
            ip_address=log.ip_address,
            created_at=log.created_at,
        ))

    return AuditLogListResponse(
        logs=log_responses, total=total, page=page, page_size=page_size,
    )


@router.get("/api/audit-logs/actions")
async def list_audit_actions(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    actions = db.query(AuditLog.action).distinct().all()
    return [a[0] for a in actions]


# =================== Settings ===================
@router.get("/api/settings", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    settings = db.query(CompanySettings).first()
    if not settings:
        settings = CompanySettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return SettingsResponse.model_validate(settings)


@router.put("/api/settings", response_model=SettingsResponse)
async def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    settings = db.query(CompanySettings).first()
    if not settings:
        settings = CompanySettings()
        db.add(settings)
        db.flush()

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(settings, k, v)

    db.commit()
    db.refresh(settings)

    log_audit(db, current_user.id, "UPDATE_SETTINGS", "settings", settings.id, "Updated company settings")

    return SettingsResponse.model_validate(settings)
