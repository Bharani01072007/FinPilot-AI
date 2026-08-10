"""Knowledge Assistant Service — Module 4.

Routes user queries through RAG retrieval → context assembly → AIGateway → grounded response with source attribution.
"""

import uuid
from typing import Any, Dict, List, Optional

from app.modules.ai.assistant.knowledge.retriever import knowledge_retriever
from app.modules.ai.assistant.session.manager import session_manager
from app.modules.ai.gateway import ai_gateway


class KnowledgeAssistantService:
    """Service building grounded customer support responses using RAG and AIGateway."""

    def query(
        self,
        question: str,
        session_id: Optional[str] = None,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """Process user query with RAG retrieval and AI Gateway.

        Returns:
            Dict containing answer, session_id, sources, and conversation_turn.
        """
        session_id = session_id or str(uuid.uuid4())

        # 1. Retrieve relevant knowledge chunks
        chunks = knowledge_retriever.retrieve(question, top_k=top_k)
        context_text = knowledge_retriever.format_context(chunks)

        # 2. Build grounded prompt
        system_prompt = (
            "You are FinPilot AI's intelligent banking, credit, and financial assistant. "
            "When responding to customer queries (e.g. Account Opening, Home Loans, Appointments, Document Vault, Credit Cards), ALWAYS structure your answer into 2 key parts:\n"
            "1. **Requirements & Eligibility**: Detail the required documents, income criteria, or deposit rules.\n"
            "2. **How to Complete in FinPilot AI App**: Guide the user step-by-step on how to perform this exact operation in our app (e.g., 'Go to Applications -> Smart Form Filling', 'Go to Applications -> Appointments tab', or 'Go to Document Vault'). Emphasize that FinPilot AI's 1-Click Vault auto-fills verified identity details automatically.\n\n"
            "Always present responses with clean markdown, bold section headers, bullet points, and actionable next steps."
        )
        prompt = (
            f"KNOWLEDGE CONTEXT:\n{context_text}\n\n"
            f"CUSTOMER QUESTION: {question}\n\n"
            "Provide a well-structured response with clear headings, bullet points, and exact step-by-step FinPilot AI app navigation guidance:"
        )

        # 3. Route through AI Gateway (guardrails + audit logging)
        result = ai_gateway.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            provider_name="Groq",
            temperature=0.3,
            max_tokens=512,
            metadata={"session_id": session_id, "module": "KnowledgeAssistant"},
        )

        # 4. Store turn in session
        session_manager.add_turn(session_id, "user", question)
        session_manager.add_turn(session_id, "assistant", result.completion_text)

        sources = [{"topic": c.get("topic"), "category": c.get("category")} for c in chunks]
        return {
            "answer": result.completion_text,
            "session_id": session_id,
            "sources": sources,
            "provider": result.provider_name,
            "model": result.model_name,
        }

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return session_manager.get_history(session_id)

    def clear_session(self, session_id: str) -> None:
        session_manager.clear_session(session_id)


knowledge_assistant_service = KnowledgeAssistantService()
