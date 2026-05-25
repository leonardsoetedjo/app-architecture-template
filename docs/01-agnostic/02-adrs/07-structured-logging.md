---
name: "ADR 09: Structured Logging for Observability (NDJSON & MDC)"
type: "ADR"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# ADR 09: Structured Logging for Observability (NDJSON & MDC)

**Status**: Accepted
**Date**: 2026-04-30

## Context
With the move to a microservices architecture, traditional line-based logs are insufficient. We need a way to trace requests across service boundaries and ingest logs into Splunk without expensive regex-based parsing.

## Decision
We will implement structured logging using the following constraints:
1. **Format**: All logs in production will be emitted as **NDJSON** (Newline Delimited JSON). Each log entry is a single JSON object on one line.
2. **Context**: We will use **MDC (Mapped Diagnostic Context)** to attach request-scoped metadata to every log statement automatically.
3. **Schema**: Every log entry must follow a consistent schema to ensure Splunk can index fields predictably.

## Reasons
1. **Splunk Ingestion**: NDJSON is the native format for high-performance ingestion in Splunk and ELK. It eliminates parsing errors associated with multiline logs.
2. **Correlation**: MDC allows us to inject `traceId` and `spanId` into every log entry without manually passing them to every `log.info()` call.
3. **Searchability**: Structured fields allow for precise querying (e.g., `status=500 AND service="order-service"`) instead of slow full-text searches.

## Consequences
- **Positive**: Drastically reduced MTTR (Mean Time To Resolution) via distributed tracing and instant field-based filtering.
- **Negative**: Logs are less readable to humans in the raw console; developers must use a log viewer or `jq` for local debugging.
- **Mitigation**: Use a Log4j2 profile that prints pretty-printed logs to the console in `dev` environment and NDJSON in `prod`.
