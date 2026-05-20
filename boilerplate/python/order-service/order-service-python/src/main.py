"""Application entry point."""

from src.infrastructure.api.factory import create_app

app = create_app()
