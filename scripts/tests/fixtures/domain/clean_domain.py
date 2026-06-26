# This file is clean (no violations)
from dataclasses import dataclass
from typing import Optional

@dataclass
class Order:
    id: int
    customer_id: Optional[str] = None
    status: str = "pending"
