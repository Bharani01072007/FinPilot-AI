"""Real-time SMTP Email Dispatcher for 2FA OTP Security Codes."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
from app.config.settings import settings
from app.core.logging import logger


def _send_email_task(recipient: str, otp_code: str):
    """Execute SMTP connection and send email in background thread."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info("[SMTP SIMULATION] Real SMTP credentials (SMTP_USER/SMTP_PASSWORD) not configured in .env. Code [%s] for %s logged.", otp_code, recipient)
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your FinPilot 2FA Verification Code: {otp_code}"
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.SMTP_USER}>"
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

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, recipient, msg.as_string())
        server.quit()
        logger.info("[SMTP SUCCESS] Real email containing 2FA OTP [%s] sent to %s", otp_code, recipient)
    except Exception as e:
        logger.error("[SMTP ERROR] Failed to send email to %s: %s", recipient, str(e))


def dispatch_2fa_email(recipient: str, otp_code: str):
    """Dispatch email asynchronously without blocking HTTP response."""
    thread = threading.Thread(target=_send_email_task, args=(recipient, otp_code))
    thread.daemon = True
    thread.start()
