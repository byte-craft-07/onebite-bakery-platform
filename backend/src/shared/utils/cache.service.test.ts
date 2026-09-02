import { describe, expect, it, beforeEach } from "vitest";
import { CacheService } from "./cache.service.js";

describe("CacheService", () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({ maxEntries: 10, defaultTtlSeconds: 10 });
  });

  it("should set and retrieve values", () => {
    cache.set("key1", { name: "Chocolate Cake" });
    const result = cache.get<{ name: string }>("key1");
    expect(result).toEqual({ name: "Chocolate Cake" });
  });

  it("should return null for non-existent keys", () => {
    expect(cache.get("non-existent")).toBeNull();
  });

  it("should invalidate keys by tag", () => {
    cache.set("prod:1", { id: 1 }, { tags: ["products"] });
    cache.set("prod:2", { id: 2 }, { tags: ["products"] });
    cache.set("cat:1", { id: 1 }, { tags: ["categories"] });

    expect(cache.get("prod:1")).toEqual({ id: 1 });
    expect(cache.get("prod:2")).toEqual({ id: 2 });
    expect(cache.get("cat:1")).toEqual({ id: 1 });

    const invalidated = cache.invalidateTag("products");
    expect(invalidated).toBe(2);

    expect(cache.get("prod:1")).toBeNull();
    expect(cache.get("prod:2")).toBeNull();
    expect(cache.get("cat:1")).toEqual({ id: 1 });
  });

  it("should invalidate multiple tags", () => {
    cache.set("prod:1", { id: 1 }, { tags: ["products"] });
    cache.set("cat:1", { id: 1 }, { tags: ["categories"] });
    cache.set("banner:1", { id: 1 }, { tags: ["banners"] });

    cache.invalidateTags(["products", "categories"]);

    expect(cache.get("prod:1")).toBeNull();
    expect(cache.get("cat:1")).toBeNull();
    expect(cache.get("banner:1")).toEqual({ id: 1 });
  });

  it("should handle key expiration (TTL)", async () => {
    // TTL of 0.05 seconds (50ms)
    cache.set("quick-key", "value", { ttlSeconds: 0.05 });
    expect(cache.get("quick-key")).toBe("value");

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(cache.get("quick-key")).toBeNull();
  });

  it("should enforce max entries limit via eviction", () => {
    const smallCache = new CacheService({ maxEntries: 3, defaultTtlSeconds: 60 });
    smallCache.set("k1", 1);
    smallCache.set("k2", 2);
    smallCache.set("k3", 3);
    smallCache.set("k4", 4);

    const stats = smallCache.getStats();
    expect(stats.size).toBeLessThanOrEqual(3);
    expect(smallCache.get("k4")).toBe(4);
  });
});
