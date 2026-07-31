"""AI Conversation & Session Memory Interfaces.

Defines abstract interfaces for Conversation Memory, Session Memory, User Memory, and Long-Term Memory providers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class ConversationMemoryProvider(ABC):
    """Interface for managing ongoing multi-turn chat conversation memory."""

    @abstractmethod
    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        pass

    @abstractmethod
    def get_messages(self, conversation_id: str, limit: int = 20) -> List[Dict[str, str]]:
        pass


class SessionMemoryProvider(ABC):
    """Interface for managing ephemeral session-level AI memory state."""

    @abstractmethod
    def set_session_state(self, session_id: str, state: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_session_state(self, session_id: str) -> Dict[str, Any]:
        pass


class UserMemoryProvider(ABC):
    """Interface for persistent user profile preferences and AI memory."""

    @abstractmethod
    def get_user_memory(self, user_id: str) -> Dict[str, Any]:
        pass


class LongTermMemoryProvider(ABC):
    """Interface for cross-session vector-indexed long-term AI memory."""

    @abstractmethod
    def store_memory(self, entity_id: str, memory_text: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        pass
