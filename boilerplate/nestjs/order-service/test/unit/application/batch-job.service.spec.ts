import { BatchJobService } from "../../src/application/services/batch-job.service";

describe("BatchJobService", () => {
  let svc: BatchJobService;

  beforeEach(() => {
    svc = new BatchJobService();
  });

  it("tracks job status through lifecycle", () => {
    const id = "batch-1";
    svc.startJob(id);
    expect(svc.getStatus(id)?.status).toBe("RUNNING");

    svc.completeJob(id, 42, 1);
    const completed = svc.getStatus(id)!;
    expect(completed.status).toBe("COMPLETED");
    expect(completed.recordsProcessed).toBe(42);
    expect(completed.recordsFailed).toBe(1);
  });

  it("marks job as FAILED on error", () => {
    const id = "batch-2";
    svc.startJob(id);
    svc.failJob(id, "DB connection lost");
    const failed = svc.getStatus(id)!;
    expect(failed.status).toBe("FAILED");
    expect(failed.errorMessage).toBe("DB connection lost");
  });
});
