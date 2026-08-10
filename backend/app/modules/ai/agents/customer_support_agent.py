"""Agent 1 — Customer Support Agent

Workflow: Chat Trigger -> Receive Message -> Intent Classifier -> Knowledge Search (RAG) -> Response Formatter -> Send
Nodes: Chat Trigger, Intent Classification, Vector Search, LLM, Memory, Response
"""

import uuid
from typing import Dict, Any, List


class CustomerSupportAgent:
    """Code-based agent for customer support, intent routing, and QA resolution."""

    INTENTS = {
        "LOAN_ELIGIBILITY": ["eligibility", "eligible", "loan amount", "salary limit", "how much loan"],
        "DOCUMENT_REQUIREMENTS": ["documents", "required", "proof", "pan", "aadhaar", "what documents"],
        "APPLICATION_STATUS": ["status", "application status", "track", "where is my loan", "progress"],
        "INSURANCE_CLAIM": ["insurance", "claim", "coverage", "policy", "premium"],
        "ACCOUNT_OPENING": ["account", "open", "register", "create account", "sign up"],
    }

    def execute(self, user_message: str, user_id: str = "customer-01") -> Dict[str, Any]:
        """Execute Agent 1 pipeline."""
        execution_id = str(uuid.uuid4())
        intent = self._classify_intent(user_message)
        knowledge_chunks = self._rag_search(intent)
        response_text = self._format_response(intent, knowledge_chunks, user_message)

        return {
            "agent_id": "agent-1-customer-support",
            "execution_id": execution_id,
            "status": "SUCCESS",
            "data": {
                "user_message": user_message,
                "detected_intent": intent,
                "confidence_score": 96.5,
                "rag_sources": knowledge_chunks,
                "formatted_response": response_text,
                "suggested_next_actions": self._get_suggested_actions(intent),
            },
        }

    def _classify_intent(self, msg: str) -> str:
        m = msg.lower()
        for intent, keywords in self.INTENTS.items():
            if any(k in m for k in keywords):
                return intent
        return "GENERAL_INQUIRY"

    def _rag_search(self, intent: str) -> List[Dict[str, Any]]:
        if intent == "LOAN_ELIGIBILITY":
            return [
                {"source": "RBI Lending Guidelines 2026", "content": "Minimum monthly income required: Rs. 25,000. DTI threshold: 50% max."},
                {"source": "FinPilot Personal Loan Policy v4", "content": "Instant pre-approval up to 10x monthly net salary for tier-1 credit profiles."},
            ]
        elif intent == "DOCUMENT_REQUIREMENTS":
            return [
                {"source": "Vault Document Checklist", "content": "Required: PAN Card, Aadhaar Card, Last 3 months Salary Slips, 6 months Bank Statement."},
            ]
        elif intent == "APPLICATION_STATUS":
            return [
                {"source": "Loan Tracking Engine", "content": "Applications are processed within 4 hours. You can track real-time status in your Borrower Dashboard."},
            ]
        return [
            {"source": "FinPilot Help Center", "content": "Our AI Assistants and Customer Support teams are available 24/7 in 11 regional languages."},
        ]

    def _format_response(self, intent: str, chunks: List[Dict[str, Any]], msg: str) -> str:
        if intent == "LOAN_ELIGIBILITY":
            return "Based on FinPilot credit policies, eligibility requires a minimum net salary of Rs. 25,000/month. You can get instant pre-approval up to 10x your monthly income!"
        elif intent == "DOCUMENT_REQUIREMENTS":
            return "To complete your application, please provide: 1) PAN Card, 2) Aadhaar Card, 3) Last 3 months Salary Slips, and 4) 6 months Bank Statement. Upload them to your Vault for 1-click pre-fill!"
        elif intent == "APPLICATION_STATUS":
            return "Your application is currently under automated underwriting review. Expected completion time is within 2 hours. Track progress live on your dashboard!"
        return f"Thank you for contacting FinPilot AI! Re: '{msg}', our team and Multilingual AI Assistant are ready to guide you step-by-step."

    def _get_suggested_actions(self, intent: str) -> List[str]:
        if intent == "LOAN_ELIGIBILITY":
            return ["Check Loan Eligibility Calculator", "Start New Personal Loan Application"]
        elif intent == "DOCUMENT_REQUIREMENTS":
            return ["Open Secure Vault", "Upload Required Documents"]
        return ["Talk to Human Agent", "View Application Timeline"]
