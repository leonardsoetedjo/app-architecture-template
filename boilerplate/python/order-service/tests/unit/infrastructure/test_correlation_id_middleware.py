"""
Tests for correlation ID middleware.

Verifies:
1. Correlation ID is extracted from request headers
2. Correlation ID is generated if not present
3. Correlation ID is included in response headers
4. Correlation ID is accessible via contextvars
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from starlette.testclient import TestClient
from starlette.requests import Request
from starlette.responses import Response

from src.infrastructure.logging.correlation_id_middleware import (
    CorrelationIdMiddleware,
    get_correlation_id,
    correlation_id_var,
    set_user_id,
    get_user_id,
)


@pytest.fixture
def mock_call_next():
    """Create mock call_next function."""
    async def mock_call(request: Request):
        return Response(
            content="OK",
            status_code=200,
            headers={"content-type": "text/plain"}
        )
    return mock_call


class TestCorrelationIdMiddleware:
    """Test correlation ID middleware functionality."""

    @pytest.mark.asyncio
    async def test_generates_correlation_id_when_not_present(self, mock_call_next):
        """Middleware generates UUID when X-Correlation-ID header is missing."""
        middleware = CorrelationIdMiddleware(None)
        
        # Create mock request without correlation ID header
        scope = {
            "type": "http",
            "headers": [],  # No headers
        }
        request = Request(scope)
        
        # Call middleware
        response = await middleware.dispatch(request, mock_call_next)
        
        # Verify correlation ID was generated and added to response
        assert "X-Correlation-ID" in response.headers
        generated_id = response.headers["X-Correlation-ID"]
        assert len(generated_id) == 36  # UUID length
        assert uuid.UUID(generated_id)  # Valid UUID

    @pytest.mark.asyncio
    async def test_uses_provided_correlation_id(self, mock_call_next):
        """Middleware uses provided X-Correlation-ID header."""
        middleware = CorrelationIdMiddleware(None)
        test_id = "test-correlation-123"
        
        # Create mock request with correlation ID header
        scope = {
            "type": "http",
            "headers": [(b"x-correlation-id", test_id.encode())],
        }
        request = Request(scope)
        
        # Call middleware
        response = await middleware.dispatch(request, mock_call_next)
        
        # Verify correlation ID was used
        assert response.headers["X-Correlation-ID"] == test_id

    @pytest.mark.asyncio
    async def test_generates_for_empty_correlation_id(self, mock_call_next):
        """Middleware generates UUID when X-Correlation-ID is empty string."""
        middleware = CorrelationIdMiddleware(None)
        
        # Create mock request with empty correlation ID header
        scope = {
            "type": "http",
            "headers": [(b"x-correlation-id", b"")],
        }
        request = Request(scope)
        
        # Call middleware
        response = await middleware.dispatch(request, mock_call_next)
        
        # Verify correlation ID was generated
        assert "X-Correlation-ID" in response.headers
        generated_id = response.headers["X-Correlation-ID"]
        assert len(generated_id) == 36

    @pytest.mark.asyncio
    async def test_contextvars_isolated_per_request(self, mock_call_next):
        """Contextvars are properly isolated between requests."""
        middleware = CorrelationIdMiddleware(None)
        
        # First request
        scope1 = {
            "type": "http",
            "headers": [(b"x-correlation-id", b"request-1")],
        }
        request1 = Request(scope1)
        response1 = await middleware.dispatch(request1, mock_call_next)
        
        # Second request
        scope2 = {
            "type": "http",
            "headers": [(b"x-correlation-id", b"request-2")],
        }
        request2 = Request(scope2)
        response2 = await middleware.dispatch(request2, mock_call_next)
        
        # Each should have its own correlation ID
        assert response1.headers["X-Correlation-ID"] == "request-1"
        assert response2.headers["X-Correlation-ID"] == "request-2"

    def test_context_helper_functions(self):
        """Test get_correlation_id, set_user_id, get_user_id helpers."""
        # Test correlation ID
        token = correlation_id_var.set("test-id-123")
        assert get_correlation_id() == "test-id-123"
        correlation_id_var.reset(token)
        
        # Test user ID
        set_user_id("user-456")
        assert get_user_id() == "user-456"
        
        # Test None user ID
        set_user_id(None)
        assert get_user_id() is None


class TestCorrelationIdMiddlewareIntegration:
    """Integration tests using TestClient."""

    def test_middleware_in_fastapi_app(self):
        """Test middleware works in a real FastAPI app."""
        from fastapi import FastAPI
        from src.infrastructure.api.factory import create_app
        
        # Create app (this registers the middleware)
        app = create_app()
        client = TestClient(app)
        
        # Test without correlation ID header
        response1 = client.get("/health")
        assert response1.status_code == 200
        assert "X-Correlation-ID" in response1.headers
        id1 = response1.headers["X-Correlation-ID"]
        assert len(id1) == 36
        
        # Test with correlation ID header
        custom_id = "custom-test-id"
        response2 = client.get("/health", headers={"X-Correlation-ID": custom_id})
        assert response2.status_code == 200
        assert response2.headers["X-Correlation-ID"] == custom_id
