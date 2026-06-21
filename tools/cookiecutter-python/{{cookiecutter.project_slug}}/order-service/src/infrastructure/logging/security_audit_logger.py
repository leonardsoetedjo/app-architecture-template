"""
Security audit logger for standardized security event logging.

Logs all security-relevant events in structured JSON format
with context (user_id, ip_address, session_id, user_agent).

Events logged:
- AUTH_SUCCESS / AUTH_FAILURE
- AUTHZ_FAILURE
- SENSITIVE_DATA_ACCESS
- SECURITY_CONFIG_CHANGE
- SESSION_REVOKED
- PASSWORD_RESET_REQUESTED
- MFA_ENABLED / MFA_DISABLED
- RATE_LIMIT_EXCEEDED
- ACCOUNT_LOCKED
"""

import json
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any


class SecurityEventType(str, Enum):
    """Security event types for audit logging."""
    AUTH_SUCCESS = "AUTH_SUCCESS"
    AUTH_FAILURE = "AUTH_FAILURE"
    AUTHZ_FAILURE = "AUTHZ_FAILURE"
    SENSITIVE_DATA_ACCESS = "SENSITIVE_DATA_ACCESS"
    SECURITY_CONFIG_CHANGE = "SECURITY_CONFIG_CHANGE"
    SESSION_REVOKED = "SESSION_REVOKED"
    PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED"
    MFA_ENABLED = "MFA_ENABLED"
    MFA_DISABLED = "MFA_DISABLED"
    MFA_VERIFICATION_SUCCESS = "MFA_VERIFICATION_SUCCESS"
    MFA_VERIFICATION_FAILURE = "MFA_VERIFICATION_FAILURE"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED"


# Configure dedicated security audit logger
audit_logger = logging.getLogger("SECURITY_AUDIT")
audit_logger.setLevel(logging.INFO)

# Add handler if not already present
if not audit_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    audit_logger.addHandler(handler)


