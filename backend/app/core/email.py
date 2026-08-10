"""Real-time SMTP Email Dispatcher for 2FA OTP Security Codes."""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
from app.config.settings import settings
from app.core.logging import logger


def _send_email_task(recipient: str, otp_code: str):
    """Execute SMTP connection and send email in background thread."""
    smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER", "")
    smtp_pass = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")
    smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(settings.SMTP_PORT or os.getenv("SMTP_PORT", 587))
    from_name = settings.EMAILS_FROM_NAME or "FinPilot AI Security"

    if not smtp_user or not smtp_pass:
        logger.info("[SMTP SIMULATION] Real SMTP credentials (SMTP_USER/SMTP_PASSWORD) not configured. Code [%s] for %s logged.", otp_code, recipient)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your FinPilot 2FA Verification Code: {otp_code}"
    msg["From"] = f"{from_name} <{smtp_user}>"
    msg["To"] = recipient

    text_content = f"""
Hello,

Your 6-digit 2FA verification code for FinPilot AI is:

    {otp_code}

This code is valid for 10 minutes. If you did not request this, please ignore this email.

Best regards,
FinPilot AI Security Team
"""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">FinPilot AI Security</h2>
      <p style="color: #475569; font-size: 14px;">Your 6-digit 2FA security code is:</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">{otp_code}</span>
      </div>
      <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes. Do not share this code with anyone.</p>
    </div>
    """

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    # Attempt 1: Port 587 TLS
    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.quit()
        logger.info("[SMTP SUCCESS] Real email containing 2FA OTP [%s] sent to %s via TLS (Port %d)", otp_code, recipient, smtp_port)
        return
    except Exception as err_tls:
        logger.warn("[SMTP TLS WARN] Port %d TLS failed (%s). Retrying via Port 465 SSL...", smtp_port, str(err_tls))

    # Attempt 2: Port 465 SSL Fallback
    try:
        server_ssl = smtplib.SMTP_SSL(smtp_host, 465, timeout=10)
        server_ssl.login(smtp_user, smtp_pass)
        server_ssl.sendmail(smtp_user, recipient, msg.as_string())
        server_ssl.quit()
        logger.info("[SMTP SUCCESS] Real email containing 2FA OTP [%s] sent to %s via SSL (Port 465)", otp_code, recipient)
    except Exception as err_ssl:
        logger.error("[SMTP ERROR] Failed to send email to %s via SSL: %s", recipient, str(err_ssl))


def dispatch_2fa_email(recipient: str, otp_code: str):
    """Dispatch email asynchronously without blocking HTTP response."""
    thread = threading.Thread(target=_send_email_task, args=(recipient, otp_code))
    thread.daemon = True
    thread.start()

