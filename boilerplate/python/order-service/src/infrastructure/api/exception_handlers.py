import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.status import HTTP_422_UNPROCESSABLE_CONTENT, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED

from domain.exceptions import InvalidOrderException, DomainException
from domain.models.user import AuthenticationException

logger = logging.getLogger(__name__)


def setup_exception_handlers(app: FastAPI) -> None:
    """Register domain exception → HTTP code mappings.

    Catches domain exceptions at framework boundary and translates to
    standard HTTP codes following API contract standards.
    """

    @app.exception_handler(AuthenticationException)
    async def _auth(request: Request, exc: AuthenticationException) -> JSONResponse:
        logger.warning(f"Auth error: {exc.code} - {exc.message}")
        return JSONResponse(
            status_code=HTTP_400_BAD_REQUEST,
            content={"error": exc.code, "message": exc.message},
        )

    @app.exception_handler(InvalidOrderException)
    async def _invalid_order(
        request: Request, exc: InvalidOrderException
    ) -> JSONResponse:
        logger.warning(f"Invalid order: {exc.code} - {exc.message}")
        return JSONResponse(
            status_code=HTTP_400_BAD_REQUEST,
            content={"error": exc.code, "message": exc.message},
        )

    @app.exception_handler(DomainException)
    async def _domain(
        request: Request, exc: DomainException
    ) -> JSONResponse:
        logger.warning(f"Domain error: {exc.code} - {exc.message}")
        return JSONResponse(
            status_code=HTTP_422_UNPROCESSABLE_CONTENT,
            content={"error": exc.code, "message": exc.message},
        )
