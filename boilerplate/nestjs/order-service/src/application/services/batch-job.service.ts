import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * NestJS batch job demonstration.
 *
 * Maps to Java Spring Batch tasklet and Python Prefect flow.
 * Status lifecycle: SCHEDULED → RUNNING → COMPLETED | FAILED
 *
 * In production, heavy batch work should use BullMQ queues (Redis-backed)
 * so jobs survive process restarts.
 */
interface BatchJobStatus {
  jobId: string;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class BatchJobService {
  private readonly jobs = new Map<string, BatchJobStatus>();

  getStatus(jobId: string): BatchJobStatus | undefined {
    return this.jobs.get(jobId);
  }

  startJob(jobId: string): void {
    this.jobs.set(jobId, {
      jobId,
      status: 'RUNNING',
      recordsProcessed: 0,
      recordsFailed: 0,
      startedAt: new Date(),
    });
  }

  completeJob(jobId: string, processed: number, failed: number): void {
    const j = this.jobs.get(jobId);
    if (!j) return;
    j.status = 'COMPLETED';
    j.recordsProcessed = processed;
    j.recordsFailed = failed;
    j.completedAt = new Date();
  }

  failJob(jobId: string, errorMessage: string): void {
    const j = this.jobs.get(jobId);
    if (!j) return;
    j.status = 'FAILED';
    j.errorMessage = errorMessage;
    j.completedAt = new Date();
  }

  /**
   * Scheduled batch job — runs every hour.
   * Maps to Java @Scheduled / Quartz and Python Prefect @flow.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyCleanup(): Promise<void> {
    const jobId = `cleanup-${Date.now()}`;
    this.startJob(jobId);
    try {
      const processed = await this.simulateCleanup();
      this.completeJob(jobId, processed, 0);
    } catch (e) {
      this.failJob(jobId, (e as Error).message);
    }
  }

  private async simulateCleanup(): Promise<number> {
    // Simulated work; replace with real business logic.
    await new Promise((r) => setTimeout(r, 500));
    return 100;
  }
}
