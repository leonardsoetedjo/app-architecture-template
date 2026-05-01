# ADR 008: File Storage in Database

**Status**: Accepted
**Date**: 2026-04-30

## Context
The previous standard mandated storing files in object storage (S3, MinIO, GCS) and only keeping metadata in the database. While this is the industry standard for large-scale binary data, the project requirements have shifted toward a need for stricter consistency and simplified infrastructure.

## Decision
We will now store file uploads directly in the PostgreSQL database using the `BYTEA` data type for the file content.

## Reasons
1. **Strong Consistency**: By storing the file and its metadata in the same transaction, we eliminate "orphan" files in object storage or "broken links" in the DB.
2. **Simplified Backups**: A single database dump (`pg_dump`) captures both metadata and the files themselves, ensuring atomic point-in-time recovery.
3. **Reduced Infrastructure Complexity**: Removes the dependency on an external object store, reducing the number of failure points and simplifying the deployment pipeline.
4. **Security**: Access control is managed centrally via the database's own security and the application's service layer, avoiding the need to manage signed URLs or S3 IAM policies.

## Consequences
- **Positive**: Atomic updates, simplified backup/restore, and reduced operational overhead.
- **Negative**: 
    - **Database Bloat**: Increased database size, which may lead to slower backups and potentially higher storage costs.
    - **Performance**: Reading large binaries from the DB can be slower than streaming from an object store.
- **Mitigation**: 
    - Implement strict file size limits for uploads.
    - Use streaming for retrieval to avoid loading entire binaries into memory.
    - Consider moving to a hybrid approach (TOAST handles most of this in Postgres) if performance degrades.
