export interface HealthStatusResponse {
  status: "ok" | "unhealthy" | "healthy";
  database: "connected" | "disconnected";
  environment: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface PlatformMetricsResponse {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  databaseLatencyMs: number;
  apiUptimeSeconds: number;
  memoryUsage: NodeJS.MemoryUsage;
  nodeVersion: string;
  environment: string;
}
