# This file imports infrastructure from application layer (violation)
from fastapi import Depends
from infrastructure.database import get_session
from sqlalchemy.orm import Session

class CreateOrderUseCase:
    def execute(self):
        session = get_session()
        pass
