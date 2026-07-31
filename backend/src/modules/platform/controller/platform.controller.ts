import type { Request, Response } from "express";

import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { QueryPlatformLogsDto } from "../dto/index.js";
import type { PlatformService } from "../service/index.js";

export class PlatformController {
  public constructor(private readonly platformService: PlatformService) {}

  public getHealth = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const health = await this.platformService.getHealth();

    return sendSuccess(response, {
      message: "Health check completed.",
      data: health,
    });
  };

  public getLiveness = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const live = this.platformService.getLiveness();

    return sendSuccess(response, {
      message: "Liveness probe passed.",
      data: live,
    });
  };

  public getReadiness = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const ready = this.platformService.getReadiness();

    return sendSuccess(response, {
      message: "Readiness probe completed.",
      data: ready,
    });
  };

  public getMetrics = async (
    _request: Request,
    response: Response,
  ): Promise<Response> => {
    const metrics = await this.platformService.getMetrics();

    return sendSuccess(response, {
      message: "Platform metrics retrieved successfully.",
      data: metrics,
    });
  };

  public getAuditLogs = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.platformService.getAuditLogs(
      request.query as unknown as QueryPlatformLogsDto,
    );

    return sendSuccess(response, {
      message: "Audit logs retrieved successfully.",
      data: result,
    });
  };

  public getActivityLogs = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const result = await this.platformService.getActivityLogs(
      request.query as unknown as QueryPlatformLogsDto,
    );

    return sendSuccess(response, {
      message: "Activity logs retrieved successfully.",
      data: result,
    });
  };
}
