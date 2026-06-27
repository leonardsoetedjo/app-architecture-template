---
title: "Batch Job Status Architecture"
number: "47"
type: "Standard"
created: "2026-06-27"
status: "active"
---
# Batch Job Status Architecture

## ⚠️ CRITICAL: Separate Business Status from Scheduler Status

**DO NOT confuse batch job business statuses with Quartz scheduler statuses.** They serve different purposes and operate at different architectural layers.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│  (API Controllers, UI Dashboards, Reports)              │
│  - Display business status to users                      │
│  - Filter by business status                             │
│  - Business metrics and KPIs                             │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER                           │
│  (Business Logic - Framework Agnostic)                  │
│  - BatchJobStatus enum (business states)                │
│  - Business rules for status transitions                │
│  - Audit trail and compliance                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              APPLICATION LAYER                           │
│  (Use Cases, Services)                                  │
│  - Map scheduler events → business status               │
│  - Orchestrate batch execution                          │
│  - Handle business exceptions                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                        │
│  (Quartz Scheduler - Technical)                         │
│  - Quartz JobStatus (technical states)                  │
│  - Trigger execution                                    │
│  - Scheduler health monitoring                          │
└─────────────────────────────────────────────────────────┘
```

---

## Status Comparison

### Business Batch Job Statuses (Domain Layer)

**Purpose:** Track the business state of batch operations for users, auditors, and reporting.

```java
// domain/models/batch/BatchJobStatus.java
package com.example.order.domain.models.batch;

/**
 * Business status of a batch job.
 * Used for reporting, auditing, and user-facing dashboards.
 * Independent of scheduler implementation.
 */
public enum BatchJobStatus {
    /**
     * Job is configured but not yet triggered.
     * Business rule: Can be cancelled by user.
     */
    SCHEDULED,
    
    /**
     * Job is queued, waiting for resources.
     * Business rule: Can be prioritized or cancelled.
     */
    QUEUED,
    
    /**
     * Job is actively processing data.
     * Business rule: Monitor progress, estimate completion.
     */
    PROCESSING,
    
    /**
     * Job completed successfully with all records processed.
     * Business rule: Trigger downstream processes, send notifications.
     */
    COMPLETED,
    
    /**
     * Job failed due to business rule violation or data error.
     * Business rule: Alert business users, require manual review.
     */
    FAILED,
    
    /**
     * Job partially completed (some records failed).
     * Business rule: Review failed records, decide on reprocessing.
     */
    PARTIALLY_COMPLETED,
    
    /**
     * Job was cancelled by user before completion.
     * Business rule: Log reason, cleanup partial data.
     */
    CANCELLED,
    
    /**
     * Job validation failed before processing started.
     * Business rule: Fix configuration, reschedule.
     */
    VALIDATION_FAILED,
    
    /**
     * Job is paused for manual review.
     * Business rule: Requires manual approval to continue.
     */
    ON_HOLD,
    
    /**
     * Job completed with warnings (non-critical issues).
     * Business rule: Review warnings, no action required.
     */
    COMPLETED_WITH_WARNINGS
}
```

**Characteristics:**
- ✅ **Business-driven** - Reflects business process state
- ✅ **User-facing** - Displayed in dashboards and reports
- ✅ **Auditable** - Stored in business database for compliance
- ✅ **Framework-agnostic** - No Quartz/Spring annotations
- ✅ **Persistent** - Survives application restarts
- ✅ **Domain layer** - Part of business logic

---

### Quartz Scheduler Statuses (Infrastructure Layer)

**Purpose:** Track the technical execution state of scheduled jobs.

```java
// From Quartz library - DO NOT use in domain layer
org.quartz.Trigger.TriggerState:
    - NONE       - Trigger does not exist
    - NORMAL     - Trigger is active and scheduled
    - PAUSED     - Trigger is paused by scheduler
    - COMPLETE   - Trigger has fired and completed
    - ERROR      - Trigger encountered an error
    - BLOCKED    - Trigger is blocked by another job
