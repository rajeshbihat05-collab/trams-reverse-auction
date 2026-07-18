"""
Document model for transporter document uploads.
"""

import enum

from sqlalchemy import (
    Column, String, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import generate_uuid, utcnow


class DocType(str, enum.Enum):
    PAN = "PAN"
    GST = "GST"
    RC = "RC"
    INSURANCE = "Insurance"
    FITNESS = "Fitness"
    PERMIT = "Permit"
    DRIVING_LICENSE = "DL"
    COMPANY = "Company"
    OTHER = "Other"


class DocStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transporter_id = Column(String(36), ForeignKey("transporters.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(String(20), nullable=False)
    doc_number = Column(String(50), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    status = Column(String(20), default=DocStatus.PENDING.value, nullable=False)
    remarks = Column(Text, nullable=True)
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    transporter = relationship("Transporter", back_populates="documents")

    def __repr__(self):
        return f"<Document {self.doc_type} - {self.file_name}>"
