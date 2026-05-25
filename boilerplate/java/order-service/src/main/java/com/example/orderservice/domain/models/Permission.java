package com.example.orderservice.domain.models;

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
}
