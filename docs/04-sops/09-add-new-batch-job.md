---
name: "SOP: Add New Batch Job"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture_team"
---

# SOP: Add New Batch Job

## Trigger

Adding a new scheduled background job for batch processing (e.g., daily report generation, periodic data cleanup, scheduled notifications).

## Files & Locations

### Backend (Java/Spring Boot with Quartz)

| File | Path | Purpose |
|------|------|---------|
| Job Class | `src/main/java/.../infrastructure/batch/{Name}Job.java` | Quartz job implementation |
| Job Configuration | `src/main/java/.../infrastructure/batch/{Name}JobConfig.java` | Quartz configuration |
| Use Case | `src/main/java/.../application/usecases/{Name}UseCase.java` | Business logic |
| Properties | `src/main/resources/application.yml` | Cron schedule config |
| Integration Test | `src/test/java/.../infrastructure/batch/{Name}JobTest.java` | Job tests |

### Backend (Python/FastAPI with APScheduler)

| File | Path | Purpose |
|------|------|---------|
| Job Function | `src/infrastructure/batch/{name}_job.py` | Scheduled function |
| Scheduler Config | `src/infrastructure/scheduler.py` | APScheduler setup |
| Use Case | `src/application/usecases/{name}_use_case.py` | Business logic |
| Environment | `.env` | Cron schedule config |
| Integration Test | `tests/integration/test_{name}_job.py` | Job tests |

## Procedure

### 1. Create Use Case (Business Logic)

```java
// src/main/java/com/example/orderservice/application/usecases/GenerateDailyReportUseCase.java
package com.example.orderservice.application.usecases;

public interface GenerateDailyReportUseCase {
    void execute();
}
```

```java
// src/main/java/com/example/orderservice/application/usecases/GenerateDailyReportUseCaseImpl.java
package com.example.orderservice.application.usecases;

import com.example.orderservice.domain.ports.OrderRepository;
import com.example.orderservice.domain.ports.ReportGenerator;
import com.example.orderservice.domain.ports.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenerateDailyReportUseCaseImpl implements GenerateDailyReportUseCase {
    private final OrderRepository orderRepository;
    private final ReportGenerator reportGenerator;
    private final NotificationService notificationService;

    @Override
    public void execute() {
        log.info("Starting daily report generation");

        // 1. Fetch data
        LocalDate yesterday = LocalDate.now().minusDays(1);
        int totalOrders = orderRepository.countByDate(yesterday);
        double totalRevenue = orderRepository.sumRevenueByDate(yesterday);

        // 2. Generate report
        String reportPath = reportGenerator.generateDailyReport(
            yesterday,
            totalOrders,
            totalRevenue
        );

        // 3. Send notification
        notificationService.sendEmail(
            "admin@example.com",
            "Daily Report - " + yesterday,
            "Please find attached: " + reportPath
        );

        log.info("Daily report generated successfully: {}", reportPath);
    }
}
```

### 2. Create Quartz Job (Java)

```java
// src/main/java/com/example/orderservice/infrastructure/batch/GenerateDailyReportJob.java
package com.example.orderservice.infrastructure.batch;

import com.example.orderservice.application.usecases.GenerateDailyReportUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class GenerateDailyReportJob extends QuartzJobBean {

    private final GenerateDailyReportUseCase generateDailyReportUseCase;

    @Override
    protected void executeInternal(JobExecutionContext context) {
        log.info("Executing GenerateDailyReportJob at {}", LocalDateTime.now());

        try {
            generateDailyReportUseCase.execute();
            log.info("GenerateDailyReportJob completed successfully");
        } catch (Exception e) {
            log.error("GenerateDailyReportJob failed", e);
            throw new JobExecutionException("Failed to generate daily report", e);
        }
    }
}
```

### 3. Create Job Configuration (Java/Quartz)

```java
// src/main/java/com/example/orderservice/infrastructure/batch/JobConfig.java
package com.example.orderservice.infrastructure.batch;

import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JobConfig {

    /**
     * Daily report job - runs every day at 2:00 AM UTC.
     * Cron format: seconds minutes hours day month weekday
     */
    @Bean
    public JobDetail generateDailyReportJobDetail() {
        return JobBuilder.newJob(GenerateDailyReportJob.class)
            .withIdentity("generateDailyReportJob")
            .withDescription("Generates daily order report")
            .storeDurably()
            .build();
    }

    @Bean
    public Trigger generateDailyReportJobTrigger() {
        // Cron: 0 0 2 * * ? = Every day at 2:00 AM
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder
            .cronSchedule("0 0 2 * * ?");

        return TriggerBuilder.newTrigger()
            .forJob(generateDailyReportJobDetail())
            .withIdentity("generateDailyReportTrigger")
            .withDescription("Daily at 2:00 AM UTC")
            .withSchedule(scheduleBuilder)
            .build();
    }
}
```

### 4. Configure Cron Schedule (application.yml)

```yaml
# src/main/resources/application.yml
spring:
  quartz:
    job-store-type: jdbc
    jdbc:
      initialize-schema: always
    properties:
      org.quartz.scheduler.instanceName: order-service-scheduler
      org.quartz.threadPool.threadCount: 5

# Custom cron schedules (externalize to environment)
jobs:
  generate-daily-report:
    cron: "0 0 2 * * ?"  # Daily at 2:00 AM
    enabled: true
  
  cleanup-expired-sessions:
    cron: "0 0 3 * * ?"  # Daily at 3:00 AM
    enabled: true
  
  sync-inventory:
    cron: "0 */30 * * * ?"  # Every 30 minutes
    enabled: true
```

