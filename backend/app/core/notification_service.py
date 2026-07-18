"""
Notification Service for TRAMS.
Handles sending emails (SMTP/Gmail) and WhatsApp notifications.
Logs mock notifications locally if API credentials are not set.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
from app.config import get_settings

settings = get_settings()

EMAILS_LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "emails.log")
WHATSAPP_LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "whatsapp.log")

def send_email_notification(to_email: str, subject: str, message_body: str):
    """
    Sends an email using configured SMTP settings.
    Falls back to logging to backend/emails.log if SMTP settings are missing.
    """
    # Check if SMTP configuration exists
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(message_body, "plain"))

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            server.quit()
            
            # Log success locally as well
            with open(EMAILS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(f"[SENT - SMTP] To: {to_email} | Subject: {subject}\nBody:\n{message_body}\n{'-'*50}\n")
            return True
        except Exception as e:
            # If actual SMTP fails, log to logfile with error note
            with open(EMAILS_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(f"[FAILED - SMTP Error: {str(e)}] To: {to_email} | Subject: {subject}\nBody:\n{message_body}\n{'-'*50}\n")
            return False
    else:
        # Development fallback log
        with open(EMAILS_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[SIMULATED - GMAIL] To: {to_email} | Subject: {subject}\nBody:\n{message_body}\n{'-'*50}\n")
        return True


def send_whatsapp_notification(to_phone: str, message_body: str):
    """
    Sends a WhatsApp message using configured API.
    Falls back to logging to backend/whatsapp.log if credentials are empty.
    """
    if not to_phone:
        return False
        
    if settings.WHATSAPP_API_KEY and settings.WHATSAPP_API_URL:
        try:
            payload = {
                "phone": to_phone,
                "message": message_body,
                "apikey": settings.WHATSAPP_API_KEY
            }
            # Simulated HTTP POST request to Whatsapp API gateway
            response = httpx.post(settings.WHATSAPP_API_URL, json=payload, timeout=5.0)
            status_code = response.status_code
            
            with open(WHATSAPP_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(f"[SENT - API Status: {status_code}] To: {to_phone} | Message: {message_body}\n{'-'*50}\n")
            return response.status_code < 400
        except Exception as e:
            with open(WHATSAPP_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(f"[FAILED - API Error: {str(e)}] To: {to_phone} | Message: {message_body}\n{'-'*50}\n")
            return False
    else:
        # Development fallback log
        with open(WHATSAPP_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(f"[SIMULATED - WHATSAPP] To: {to_phone} | Message: {message_body}\n{'-'*50}\n")
        return True
