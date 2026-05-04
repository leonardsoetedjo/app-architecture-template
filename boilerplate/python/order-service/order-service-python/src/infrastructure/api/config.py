from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

class Settings(BaseSettings):
    """
    Database configuration - platform independent.

    To change databases, update DATABASE_URL and ensure the correct driver:
    - PostgreSQL: postgresql://user:pass@host:5432/db
    - MySQL:      mysql://user:pass@host:3306/db
    - Oracle:     oracle://user:pass@host:1521/db
    - MSSQL:      mssql+pyodbc://user:pass@host:1433/db?driver=ODBC+Driver+17+for+SQL+Server
    """
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/order_db")
    DATABASE_DRIVER: str = os.getenv("DATABASE_DRIVER", "")
    APP_NAME: str = os.getenv("APP_NAME", "Order Service")
    ENV: str = os.getenv("ENV", "development")

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        """Return the full database URL, prioritizing environment variable."""
        return self.DATABASE_URL

settings = Settings()
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
