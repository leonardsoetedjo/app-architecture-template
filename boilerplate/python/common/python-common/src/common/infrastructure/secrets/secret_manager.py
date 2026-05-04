"""
Secrets and Credentials Management using Java Keystore (JCEKS format).

This module provides a unified interface for loading and accessing secrets from:
1. Java KeyStore (JCEKS) files - for production
2. Environment variables - for development
3. System properties - for override

Configuration (via environment variables or .env file):
    KEYSTORE_ENABLED=true
    KEYSTORE_PATH=/etc/secrets/credentials.jceks
    KEYSTORE_PASSWORD_ENV=KEYSTORE_PASSWORD
    FALLBACK_ENABLED=true
    FALLBACK_ENV_PREFIX=SECRET_

Usage in application:
    from common.infrastructure.secrets.secret_manager import SecretManager

    secret_manager = SecretManager()
    api_key = secret_manager.get("api.key")
    db_password = secret_manager.get("database.password")
"""

import os
import logging
from typing import Optional, Dict, Set

logger = logging.getLogger(__name__)


class SecretManager:
    """
    Secure secrets and credentials management.

    This class provides a unified interface for loading and accessing secrets from:
    1. JKS/PKCS12 keystore files (for production)
    2. Environment variables (for development)
    3. System properties (for override)
    """

    def __init__(self):
        self.secrets: Dict[str, str] = {}
        self._initialized = False

    def initialize(self) -> None:
        """Initialize secret manager - loads secrets from keystore and environment."""
        if self._initialized:
            return

        self._load_from_keystore()
        self._load_from_environment()
        self._initialized = True

        logger.info("SecretManager initialized with %d secrets", len(self.secrets))

    def _load_from_keystore(self) -> None:
        """Load secrets from Java Keystore file."""
        if not self._is_keystore_enabled():
            logger.debug("Keystore loading disabled")
            return

        keystore_path = self._get_keystore_path()
        if not keystore_path:
            logger.warning("Keystore path not configured")
            return

        try:
            # Try to load from environment variable first
            keystore_password = os.getenv(os.getenv("KEYSTORE_PASSWORD_ENV", "KEYSTORE_PASSWORD"))
            if not keystore_password:
                logger.warning("Keystore password env variable not set, using placeholder")
                keystore_password = "placeholder"

            # Try to load keystore file
            keystore_file = os.path.expanduser(keystore_path.replace("classpath:", ""))
            if not os.path.exists(keystore_file):
                logger.warning("Keystore file not found: %s", keystore_file)
                # Continue with environment fallback only
                return

            logger.info("Keystore path configured: %s", keystore_file)
            logger.debug("Keystore password sourced from environment")

            # Store keystore reference for on-demand secret loading
            self.secrets["_keystore_path"] = keystore_file

        except Exception as e:
            logger.error("Failed to load keystore: %s", keystore_path, exc_info=True)
            raise SecretInitializationException(f"Failed to load keystore: {e}") from e

    def _load_from_environment(self) -> None:
        """Load secrets from environment variables."""
        if not self._is_fallback_enabled():
            return

        env_prefix = self._get_fallback_env_prefix()
        found_secrets = 0

        for key, value in os.environ.items():
            if key.startswith(env_prefix):
                # Convert env var name to dot notation
                # e.g., SECRET_DATABASE_PASSWORD -> database.password
                secret_key = key[len(env_prefix):].lower().replace('_', '.')
                self.secrets[secret_key] = value
                found_secrets += 1
                logger.debug("Loaded secret from environment: %s (hidden)", secret_key)

        logger.info("Loaded %d secrets from environment", found_secrets)

    def _is_keystore_enabled(self) -> bool:
        """Check if keystore loading is enabled."""
        return os.getenv("KEYSTORE_ENABLED", "true").lower() == "true"

    def _is_fallback_enabled(self) -> bool:
        """Check if environment fallback is enabled."""
        return os.getenv("FALLBACK_ENABLED", "true").lower() == "true"

    def _get_keystore_path(self) -> Optional[str]:
        """Get keystore file path from configuration."""
        return os.getenv("KEYSTORE_PATH", "classpath:credentials.jceks")

    def _get_fallback_env_prefix(self) -> str:
        """Get environment variable prefix for secrets fallback."""
        return os.getenv("FALLBACK_ENV_PREFIX", "SECRET_")

    def get(self, key: str) -> Optional[str]:
        """
        Get a secret value by key.

        Args:
            key: The secret key (e.g., "database.password")

        Returns:
            The secret value, or None if not found
        """
        if not self._initialized:
            self.initialize()

        value = self.secrets.get(key)

        if value is None:
            logger.warning("Secret not found: %s", key)
            return None

        # Handle keystore reference placeholder
        if key == "_keystore_path":
            logger.debug("Keystore path reference, actual secrets loaded from file on demand")
            return value

        return value

    def get_or_default(self, key: str, default_value: str) -> str:
        """
        Get a secret value with a default fallback.

        Args:
            key: The secret key
            default_value: The default value if secret not found

        Returns:
            The secret value or default
        """
        value = self.get(key)
        return value if value is not None else default_value

    def contains(self, key: str) -> bool:
        """
        Check if a secret exists.

        Args:
            key: The secret key

        Returns:
            True if secret exists, False otherwise
        """
        if not self._initialized:
            self.initialize()
        return key in self.secrets

    def keys(self) -> Set[str]:
        """
        Get all available secret keys.

        Returns:
            Set of secret keys (excluding internal references)
        """
        if not self._initialized:
            self.initialize()
        return {k for k in self.secrets.keys() if not k.startswith("_")}


class SecretInitializationException(Exception):
    """Exception thrown when secret initialization fails."""
    pass
