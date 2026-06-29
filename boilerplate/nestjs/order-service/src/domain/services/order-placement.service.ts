/**
 * Domain service: OrderPlacementService.
 *
 * Pure business logic — no infrastructure concerns.
 * Validates order rules, calculates totals, triggers domain events.
 *
 * Mirrors Java OrderPlacementService and Python order_placement_service.
 */
import { DomainException } from '../exceptions/domain.exception';
import { Order } from '../models/order.aggregate';

export class OrderPlacementService {
  validateOrder(order: Order): void {
    if (order.items.length === 0) {
      throw new DomainException('Order must contain at least one item');
    }
    if (order.totalAmount().lte(0)) {
      throw new DomainException('Order total must be greater than zero');
    }
  }

  calculateDiscount(total: number, customerTier: string): number {
    switch (customerTier) {
      case 'GOLD':
        return total * 0.15;
      case 'SILVER':
        return total * 0.10;
      case 'BRONZE':
        return total * 0.05;
      default:
        return 0;
    }
  }
}
