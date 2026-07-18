"""
Authentication API endpoints:
Login, Register, Forgot Password, OTP, Reset Password, Refresh Token, Logout.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.core import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, generate_otp
)
from app.core.exceptions import (
    BadRequestException, UnauthorizedException, ConflictException, NotFoundException
)
from app.dependencies import get_current_user, log_audit
from app.models.user import User
from app.models.transporter import Transporter
from app.models.notification import Notification
from app.schemas.auth import (
    LoginRequest, LoginResponse, UserInfo, RegisterRequest,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest,
    RefreshTokenRequest, ChangePasswordRequest, MessageResponse
)
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedException("Account is deactivated. Contact admin.")

    access_token = create_access_token({"sub": user.id, "role": user.role})

    refresh_expires = timedelta(days=30) if data.remember_me else timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token({"sub": user.id})

    user.last_login = datetime.now(timezone.utc)
    user.refresh_token = refresh_token
    db.commit()

    transporter_id = None
    company_name = None
    if user.role == "transporter" and user.transporter:
        transporter_id = user.transporter.id
        company_name = user.transporter.company_name

    log_audit(
        db, user.id, "LOGIN", "user", user.id,
        f"User {user.email} logged in",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            phone=user.phone,
            avatar_url=user.avatar_url,
            transporter_id=transporter_id,
            company_name=company_name,
        ),
    )


@router.post("/register", response_model=MessageResponse)
async def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ConflictException("Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role if data.role in ("transporter",) else "transporter",
    )
    db.add(user)
    db.flush()

    if data.role == "transporter":
        transporter = Transporter(
            user_id=user.id,
            company_name=data.company_name or data.full_name,
            gst_number=data.gst_number,
            pan_number=data.pan_number,
            address=data.address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
        )
        db.add(transporter)

    notification = Notification(
        user_id=user.id,
        title="Welcome to TRAMS",
        message=f"Welcome {user.full_name}! Your account has been created. Please complete your profile and upload required documents.",
        type="system",
    )
    db.add(notification)

    db.commit()

    log_audit(
        db, user.id, "REGISTER", "user", user.id,
        f"New user registered: {user.email}",
        ip_address=request.client.host if request.client else None,
    )

    return MessageResponse(message="Registration successful. You can now log in.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return MessageResponse(message="If the email exists, an OTP has been sent.")

    otp = generate_otp()
    user.otp_code = otp
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    db.commit()

    # In production, send OTP via email/SMS
    # For development, the OTP is stored in DB
    return MessageResponse(message=f"OTP has been sent to your email. (Dev OTP: {otp})")


@router.post("/verify-otp", response_model=MessageResponse)
async def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise NotFoundException("User not found")

    if not user.otp_code or user.otp_code != data.otp:
        raise BadRequestException("Invalid OTP")

    if user.otp_expiry and user.otp_expiry < datetime.now(timezone.utc):
        raise BadRequestException("OTP has expired")

    return MessageResponse(message="OTP verified successfully")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise NotFoundException("User not found")

    if not user.otp_code or user.otp_code != data.otp:
        raise BadRequestException("Invalid OTP")

    if user.otp_expiry and user.otp_expiry < datetime.now(timezone.utc):
        raise BadRequestException("OTP has expired")

    user.password_hash = hash_password(data.new_password)
    user.otp_code = None
    user.otp_expiry = None
    db.commit()

    return MessageResponse(message="Password reset successfully")


@router.post("/refresh-token", response_model=dict)
async def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedException("User not found")

    new_access = create_access_token({"sub": user.id, "role": user.role})
    new_refresh = create_refresh_token({"sub": user.id})
    user.refresh_token = new_refresh
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise BadRequestException("Current password is incorrect")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()

    return MessageResponse(message="Password changed successfully")


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.refresh_token = None
    db.commit()
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    transporter_id = None
    company_name = None
    if current_user.role == "transporter" and current_user.transporter:
        transporter_id = current_user.transporter.id
        company_name = current_user.transporter.company_name

    return UserInfo(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        avatar_url=current_user.avatar_url,
        transporter_id=transporter_id,
        company_name=company_name,
    )
