"""Orchestration REST Endpoints — Module 8."""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
from app.modules.ai.orchestration.coordinator import AgentRegistry, agent_coordinator, SharedAgentContext
from app.modules.ai.orchestration.workflows import WORKFLOW_REGISTRY
from app.modules.identity.dependencies import RequireRoles
from app.modules.identity.schemas.auth import APIResponse
import uuid

router = APIRouter(prefix="/ai/orchestration", tags=["Multi-Agent Orchestration"])


class OrchestrationRequest(BaseModel):
    workflow_name: str = Field(..., description="Workflow name (KYC_WORKFLOW, RISK_WORKFLOW, FULL_ONBOARDING_WORKFLOW)")
    application_id: str = Field(..., description="Target Application UUID")


@router.post(
    "/execute",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Execute Agent Workflow",
    description="Trigger a pre-defined multi-agent workflow. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def execute_workflow(req: OrchestrationRequest) -> APIResponse[dict]:
    context = SharedAgentContext(
        application_id=req.application_id,
        actor_id="orchestrator",
        session_id=str(uuid.uuid4()),
    )
    result = agent_coordinator.execute_workflow(req.workflow_name, context, db=None)
    return APIResponse(success=True, message=f"Workflow '{req.workflow_name}' executed", data=result)


@router.get(
    "/agents",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="List Registered Agents & Workflows",
    description="Retrieve all registered AI agents and available workflows. (Manager, Admin)",
    dependencies=[Depends(RequireRoles("Manager", "Admin"))],
)
def list_agents() -> APIResponse[dict]:
    return APIResponse(
        success=True,
        message="Agent registry retrieved",
        data={
            "registered_agents": AgentRegistry.list_agents(),
            "available_workflows": list(WORKFLOW_REGISTRY.keys()),
        },
    )
