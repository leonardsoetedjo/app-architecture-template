import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Create outbox_events table for reliable event publishing.
 *
 * Maps to Java/Python outbox pattern tables.
 */
export class CreateOutboxEventsTable1718726400001 implements MigrationInterface {
  name = "CreateOutboxEventsTable1718726400001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE outbox_events (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aggregate_type VARCHAR(128) NOT NULL,
        aggregate_id   VARCHAR(256) NOT NULL,
        event_type     VARCHAR(128) NOT NULL,
        payload        JSONB NOT NULL DEFAULT '{}',
        status         VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        retry_count    INT NOT NULL DEFAULT 0,
        error_message  TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at        TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_outbox_status_created
        ON outbox_events(status, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS outbox_events;`);
  }
}
