import type { NextFunction, Request, Response } from "express";
import { cacheService } from "../utils/cache.service.js";

export interface CacheMiddlewareOptions {
  ttlSeconds?: number;
  tags?: string[];
  keyGenerator?: (req: Request) => string;
}

/**
 * Generate default cache key based on path, query, and branch header
 */
export const defaultCacheKeyGenerator = (req: Request): string => {
  const branchId = (req.headers["x-branch-id"] as string) || "all";
  const userRole = (req as any).user?.role || "public";
  const queryString = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : "";
  return `api:${req.method}:${req.baseUrl}${req.path}:${queryString}:branch:${branchId}:role:${userRole}`;
};

/**
 * Middleware to cache GET API responses
 */
export const cacheResponse = (options?: CacheMiddlewareOptions) => {
  const ttlSeconds = options?.ttlSeconds ?? 300; // default 5 mins
  const tags = options?.tags ?? [];
  const keyGen = options?.keyGenerator ?? defaultCacheKeyGenerator;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = keyGen(req);
    const cached = cacheService.get<{ statusCode: number; data: unknown }>(key);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.status(cached.statusCode).json(cached.data);
      return;
    }

    res.setHeader("X-Cache", "MISS");

    // Intercept res.json to cache response body
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(
          key,
          {
            statusCode: res.statusCode,
            data: body,
          },
          {
            ttlSeconds,
            tags,
          },
        );
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to automatically invalidate specific cache tags when a modifying request succeeds
 */
export const invalidateCache = (tags: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
      // Invalidate only if response was successful (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.invalidateTags(tags);
      }
    });
    next();
  };
};