class SecurityAuditLogger:
    """
    Security audit logger for standardized security event logging.
    
    Usage:
        logger = SecurityAuditLogger()
        logger.log_authentication_success("user-123", "192.168.1.1")
        logger.log_authorization_failure("user-123", "/orders/456", "GET")
    """
    
    def __init__(self, context: Optional[Dict[str, str]] = None):
        """
        Initialize security audit logger.
        
        Args:
            context: Optional context dict with user_id, ip_address, session_id, etc.
        """
        self.context = context or {}
    
    def _log_security_event(
        self,
        event_type: SecurityEventType,
        event_data: Dict[str, Any],
        level: int = logging.INFO
    ) -> None:
        """
        Log security event with structured data.
        
        Args:
            event_type: Type of security event
            event_data: Event data dictionary
            level: Logging level (INFO, WARNING, ERROR)
        """
        # Build log entry
        log_entry = {
            "eventType": event_type.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **self.context,
            **event_data
        }
        
        # Mask sensitive data
        log_entry = self._mask_sensitive_fields(log_entry)
        
        # Log event
        audit_logger.log(level, f"SECURITY_EVENT: {json.dumps(log_entry)}")
    
    def log_authentication_success(
        self,
        user_id: str,
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> None:
        """Log authentication success."""
        self._log_security_event(
            SecurityEventType.AUTH_SUCCESS,
            {
                "userId": user_id,
                "ipAddress": ip_address,
                "userAgent": user_agent,
                "message": "User authenticated successfully"
            }
        )
    
    def log_authentication_failure(
        self,
        username: str,
        ip_address: str,
        reason: str
    ) -> None:
        """Log authentication failure."""
        self._log_security_event(
            SecurityEventType.AUTH_FAILURE,
            {
                "username": username,
                "ipAddress": ip_address,
                "reason": reason,
                "message": "Authentication failed"
            },
            level=logging.WARNING
        )
    
    def log_authorization_failure(
        self,
        user_id: str,
        resource: str,
        action: str
    ) -> None:
        """Log authorization failure (access denied)."""
        self._log_security_event(
            SecurityEventType.AUTHZ_FAILURE,
            {
                "userId": user_id,
                "resource": resource,
                "action": action,
                "message": "Unauthorized access attempt"
            },
            level=logging.WARNING
        )
    
    def log_sensitive_data_access(
        self,
        user_id: str,
        data_type: str,
        record_id: str
    ) -> None:
        """Log access to sensitive data (PII, PHI)."""
        self._log_security_event(
            SecurityEventType.SENSITIVE_DATA_ACCESS,
            {
                "userId": user_id,
                "dataType": data_type,
                "recordId": record_id,
                "message": "Sensitive data accessed"
            }
        )
    
    def log_security_config_change(
        self,
        user_id: str,
        config_type: str,
        old_value: Any,
        new_value: Any
    ) -> None:
        """Log security configuration changes."""
        self._log_security_event(
            SecurityEventType.SECURITY_CONFIG_CHANGE,
            {
                "userId": user_id,
                "configType": config_type,
                "oldValue": self._mask_sensitive_data(str(old_value)),
                "newValue": self._mask_sensitive_data(str(new_value)),
                "message": "Security configuration changed"
            },
            level=logging.ERROR
        )
    
    def log_session_revoked(
        self,
        user_id: str,
        session_id: str,
        reason: str
    ) -> None:
        """Log session revocation (security reason)."""
        self._log_security_event(
            SecurityEventType.SESSION_REVOKED,
            {
                "userId": user_id,
                "sessionId": session_id,
                "reason": reason,
                "message": "Session revoked for security reason"
            },
            level=logging.WARNING
        )
    
    def log_password_reset_requested(
        self,
        username: str,
        ip_address: str
    ) -> None:
        """Log password reset request."""
        self._log_security_event(
            SecurityEventType.PASSWORD_RESET_REQUESTED,
            {
                "username": username,
                "ipAddress": ip_address,
                "message": "Password reset requested"
            }
        )
    
    def log_mfa_enabled(
        self,
        user_id: str,
        method: str
    ) -> None:
        """Log MFA enabled."""
        self._log_security_event(
            SecurityEventType.MFA_ENABLED,
            {
                "userId": user_id,
                "method": method,
                "message": "MFA enabled"
            }
        )
    
    def log_mfa_disabled(
        self,
        user_id: str,
        method: str
    ) -> None:
        """Log MFA disabled."""
        self._log_security_event(
            SecurityEventType.MFA_DISABLED,
            {
                "userId": user_id,
                "method": method,
                "message": "MFA disabled"
            }
        )
    
    def log_rate_limit_exceeded(
        self,
        ip_address: str,
        endpoint: str,
        retry_after_seconds: int
    ) -> None:
        """Log rate limit exceeded."""
        self._log_security_event(
            SecurityEventType.RATE_LIMIT_EXCEEDED,
            {
                "ipAddress": ip_address,
                "endpoint": endpoint,
                "retryAfterSeconds": retry_after_seconds,
                "message": "Rate limit exceeded"
            },
            level=logging.WARNING
        )
    
    def log_account_locked(
        self,
        username: str,
        ip_address: str,
        failed_attempts: int
    ) -> None:
        """Log account lockout."""
        self._log_security_event(
            SecurityEventType.ACCOUNT_LOCKED,
            {
                "username": username,
                "ipAddress": ip_address,
                "failedAttempts": failed_attempts,
                "message": "Account locked due to failed login attempts"
            },
            level=logging.ERROR
        )
    
    @staticmethod
    def _mask_sensitive_data(data: str) -> str:
        """Mask sensitive data in logs."""
        if not data or len(data) < 4:
            return "***"
        return f"{data[:2]}***{data[-2:]}"
    
    def _mask_sensitive_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mask sensitive fields in log entry."""
        sensitive_fields = ["secret", "password", "token", "authorization", "credential"]
        masked = data.copy()
        
        for field in sensitive_fields:
            for key in masked.keys():
                if field.lower() in key.lower():
                    masked[key] = self._mask_sensitive_data(str(masked[key]))
        
        return masked
