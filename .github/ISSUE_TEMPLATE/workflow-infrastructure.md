---
title: "Add Workflow/Background Job Infrastructure"
labels: ["enhancement", "infrastructure", "architecture"]
assignees: []
---

## 🎯 Goal

Implement background job processing infrastructure for async tasks, scheduled jobs, and workflow orchestration.

## 📋 Technical Requirements

### Job Types to Support

**1. Immediate Background Jobs**
- [ ] Fire-and-forget tasks
- [ ] Email notifications
- [ ] File processing
- [ ] External API calls

**2. Scheduled/Cron Jobs**
- [ ] Periodic data cleanup
- [ ] Report generation
- [ ] Data synchronization
- [ ] Health checks

**3. Delayed Jobs**
- [ ] Execute at specific time
- [ ] Retry with exponential backoff
- [ ] Scheduled reminders

**4. Workflow/Saga Patterns**
- [ ] Multi-step workflows
- [ ] Compensation transactions
- [ ] State machine orchestration

### Message Broker Options

**Option A: RabbitMQ** (Recommended for most cases)
- [ ] Add RabbitMQ to Docker Compose
- [ ] Configure queues, exchanges, bindings
- [ ] Dead letter queues for failed messages
- [ ] Message persistence

**Option B: Redis Streams** (Simpler, already have Redis)
- [ ] Use Redis Streams for job queue
- [ ] Consumer groups for parallel processing
- [ ] Pending entry tracking

**Option C: Kafka** (High throughput, event sourcing)
- [ ] Add Kafka to Docker Compose
- [ ] Configure topics, partitions
- [ ] Consumer groups
- [ ] Schema registry

### Infrastructure Setup

**Docker Compose**
- [ ] Add message broker service (RabbitMQ/Redis/Kafka)
- [ ] Management UI (RabbitMQ Management / Redis Insight)
- [ ] Health checks
- [ ] Volume persistence

**Configuration**
- [ ] Broker connection via environment variables
- [ ] Queue names per environment
- [ ] Consumer concurrency settings
- [ ] Retry policies

### Code Structure

**Java (Spring Boot)**
```
boilerplate/java/order-service/src/main/java/
├── infrastructure/messaging/
│   ├── MessagingConfig.java           # RabbitMQ/Redis config
│   ├── QueueNames.java                # Queue name constants
│   ├── producers/
│   │   └── JobProducer.java           # Message producer
│   ├── consumers/
│   │   ├── JobConsumer.java           # Base consumer
│   │   └── EmailJobConsumer.java      # Specific consumer
│   └── jobs/
│       ├── JobHandler.java            # Job interface
│       ├── JobExecutor.java           # Job execution logic
│       └── annotations/
│           └── AsyncJob.java          # @AsyncJob annotation
├── infrastructure/scheduler/
│   ├── SchedulerConfig.java           # Scheduled task config
│   └── ScheduledTasks.java            # @Scheduled methods
└── infrastructure/workflow/
    ├── WorkflowEngine.java            # Workflow orchestration
    ├── Step.java                      # Workflow step interface
    └── Saga.java                      # Saga pattern implementation
```

**Python (FastAPI)**
```
boilerplate/python/order-service/src/
├── infrastructure/messaging/
│   ├── __init__.py
│   ├── broker_config.py              # Broker configuration
│   ├── producer.py                   # Message producer
│   └── consumer.py                   # Message consumer
├── infrastructure/jobs/
│   ├── __init__.py
│   ├── job_handler.py                # Job base class
│   ├── executor.py                   # Job executor
│   └── registry.py                   # Job registry
├── infrastructure/scheduler/
│   ├── __init__.py
│   ├── scheduler.py                  # APScheduler setup
│   └── scheduled_tasks.py            # Scheduled job definitions
└── infrastructure/workflow/
    ├── __init__.py
    ├── workflow_engine.py            # Workflow orchestration
    ├── step.py                       # Workflow step
    └── saga.py                       # Saga pattern
```

### Job Queue Patterns

**Simple Queue**
```
Producer → Queue → Consumer
```

**Priority Queue**
```
High Priority → Queue → Consumer
Medium Priority → Queue → Consumer
Low Priority → Queue → Consumer
```

**Dead Letter Queue**
```
Main Queue → Consumer (fails) → Dead Letter Queue
                                              ↓
                                    Retry/Alert/Monitoring
```

### Worker Implementation

**Background Worker Process**
- [ ] Separate worker process (not web server)
- [ ] Graceful shutdown handling
- [ ] Health check endpoint
- [ ] Metrics exposure
- [ ] Log aggregation

**Worker Scaling**
- [ ] Horizontal scaling (multiple workers)
- [ ] Consumer prefetch limits
- [ ] Load balancing across workers

### Scheduled Jobs

**Cron Expression Support**
- [ ] Standard 5-field cron (Unix)
- [ ] 6-field cron (Quartz - with seconds)
- [ ] Timezone support
- [ ] Dynamic scheduling (add/remove at runtime)

**Job Persistence**
- [ ] Store job metadata in database
- [ ] Track last execution time
- [ ] Track next execution time
- [ ] Track success/failure count

### Workflow/Saga Pattern

**Saga Orchestration**
```
Step 1 (Success) → Step 2 (Success) → Step 3 (Fail)
                                          ↓
                              Compensation: Step 2 → Step 1
```

**State Machine**
- [ ] Define states
- [ ] Define transitions
- [ ] Guard conditions
- [ ] State persistence

### Monitoring & Observability

- [ ] Queue depth metrics (Prometheus)
- [ ] Job success/failure rates
- [ ] Processing time per job type
- [ ] Dead letter queue size
- [ ] Worker health status
- [ ] Scheduled job execution history

### Error Handling

- [ ] Retry with exponential backoff
- [ ] Max retry count
- [ ] Dead letter queue for permanent failures
- [ ] Alert on repeated failures
- [ ] Manual retry mechanism

### Testing

- [ ] Unit tests for job handlers
- [ ] Integration tests with Testcontainers (RabbitMQ/Redis)
- [ ] End-to-end workflow tests
- [ ] Failure scenario tests
- [ ] Performance tests (job throughput)

## ✅ Acceptance Criteria

- [ ] Message broker added to Docker Compose
- [ ] At least 3 example jobs implemented (email, cleanup, report)
- [ ] Scheduled jobs working with cron expressions
- [ ] Dead letter queue configured
- [ ] Retry mechanism implemented
- [ ] Metrics exposed to Prometheus
- [ ] Integration tests passing
- [ ] Documentation in AGENTS.md

## 📝 Implementation Notes

**Job Idempotency:**
- Design jobs to be idempotent (safe to retry)
- Use unique job IDs for deduplication

**Job Payload:**
- Keep payloads small (<1MB)
- Store large data in DB/cache, pass reference in job

**Security:**
- Validate job payloads
- Authenticate inter-service messages
- Encrypt sensitive data in transit

## 🔗 Related

- Caching Infrastructure: #[issue-number]
- Monitoring Setup: #35
- Event-Driven Architecture: #[issue-number]

## 📚 References

- RabbitMQ Patterns: https://www.rabbitmq.com/getstarted.html
- APScheduler (Python): https://apscheduler.readthedocs.io/
- Spring Scheduler: https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#scheduling
- Saga Pattern: https://microservices.io/patterns/data/saga.html
