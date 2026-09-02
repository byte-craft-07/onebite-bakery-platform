import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { cacheResponse, invalidateCache } from "./cache.middleware.js";
import { cacheService } from "../utils/cache.service.js";

describe("Cache Middleware", () => {
  beforeEach(() => {
    cacheService.clear();
  });

  it("should pass non-GET requests without caching", () => {
    const req = {
      method: "POST",
      baseUrl: "/api/v1/products",
      path: "/",
      query: {},
      headers: {},
    } as unknown as Request;

    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    const middleware = cacheResponse({ ttlSeconds: 60, tags: ["products"] });
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("should set X-Cache MISS on first GET and cache the response", () => {
    const req = {
      method: "GET",
      baseUrl: "/api/v1/products",
      path: "/",
      query: {},
      headers: { "x-branch-id": "branch-123" },
    } as unknown as Request;

    let interceptedJson: (body: unknown) => Response;
    const originalJson = vi.fn();

    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      json: originalJson,
    } as unknown as Response;

    const next = vi.fn();

    const middleware = cacheResponse({ ttlSeconds: 60, tags: ["products"] });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("X-Cache", "MISS");
    expect(next).toHaveBeenCalledTimes(1);

    // Simulate route sending json
    res.json({ products: [{ id: "1", name: "Red Velvet" }] });

    // Now second request should HIT
    const res2 = {
      statusCode: 200,
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next2 = vi.fn();

    middleware(req, res2, next2);

    expect(res2.setHeader).toHaveBeenCalledWith("X-Cache", "HIT");
    expect(res2.json).toHaveBeenCalledWith({ products: [{ id: "1", name: "Red Velvet" }] });
  });

  it("should invalidate cache when invalidateCache middleware triggers on successful finish", () => {
    // Populate cache first
    cacheService.set("test-key", { data: 123 }, { tags: ["products"] });
    expect(cacheService.get("test-key")).toEqual({ data: 123 });

    let finishCallback: () => void = () => {};
    const res = {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "finish") finishCallback = cb;
      }),
    } as unknown as Response;

    const req = {} as Request;
    const next = vi.fn();

    const middleware = invalidateCache(["products"]);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    // Trigger finish
    finishCallback();

    // Key should be invalidated
    expect(cacheService.get("test-key")).toBeNull();
  });
});
