// infrastructure/persistence/order.typeorm-repository.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";

import { OrderId } from "@domain/models/order-id.value-object";
import { Order } from "@domain/models/order.aggregate";
import { OrderRepositoryPort } from "@domain/ports/order-repository.port";

import { OrderEntity } from "./order.entity";
import { OrderMapper } from "./order.mapper";

@Injectable()
export class OrderTypeOrmRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    const entity = OrderMapper.toEntity(order);
    await this.repository.save(entity);
  }

  async findById(id: OrderId): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value, deletedAt: IsNull() },
      relations: ["items"],
    });
    return entity ? OrderMapper.toDomain(entity) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    sort?: { field: string; direction: "ASC" | "DESC" };
  }): Promise<Order[]> {
    const { skip, take, sort } = options || {};
    const findOptions: any = {
      skip,
      take,
      relations: ["items"],
      where: { deletedAt: IsNull() },
    };

    if (sort) {
      findOptions.order = { [sort.field]: sort.direction };
    }

    const entities = await this.repository.find(findOptions);
    return entities.map((entity) => OrderMapper.toDomain(entity));
  }

  async countAll(): Promise<number> {
    return this.repository.count({ where: { deletedAt: IsNull() } });
  }
}
