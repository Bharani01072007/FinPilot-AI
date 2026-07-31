"""Conversation Session Manager — Module 4: Knowledge Assistant."""

from typing import Any, Dict, List


# In-memory session store (interface-ready for Redis/DB backend)
_session_store: Dict[str, List[Dict[str, str]]] = {}


class ConversationSessionManager:
    """Manages conversation turn history per session."""

    @staticmethod
    def add_turn(session_id: str, role: str, content: str) -> None:
        """Append a conversation turn to session history."""
        if session_id not in _session_store:
            _session_store[session_id] = []
        _session_store[session_id].append({"role": role, "content": content})
        # Keep last 20 turns
        _session_store[session_id] = _session_store[session_id][-20:]

    @staticmethod
    def get_history(session_id: str) -> List[Dict[str, str]]:
        """Return conversation history for a session."""
        return _session_store.get(session_id, [])

    @staticmethod
    def clear_session(session_id: str) -> None:
        """Clear all conversation history for a session."""
        _session_store.pop(session_id, None)


session_manager = ConversationSessionManager()
