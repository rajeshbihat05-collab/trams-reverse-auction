"""
Document upload and management API.
"""

import os
import shutil
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import get_settings
from app.core.exceptions import NotFoundException, BadRequestException
from app.dependencies import get_current_user, get_admin_user, log_audit
from app.models.user import User
from app.models.document import Document
from app.models.transporter import Transporter
from app.schemas.auth import MessageResponse

settings = get_settings()

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    transporter_id: str = Form(...),
    doc_type: str = Form(...),
    doc_number: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in settings.allowed_extensions_list:
        raise BadRequestException(f"File type .{ext} not allowed")

    upload_dir = settings.upload_path / "documents" / transporter_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = f"{doc_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
    file_path = upload_dir / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    exp_date = None
    if expiry_date:
        try:
            exp_date = datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            pass

    doc = Document(
        transporter_id=transporter_id,
        doc_type=doc_type,
        doc_number=doc_number,
        file_path=str(file_path),
        file_name=file.filename or safe_filename,
        expiry_date=exp_date,
        status="pending",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "doc_type": doc.doc_type,
        "file_name": doc.file_name,
        "status": doc.status,
        "message": "Document uploaded successfully",
    }


@router.get("/transporter/{transporter_id}")
async def list_documents(
    transporter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = db.query(Document).filter(Document.transporter_id == transporter_id).all()
    return [
        {
            "id": d.id,
            "doc_type": d.doc_type,
            "doc_number": d.doc_number,
            "file_name": d.file_name,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "status": d.status,
            "remarks": d.remarks,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.put("/{doc_id}/verify", response_model=MessageResponse)
async def verify_document(
    doc_id: str,
    status: str = Query(..., regex="^(verified|rejected)$"),
    remarks: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise NotFoundException("Document not found")

    doc.status = status
    doc.remarks = remarks
    doc.verified_by = current_user.id
    doc.verified_at = datetime.now(timezone.utc)
    db.commit()

    return MessageResponse(message=f"Document {status}")


@router.delete("/{doc_id}", response_model=MessageResponse)
async def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise NotFoundException("Document not found")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()
    return MessageResponse(message="Document deleted")


@router.get("/expiring")
async def get_expiring_documents(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) + timedelta(days=days)

    docs = (
        db.query(Document)
        .filter(Document.expiry_date != None, Document.expiry_date <= cutoff)
        .order_by(Document.expiry_date.asc())
        .all()
    )

    result = []
    for d in docs:
        t = db.query(Transporter).filter(Transporter.id == d.transporter_id).first()
        result.append({
            "id": d.id,
            "transporter_id": d.transporter_id,
            "company_name": t.company_name if t else None,
            "doc_type": d.doc_type,
            "doc_number": d.doc_number,
            "file_name": d.file_name,
            "expiry_date": d.expiry_date.isoformat() if d.expiry_date else None,
            "status": d.status,
            "days_remaining": (d.expiry_date - datetime.now(timezone.utc)).days if d.expiry_date else None,
        })

    return result
