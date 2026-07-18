"""
TRAMS - Transport Reverse Auction Management System
Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.core.middleware import (
    RateLimitMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
)
from app.api import (
    auth, dashboard, auctions, bids, transporters,
    documents, notifications, reports, master,
    audit_settings, websocket
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    init_db()

    # Run seed on first startup
    from app.seed_data import seed_if_empty
    seed_if_empty()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise-level Transport Reverse Auction Management System for managing transport requirements, bidding, and logistics procurement.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_PER_MINUTE)

# Mount upload directory for serving files
import os
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(auctions.router)
app.include_router(bids.router)
app.include_router(transporters.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(master.router)
app.include_router(audit_settings.router)
app.include_router(websocket.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
