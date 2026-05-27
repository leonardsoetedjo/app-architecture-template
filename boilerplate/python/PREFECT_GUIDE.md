# Prefect Workflow Orchestration Guide

## Overview

This guide provides Clean Architecture-compliant patterns for implementing batch processing and workflow orchestration using Prefect in the Python boilerplate.

## Architecture

### Layer Responsibilities

**Domain Layer** (`domain/models/workflows/`, `domain/ports/workflows/`):
- Workflow entities (pure dataclasses)
- Task definition interfaces
- Flow configuration interfaces

**Application Layer** (`application/usecases/workflows/`, `application/services/workflows/`):
- Flow orchestration use cases
- Task processing services
- Flow state management

**Infrastructure Layer** (`infrastructure/workflows/`):
- Prefect flows
- Prefect tasks
- Flow deployments
- Prefect configuration

## Implementation Steps

### 1. Add Dependencies

Add to `pyproject.toml`:

```toml
[project]
dependencies = [
    # ... existing dependencies ...
    "prefect>=2.14.0",
    "prefect-sqlalchemy>=0.4.0",
]

[project.optional-dependencies]
dev = [
    # ... existing dev dependencies ...
    "pytest-prefect>=0.3.0",
]
```

Install:
```bash
poetry add prefect prefect-sqlalchemy
poetry add --group dev pytest-prefect
```

### 1.5. ⚠️ CRITICAL: Parameter Externalization

**IMPORTANT**: Externalize ALL configuration parameters to maximize flexibility and reduce code changes.

**DO NOT hardcode these values in flow/task code:**

| Parameter | Externalize To | Example |
|-----------|---------------|---------|
| Cron expressions | `prefect.yaml` or env | `PREFECT_SCHEDULE_CRON="0 0 * * *"` |
| Chunk sizes | Flow parameters | `chunk_size: int = Parameter("chunk_size", default=100)` |
| File paths | Environment variables | `os.getenv("INPUT_PATH", "/data/input")` |
| Database connections | Prefect Blocks | Use `SqlAlchemyConnector` Block |
| API URLs | Environment variables | `os.getenv("API_BASE_URL")` |
| Retry counts | Task/Flow parameters | `retries: int = Parameter("retries", default=3)` |
| Batch sizes | Flow parameters | `batch_size: int = Parameter("batch_size", default=1000)` |
| Timeout values | Flow parameters | `timeout_seconds: int = Parameter("timeout", default=3600)` |

**Recommended Flow Pattern with Parameters:**

```python
from prefect import flow, Parameter
from prefect.logging import get_run_logger
import os

@flow(name="sample-etl-flow", version="1.0.0")
def sample_etl_flow(
    # Externalized parameters with defaults
    source_url: str = Parameter(
        "source_url",
        default_factory=lambda: os.getenv("SOURCE_URL", "https://api.example.com/data")
    ),
    destination: str = Parameter(
        "destination",
        default_factory=lambda: os.getenv("DESTINATION", "postgresql://localhost/order_db")
    ),
    chunk_size: int = Parameter("chunk_size", default=100),
    retry_count: int = Parameter("retry_count", default=3),
) -> dict:
    """Sample ETL flow with externalized parameters."""
    logger = get_run_logger()
    logger.info(f"Running with chunk_size={chunk_size}, retries={retry_count}")
    
    # Use parameters throughout flow
    data = extract_data(source_url, chunk_size)
    transformed = transform_data(data)
    result = load_data(transformed, destination)
    
    return result
```

**Task with Externalized Parameters:**

```python
from prefect import task, Parameter

@task(
    name="extract-data",
    retries=Parameter("task_retries", default=3),
    retry_delay_seconds=Parameter("retry_delay", default=30),
)
def extract_data(
    source_url: str = None,
    chunk_size: int = None,
    timeout: int = None,
):
    # Use parameters or fall back to environment variables
    actual_source = source_url or os.getenv("SOURCE_URL")
    actual_chunk_size = chunk_size or int(os.getenv("CHUNK_SIZE", "100"))
    actual_timeout = timeout or int(os.getenv("EXTRACT_TIMEOUT", "300"))
    
    logger = get_run_logger()
    logger.info(f"Extracting from {actual_source} with chunk_size={actual_chunk_size}")
    
    return data
```

**Environment-Specific Overrides:**