```

**Characteristics:**
- ✅ **Technical** - Reflects scheduler execution state
- ✅ **Internal** - Used for scheduler monitoring only
- ✅ **Quartz-managed** - Stored in QRTZ_* tables
- ✅ **Framework-specific** - Tied to Quartz API
- ✅ **Ephemeral** - May be lost on scheduler restart (unless using JDBC job store)
- ✅ **Infrastructure layer** - Part of scheduler implementation

---

## Status Mapping

**How scheduler events map to business statuses:**

| Quartz Event | → | Business Status | Action |
|--------------|---|-----------------|--------|
| Trigger fired | → | `PROCESSING` | Update business DB |
| Job completed successfully | → | `COMPLETED` | Record metrics, notify |
| Job failed (exception) | → | `FAILED` | Alert, log error details |
| Job skipped records | → | `PARTIALLY_COMPLETED` | Flag for review |
| Job cancelled via API | → | `CANCELLED` | Cleanup, log reason |
| Validation exception | → | `VALIDATION_FAILED` | Notify config owner |
| Scheduler paused | → | `ON_HOLD` | No business action |
| Scheduler error | → | `FAILED` | Alert technical team |

---

## Implementation Pattern

### ✅ CORRECT: Separate Status Tracking

```java
// Domain Layer - Business Status
// domain/models/batch/BatchJob.java
@Value
@Builder
public class BatchJob {
    Long id;
    String jobName;
    String jobType;
    BatchJobStatus businessStatus;  // ← Business status
    LocalDateTime startTime;
    LocalDateTime endTime;
    int recordsProcessed;
    int recordsFailed;
    String errorMessage;
}

// Infrastructure Layer - Scheduler Status
// infrastructure/scheduler/service/QuartzSchedulerService.java
@Service
public class QuartzSchedulerService {
    
    public void onJobExecution(JobExecutionContext context) {
        // 1. Get Quartz technical status
        Trigger.TriggerState quartzStatus = scheduler.getTriggerState(
            context.getTrigger().getKey()
        );
        
        // 2. Map to business status
        BatchJobStatus businessStatus = mapToBusinessStatus(quartzStatus);
        
        // 3. Update business database via domain service
        batchJobPort.updateJobStatus(
            context.getJobDetail().getKey().getName(),
            businessStatus
        );
    }
    
    private BatchJobStatus mapToBusinessStatus(Trigger.TriggerState quartzStatus) {
        return switch (quartzStatus) {
            case NORMAL -> BatchJobStatus.PROCESSING;
            case COMPLETE -> BatchJobStatus.COMPLETED;
            case ERROR -> BatchJobStatus.FAILED;
            case PAUSED -> BatchJobStatus.ON_HOLD;
            default -> BatchJobStatus.FAILED;
        };
    }
}
```

### ❌ WRONG: Mixing Statuses

```java
// DON'T DO THIS - Leaks infrastructure concerns to domain
@Value
public class BatchJob {
    String jobName;
    org.quartz.Trigger.TriggerState status;  // ❌ WRONG!
}

// DON'T DO THIS - Exposes business status to scheduler
@Component
public class SampleQuartzJob implements Job {
    public void execute(JobExecutionContext context) {
        // ❌ WRONG! Scheduler shouldn't know about business status
        context.getMergedJobDataMap().put("businessStatus", "COMPLETED");
    }
}
```

---

## Database Schema

### Business Batch Jobs Table (Your Application DB)

```sql
CREATE TABLE batch_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    business_status VARCHAR(50) NOT NULL,  -- COMPLETED, FAILED, etc.
    quartz_job_name VARCHAR(255),          -- Reference to Quartz job
    quartz_job_group VARCHAR(255),         -- Reference to Quartz group
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for business queries
CREATE INDEX idx_batch_jobs_business_status ON batch_jobs(business_status);
CREATE INDEX idx_batch_jobs_job_type ON batch_jobs(job_type);
CREATE INDEX idx_batch_jobs_created_at ON batch_jobs(created_at);
```

### Quartz Scheduler Tables (QRTZ_* - Managed by Quartz)

```sql
-- These are auto-created by Quartz when using JDBC job store
-- DO NOT modify these directly for business logic

QRTZ_JOB_DETAILS      -- Job technical details
QRTZ_TRIGGERS         -- Trigger technical state
QRTZ_SIMPLE_TRIGGERS  -- Simple trigger config
QRTZ_CRON_TRIGGERS    -- Cron trigger config
QRTZ_JOB_EXECUTION_LOGS -- Technical execution logs
-- ... and more
```

---

## API Design

### ✅ CORRECT: Expose Business Status

```java
@RestController
@RequestMapping("/api/batch-jobs")
public class BatchJobController {
    
