import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fix orders table: add missing columns for parity with Java/Python.
 *
 * Adds:
 * - customer_id UUID (nullable for backward compatibility)
 * - version BIGINT DEFAULT 0 (optimistic locking)
 * - deleted_at TIMESTAMPTZ (soft delete)
 * - confirmed_at TIMESTAMPTZ (order confirmation timestamp)
 *
 * Note: items JSONB column is kept for backward compatibility.
 * A separate migration will create order_items table and migrate data.
 */
export class FixOrdersTableAddMissingColumns1718800000000 implements MigrationInterface {
  name = "FixOrdersTableAddMissingColumns1718800000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add customer_id column (nullable for backward compatibility)
    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
    `);

    // Add version column for optimistic locking (required)
    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0 NOT NULL;
    `);

    // Add deleted_at column for soft delete
    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    `);

    // Add confirmed_at column for order confirmation timestamp
    await queryRunner.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
    `);

    // Create index on customer_id for querying orders by customer
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_customer_id;`);
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS confirmed_at;`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS deleted_at;`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS version;`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;`,
    );
  }
}
