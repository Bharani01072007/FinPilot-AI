"""Health Check Pydantic Schema.

Defines response model for the system health status endpoint.
"""

from typing import Optional
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Schema for health check endpoint response."""

    status: str = Field(default="healthy", description="Status of the application service")
    service: str = Field(default="FinPilot AI Backend", description="Name of the running service")
    environment: Optional[str] = Field(default=None, description="Current deployment environment")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of health check")
