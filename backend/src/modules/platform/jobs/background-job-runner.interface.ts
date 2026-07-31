export interface JobExecutionResult {
  jobId: string;
  status: "queued" | "completed" | "failed";
}

export interface IBackgroundJobRunner {
  readonly runnerName: string;
  registerJob(
    name: string,
    handler: (data: unknown) => Promise<void>,
  ): void;
  runJob(name: string, data: unknown): Promise<JobExecutionResult>;
  getJobStatus(
    jobId: string,
  ): Promise<"queued" | "completed" | "failed" | "not_found">;
}

export class InMemoryBackgroundJobRunner implements IBackgroundJobRunner {
  public readonly runnerName = "IN_MEMORY";

  private readonly handlers = new Map<string, (data: unknown) => Promise<void>>();
  private readonly jobStatuses = new Map<string, "queued" | "completed" | "failed">();

  public registerJob(
    name: string,
    handler: (data: unknown) => Promise<void>,
  ): void {
    this.handlers.set(name, handler);
  }

  public async runJob(name: string, data: unknown): Promise<JobExecutionResult> {
    const handler = this.handlers.get(name);
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!handler) {
      this.jobStatuses.set(jobId, "failed");
      return { jobId, status: "failed" };
    }

    this.jobStatuses.set(jobId, "queued");

    try {
      await handler(data);
      this.jobStatuses.set(jobId, "completed");
      return { jobId, status: "completed" };
    } catch (_err) {
      this.jobStatuses.set(jobId, "failed");
      return { jobId, status: "failed" };
    }
  }

  public async getJobStatus(
    jobId: string,
  ): Promise<"queued" | "completed" | "failed" | "not_found"> {
    return this.jobStatuses.get(jobId) ?? "not_found";
  }
}
