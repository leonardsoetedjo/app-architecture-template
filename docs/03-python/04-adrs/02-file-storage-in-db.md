# ADR 08: File Storage in Database (Python/Quasar)

**Status**: Accepted
**Date**: 2026-05-01

## Context
We need to store binary files (shipping labels, customs documents) associated with shipments. We must decide between storing files in a cloud bucket (S3) or directly in the database.

## Decision
Store files directly in **PostgreSQL using the `BYTEA` type**.

### Implementation:
- **Storage**: Use SQLAlchemy's `LargeBinary` type.
- **Metadata**: Store filename, MIME type, size, and checksum in a separate `file_metadata` table.
- **Streaming**: Use Python's streaming responses in FastAPI to avoid loading large files into memory.
- **Access**: Implement access control at the application layer before retrieving the binary data.

## Consequences
- **Positive**: Simplifies backups (single DB dump), ensures transactional consistency (file + record saved together), and removes dependency on external cloud providers.
- **Negative**: Increases database size and backup time.
- **Trade-off**: We prioritize transactional integrity and simplified infrastructure over storage cost.
