"""Knowledge Assistant REST Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from app.modules.ai.assistant.services.assistant_service import knowledge_assistant_service
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/ai/assistant", tags=["Customer Support Knowledge Assistant"])


class AssistantQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Customer support question")
    session_id: Optional[str] = Field(default=None, description="Optional existing session ID for conversation continuity")


@router.post(
    "/query",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Query Knowledge Assistant",
    description="Submit a customer support question and receive a RAG-grounded answer with source attribution.",
)
def query_assistant(req: AssistantQueryRequest) -> APIResponse[dict]:
    res = knowledge_assistant_service.query(question=req.question, session_id=req.session_id)
    return APIResponse(success=True, message="Assistant response generated", data=res)


@router.get(
    "/sessions/{session_id}/history",
    response_model=APIResponse[List[dict]],
    status_code=status.HTTP_200_OK,
    summary="Get Conversation History",
    description="Retrieve conversation turn history for a session.",
)
def get_session_history(session_id: str) -> APIResponse[List[dict]]:
    history = knowledge_assistant_service.get_history(session_id)
    return APIResponse(success=True, message="Session history retrieved", data=history)


@router.delete(
    "/sessions/{session_id}",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Clear Session",
    description="Clear conversation history for a session.",
)
def clear_session(session_id: str) -> APIResponse[dict]:
    knowledge_assistant_service.clear_session(session_id)
    return APIResponse(success=True, message="Session cleared", data={"session_id": session_id})