```bash
# .env.dev
CHUNK_SIZE=10
BATCH_SIZE=100
PREFECT_SCHEDULE_CRON="0 */2 * * *"  # Every 2 hours in dev

# .env.staging
CHUNK_SIZE=50
BATCH_SIZE=500
PREFECT_SCHEDULE_CRON="0 0 * * *"  # Hourly in staging

# .env.prod
CHUNK_SIZE=200
BATCH_SIZE=2000
PREFECT_SCHEDULE_CRON="0 0 0 * *"  # Daily at midnight in prod
```

**Using Prefect Blocks for Secrets:**

```python
from prefect import flow
from prefect_sqlalchemy import SqlAlchemyConnector, ConnectionComponents

@flow
def flow_with_blocks():
    # Load database connection from Prefect Block (configured via UI/CLI)
    database = SqlAlchemyConnector.load("my-database-connection")
    
    # Load API credentials from Block
    api_credentials = Secret.load("my-api-credentials")
    
    # Use in tasks
    data = query_database(database, api_credentials.get())
    return data
```

**Benefits:**
1. ✅ No code changes for parameter tuning
2. ✅ Environment-specific configuration (dev/staging/prod)
3. ✅ Runtime adjustments via deployment updates
4. ✅ Security: Secrets in Prefect Blocks or environment variables
5. ✅ Audit trail: Deployment changes tracked in version control
6. ✅ Reusability: Same flow, different parameters per environment

### 2. Create Domain Layer

**File**: `domain/models/workflows/workflow_execution.py`
```python
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class WorkflowExecution:
    """Domain entity representing a workflow execution."""
    workflow_name: str
    workflow_type: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: WorkflowStatus = WorkflowStatus.PENDING
    records_processed: int = 0
    records_failed: int = 0
    error_message: Optional[str] = None
```

**File**: `domain/ports/workflows/workflow_port.py`
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from domain.models.workflows.workflow_execution import WorkflowExecution


class WorkflowPort(ABC):
    """Interface for workflow operations."""
    
    @abstractmethod
    def create_execution(self, workflow_name: str, workflow_type: str) -> WorkflowExecution:
        """Create a new workflow execution record."""
        pass
    
    @abstractmethod
    def update_status(
        self, 
        execution_id: int, 
        status: WorkflowStatus,
        error_message: Optional[str] = None
    ) -> WorkflowExecution:
        """Update workflow execution status."""
        pass
    
    @abstractmethod
    def get_executions_by_status(self, status: WorkflowStatus) -> List[WorkflowExecution]:
        """Get executions by status."""
        pass
    
    @abstractmethod
    def get_execution_by_id(self, execution_id: int) -> Optional[WorkflowExecution]:
        """Get execution by ID."""
        pass
```

### 3. Create Application Layer

**File**: `application/usecases/workflows/execute_workflow_use_case.py`
```python
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class WorkflowParameters:
    """Parameters for workflow execution."""
    source_url: str
    destination: str
    chunk_size: int = 100
    retry_count: int = 3
    

class ExecuteWorkflowUseCase:
    """Use case for executing workflows."""
    
    def execute(self, workflow_name: str, params: WorkflowParameters) -> Dict[str, Any]:
        """
        Execute a workflow with the given parameters.
        
        Args:
            workflow_name: Name of the workflow to execute
            params: Workflow parameters
            
        Returns:
            Execution result with status and metrics
        """
        raise NotImplementedError
```

**File**: `application/services/workflows/workflow_executor.py`
```python
import logging
from typing import Any, Dict
from application.usecases.workflows.execute_workflow_use_case import (
    ExecuteWorkflowUseCase,
    WorkflowParameters
)
from domain.ports.workflows.workflow_port import WorkflowPort
from domain.models.workflows.workflow_execution import WorkflowExecution, WorkflowStatus


logger = logging.getLogger(__name__)


class WorkflowExecutor(ExecuteWorkflowUseCase):
    """Service for executing workflows."""
    
    def __init__(self, workflow_port: WorkflowPort):
        self.workflow_port = workflow_port
    
    def execute(self, workflow_name: str, params: WorkflowParameters) -> Dict[str, Any]:
        logger.info(f"Executing workflow: {workflow_name} with params: {params}")
        
        # Create execution record
        execution = self.workflow_port.create_execution(
            workflow_name=workflow_name,
            workflow_type="ETL"
        )
        
        try:
            # Execute workflow logic here
            # This would typically call Prefect flow
            result = self._run_workflow(workflow_name, params)
            
            # Update success
            self.workflow_port.update_status(
                execution_id=1,  # Replace with actual ID
                status=WorkflowStatus.COMPLETED,
            )
            
            logger.info(f"Workflow completed: {result['records_processed']} records processed")
            
            return result
            
        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            
            # Update failure
            self.workflow_port.update_status(
                execution_id=1,
                status=WorkflowStatus.FAILED,
                error_message=str(e)
            )
            
            raise
    
    def _run_workflow(self, workflow_name: str, params: WorkflowParameters) -> Dict[str, Any]:
        """Internal method to run the actual workflow."""
        # Placeholder - actual implementation would call Prefect
        return {
            "status": "success",
            "records_processed": 1000,
            "records_failed": 0
        }
