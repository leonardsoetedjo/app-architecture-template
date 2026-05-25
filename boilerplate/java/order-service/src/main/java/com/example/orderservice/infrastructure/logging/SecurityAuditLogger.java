package com.example.orderservice.infrastructure.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Security audit logger for standardized security event logging.
 * 
 * Logs all security-relevant events in structured JSON format
 * with MDC context (userId, ipAddress, sessionId, userAgent).
 * 
 * Events logged:
 * - AUTH_SUCCESS / AUTH_FAILURE
 * - AUTHZ_FAILURE
 * - SENSITIVE_DATA_ACCESS
 * - SECURITY_CONFIG_CHANGE
 * - SESSION_REVOKED
 * - PASSWORD_RESET_REQUESTED
 * - MFA_ENABLED / MFA_DISABLED
 */
@Component
public class SecurityAuditLogger {
    
    private static final Logger auditLogger = LoggerFactory.getLogger("SECURITY_AUDIT");
    
    public enum SecurityEventType {
        AUTH_SUCCESS,
        AUTH_FAILURE,
        AUTHZ_FAILURE,
        SENSITIVE_DATA_ACCESS,
        SECURITY_CONFIG_CHANGE,
        SESSION_REVOKED,
        PASSWORD_RESET_REQUESTED,
        MFA_ENABLED,
        MFA_DISABLED,
        MFA_VERIFICATION_SUCCESS,
        MFA_VERIFICATION_FAILURE,
        RATE_LIMIT_EXCEEDED,
        ACCOUNT_LOCKED,
        ACCOUNT_UNLOCKED
    }
    
    /**
     * Log authentication success.
     */
    public void logAuthenticationSuccess(String userId, String ipAddress, String userAgent) {
        logSecurityEvent(SecurityEventType.AUTH_SUCCESS, Map.of(
            "userId", userId,
            "ipAddress", ipAddress,
            "userAgent", userAgent,
            "message", "User authenticated successfully"
        ));
    }
    
    /**
     * Log authentication failure.
     */
    public void logAuthenticationFailure(String username, String ipAddress, String reason) {
        logSecurityEvent(SecurityEventType.AUTH_FAILURE, Map.of(
            "username", username,
            "ipAddress", ipAddress,
            "reason", reason,
            "message", "Authentication failed"
        ));
    }
    
    /**
     * Log authorization failure (access denied).
     */
    public void logAuthorizationFailure(String userId, String resource, String action) {
        logSecurityEvent(SecurityEventType.AUTHZ_FAILURE, Map.of(
            "userId", userId,
            "resource", resource,
            "action", action,
            "message", "Unauthorized access attempt"
        ));
    }
    
    /**
     * Log access to sensitive data (PII, PH).
     */
    public void logSensitiveDataAccess(String userId, String dataType, String recordId) {
        logSecurityEvent(SecurityEventType.SENSITIVE_DATA_ACCESS, Map.of(
            "userId", userId,
            "dataType", dataType,
            "recordId", recordId,
            "message", "Sensitive data accessed"
        ));
    }
    
    /**
     * Log security configuration changes.
     */
    public void logSecurityConfigChange(String userId, String configType, String oldValue, String newValue) {
        logSecurityEvent(SecurityEventType.SECURITY_CONFIG_CHANGE, Map.of(
            "userId", userId,
            "configType", configType,
            "oldValue", maskSensitiveData(oldValue),
            "newValue", maskSensitiveData(newValue),
            "message", "Security configuration changed"
        ));
    }
    
    /**
     * Log session revocation (security reason).
     */
    public void logSessionRevoked(String userId, String sessionId, String reason) {
        logSecurityEvent(SecurityEventType.SESSION_REVOKED, Map.of(
            "userId", userId,
            "sessionId", sessionId,
            "reason", reason,
            "message", "Session revoked for security reason"
        ));
    }
    
    /**
     * Log password reset request.
     */
    public void logPasswordResetRequested(String username, String ipAddress) {
        logSecurityEvent(SecurityEventType.PASSWORD_RESET_REQUESTED, Map.of(
            "username", username,
            "ipAddress", ipAddress,
            "message", "Password reset requested"
        ));
    }
    
    /**
     * Log MFA enabled.
     */
    public void logMfaEnabled(String userId, String method) {
        logSecurityEvent(SecurityEventType.MFA_ENABLED, Map.of(
            "userId", userId,
            "method", method,
            "message", "MFA enabled"
        ));
    }
    
    /**
     * Log MFA disabled.
     */
    public void logMfaDisabled(String userId, String method) {
        logSecurityEvent(SecurityEventType.MFA_DISABLED, Map.of(
            "userId", userId,
            "method", method,
            "message", "MFA disabled"
        ));
    }
    
    /**
     * Log rate limit exceeded.
     */
    public void logRateLimitExceeded(String ipAddress, String endpoint, long retryAfterSeconds) {
        logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, Map.of(
            "ipAddress", ipAddress,
            "endpoint", endpoint,
            "retryAfterSeconds", retryAfterSeconds,
            "message", "Rate limit exceeded"
        ));
    }
    
    /**
     * Log account lockout.
     */
    public void logAccountLocked(String username, String ipAddress, int failedAttempts) {
        logSecurityEvent(SecurityEventType.ACCOUNT_LOCKED, Map.of(
            "username", username,
            "ipAddress", ipAddress,
            "failedAttempts", failedAttempts,
            "message", "Account locked due to failed login attempts"
        ));
    }
    
    /**
     * Generic security event logging with MDC context.
     */
    private void logSecurityEvent(SecurityEventType eventType, Map<String, Object> eventData) {
        try {
            // Add MDC context
            MDC.put("event_type", eventType.name());
            MDC.put("timestamp", Instant.now().toString());
            
            // Add user context if available
            String userId = MDC.get("userId");
            if (userId != null) {
                MDC.put("userId", userId);
            }
            
            // Build structured log message
            Map<String, Object> logEntry = new HashMap<>(eventData);
            logEntry.put("eventType", eventType.name());
            logEntry.put("timestamp", Instant.now().toString());
            
            // Log based on severity
            switch (eventType) {
                case AUTH_FAILURE:
                case AUTHZ_FAILURE:
                case ACCOUNT_LOCKED:
                case RATE_LIMIT_EXCEEDED:
                    auditLogger.warn("SECURITY_EVENT: {}", toJson(logEntry));
                    break;
                case SECURITY_CONFIG_CHANGE:
                case SESSION_REVOKED:
                    auditLogger.error("SECURITY_EVENT: {}", toJson(logEntry));
                    break;
                default:
                    auditLogger.info("SECURITY_EVENT: {}", toJson(logEntry));
            }
            
        } finally {
            // Clear MDC
            MDC.clear();
        }
    }
    
    /**
     * Convert map to JSON string.
     */
    private String toJson(Map<String, Object> data) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!first) json.append(",");
            json.append("\"").append(entry.getKey()).append("\":");
            if (entry.getValue() instanceof String) {
                json.append("\"").append(entry.getValue()).append("\"");
            } else {
                json.append(entry.getValue());
            }
            first = false;
        }
        json.append("}");
        return json.toString();
    }
    
    /**
     * Mask sensitive data in logs.
     */
    private String maskSensitiveData(String data) {
        if (data == null || data.length() < 4) {
            return "***";
        }
        return data.substring(0, 2) + "***" + data.substring(data.length() - 2);
    }
}
