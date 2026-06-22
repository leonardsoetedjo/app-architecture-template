export enum Role {
    ADMIN = 'admin',
    MANAGER = 'manager',
    USER = 'user',
    GUEST = 'guest',
    SERVICE = 'service',
}

export enum Permission {
    ORDER_CREATE = 'orders:create',
    ORDER_READ = 'orders:read',
    ORDER_UPDATE = 'orders:update',
    ORDER_DELETE = 'orders:delete',
    ORDER_EXPORT = 'orders:export',
    ORDER_APPROVE = 'orders:approve',
    USER_CREATE = 'users:create',
    USER_READ = 'users:read',
    USER_UPDATE = 'users:update',
    USER_DELETE = 'users:delete',
    USER_MANAGE = 'users:manage',
    PRODUCT_CREATE = 'products:create',
    PRODUCT_READ = 'products:read',
    PRODUCT_UPDATE = 'products:update',
    PRODUCT_DELETE = 'products:delete',
    REPORT_READ = 'reports:read',
    REPORT_EXPORT = 'reports:export',
    REPORT_CREATE = 'reports:create',
    ADMIN_ACCESS = 'admin:access',
    ADMIN_CONFIGURE = 'admin:configure',
    ADMIN_AUDIT = 'admin:audit',
    SETTINGS_READ = 'settings:read',
    SETTINGS_UPDATE = 'settings:update',
}

export class PermissionService {
    static valuesForRole(role: Role): Set<Permission> {
        switch (role) {
            case Role.ADMIN: return new Set(Object.values(Permission));
            case Role.MANAGER: return new Set([
                Permission.ORDER_READ, Permission.ORDER_UPDATE, Permission.ORDER_EXPORT, Permission.ORDER_APPROVE,
                Permission.USER_READ, Permission.USER_UPDATE,
                Permission.PRODUCT_READ, Permission.PRODUCT_UPDATE,
                Permission.REPORT_READ, Permission.REPORT_EXPORT, Permission.REPORT_CREATE,
                Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE,
            ]);
            case Role.USER: return new Set([
                Permission.ORDER_CREATE, Permission.ORDER_READ, Permission.ORDER_UPDATE, Permission.ORDER_DELETE, Permission.ORDER_EXPORT,
                Permission.PRODUCT_READ,
                Permission.REPORT_READ, Permission.REPORT_CREATE,
            ]);
            case Role.GUEST: return new Set([
                Permission.PRODUCT_READ, Permission.REPORT_READ,
            ]);
            case Role.SERVICE: return new Set([
                Permission.ORDER_READ, Permission.ORDER_CREATE, Permission.ORDER_UPDATE,
                Permission.USER_READ, Permission.USER_CREATE,
                Permission.PRODUCT_READ, Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE, Permission.PRODUCT_DELETE,
                Permission.REPORT_READ, Permission.REPORT_EXPORT, Permission.REPORT_CREATE,
                Permission.ADMIN_AUDIT,
            ]);
            default: return new Set();
        }
    }
}
