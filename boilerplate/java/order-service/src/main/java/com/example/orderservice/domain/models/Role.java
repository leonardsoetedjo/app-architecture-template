package com.example.orderservice.domain.models;

/**
 * Role enumeration for RBAC (Role-Based Access Control).
 * 
 * Standard roles following principle of least privilege:
 * - ADMIN: Full system access
 * - MANAGER: Team management + reporting
 * - USER: Standard user operations
 * - GUEST: Read-only access
 * - SERVICE: Service-to-service communication
 */
public enum Role {
    /** System administrator - full access to all resources */
    ADMIN("admin", "System Administrator"),
    
    /** Team manager - manage team members and view reports */
    MANAGER("manager", "Team Manager"),
    
    /** Standard user - create and manage own resources */
    USER("user", "Standard User"),
    
    /** Guest - read-only access to public resources */
    GUEST("guest", "Guest User"),
    
    /** Service account - automated service-to-service communication */
    SERVICE("service", "Service Account");
    
    private final String code;
    private final String displayName;
    
    Role(String code, String displayName) {
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
     * Check if this role has higher or equal privilege than another role.
     */
    public boolean hasPrivilegeOver(Role other) {
        if (other == null) return true;
        
        // Define privilege hierarchy
        return switch (this) {
            case ADMIN -> true; // Admin has privilege over all
            case MANAGER -> other == USER || other == GUEST;
            case USER -> other == GUEST;
            case GUEST -> false;
            case SERVICE -> other == GUEST || other == USER;
        };
    }
}
