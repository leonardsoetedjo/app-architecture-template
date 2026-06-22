"""Application entry point."""

import os
from infrastructure.api.factory import create_app
from infrastructure.persistence import init_db

# Ensure tables exist before first request
app = create_app()
init_db()
