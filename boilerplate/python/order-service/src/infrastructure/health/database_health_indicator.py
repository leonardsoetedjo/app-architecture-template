"""Real database health indicator (Spring Boot Actuator compatible)."""

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

from infrastructure.persistence import get_engine
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


class DatabaseHealthIndicator:
    """Performs an actual round-trip to PostgreSQL.

    Returns shape:
        {"status": "UP",  "database": "PostgreSQL", "validationQuery": "SELECT 1",  "version": "PostgreSQL 16.4"}
    or  {"status": "DOWN", "database": "PostgreSQL", "error": "..."}
    """

    def __init__(self, engine: Engine | None = None) -> None:
        self._engine = engine or get_engine()

    def check(self) -> dict[str, Any]:
        """Run a lightweight query to confirm connectivity."""
        try:
            with self._engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                version_result = conn.execute(text("SELECT version()"))
                db_version: str | None = version_result.scalar()

            return {
                "status": "UP",
                "database": "PostgreSQL",
                "db_version": db_version or "unknown",
                "validation_query": "SELECT 1",
            }
        except (DBAPIError, SQLAlchemyError) as exc:
            logger.error(f"DB health check failed: {exc}")
            return {
                "status": "DOWN",
                "database": "PostgreSQL",
                "error": str(exc),
            }

    @property
    def status(self) -> str:
        return self.check()["status"]
