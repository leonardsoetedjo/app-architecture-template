"""
Rate Limiting Middleware for FastAPI

Implements sliding window rate limiting with Redis backend.
Supports per-user, per-IP, and per-endpoint rate limits.

Usage:
    from fastapi import FastAPI
    from infrastructure.middleware.rate_limit import RateLimitMiddleware
    
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, redis_url="redis://localhost:6379")
"""

import time
from typing import List, Optional, Pattern
import re
from dataclasses import dataclass

import redis.asyncio as redis
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


@dataclass(frozen=True)
class RateLimitConfig:
    """Configuration for a rate limit rule."""
    requests: int  # Number of requests allowed
    seconds: int  # Time window in seconds
    key_prefix: str = "rate_limit"
    
    @property
    def redis_key_pattern(self) -> str:
        """Redis key pattern for this limit."""
        return self.key_prefix + ":{identifier}:{window}"


@dataclass(frozen=True)
class RateLimitRule:
    """A rate limit rule for specific paths or methods."""
    path_pattern: str  # Regex pattern or exact path
    limit: RateLimitConfig
    methods: Optional[List[str]] = None  # HTTP methods, None = all
    per_user: bool = True  # Rate limit per user ID
    per_ip: bool = True  # Rate limit per IP address


class RateLimitMiddleware:
    """
    Sliding window rate limiting middleware with Redis backend.
    
    Features:
    - Sliding window algorithm for accurate rate limiting
    - Redis backend for distributed rate limiting
    - Per-user and per-IP rate limiting
    - Configurable limits per endpoint
    - Rate limit headers in response
    
    Headers added to response:
    - X-RateLimit-Limit: Maximum requests allowed
    - X-RateLimit-Remaining: Requests remaining in window
    - X-RateLimit-Reset: Unix timestamp when window resets
    """
    
    # Default rate limits
    DEFAULT_LIMIT = RateLimitConfig(requests=100, seconds=60)  # 100 req/min
    
    # Pre-defined rate limit rules
    RULES: List[RateLimitRule] = [
        RateLimitRule(
            path_pattern="/api/v1/auth/login",
            limit=RateLimitConfig(requests=5, seconds=60, key_prefix="rate_limit:auth"),
            methods=["POST"],
            per_user=False,
            per_ip=True,
        ),
        RateLimitRule(
            path_pattern="/api/v1/orders",
            limit=RateLimitConfig(requests=30, seconds=60, key_prefix="rate_limit:orders"),
            methods=["POST"],
            per_user=True,
            per_ip=False,
        ),
    ]
    
    def __init__(
        self,
        app: FastAPI,
        redis_url: str = "redis://localhost:6379",
        default_limit: Optional[RateLimitConfig] = None,
    ):
        self.app = app
        self.redis_url = redis_url
        self.default_limit = default_limit or self.DEFAULT_LIMIT
        self._redis: Optional[redis.Redis] = None
    
    async def get_redis(self) -> redis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
    
    def _get_identifier(self, request: Request, rule: RateLimitRule) -> str:
        """
        Generate rate limit identifier based on rule configuration.
        
        Combines user ID and/or IP address for granular rate limiting.
        """
        parts = []
        
        if rule.per_user:
            # Try to get user ID from request state (set by auth middleware)
            user_id = getattr(request.state, "user_id", None)
            if user_id:
                parts.append(f"user:{user_id}")
            else:
                # Fall back to IP if no user ID
                parts.append(f"ip:{self._get_client_ip(request)}")
        elif rule.per_ip:
            parts.append(f"ip:{self._get_client_ip(request)}")
        else:
            parts.append("global")
        
        return ":".join(parts)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded header (proxy/load balancer)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Direct connection
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _get_rule_for_path(self, path: str, method: str) -> Optional[RateLimitRule]:
        """Find matching rate limit rule for path and method."""
        for rule in self.RULES:
            # Simple path matching (can be extended to regex)
            if rule.path_pattern == path:
                if rule.methods is None or method in rule.methods:
                    return rule
        return None
    
    async def _check_rate_limit(
        self,
        redis_client: redis.Redis,
        identifier: str,
        config: RateLimitConfig,
    ) -> tuple[bool, int, int]:
        """
        Check if request is within rate limit using sliding window.
        
        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        current_time = int(time.time())
        window_start = current_time - config.seconds
        
        # Redis key for current window
        current_window = current_time // config.seconds
        key = config.redis_key_pattern.format(
            identifier=identifier,
            window=current_window,
        )
        
        # Use Redis pipeline for atomic operations
        pipe = redis_client.pipeline()
        
        # Remove old windows
        pipe.zremrangebyscore(key, "-inf", window_start)
        
        # Add current request
        pipe.zadd(key, {f"{current_time}:{time.time()}": current_time})
        
        # Count requests in window
        pipe.zcard(key)
        
        # Set expiry on key
        pipe.expire(key, config.seconds * 2)
        
        # Execute pipeline
        results = await pipe.execute()
        request_count = results[2]
        
        allowed = request_count <= config.requests
        remaining = max(0, config.requests - request_count)
        reset_time = (current_window + 1) * config.seconds
        
        return allowed, remaining, reset_time
    
    async def __call__(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Process request and apply rate limiting."""
        # Skip rate limiting for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        redis_client = await self.get_redis()
        
        # Find matching rule or use default
        rule = self._get_rule_for_path(request.url.path, request.method)
        config = rule.limit if rule else self.default_limit
        
        # Get identifier for this request
        identifier = self._get_identifier(request, rule) if rule else f"ip:{self._get_client_ip(request)}"
        
        # Check rate limit
        allowed, remaining, reset_time = await self._check_rate_limit(
            redis_client, identifier, config
        )
        
        if not allowed:
            # Rate limit exceeded
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": f"Too many requests. Please try again in {reset_time - int(time.time())} seconds.",
                    "retry_after": reset_time - int(time.time()),
                },
                headers={
                    "Retry-After": str(reset_time - int(time.time())),
                },
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(config.requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        
        return response


def create_rate_limit_middleware(
    redis_url: str = "redis://localhost:6379",
    default_requests: int = 100,
    default_seconds: int = 60,
) -> RateLimitMiddleware:
    """
    Factory function to create rate limit middleware.
    
    Args:
        redis_url: Redis connection URL
        default_requests: Default number of requests allowed
        default_seconds: Default time window in seconds
        
    Returns:
        Configured RateLimitMiddleware instance
    """
    return RateLimitMiddleware(
        app=None,  # type: ignore - will be set by FastAPI
        redis_url=redis_url,
        default_limit=RateLimitConfig(
            requests=default_requests,
            seconds=default_seconds,
        ),
    )
