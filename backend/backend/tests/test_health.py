"""Unit Tests for Health Check Endpoint.

Verifies operational status endpoint functionality and schema contract.
"""

from fastapi import status


def test_root_health_endpoint(client):
    """Test GET /health returns 200 OK with expected JSON body."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FinPilot AI Backend"


def test_v1_health_endpoint(client):
    """Test GET /api/v1/health returns 200 OK with expected JSON body."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FinPilot AI Backend"
