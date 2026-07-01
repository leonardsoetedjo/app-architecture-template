import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Create order_items table for proper relational mapping.
 *
 * This migration creates the order_items table that was missing from the initial schema.
 * The items are stored as a separate table with foreign key to orders,
 * following the same pattern as Java and Python backends.
 *
 * Note: The orders.items JSONB column is NOT removed in this migration
 * to maintain backward compatibility. Applications should migrate to
 * using the relational items instead.
 */
export class CreateOrderItemsTable1718800000001 implements MigrationInterface {
  name = "CreateOrderItemsTable1718800000001";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create order_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(19, 4) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_order_items_order
          FOREIGN KEY (order_id)
          REFERENCES orders(id)
          ON DELETE CASCADE
      );
    `);

    // Create index on order_id for efficient joins
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);

    // Create index on product_id for querying items by product
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_product_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_order_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items;`);
  }
}
