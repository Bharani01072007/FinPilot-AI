"""Pluggable Provider Interfaces for Future Communication Channels.

Defines interface definitions for Email, SMS, WhatsApp, Push, and Webhook providers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class EmailProvider(ABC):
    """Interface for Email Communication Providers (SendGrid, AWS SES, SMTP)."""

    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
    ) -> bool:
        pass


class SMSProvider(ABC):
    """Interface for SMS Communication Providers (Twilio, AWS SNS)."""

    @abstractmethod
    def send_sms(self, phone_number: str, message: str) -> bool:
        pass


class WhatsAppProvider(ABC):
    """Interface for WhatsApp Communication Providers (Twilio WhatsApp, Meta Graph API)."""

    @abstractmethod
    def send_whatsapp(self, phone_number: str, template_name: str, parameters: Dict[str, Any]) -> bool:
        pass


class PushProvider(ABC):
    """Interface for Push Notification Providers (Firebase FCM, Apple APNS)."""

    @abstractmethod
    def send_push(self, device_token: str, title: str, body: str, payload: Optional[Dict[str, Any]] = None) -> bool:
        pass


class WebhookProvider(ABC):
    """Interface for Webhook Notification Dispatches."""

    @abstractmethod
    def send_webhook(self, target_url: str, payload: Dict[str, Any], secret_token: Optional[str] = None) -> bool:
        pass
