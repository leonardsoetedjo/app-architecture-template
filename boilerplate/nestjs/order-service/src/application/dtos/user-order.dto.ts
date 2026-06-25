import { Role } from '../../domain/models/role';

export interface RegisterCommand {
    email: string;
    password: string;
    roles?: Role[];
}

export interface RegisterResult {
    userId: string;
    email: string;
    roles: Set<Role>;
}

export interface UserProfileResult {
    userId: string;
    email: string;
    roles: Set<Role>;
    enabled: boolean;
    createdAt: Date;
    lastLoginAt?: Date;
}

export interface OrderDetailResult {
    orderId: string;
    customerId: string;
    status: string;
    items: OrderItemResult[];
    totalAmount: string;
    createdAt: Date;
    confirmedAt?: Date;
    deleted: boolean;
}

export interface OrderItemResult {
    productId: string;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
}

export interface OrderListItemResult {
    orderId: string;
    customerId: string;
    status: string;
    totalAmount: string;
    createdAt: Date;
    itemCount: number;
}

export interface UpdateOrderStatusCommand {
    orderId: string;
    newStatus: string;
}

export interface PaginatedResult<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface SoftDeleteOrderCommand {
    orderId: string;
}
