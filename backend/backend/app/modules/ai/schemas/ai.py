"""AI Domain Pydantic Schemas.

Defines DTOs for AI Gateway health, provider listings, completion test requests, and completion responses.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AITestRequest(BaseModel):
    """Request payload for testing completion via AI Gateway."""

    prompt: str = Field(..., min_length=1, description="Prompt query text")
    system_prompt: Optional[str] = Field(default=None, description="Optional system instruction prompt")
    prompt_key: Optional[str] = Field(default=None, description="Optional predefined prompt template key")
    provider_name: Optional[str] = Field(default="Gemini", description="Target AI provider name")
    model: Optional[str] = Field(default=None, description="Target model name")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(default=1024, ge=1, le=8192, description="Maximum completion tokens")


class AITestResponse(BaseModel):
    """Response model for AI completion execution result."""

    completion_text: str
    provider_name: str
    model_name: str
    duration_ms: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    finish_reason: str


class AIProviderInfo(BaseModel):
    """Information summary schema for registered AI provider."""

    name: str
    default_model: str
    status: str = "HEALTHY"


class AIHealthResponse(BaseModel):
    """AI Gateway platform health status schema."""

    status: str = "UP"
    active_providers: List[AIProviderInfo]
    default_provider: str
    gateway_version: str = "1.0.0"
