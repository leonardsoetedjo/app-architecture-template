// domain/ports/order-repository.port.ts
import { Order } from '../models/order.aggregate';
import { OrderId } from '../models/order-id.value-object';

export interface OrderRepositoryPort {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findAll(options?: {
    skip?: number;
    take?: number;
    sort?: { field: string; direction: 'ASC' | 'DESC' };
  }): Promise<Order[]>;
  countAll(): Promise<number>;
}
