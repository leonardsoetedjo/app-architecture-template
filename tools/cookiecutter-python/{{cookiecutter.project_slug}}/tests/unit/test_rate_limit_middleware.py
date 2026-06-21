"""
Unit tests for rate limiting middleware.
"""

import pytest
from unittest.mock import Mock, AsyncMock
from infrastructure.ratelimit.rate_limit_middleware import (
    RateLimitTier,
    get_client_ip,
    apply_rate_limit_by_path,
    calculate_retry_after
)


class TestRateLimitTier:
    """Test rate limit tier constants."""
    
    def test_auth_tier_is_10_per_minute(self):
        """Auth tier should be 10 requests per minute."""
        assert RateLimitTier.AUTH == "10/minute"
    
    def test_public_tier_is_30_per_minute(self):
        """Public tier should be 30 requests per minute."""
        assert RateLimitTier.PUBLIC == "30/minute"
    
    def test_default_tier_is_100_per_minute(self):
        """Default tier should be 100 requests per minute."""
        assert RateLimitTier.DEFAULT == "100/minute"
    
    def test_write_tier_is_60_per_minute(self):
        """Write tier should be 60 requests per minute."""
        assert RateLimitTier.WRITE == "60/minute"
    
    def test_export_tier_is_5_per_minute(self):
        """Export tier should be 5 requests per minute."""
        assert RateLimitTier.EXPORT == "5/minute"


class TestGetClientIp:
    """Test client IP extraction."""
    
    def test_get_ip_from_x_forwarded_for(self):
        """Should extract IP from X-Forwarded-For header."""
        request = Mock()
        request.headers = {"X-Forwarded-For": "192.168.1.1, 10.0.0.1"}
        request.client = None
        
        ip = get_client_ip(request)
        assert ip == "192.168.1.1"
    
    def test_get_ip_from_x_real_ip(self):
        """Should extract IP from X-Real-IP header."""
        request = Mock()
        request.headers = {"X-Real-IP": "192.168.1.1"}
        request.client = None
        
        ip = get_client_ip(request)
        assert ip == "192.168.1.1"
    
    def test_get_ip_from_client(self):
        """Should use client host if no headers present."""
        request = Mock()
        request.headers = {}
        request.client = Mock(host="192.168.1.1")
        
        ip = get_client_ip(request)
        assert ip == "192.168.1.1"
    
    def test_get_ip_returns_unknown_if_no_client(self):
        """Should return 'unknown' if no client info available."""
        request = Mock()
        request.headers = {}
        request.client = None
        
        ip = get_client_ip(request)
        assert ip == "unknown"


class TestApplyRateLimitByPath:
    """Test rate limit tier selection based on path and method."""
    
    def test_auth_endpoints_use_auth_tier(self):
        """Auth endpoints should use auth tier."""
        auth_paths = [
            ("/api/auth/login", "POST"),
            ("/api/auth/register", "POST"),
            ("/api/auth/password-reset", "POST"),
            ("/api/mfa/setup", "POST"),
            ("/login", "POST")
        ]
        
        for path, method in auth_paths:
            tier = apply_rate_limit_by_path(path, method)
            assert tier == RateLimitTier.AUTH, f"Failed for {path}"
    
    def test_export_endpoints_use_export_tier(self):
        """Export endpoints should use export tier."""
        export_paths = [
            ("/api/reports/export", "GET"),
            ("/api/users/export", "GET"),
            ("/api/bulk/import", "POST")
        ]
        
        for path, method in export_paths:
            tier = apply_rate_limit_by_path(path, method)
            assert tier == RateLimitTier.EXPORT, f"Failed for {path}"
    
    def test_write_operations_use_write_tier(self):
        """Write operations should use write tier."""
        write_ops = [
            ("/api/orders", "POST"),
            ("/api/orders/123", "PUT"),
            ("/api/orders/123", "DELETE"),
            ("/api/users/456", "PATCH")
        ]
        
        for path, method in write_ops:
            tier = apply_rate_limit_by_path(path, method)
            assert tier == RateLimitTier.WRITE, f"Failed for {path} {method}"
    
    def test_public_endpoints_use_public_tier(self):
        """Public endpoints should use public tier."""
        public_paths = [
            ("/api/public/info", "GET"),
            ("/health", "GET"),
            ("/actuator/health", "GET"),
            ("/docs", "GET"),
            ("/openapi.json", "GET")
        ]
        
        for path, method in public_paths:
            tier = apply_rate_limit_by_path(path, method)
            assert tier == RateLimitTier.PUBLIC, f"Failed for {path}"
    
    def test_default_uses_default_tier(self):
        """Unmatched endpoints should use default tier."""
        default_paths = [
            ("/api/orders", "GET"),
            ("/api/users/123", "GET"),
            ("/api/products", "GET")
        ]
        
        for path, method in default_paths:
            tier = apply_rate_limit_by_path(path, method)
            assert tier == RateLimitTier.DEFAULT, f"Failed for {path}"


class TestCalculateRetryAfter:
    """Test retry-after calculation."""
    
    def test_calculate_retry_after_returns_default(self):
        """Should return default 60 seconds."""
        retry_after = calculate_retry_after("Rate limit exceeded")
        assert retry_after == 60


@pytest.mark.asyncio
class TestRateLimitMiddlewareIntegration:
    """Integration tests for rate limiting middleware."""
    
    async def test_rate_limit_exceeded_returns_429(self):
        """Test that exceeding rate limit returns 429."""
        # This would require a full FastAPI test client setup
        # Placeholder for integration test
        pytest.skip("Requires full FastAPI app setup")
    
    async def test_rate_limit_headers_present(self):
        """Test that rate limit headers are present in response."""
        # This would require a full FastAPI test client setup
        # Placeholder for integration test
        pytest.skip("Requires full FastAPI app setup")
