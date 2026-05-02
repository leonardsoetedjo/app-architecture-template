from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/order_db"
    APP_NAME: str = "Order Service"
    ENV: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
