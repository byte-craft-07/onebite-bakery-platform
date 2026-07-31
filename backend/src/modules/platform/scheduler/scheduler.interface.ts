export interface ScheduledJobInfo {
  scheduleId: string;
  name: string;
  cronExpression: string;
}

export interface IScheduler {
  readonly schedulerName: string;
  scheduleJob(
    name: string,
    cronExpression: string,
    handler: () => Promise<void>,
  ): { scheduleId: string };
  cancelJob(scheduleId: string): boolean;
  getScheduledJobs(): ScheduledJobInfo[];
}

export class InMemoryScheduler implements IScheduler {
  public readonly schedulerName = "IN_MEMORY";

  private readonly jobs = new Map<string, ScheduledJobInfo & { handler: () => Promise<void> }>();

  public scheduleJob(
    name: string,
    cronExpression: string,
    handler: () => Promise<void>,
  ): { scheduleId: string } {
    const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.jobs.set(scheduleId, { scheduleId, name, cronExpression, handler });
    return { scheduleId };
  }

  public cancelJob(scheduleId: string): boolean {
    return this.jobs.delete(scheduleId);
  }

  public getScheduledJobs(): ScheduledJobInfo[] {
    return Array.from(this.jobs.values()).map(({ scheduleId, name, cronExpression }) => ({
      scheduleId,
      name,
      cronExpression,
    }));
  }
}
