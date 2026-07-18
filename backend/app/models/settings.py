"""
Company settings model.
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text

from app.database import Base
from app.models.user import generate_uuid, utcnow


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_name = Column(String(255), default="TRAMS Enterprise", nullable=False)
    logo_path = Column(String(500), nullable=True)
    tagline = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)

    # Email settings
    email_host = Column(String(255), nullable=True)
    email_port = Column(Integer, default=587)
    email_user = Column(String(255), nullable=True)
    email_password = Column(String(255), nullable=True)
    email_use_tls = Column(Boolean, default=True)

    # SMS settings
    sms_api_key = Column(String(255), nullable=True)
    sms_api_url = Column(String(500), nullable=True)
    sms_sender_id = Column(String(20), nullable=True)

    # WhatsApp settings
    whatsapp_api_key = Column(String(255), nullable=True)
    whatsapp_api_url = Column(String(500), nullable=True)

    # General settings
    currency = Column(String(5), default="INR", nullable=False)
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    date_format = Column(String(20), default="DD/MM/YYYY", nullable=False)
    bid_auto_close = Column(Boolean, default=True, nullable=False)
    maintenance_mode = Column(Boolean, default=False, nullable=False)

    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    def __repr__(self):
        return f"<CompanySettings {self.company_name}>"
