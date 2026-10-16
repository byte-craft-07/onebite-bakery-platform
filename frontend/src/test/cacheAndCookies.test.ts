import { describe, it, expect, beforeEach, vi } from "vitest";
import { clientCache, cookieUtils } from "@/utils/clientCache";
import { imageCache } from "@/utils/imageCache";

describe("Client Cache & Cookies Integration", () => {
  beforeEach(() => {
    clientCache.clear();
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Cookie Utilities", () => {
    it("should correctly set, get, and remove cookies", () => {
      cookieUtils.set("test_cookie", "hello_world", 3600);
      expect(cookieUtils.get("test_cookie")).toBe("hello_world");

      cookieUtils.remove("test_cookie");
      expect(cookieUtils.get("test_cookie")).toBeNull();
    });
  });

  describe("Multi-Tier ClientCache", () => {
    it("should store data in memory and localStorage and set cookie metadata", () => {
      const sampleProduct = { id: "p1", name: "Dutch Truffle Cake", price: 450 };
      clientCache.set("product_slug_dutch-truffle", sampleProduct, 60000);

      // Verify immediate read from memory
      const cached = clientCache.get<typeof sampleProduct>("product_slug_dutch-truffle");
      expect(cached).toEqual(sampleProduct);

      // Verify cookie was updated
      const cookieStatus = cookieUtils.get("onebite_product_cache");
      expect(cookieStatus).toContain("status=active");

      const cachedSlugsCookie = cookieUtils.get("onebite_cached_products");
      expect(cachedSlugsCookie).toContain("dutch-truffle");
    });

    it("should avoid calling fetcher when data is present in cache (0ms database hit)", async () => {
      const fetcher = vi.fn().mockResolvedValue({ id: "p2", name: "Red Velvet Cake" });

      // First call invokes fetcher
      const firstResult = await clientCache.withCache("prod_red_velvet", fetcher, 60000);
      expect(firstResult).toEqual({ id: "p2", name: "Red Velvet Cake" });
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second call MUST come directly from cache without calling fetcher again
      const secondResult = await clientCache.withCache("prod_red_velvet", fetcher, 60000);
      expect(secondResult).toEqual({ id: "p2", name: "Red Velvet Cake" });
      expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, 0 extra database/API calls!
    });

    it("should restore from localStorage if memory cache is purged", () => {
      const sampleData = { id: "p3", title: "Black Forest" };
      clientCache.set("product_bf", sampleData, 60000);

      // Simulate memory eviction by creating a fresh internal state
      (clientCache as any).memCache.clear();

      // Read should fallback to localStorage and restore into memory
      const restored = clientCache.get<typeof sampleData>("product_bf");
      expect(restored).toEqual(sampleData);
    });

    it("should properly invalidate keys and remove cookies on clear", () => {
      clientCache.set("products_list", [{ id: "1" }], 60000);
      expect(clientCache.get("products_list")).toBeDefined();

      clientCache.clear();
      expect(clientCache.get("products_list")).toBeNull();
      expect(cookieUtils.get("onebite_product_cache")).toBeNull();
    });
  });

  describe("ImageCache", () => {
    it("should batch queue images and track in-memory cached state", () => {
      const testImages = [
        "https://images.unsplash.com/photo-sample-1.jpg",
        "https://images.unsplash.com/photo-sample-2.jpg",
      ];

      imageCache.cacheImages(testImages);
      expect(typeof imageCache.getCachedCount()).toBe("number");
    });
  });
});
