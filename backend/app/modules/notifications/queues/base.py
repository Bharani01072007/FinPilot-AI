"""Message Queue, Retry Queue, and Dead Letter Queue (DLQ) Interface Definitions.

Provides broker-agnostic interfaces for future asynchronous message queues (RabbitMQ, Kafka, Redis Streams, SQS, Azure Service Bus).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class MessageQueueProvider(ABC):
    """Abstract interface for publishing asynchronous messages to topic exchanges."""

    @abstractmethod
    def publish_message(self, topic: str, payload: Dict[str, Any]) -> bool:
        """Publish payload to a message queue topic."""
        pass


class RetryQueueProvider(ABC):
    """Abstract interface for enqueuing failed notifications into exponential backoff retry queues."""

    @abstractmethod
    def enqueue_retry(
        self,
        payload: Dict[str, Any],
        retry_count: int = 1,
        delay_seconds: int = 60,
    ) -> bool:
        """Enqueue message for retry execution."""
        pass


class DeadLetterQueueProvider(ABC):
    """Abstract interface for capturing permanently failed notifications in Dead Letter Queue (DLQ)."""

    @abstractmethod
    def enqueue_dlq(self, payload: Dict[str, Any], error_reason: str) -> bool:
        """Enqueue message into DLQ for administrative inspection and manual retry."""
        pass