```

### 4. Create Infrastructure Layer - Prefect Tasks

**File**: `infrastructure/workflows/tasks/sample_tasks.py`
```python
"""
Sample Prefect tasks for ETL operations.

Tasks should be:
- Idempotent (safe to retry)
- Atomic (do one thing well)
- Configurable (parameters for flexibility)
- Logged (proper observability)
"""

from prefect import task
from prefect.logging import get_run_logger
from typing import Any, Dict, List
import logging


@task(
    name="extract-data",
    retries=3,
    retry_delay_seconds=30,
    tags=["extract", "etl"]
)
def extract_data(source_url: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Extract data from a source.
    
    Args:
        source_url: URL or path to data source
        params: Additional extraction parameters
        
    Returns:
        Extracted data as dictionary
    """
    logger = get_run_logger()
    logger.info(f"Extracting data from {source_url}")
    
    try:
        # Implementation here
        # Examples:
        # - HTTP API call
        # - Database query
        # - File read
        
        data = {
            "records": [],
            "metadata": {
                "source": source_url,
                "extracted_count": 0
            }
        }
        
        logger.info(f"Extracted {len(data['records'])} records")
        return data
        
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise


@task(
    name="transform-data",
    retries=2,
    retry_delay_seconds=15,
    tags=["transform", "etl"]
)
def transform_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform raw data.
    
    Args:
        raw_data: Raw extracted data
        
    Returns:
        Transformed data
    """
    logger = get_run_logger()
    logger.info(f"Transforming {len(raw_data.get('records', []))} records")
    
    try:
        # Implementation here
        # Examples:
        # - Data validation
        # - Field mapping
        # - Data enrichment
        # - Filtering
        
        transformed = {
            "records": [],
            "metadata": {
                "transformed_count": 0
            }
        }
        
        logger.info(f"Transformed {len(transformed['records'])} records")
        return transformed
        
    except Exception as e:
        logger.error(f"Transformation failed: {e}")
        raise


@task(
    name="load-data",
    retries=3,
    retry_delay_seconds=60,
    tags=["load", "etl"]
)
def load_data(
    data: Dict[str, Any],
    destination: str,
    batch_size: int = 100
) -> Dict[str, int]:
    """
    Load data to destination.
    
    Args:
        data: Data to load
        destination: Destination URL or path
        batch_size: Records per batch
        
    Returns:
        Load statistics
    """
    logger = get_run_logger()
    logger.info(f"Loading {len(data.get('records', []))} records to {destination}")
    
    try:
        # Implementation here
        # Examples:
        # - Database insert/update
        # - File write
        # - API POST
        
        stats = {
            "loaded": 0,
            "failed": 0,
            "skipped": 0
        }
        
        logger.info(f"Load complete: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Load failed: {e}")
        raise
```

### 5. Create Infrastructure Layer - Prefect Flows

**File**: `infrastructure/workflows/flows/sample_flow.py`
```python
"""
Sample Prefect flow demonstrating ETL pattern.

Flows should:
- Orchestrate tasks (not implement business logic)
- Handle flow-level error handling
- Provide observability (logging, metrics)
- Be versioned for deployment
"""

from prefect import flow, get_run_logger
from prefect.logging import get_run_logger
from typing import Any, Dict
from infrastructure.workflows.tasks.sample_tasks import (
    extract_data,
    transform_data,
    load_data
)


@flow(
    name="sample-etl-flow",
    version="1.0.0",
    description="Sample ETL flow demonstrating Prefect patterns",
    tags=["etl", "sample"],
    timeout_seconds=3600,  # 1 hour timeout
)
def sample_etl_flow(
    source_url: str,
    destination: str,
    chunk_size: int = 100
) -> Dict[str, Any]:
    """
    Sample ETL flow.
    
    Args:
        source_url: Source data URL
        destination: Destination URL
        chunk_size: Processing chunk size
        
    Returns:
        Flow execution result
    """
    logger = get_run_logger()
    logger.info(f"Starting ETL flow: {source_url} -> {destination}")
    
    try:
        # Extract phase
        raw_data = extract_data(source_url)
        
        # Transform phase
        transformed_data = transform_data(raw_data)
        
        # Load phase
        load_stats = load_data(transformed_data, destination, chunk_size)
        
        result = {
            "status": "success",
            "records_processed": load_stats.get("loaded", 0),
            "records_failed": load_stats.get("failed", 0)
        }
        
        logger.info(f"Flow completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Flow failed: {e}")
        raise
```

### 6. Chunked Processing Pattern

**File**: `infrastructure/workflows/flows/chunked_flow.py`
```python
"""
Chunked processing flow for large datasets.

This pattern:
- Splits large datasets into manageable chunks
- Processes chunks in parallel
- Provides better memory management
- Enables progress tracking
"""

from prefect import flow, task
from prefect.logging import get_run_logger
from typing import List, Any, Dict
from concurrent.futures import ThreadPoolExecutor


@task(name="process-chunk", retries=3, retry_delay_seconds=30)
def process_chunk(chunk: List[Any], chunk_index: int) -> Dict[str, Any]:
    """
    Process a single chunk of data.
    
    Args:
        chunk: List of records to process
        chunk_index: Index of this chunk
        
    Returns:
        Processing result for this chunk
    """
    logger = get_run_logger()
    logger.info(f"Processing chunk {chunk_index} with {len(chunk)} records")
    
    try:
        # Process chunk logic here
        success_count = len(chunk)  # Placeholder
        
        return {
            "chunk_index": chunk_index,
            "records_processed": success_count,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Chunk {chunk_index} failed: {e}")
        return {
            "chunk_index": chunk_index,
            "records_processed": 0,
            "status": "failed",
            "error": str(e)
        }


@flow(
    name="chunked-processing-flow",
    version="1.0.0",
    description="Process large datasets in chunks",
    tags=["chunked", "etl"],
)
def chunked_processing_flow(
    data: List[Any],
    chunk_size: int = 100,
    max_parallel: int = 4
) -> Dict[str, Any]:
    """
    Process large datasets in chunks for better memory management.
    
    Args:
        data: List of records to process
        chunk_size: Records per chunk
        max_parallel: Maximum parallel chunks
        
    Returns:
        Aggregated processing results
    """
    logger = get_run_logger()
    
    # Split data into chunks
    chunks = [
        data[i:i + chunk_size]
        for i in range(0, len(data), chunk_size)
    ]
    
    logger.info(f"Processing {len(data)} records in {len(chunks)} chunks")
    
    # Process chunks in parallel using map
    # Prefect's .map() automatically parallelizes
    results = process_chunk.map(chunks, range(len(chunks)))
    
    # Wait for all chunks to complete
    chunk_results = [result.result() for result in results]
    
    # Aggregate results
    total_processed = sum(r["records_processed"] for r in chunk_results)
    successful_chunks = sum(1 for r in chunk_results if r["status"] == "success")
    failed_chunks = sum(1 for r in chunk_results if r["status"] == "failed")
    
    result = {
        "total_chunks": len(chunks),
        "successful_chunks": successful_chunks,
        "failed_chunks": failed_chunks,
        "total_records_processed": total_processed,
        "success_rate": successful_chunks / len(chunks) if chunks else 0
    }
    
    logger.info(f"Chunked processing complete: {result}")
    
    return result
```

### 7. Flow Deployment Configuration

**File**: `infrastructure/workflows/deployments/sample_deployment.py`
```python
"""
Prefect deployment configuration.

This file defines how flows are deployed and scheduled.
"""

from prefect.deployments import Deployment
from prefect.filesystems import LocalFileSystem, GCS, S3
from prefect.infrastructure import Process, KubernetesJob, DockerContainer
from infrastructure.workflows.flows.sample_flow import sample_etl_flow


# Create deployment for sample ETL flow
sample_deployment = Deployment.build_from_flow(
    flow=sample_etl_flow,
    name="sample-etl-daily",
    version="1.0.0",
    schedule={
        "cron": "0 0 * * *",  # Daily at midnight UTC
        "timezone": "UTC"
    },
    work_queue_name="default",
    tags=["etl", "production", "daily"],
    parameters={
        "source_url": "https://api.example.com/data",
        "destination": "postgresql://localhost/order_db",
        "chunk_size": 100
    },
    storage=LocalFileSystem(basepath="."),
    infrastructure=Process(),
    infra_overrides={
        "env":***@pytest.fixture(scope="session")
def prefect_test_fixture():
    """
    Prefect test fixture for running flows in test mode.
    """
    with prefect_test_harness():
        yield


def test_sample_etl_flow(prefect_test_fixture):
    """Test the sample ETL flow."""
    result = sample_etl_flow(
        source_url="test://data",
        destination="test://output"
    )
    assert result["status"] == "success"
    assert "records_processed" in result


def test_chunked_processing_flow(prefect_test_fixture):
    """Test chunked processing flow."""
    test_data = list(range(1000))  # 1000 records
    
    result = chunked_processing_flow(
        data=test_data,
        chunk_size=100,
        max_parallel=4
    )
    
    assert result["total_chunks"] == 10
    assert result["success_rate"] == 1.0
```

### 9. Configuration

**File**: `prefect.yaml`
```yaml
# Prefect configuration file
# Place in project root

name: order-service
prefect-version: 2.14.0

# Build section for flow deployments
build:
  - prefect.deployments.steps.set_working_directory:
      directory: /opt/prefect/order-service

# Push section for storing flow code
push:
  - prefect.deployments.steps.git_clone:
      repository: https://github.com/your-org/order-service.git
      branch: main

# Pull section for retrieving flow code
pull:
  - prefect.deployments.steps.set_working_directory:
      directory: /opt/prefect/order-service

# Deployments
deployments:
  - name: sample-etl-daily
    entrypoint: infrastructure/workflows/flows/sample_flow.py:sample_etl_flow
    schedule:
      cron: "0 0 * * *"
      timezone: UTC
    work_queue: default
    tags:
      - etl
      - production
    parameters:
      source_url: "https://api.example.com/data"
      destination: "postgresql://localhost/order_db"
      chunk_size: 100
    infra_overrides:
      env:
        DATABASE_URL: "${DATABASE_URL}"
        API_KEY: "${API_KEY}"
```

### 10. Running and Deploying

**Local Development:**
```bash
# Start Prefect server
prefect server start

# Run flow locally
python -m prefect run infrastructure/workflows/flows/sample_flow.py:sample_etl_flow \
    --param source_url="https://api.example.com/data" \
    --param destination="postgresql://localhost/order_db"

# Register deployment
prefect deployment build \
    infrastructure/workflows/flows/sample_flow.py:sample_etl_flow \
    -n sample-etl-daily \
    -q default \
    --schedule "0 0 * * *" \
    --apply
```

**Production Deployment:**
```bash
# Deploy to Prefect Cloud
prefect deployment run sample-etl-flow/sample-etl-daily

# Or via API
curl -X POST "https://api.prefect.cloud/api/deployments/{deployment_id}/create_flow_run" \
    -H "Authorization: Bearer $PREFECT_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"parameters": {"source_url": "...", "destination": "..."}}'
```

## Best Practices

1. **Task Granularity**: Keep tasks small and focused
2. **Retries**: Always configure retries for transient failures
3. **Logging**: Use `get_run_logger()` for observability
4. **Versioning**: Version all flows for deployment
5. **Testing**: Use `prefect_test_harness()` for testing
6. **Secrets**: Use Prefect blocks for sensitive data
7. **Monitoring**: Set up alerts for failed flows

## Common Patterns

### Database Integration
```python
from prefect_sqlalchemy import SqlAlchemyConnector, ConnectionComponents

@task
def query_database(query: str):
    connector = SqlAlchemyConnector(
        connection_info=ConnectionComponents(
            driver="postgresql+psycopg2",
            username="user",
            password="password",
            host="localhost",
            database="order_db"
        )
    )
    with connector.get_connection() as conn:
        return pd.read_sql(query, conn)
```

### File Operations
```python
from prefect import task
from pathlib import Path

@task
def read_csv_file(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)

@task
def write_csv_file(df: pd.DataFrame, file_path: str):
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(file_path, index=False)
```

### API Integration
```python
import httpx

@task(retries=3)
def fetch_api_data(url: str, params: dict = None):
    with httpx.Client() as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        return response.json()
```

## Monitoring

### Prefect UI
- Access at: `http://localhost:4200`
- View flow runs, task runs, logs
- Set up notifications

### Alerts
```python
from prefect.blocks.notifications import SlackWebhook

slack_webhook = SlackWebhook.load("my-slack-webhook")

@flow(on_failure=[slack_webhook.notify])
def monitored_flow():
    # Flow with Slack notifications on failure
    pass
```

## Next Steps

1. Implement actual business logic in tasks
2. Set up Prefect Cloud or self-hosted server
3. Configure CI/CD for flow deployments
4. Add monitoring and alerting
5. Integrate with Quartz scheduler (Issue #94)
