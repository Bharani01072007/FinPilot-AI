"""Health Check Route Handler.

Provides health verification status for system monitoring.
"""

from fastapi import APIRouter, status
from app.schemas.health import HealthCheckResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health Check",
    description="Returns operational status of the FinPilot AI Backend service.",
)
async def health_check() -> HealthCheckResponse:
    """Perform basic service health check.

    Returns:
        HealthCheckResponse schema with status and service details.
    """
    return HealthCheckResponse(
        status="healthy",
        service="FinPilot AI Backend",
    )
