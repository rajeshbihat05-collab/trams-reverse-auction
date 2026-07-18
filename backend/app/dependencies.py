"""
Shared FastAPI dependencies: authentication, database session, audit logging.
"""

import json
from datetime import datetime, timezone

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User
from app.models.audit import AuditLog

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and return the authenticated user."""
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User not found or inactive")

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require admin or manager role."""
    if current_user.role not in ("admin", "manager"):
        raise ForbiddenException("Admin access required")
    return current_user


async def get_transporter_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require transporter role."""
    if current_user.role != "transporter":
        raise ForbiddenException("Transporter access required")
    return current_user


def log_audit(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    description: str = None,
    old_values: dict = None,
    new_values: dict = None,
    ip_address: str = None,
    user_agent: str = None,
):
    """Record an audit log entry."""
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        old_values=json.dumps(old_values) if old_values else None,
        new_values=json.dumps(new_values) if new_values else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(audit)
    db.commit()
    return audit
