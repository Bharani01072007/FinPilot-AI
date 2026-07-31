"""Knowledge Retriever — Fetches relevant context chunks from knowledge sources."""

from typing import Any, Dict, List
from app.modules.ai.assistant.knowledge.sources import knowledge_source


class KnowledgeRetriever:
    """Retrieves relevant knowledge chunks matching a user query."""

    @staticmethod
    def retrieve(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant knowledge chunks for query."""
        results = knowledge_source.search(query)
        return results[:top_k]

    @staticmethod
    def format_context(chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks into prompt-ready context string."""
        return "\n\n".join(
            f"[Source: {c.get('topic', 'General')}]\n{c.get('content', '')}"
            for c in chunks
        )


knowledge_retriever = KnowledgeRetriever()
