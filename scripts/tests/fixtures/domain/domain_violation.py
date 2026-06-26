# This file intentionally imports fastapi in the domain layer (violation)
from fastapi import FastAPI
from sqlalchemy.orm import Session
from pydantic import BaseModel

class Order(BaseModel):
    id: int

class OrderRepository:
    def save(self, order: Order, session: Session):
        session.add(order)

app = FastAPI()
