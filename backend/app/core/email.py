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
    smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER", "finpilotaiadmin@gmail.com")
    smtp_pass = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "pwptvhursqndpbvn")
    smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(settings.SMTP_PORT or os.getenv("SMTP_PORT", 587))
    from_name = settings.EMAILS_FROM_NAME or "FinPilot AI Security"

    if not getattr(settings, "ENABLE_SMTP", False) or not smtp_user or not smtp_pass:
        logger.info("[SMTP DISABLED] Email dispatch bypassed. 2FA Security Code [%s] for %s logged.", otp_code, recipient)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🔐 FinPilot AI — Your 2FA Verification Code: {otp_code}"
    msg["From"] = f"{from_name} <{smtp_user}>"
    msg["To"] = recipient

    text_content = f"""
Hello,

Your 6-digit Two-Factor Authentication (2FA) verification code for FinPilot AI is:

    {otp_code}

This code is valid for 10 minutes. Enter this code on the 2FA verification screen to access your portal.

If you did not attempt to sign in, please secure your account immediately.

Best regards,
FinPilot AI Security Governance Team
"""

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border-radius: 20px; background-color: #0b132b; color: #f8fafc; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: 800; tracking: -0.5px;">FinPilot AI</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Enterprise AI Financial Operations & Security</p>
      </div>

      <div style="background-color: #1e293b; padding: 24px; border-radius: 16px; text-align: center; margin: 24px 0; border: 1px solid #334155;">
        <p style="color: #94a3b8; font-size: 13px; margin-top: 0; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Two-Factor Verification Code</p>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; margin: 8px 0; text-indent: 10px;">
          {otp_code}
        </div>
        <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 0; margin-top: 12px;">Valid for 10 minutes · Single-use authorization</p>
      </div>

      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        Enter this 6-digit code on the FinPilot authentication screen to complete your login. If you did not request this login code, please disregard this email.
      </p>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />

      <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
        &copy; 2026 FinPilot AI Security Team. Automated security notification.
      </p>
    </div>
    """

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    # Attempt 1: Port 587 TLS
    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.quit()
        logger.info("[SMTP SUCCESS] Real email containing 2FA OTP [%s] sent to %s via TLS (Port %d)", otp_code, recipient, smtp_port)
        return
    except Exception as err_tls:
        logger.warning("[SMTP TLS WARN] Port %d TLS failed (%s). Retrying via Port 465 SSL...", smtp_port, str(err_tls))

    # Attempt 2: Port 465 SSL Fallback
    try:
        server_ssl = smtplib.SMTP_SSL(smtp_host, 465, timeout=12)
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


def _send_welcome_and_2fa_email_task(recipient: str, user_name: str, otp_code: str):
    """Execute SMTP connection and send Welcome Greeting + 2FA OTP email in background thread."""
    smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER", "finpilotaiadmin@gmail.com")
    smtp_pass = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "pwptvhursqndpbvn")
    smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(settings.SMTP_PORT or os.getenv("SMTP_PORT", 587))
    from_name = settings.EMAILS_FROM_NAME or "FinPilot AI Security"

    if not getattr(settings, "ENABLE_SMTP", False) or not smtp_user or not smtp_pass:
        logger.info("[SMTP DISABLED] Welcome email dispatch bypassed. Code [%s] for %s logged.", otp_code, recipient)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🎉 Welcome to FinPilot AI, {user_name}! Your 2FA Verification Code: {otp_code}"
    msg["From"] = f"{from_name} <{smtp_user}>"
    msg["To"] = recipient

    text_content = f"""
Dear {user_name},

Welcome to FinPilot AI — Enterprise Financial Operations & Document Intelligence Platform!

Your account has been registered successfully.

Your 6-digit 2FA verification code to activate your session is:

    {otp_code}

This code is valid for 10 minutes. Enter this code on the 2FA verification screen to access your portal.

Best regards,
FinPilot AI Customer Success & Security Team
"""

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px; border-radius: 20px; background-color: #0b132b; color: #f8fafc; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; margin: 0; font-size: 26px; font-weight: 800; tracking: -0.5px;">FinPilot AI</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Welcome to Next-Generation AI Financial Operations</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #334155;">
        <h3 style="color: #f8fafc; margin-top: 0; font-size: 16px;">Hi {user_name}, welcome aboard! 👋</h3>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0; line-height: 1.5;">
          Thank you for creating your account with FinPilot AI. Your account has been registered successfully and linked to your digital document vault.
        </p>
      </div>

      <div style="background-color: #1e293b; padding: 24px; border-radius: 16px; text-align: center; margin: 24px 0; border: 1px solid #38bdf8;">
        <p style="color: #38bdf8; font-size: 13px; margin-top: 0; margin-bottom: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🔐 Your 2FA Activation Security Code</p>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; margin: 8px 0; text-indent: 10px;">
          {otp_code}
        </div>
        <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 0; margin-top: 12px;">Valid for 10 minutes · Single-use activation code</p>
      </div>

      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        Enter this 6-digit code on the 2FA screen to complete your registration and log into your Customer Portal.
      </p>

      <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />

      <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
        &copy; 2026 FinPilot AI. Automated welcome & security notification.
      </p>
    </div>
    """

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.quit()
        logger.info("[SMTP SUCCESS] Welcome & 2FA email [%s] sent to %s via TLS", otp_code, recipient)
        return
    except Exception as err_tls:
        logger.warning("[SMTP TLS WARN] Port %d TLS failed (%s). Retrying via Port 465 SSL...", smtp_port, str(err_tls))

    try:
        server_ssl = smtplib.SMTP_SSL(smtp_host, 465, timeout=12)
        server_ssl.login(smtp_user, smtp_pass)
        server_ssl.sendmail(smtp_user, recipient, msg.as_string())
        server_ssl.quit()
        logger.info("[SMTP SUCCESS] Welcome & 2FA email [%s] sent to %s via SSL", otp_code, recipient)
    except Exception as err_ssl:
        logger.error("[SMTP ERROR] Failed to send Welcome & 2FA email to %s: %s", recipient, str(err_ssl))


def dispatch_welcome_and_2fa_email(recipient: str, user_name: str, otp_code: str):
    """Dispatch Welcome Greeting + 2FA OTP email asynchronously."""
    thread = threading.Thread(target=_send_welcome_and_2fa_email_task, args=(recipient, user_name, otp_code))
    thread.daemon = True
    thread.start()

