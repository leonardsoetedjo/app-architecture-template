"""Infrastructure metrics / Prometheus instrumentation."""

from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI


def setup_prometheus(app: FastAPI) -> None:
    """Setup Prometheus metrics instrumentation."""
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_instrumented_middleware=False,
    ).instrument(app).expose(app)
