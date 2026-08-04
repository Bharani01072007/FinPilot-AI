"""Multi-Agent Orchestration — Agent Registry, Coordinator, Context, and Workflows.

Module 8: Central orchestration layer coordinating Document Intelligence, KYC, Risk, Knowledge Assistant, and Recommendation agents.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ─────────────────────────────────────────────
# Shared Agent Context
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class SharedAgentContext:
    """Immutable context object shared across agent pipeline executions."""
    application_id: str
    actor_id: str
    session_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)


# ─────────────────────────────────────────────
# Agent Registry — Module 8
# ─────────────────────────────────────────────

class AgentRegistry:
    """Central registry mapping agent names to callable service factories."""

    _registry: Dict[str, Any] = {}

    @classmethod
    def register(cls, name: str, agent_factory: Any) -> None:
        cls._registry[name.upper()] = agent_factory

    @classmethod
    def get(cls, name: str) -> Optional[Any]:
        return cls._registry.get(name.upper())

    @classmethod
    def list_agents(cls) -> List[str]:
        return list(cls._registry.keys())


# ─────────────────────────────────────────────
# Agent Coordinator
# ─────────────────────────────────────────────

class AgentCoordinator:
    """Routes orchestration requests and sequences agent execution pipeline."""

    @staticmethod
    def execute_workflow(
        workflow_name: str,
        context: SharedAgentContext,
        db: Any,
    ) -> Dict[str, Any]:
        """Execute a pre-defined agent workflow.

        Returns:
            Aggregated workflow results dictionary.
        """
        from app.modules.ai.orchestration.workflows import WORKFLOW_REGISTRY
        workflow = WORKFLOW_REGISTRY.get(workflow_name.upper())
        if not workflow:
            return {"error": f"Workflow '{workflow_name}' not found", "available": list(WORKFLOW_REGISTRY.keys())}

        results: Dict[str, Any] = {"workflow": workflow_name, "context": context.__dict__, "steps": []}
        for step_name in workflow:
            agent = AgentRegistry.get(step_name)
            if agent:
                try:
                    step_result = agent(db=db, context=context)
                    results["steps"].append({"agent": step_name, "status": "COMPLETED", "result": step_result})
                except Exception as e:
                    results["steps"].append({"agent": step_name, "status": "FAILED", "error": str(e)})
            else:
                results["steps"].append({"agent": step_name, "status": "NOT_REGISTERED"})
        return results


agent_coordinator = AgentCoordinator()
