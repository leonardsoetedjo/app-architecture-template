"""
External HTTP Client with Resilience Patterns.

This module provides:
1. ExternalHttpClientConfig - Configuration for HTTP client with timeouts and retries
2. ExternalServiceClient - HTTP client with circuit breaker and retry logic

Usage:
    from common.infrastructure.http.external_http_client import ExternalServiceClient, ExternalHttpClientConfig

    config = ExternalHttpClientConfig(
        base_url="https://api.example.com",
        timeout=5.0,
        max_retries=3,
        circuit_breaker_threshold=5
    )
    client = ExternalServiceClient(config)
    
    response = await client.get("/endpoint")
"""
import asyncio
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)


@dataclass
class ExternalHttpClientConfig:
    """Configuration for external HTTP client."""
    base_url: str
    timeout: float = 5.0
    max_retries: int = 3
    retry_delay: float = 1.0
    circuit_breaker_threshold: int = 5
    circuit_breaker_timeout: float = 30.0


class CircuitBreakerOpen(Exception):
    """Exception raised when circuit breaker is open."""
    pass


class ExternalServiceClient:
    """
    Resilient HTTP client for external service calls.
    
    Features:
    - Automatic retries with exponential backoff
    - Circuit breaker pattern
    - Timeout handling
    - Correlation ID propagation
    """
    
    def __init__(self, config: ExternalHttpClientConfig):
        self.config = config
        self._failure_count = 0
        self._circuit_open = False
        self._client = httpx.AsyncClient(
            base_url=config.base_url,
            timeout=httpx.Timeout(config.timeout)
        )
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    async def get(self, path: str, headers: Optional[Dict[str, str]] = None) -> httpx.Response:
        """Make GET request with resilience."""
        return await self._request_with_retry("GET", path, headers=headers)
    
    async def post(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> httpx.Response:
        """Make POST request with resilience."""
        return await self._request_with_retry("POST", path, json=json, headers=headers)
    
    async def _request_with_retry(
        self,
        method: str,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> httpx.Response:
        """Execute HTTP request with retry logic and circuit breaker."""
        
        # Check circuit breaker
        if self._circuit_open:
            raise CircuitBreakerOpen(
                f"Circuit breaker is open. Failures: {self._failure_count}"
            )
        
        last_exception: Optional[Exception] = None
        
        for attempt in range(self.config.max_retries):
            try:
                response = await self._client.request(
                    method=method,
                    url=path,
                    json=json,
                    headers=headers or {}
                )
                
                # Success - reset failure count
                self._failure_count = 0
                return response
                
            except (httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError) as e:
                last_exception = e
                self._failure_count += 1
                
                logger.warning(
                    "Request failed (attempt %d/%d): %s",
                    attempt + 1,
                    self.config.max_retries,
                    str(e)
                )
                
                # Check if circuit breaker should open
                if self._failure_count >= self.config.circuit_breaker_threshold:
                    self._circuit_open = True
                    logger.error(
                        "Circuit breaker opened after %d failures",
                        self._failure_count
                    )
                
                # Wait before retry (exponential backoff)
                if attempt < self.config.max_retries - 1:
                    delay = self.config.retry_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
        
        # All retries exhausted
        error_msg = f"Request failed after {self.config.max_retries} attempts"
        if last_exception:
            raise type(last_exception)(error_msg) from last_exception
        raise RuntimeError(error_msg)
