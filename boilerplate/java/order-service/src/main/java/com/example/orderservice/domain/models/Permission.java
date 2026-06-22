package com.example.orderservice.domain.models;

import java.util.Set;

/**
 * Permission enumeration for fine-grained access control.
 * 
 * Format: {resource}:{action}
 * 
 * Resources: orders, users, products, reports, admin, settings
 * Actions: create, read, update, delete, export, approve, manage
 */
public enum Permission {
    // Order permissions
    ORDER_CREATE("orders:create", "Create new orders"),
    ORDER_READ("orders:read", "View orders"),
    ORDER_UPDATE("orders:update", "Update existing orders"),
    ORDER_DELETE("orders:delete", "Delete orders"),
    ORDER_EXPORT("orders:export", "Export order data"),
    ORDER_APPROVE("orders:approve", "Approve/reject orders"),
    
    // User permissions
    USER_CREATE("users:create", "Create new users"),
    USER_READ("users:read", "View user profiles"),
    USER_UPDATE("users:update", "Update user profiles"),
    USER_DELETE("users:delete", "Delete users"),
    USER_MANAGE("users:manage", "Full user management"),
    
    // Product permissions
    PRODUCT_CREATE("products:create", "Create products"),
    PRODUCT_READ("products:read", "View products"),
    PRODUCT_UPDATE("products:update", "Update products"),
    PRODUCT_DELETE("products:delete", "Delete products"),
    
    // Report permissions
    REPORT_READ("reports:read", "View reports"),
    REPORT_EXPORT("reports:export", "Export reports"),
    REPORT_CREATE("reports:create", "Create custom reports"),
    
    // Admin permissions
    ADMIN_ACCESS("admin:access", "Access admin panel"),
    ADMIN_CONFIGURE("admin:configure", "Configure system settings"),
    ADMIN_AUDIT("admin:audit", "View audit logs"),
    
    // Settings permissions
    SETTINGS_READ("settings:read", "View settings"),
    SETTINGS_UPDATE("settings:update", "Update settings");
    
    private final String code;
    private final String displayName;
    
    Permission(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Parse permission from code string.
     */
    public static Permission fromCode(String code) {
        for (Permission p : values()) {
            if (p.code.equals(code)) {
                return p;
            }
        }
        throw new IllegalArgumentException("Unknown permission code: " + code);
    }
    
    /**
     * Check if this permission matches a pattern.
     * Supports wildcards: "orders:*" matches all order permissions.
     */
    public boolean matches(String pattern) {
        if (pattern.equals("*")) return true;
        if (pattern.equals(this.code)) return true;
        
        // Handle wildcard patterns like "orders:*"
        if (pattern.endsWith(":*")) {
            String resource = pattern.substring(0, pattern.length() - 2);
            return this.code.startsWith(resource + ":");
        }
        
        return false;
    }

    /**
     * Get all permissions associated with a role.
     */
    public static Set<Permission> valuesForRole(Role role) {
        return switch (role) {
            case ADMIN -> Set.of(values());
            case MANAGER -> Set.of(
                ORDER_READ, ORDER_UPDATE, ORDER_EXPORT, ORDER_APPROVE,
                USER_READ, USER_UPDATE,
                PRODUCT_READ, PRODUCT_UPDATE,
                REPORT_READ, REPORT_EXPORT, REPORT_CREATE,
                SETTINGS_READ, SETTINGS_UPDATE
            );
            case USER -> Set.of(
                ORDER_CREATE, ORDER_READ, ORDER_UPDATE, ORDER_DELETE, ORDER_EXPORT,
                PRODUCT_READ,
                REPORT_READ, REPORT_CREATE
            );
            case GUEST -> Set.of(
                PRODUCT_READ, REPORT_READ
            );
            case SERVICE -> Set.of(
                ORDER_READ, ORDER_CREATE, ORDER_UPDATE,
                USER_READ, USER_CREATE,
                PRODUCT_READ, PRODUCT_CREATE, PRODUCT_UPDATE, PRODUCT_DELETE,
                REPORT_READ, REPORT_EXPORT, REPORT_CREATE,
                ADMIN_AUDIT
            );
        };
    }
}
