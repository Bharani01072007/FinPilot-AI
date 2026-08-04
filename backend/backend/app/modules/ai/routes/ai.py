"""AI Platform Core REST Controller Endpoints.

Provides API routes for AI Gateway health, provider information, supported models, and administrative completion testing.
"""

from typing import List
from fastapi import APIRouter, Depends, status

from app.modules.ai.gateway import ai_gateway
from app.modules.ai.schemas.ai import (
    AIHealthResponse,
    AIProviderInfo,
    AITestRequest,
    AITestResponse,
)
from app.modules.identity.dependencies import RequireRoles, get_current_user
from app.modules.identity.models import User
from app.modules.identity.schemas.auth import APIResponse

router = APIRouter(prefix="/ai", tags=["AI Platform Core"])


@router.get(
    "/health",
    response_model=APIResponse[AIHealthResponse],
    status_code=status.HTTP_200_OK,
    summary="Get AI Gateway Health Status",
    description="Retrieve operational health status of AI Gateway and active providers.",
)
def get_ai_health() -> APIResponse[AIHealthResponse]:
    prov_info = ai_gateway.list_providers()
    providers_list = [
        AIProviderInfo(name=p["name"], default_model=p["default_model"], status=p["status"])
        for p in prov_info["active_providers"]
    ]
    health = AIHealthResponse(
        status="UP",
        active_providers=providers_list,
        default_provider=prov_info["default_provider"],
        gateway_version="1.0.0",
    )
    return APIResponse(success=True, message="AI Gateway health operational", data=health)


@router.get(
    "/providers",
    response_model=APIResponse[List[AIProviderInfo]],
    status_code=status.HTTP_200_OK,
    summary="List Registered AI Providers",
    description="Retrieve list of registered LLM providers and default models. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def list_providers() -> APIResponse[List[AIProviderInfo]]:
    prov_info = ai_gateway.list_providers()
    providers_list = [
        AIProviderInfo(name=p["name"], default_model=p["default_model"], status=p["status"])
        for p in prov_info["active_providers"]
    ]
    return APIResponse(success=True, message="Registered AI providers retrieved", data=providers_list)


@router.get(
    "/models",
    response_model=APIResponse[List[str]],
    status_code=status.HTTP_200_OK,
    summary="List Supported AI Models",
    description="Retrieve list of available LLM models across registered providers. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def list_models() -> APIResponse[List[str]]:
    models = ["gemini-1.5-pro", "gemini-1.5-flash", "gpt-4o", "claude-3-5-sonnet", "llama3-70b-8192"]
    return APIResponse(success=True, message="Supported AI models retrieved", data=models)


@router.post(
    "/test",
    response_model=APIResponse[AITestResponse],
    status_code=status.HTTP_200_OK,
    summary="Execute Test AI Completion",
    description="Execute test LLM completion via AI Gateway with security guardrails and audit logging. (Admin)",
    dependencies=[Depends(RequireRoles("Admin"))],
)
def test_completion(
    req: AITestRequest,
    current_user: User = Depends(get_current_user),
) -> APIResponse[AITestResponse]:
    result = ai_gateway.generate_completion(
        prompt=req.prompt,
        system_prompt=req.system_prompt,
        prompt_key=req.prompt_key,
        provider_name=req.provider_name,
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        metadata={"user_id": current_user.id, "environment": "test"},
    )
    res = AITestResponse(
        completion_text=result.completion_text,
        provider_name=result.provider_name,
        model_name=result.model_name,
        duration_ms=result.duration_ms,
        prompt_tokens=result.prompt_tokens,
        completion_tokens=result.completion_tokens,
        total_tokens=result.total_tokens,
        estimated_cost_usd=result.estimated_cost_usd,
        finish_reason=result.finish_reason,
    )
    return APIResponse(success=True, message="AI completion generated successfully", data=res)
