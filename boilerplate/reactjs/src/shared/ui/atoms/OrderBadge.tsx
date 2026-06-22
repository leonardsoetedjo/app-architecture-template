import React from 'react';
import type { OrderStateLiteral } from 'entities/order';
import { ORDER_STATE_CONFIG } from 'shared/lib/formatters';

interface OrderBadgeProps {
  status: OrderStateLiteral;
}

export const OrderBadge: React.FC<OrderBadgeProps> = ({ status }) => {
  const cfg = ORDER_STATE_CONFIG[status];
  return (
    <span className={`badge ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

export default OrderBadge;
