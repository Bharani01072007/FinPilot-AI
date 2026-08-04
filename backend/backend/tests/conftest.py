"""Pytest Fixtures for FastAPI Test Suite.

Provides TestClient fixture for running automated integration and unit tests.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path during pytest execution
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


@pytest.fixture(scope="module")
def client():
    """Fixture providing FastAPI TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client
