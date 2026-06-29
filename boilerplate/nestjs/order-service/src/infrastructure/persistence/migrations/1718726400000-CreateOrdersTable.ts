import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initial migration: create orders table.
 *
 * Maps to Java Flyway V1__create_orders_table.sql
 * and Python Alembic 001_create_orders.py
 */
export class CreateOrdersTable1718726400000 implements MigrationInterface {
  name = "CreateOrdersTable1718726400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE order_status AS ENUM (
        'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED',
        'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        items       JSONB NOT NULL DEFAULT '[]',
        status      order_status NOT NULL DEFAULT 'PENDING',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS orders;`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status;`);
  }
}