### 5. Create Integration Test

```java
// src/test/java/com/example/orderservice/infrastructure/batch/GenerateDailyReportJobTest.java
package com.example.orderservice.infrastructure.batch;

import com.example.orderservice.application.usecases.GenerateDailyReportUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.mockito.Mockito.*;

@SpringBootTest
class GenerateDailyReportJobTest {

    @Autowired
    private GenerateDailyReportJob job;

    @MockBean
    private GenerateDailyReportUseCase useCase;

    @Test
    void shouldExecuteJobSuccessfully() throws Exception {
        // Arrange
        JobExecutionContext context = mock(JobExecutionContext.class);

        // Act
        job.executeInternal(context);

        // Assert
        verify(useCase, times(1)).execute();
    }

    @Test
    void shouldHandleJobExecutionFailure() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Test failure"))
            .when(useCase).execute();
        JobExecutionContext context = mock(JobExecutionContext.class);

        // Act & Assert
        assertThrows(JobExecutionException.class, () -> job.executeInternal(context));
    }
}
```

### 6. Python Example (APScheduler)

```python
# src/infrastructure/batch/generate_daily_report_job.py
from datetime import datetime
import logging

from application.usecases.generate_daily_report_use_case import GenerateDailyReportUseCase

logger = logging.getLogger(__name__)


async def generate_daily_report_job(use_case: GenerateDailyReportUseCase) -> None:
    """
    Scheduled job: Generate daily order report.
    Runs every day at 2:00 AM UTC.
    """
    logger.info(f"Starting daily report generation at {datetime.utcnow()}")

    try:
        await use_case.execute()
        logger.info("Daily report generated successfully")
    except Exception as e:
        logger.error(f"Failed to generate daily report: {e}", exc_info=True)
        raise
```

```python
# src/infrastructure/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager

from infrastructure.batch.generate_daily_report_job import generate_daily_report_job
from application.usecases.generate_daily_report_use_case import GenerateDailyReportUseCase


def setup_scheduler(use_case: GenerateDailyReportUseCase) -> AsyncIOScheduler:
    """Configure and return APScheduler with all jobs."""
    scheduler = AsyncIOScheduler()

    # Daily report job - runs at 2:00 AM UTC every day
    scheduler.add_job(
        generate_daily_report_job,
        trigger=CronTrigger(hour=2, minute=0, timezone='UTC'),
        args=[use_case],
        id='generate_daily_report',
        name='Generate Daily Report',
        replace_existing=True
    )

    # Cleanup job - runs at 3:00 AM UTC every day
    # scheduler.add_job(
    #     cleanup_expired_sessions_job,
    #     trigger=CronTrigger(hour=3, minute=0, timezone='UTC'),
    #     id='cleanup_sessions',
    #     name='Cleanup Expired Sessions',
    #     replace_existing=True
    # )

    return scheduler
```

## Cron Format Reference

**Quartz (Java) - 6 fields:**
```
seconds minutes hours day month weekday
  0       0       2     *   *     ?     = Daily at 2:00 AM
  0       30      *     *   *     ?     = Every 30 minutes
  0       0       9     *   *     MON   = Every Monday at 9:00 AM
  0       0       0     1   *     ?     = First day of month at midnight
```

**APScheduler (Python) - keyword args:**
```python
CronTrigger(hour=2, minute=0)           # Daily at 2:00 AM
CronTrigger(minute='*/30')              # Every 30 minutes
CronTrigger(hour=9, day_of_week='mon')  # Every Monday at 9:00 AM
CronTrigger(day=1, hour=0)              # First day of month at midnight
```

## Verification Steps

1. **Build backend**: `./mvnw clean compile -f services/order-service/pom.xml`
2. **Run job tests**: `./mvnw test -Dtest=GenerateDailyReportJobTest -f services/order-service/pom.xml`
3. **Verify scheduler startup**: Check logs for "Scheduler started" message
4. **Test manual execution**: Call use case directly from test
5. **Monitor job execution**: Check Quartz database tables (QRTZ_*)

## Notes

- **Idempotency**: Batch jobs must be safe to retry
- **Transaction Management**: Use `@Transactional` for database operations
- **Error Handling**: Log failures and consider retry mechanisms
- **Monitoring**: Add metrics/health checks for job execution
- **Configuration**: Externalize cron schedules to environment variables
- **Timezones**: Always use UTC for cron schedules
- **Concurrency**: Configure thread pool size based on job requirements

## Common Cron Patterns

| Description | Quartz Cron | APScheduler |
|-------------|-------------|-------------|
| Every minute | `0 * * * * ?` | `minute='*'` |
| Every 5 minutes | `0 */5 * * * ?` | `minute='*/5'` |
| Every hour | `0 0 * * * ?` | `minute=0` |
| Daily at midnight | `0 0 0 * * ?` | `hour=0, minute=0` |
| Daily at 2:30 AM | `0 30 2 * * ?` | `hour=2, minute=30` |
| Every Monday 9 AM | `0 0 9 ? * MON` | `hour=9, day_of_week='mon'` |
| First of month | `0 0 0 1 * ?` | `day=1, hour=0` |
| Every weekday 8 AM | `0 0 8 ? * MON-FRI` | `hour=8, day_of_week='mon-fri'` |

## Related SOPs

- SOP-02: [Add New REST Endpoint](02-add-new-rest-endpoint.md)
- SOP-07: [Add New Use Case](07-add-new-use-case.md)
- SOP-09: [Add New External Service Integration](06-configure-external-service.md)
