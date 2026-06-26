# This file has a dynamic import violation in domain layer
import importlib

# Indirect framework import
orm = importlib.import_module("sqlalchemy.orm")

class Order:
    pass