    @GetMapping("/{id}")
    public BatchJobDTO getJob(@PathVariable Long id) {
        BatchJob job = batchJobService.getJob(id);
        return BatchJobDTO.builder()
            .id(job.getId())
            .jobName(job.getJobName())
            .status(job.getBusinessStatus())  // ← Business status
            .recordsProcessed(job.getRecordsProcessed())
            .recordsFailed(job.getRecordsFailed())
            .errorMessage(job.getErrorMessage())
            .build();
    }
    
    @GetMapping("/{id}/details")
    public BatchJobDetailsDTO getJobDetails(@PathVariable Long id) {
        // Include technical details for admin users
        BatchJob job = batchJobService.getJob(id);
        SchedulerStatus quartzStatus = schedulerService.getJobStatus(
            job.getQuartzJobName(),
            job.getQuartzJobGroup()
        );
        
        return BatchJobDetailsDTO.builder()
            .businessStatus(job.getBusinessStatus())
            .schedulerStatus(quartzStatus)  // ← Technical status (admin only)
            .nextFireTime(quartzStatus.getNextFireTime())
            .lastFireTime(quartzStatus.getLastFireTime())
            .build();
    }
}
```

### Response Examples

**Business Status (User-Facing):**
```json
{
  "id": 123,
  "jobName": "daily-order-import",
  "status": "PARTIALLY_COMPLETED",  // ← Business status
  "recordsProcessed": 9500,
  "recordsFailed": 50,
  "errorMessage": "50 records failed validation",
  "startedAt": "2026-05-27T00:00:00Z",
  "endedAt": "2026-05-27T00:45:00Z"
}
```

**Technical Status (Admin/Debug):**
```json
{
  "businessStatus": "PARTIALLY_COMPLETED",
  "schedulerStatus": "COMPLETE",  // ← Quartz technical status
  "nextFireTime": "2026-05-28T00:00:00Z",
  "lastFireTime": "2026-05-27T00:00:00Z",
  "triggerState": "NORMAL",
  "misfireCount": 0
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Using Quartz Status in Business Logic

```java
// WRONG: Domain layer importing Quartz
import org.quartz.Trigger;  // ❌ Don't import in domain!

@Value
public class BatchJob {
    Trigger.TriggerState status;  // ❌ Infrastructure leak!
}
```

**Fix:**
```java
// CORRECT: Domain defines its own status
public enum BatchJobStatus {
    SCHEDULED, PROCESSING, COMPLETED, FAILED, ...
}

@Value
public class BatchJob {
    BatchJobStatus status;  // ✅ Business status
}
```

---

### ❌ Pitfall 2: Not Updating Business Status on Scheduler Events

```java
// WRONG: Relying only on Quartz status
@Component
public class SampleQuartzJob implements Job {
    public void execute(JobExecutionContext context) {
        // Process data...
        // ❌ Never update business database!
    }
}
```

**Fix:**
```java
// CORRECT: Update business status
@Component
@RequiredArgsConstructor
public class SampleQuartzJob implements Job {
    private final BatchJobPort batchJobPort;
    
    public void execute(JobExecutionContext context) {
        try {
            // Update to PROCESSING
            batchJobPort.updateStatus(jobId, BatchJobStatus.PROCESSING);
            
            // Process data...
            
            // Update to COMPLETED
            batchJobPort.updateStatus(jobId, BatchJobStatus.COMPLETED);
            
        } catch (Exception e) {
            // Update to FAILED
            batchJobPort.updateStatus(jobId, BatchJobStatus.FAILED, e.getMessage());
            throw e;
        }
    }
}
```

---

### ❌ Pitfall 3: Exposing Technical Status to End Users

```java
// WRONG: Returning Quartz status in public API
@GetMapping("/{id}")
public Map<String, Object> getJob(@PathVariable Long id) {
    return Map.of(
        "status", "COMPLETE",  // ❌ Quartz status, not business status!
        "triggerState", "NORMAL"
    );
}
```

**Fix:**
```java
// CORRECT: Return business status
@GetMapping("/{id}")
public BatchJobDTO getJob(@PathVariable Long id) {
    BatchJob job = batchJobService.getJob(id);
    return new BatchJobDTO(
        job.getBusinessStatus(),  // ✅ COMPLETED, FAILED, etc.
        job.getRecordsProcessed(),
        job.getErrorMessage()
    );
}
```

---

## Monitoring Strategy

### Business Metrics (Track in Your Application)

```java
// Track business outcomes
@Component
public class BatchMetrics {
    
    private final MeterRegistry meterRegistry;
    
    public void recordJobCompletion(BatchJobStatus status, long duration) {
        meterRegistry.counter("batch.job.completed", 
            "status", status.name(),
            "jobType", jobType
        ).increment();
        
        meterRegistry.timer("batch.job.duration",
            "status", status.name()
        ).record(duration, TimeUnit.MILLISECONDS);
    }
    
    public void recordRecordsProcessed(int success, int failed) {
        meterRegistry.summary("batch.records.processed", 
            "result", "success"
        ).record(success);
        
        meterRegistry.summary("batch.records.processed",
            "result", "failed"
        ).record(failed);
    }
}
```

### Scheduler Metrics (Track via Quartz/Actuator)

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,quartz
  metrics:
    tags:
      application: order-service
```

```bash
# Quartz technical metrics
curl http://localhost:8080/actuator/metrics/quartz.jobs.executed
curl http://localhost:8080/actuator/metrics/quartz.jobs.failed
```

---

## Testing Strategy

### Test Business Status Transitions

```java
@SpringBootTest
class BatchJobStatusTest {
    
    @Autowired
    private BatchJobService batchJobService;
    
    @Test
    void testStatusTransitions() {
        // Given
        BatchJob job = batchJobService.createJob("daily-import");
        assertThat(job.getBusinessStatus()).isEqualTo(BatchJobStatus.SCHEDULED);
        
        // When: Job starts
        batchJobService.startJob(job.getId());
        
        // Then
        BatchJob runningJob = batchJobService.getJob(job.getId());
        assertThat(runningJob.getBusinessStatus()).isEqualTo(BatchJobStatus.PROCESSING);
        
        // When: Job completes
        batchJobService.completeJob(job.getId(), 1000, 0);
        
        // Then
        BatchJob completedJob = batchJobService.getJob(job.getId());
        assertThat(completedJob.getBusinessStatus()).isEqualTo(BatchJobStatus.COMPLETED);
        assertThat(completedJob.getRecordsProcessed()).isEqualTo(1000);
    }
}
```

### Test Scheduler Integration

```java
@SpringBatchTest
class QuartzIntegrationTest {
    
    @Autowired
    private Scheduler scheduler;
    
    @Autowired
    private BatchJobPort batchJobPort;
    
    @Test
    void testSchedulerUpdatesBusinessStatus() throws Exception {
        // Given
        BatchJob job = batchJobPort.createJob("test-job", "TEST");
        
        // When: Trigger job
        JobKey jobKey = new JobKey("test-job", "DEFAULT");
        scheduler.triggerJob(jobKey);
        
        // Wait for execution
        Thread.sleep(2000);
        
        // Then: Business status should be updated
        BatchJob updatedJob = batchJobPort.getJob(job.getId());
        assertThat(updatedJob.getBusinessStatus())
            .isIn(BatchJobStatus.COMPLETED, BatchJobStatus.FAILED);
    }
}
```

---

## Checklist

**Before implementing batch jobs, verify:**

- [ ] Business status enum defined in domain layer (no Quartz imports)
- [ ] Business status stored in application database (not QRTZ_* tables)
- [ ] Scheduler events mapped to business status updates
- [ ] Public APIs expose business status (not Quartz status)
- [ ] Admin APIs can expose both business and technical status
- [ ] Monitoring tracks business outcomes (not just scheduler execution)
- [ ] Tests verify business status transitions
- [ ] Audit trail captures business status changes
- [ ] User dashboards show business-friendly statuses
- [ ] Technical team has access to scheduler metrics for debugging

---

## Summary

| Aspect | Business Status | Scheduler Status |
|--------|----------------|------------------|
| **Layer** | Domain | Infrastructure |
| **Purpose** | Business reporting | Technical execution |
| **Audience** | Business users, auditors | Technical team, admins |
| **Storage** | Application database | QRTZ_* tables |
| **Persistence** | Permanent (audit) | Ephemeral (unless JDBC) |
| **Examples** | COMPLETED, FAILED, PARTIALLY_COMPLETED | NORMAL, PAUSED, COMPLETE, ERROR |
| **Framework** | None (pure Java) | Quartz API |
| **API Exposure** | Public API | Admin/debug API only |

**Golden Rule:** Business status tells you **what happened to the data**. Scheduler status tells you **what the scheduler did**.
