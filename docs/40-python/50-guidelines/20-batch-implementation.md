# Batch Processing Guidelines (Python/Quasar)

## 1. Strategy
For the Python platform, batch processing is handled using **Celery** with **Redis** as the broker and **PostgreSQL** as the result backend. For complex, long-running DAGs, **Airflow** or **Prefect** should be used.

## 2. Implementation Patterns

### 2.1 Task Definition
Tasks must be atomic and idempotent. Avoid long-running tasks in a single worker; split them into smaller chunks.

```python
from celery import Celery

app = Celery('logistics_tasks', broker='redis://localhost:6379/0')

@app.task(bind=True, max_retries=3)
def process_shipment_batch(self, shipment_ids):
    try:
        for shipment_id in shipment_ids:
            process_single_shipment(shipment_id)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
```

### 2.2 Idempotency & Reliability
- **Idempotent Handlers**: Every task must check if the work was already completed (e.g., check `processed_at` timestamp in DB) before executing.
- **Dead Letter Queue (DLQ)**: Use a dedicated queue for failed tasks to allow manual inspection and reprocessing.
- **Visibility Timeout**: Configure visibility timeouts to match the expected maximum execution time of a task to avoid duplicate processing.

## 3. Error Handling
Follow the **Agnostic Resilience Standards** (`docs/agnostic/standards/resilience.md`):
- **Transient Errors**: Use Celery's `retry` mechanism with exponential backoff.
- **Semantic Errors**: Log the error and skip the item; do not retry.
- **Systemic Errors**: Stop the worker and alert operations.

## 4. Scaling & Performance
- **Prefetch Multiplier**: Set `worker_prefetch_multiplier` to `1` for long-running tasks to prevent a single worker from hoarding too many tasks.
- **Concurrency**: Use the `gevent` or `eventlet` pool for I/O bound tasks to increase throughput.
- **Monitoring**: Use **Flower** for real-time monitoring of task progress and worker health.
