from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file.
    
    Uses pydantic-settings for environment-based configuration.
    """
    model_config = SettingsConfigDict(
        env_prefix="ORDER_SERVICE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "{{ cookiecutter.project_slug }}"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8080
    debug: bool = False
    enable_metrics: bool = True

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/order_db"

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60


_settings: Settings | None = None


def get_settings() -> Settings:
    """Get cached settings instance.
    
    Uses module-level singleton to avoid re-reading files.
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
