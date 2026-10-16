/**
 * High-performance Multi-Tier Client Cache & Cookie Utility for Onebite Bakery Platform
 * Combines:
 * 1. Fast In-Memory RAM Cache (instant 0ms)
 * 2. Browser Cache Storage (window.caches - "Cache Memory")
 * 3. LocalStorage & SessionStorage (survives tab/browser reloads)
 * 4. Browser Cookies (onebite_product_cache, onebite_cached_products)
 *
 * Ensures product details and images are NEVER repeatedly fetched from the database.
 */

export interface CacheEntry<T> {
  data: T;
  expiry: number; // timestamp in ms
}

export const cookieUtils = {
  get(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  set(name: string, value: string, maxAgeSeconds: number = 86400 * 7): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
  },
  remove(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
  },
};

const BROWSER_CACHE_NAME = "onebite-product-details-cache";

class ClientCache {
  private memCache = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieve cached data if present and not expired.
   * Checks RAM Memory first, then LocalStorage, then SessionStorage.
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Try memory cache first (instant 0ms)
    const memEntry = this.memCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry) {
      if (memEntry.expiry > now) {
        if (Array.isArray(memEntry.data) && memEntry.data.length === 0) {
          this.memCache.delete(key);
        } else {
          return memEntry.data;
        }
      } else {
        this.memCache.delete(key);
      }
    }

    // 2. Try localStorage persistence (survives browser re-opens)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = localStorage.getItem(`app_cache_${key}`);
        if (item) {
          const parsed = JSON.parse(item) as CacheEntry<T>;
          if (parsed && parsed.expiry > now) {
            if (Array.isArray(parsed.data) && parsed.data.length === 0) {
              localStorage.removeItem(`app_cache_${key}`);
            } else {
              // Restore into memory cache for faster subsequent reads
              this.memCache.set(key, parsed);
              return parsed.data;
            }
          } else {
            localStorage.removeItem(`app_cache_${key}`);
          }
        }
      }
    } catch {
      // localStorage might be full or private browsing restricted
    }

    // 3. Try sessionStorage fallback
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const item = sessionStorage.getItem(`app_cache_${key}`);
        if (item) {
          const parsed = JSON.parse(item) as CacheEntry<T>;
          if (parsed && parsed.expiry > now) {
            if (Array.isArray(parsed.data) && parsed.data.length === 0) {
              sessionStorage.removeItem(`app_cache_${key}`);
            } else {
              this.memCache.set(key, parsed);
              return parsed.data;
            }
          } else {
            sessionStorage.removeItem(`app_cache_${key}`);
          }
        }
      }
    } catch {
      // sessionStorage might be restricted
    }

    return null;
  }

  /**
   * Save data into cache with a Time-To-Live (TTL).
   * Stores across RAM Memory, LocalStorage, Cache Storage, and sets Browser Cookies.
   * @param key Unique cache key
   * @param data Data payload to store
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Never cache empty arrays (prevents persistent empty state lockouts)
    if (Array.isArray(data) && data.length === 0) {
      this.invalidate(key);
      return;
    }

    const expiry = Date.now() + ttlMs;
    const entry: CacheEntry<T> = { data, expiry };

    // 1. Set RAM memory cache
    this.memCache.set(key, entry as CacheEntry<unknown>);

    // 2. Set localStorage for cross-session persistence
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
      }
    } catch {
      // ignore quota exceeded errors
    }

    // 3. Set sessionStorage
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
      }
    } catch {
      // ignore
    }

    // 4. Persist to Browser Cache Storage (Cache Memory API)
    try {
      if (typeof window !== "undefined" && "caches" in window) {
        const url = `/cache-data/${encodeURIComponent(key)}`;
        const response = new Response(JSON.stringify(entry), {
          headers: { "Content-Type": "application/json" },
        });
        caches.open(BROWSER_CACHE_NAME).then((cache) => cache.put(url, response)).catch(() => {});
      }
    } catch {
      // ignore
    }

    // 5. Update browser cookie for tracking cache status & product keys
    try {
      cookieUtils.set("onebite_product_cache", `status=active&ts=${Date.now()}&ttl=${ttlMs}`);
      
      const existingSlugsStr = cookieUtils.get("onebite_cached_products") || "";
      const slugs = existingSlugsStr.split(",").filter(Boolean);
      const cleanKey = key.replace(/^products?_|^product_slug_/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30);
      if (cleanKey && !slugs.includes(cleanKey)) {
        slugs.unshift(cleanKey);
      }
      cookieUtils.set("onebite_cached_products", slugs.slice(0, 8).join(","));
    } catch {
      // ignore
    }
  }

  /**
   * Remove a specific key or all keys matching a prefix.
   */
  invalidate(keyOrPrefix?: string): void {
    if (!keyOrPrefix) {
      this.memCache.clear();
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith("app_cache_")) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
        if (typeof window !== "undefined" && window.sessionStorage) {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k?.startsWith("app_cache_")) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => sessionStorage.removeItem(k));
        }
        if (typeof window !== "undefined" && "caches" in window) {
          caches.delete(BROWSER_CACHE_NAME).catch(() => {});
        }
        cookieUtils.remove("onebite_product_cache");
        cookieUtils.remove("onebite_cached_products");
      } catch {
        // ignore
      }
      return;
    }

    // Invalidate matching prefix in memory
    for (const k of this.memCache.keys()) {
      if (k.startsWith(keyOrPrefix)) {
        this.memCache.delete(k);
      }
    }

    // Invalidate in localStorage
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const prefix = `app_cache_${keyOrPrefix}`;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(prefix) || k === `app_cache_${keyOrPrefix}`) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {
      // ignore
    }

    // Invalidate in sessionStorage
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const prefix = `app_cache_${keyOrPrefix}`;
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k?.startsWith(prefix) || k === `app_cache_${keyOrPrefix}`) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clear all cached entries in memory, storage, and cookies.
   */
  clear(): void {
    this.invalidate();
  }

  /**
   * Helper that checks cache first. If found, returns it immediately.
   * Otherwise runs fetcher, saves result to cache, and returns it.
   */
  async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000,
    forceRefresh: boolean = false
  ): Promise<T> {
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null && cached !== undefined) {
        if (!Array.isArray(cached) || cached.length > 0) {
          return cached;
        }
      }
    }

    const freshData = await fetcher();
    if (freshData !== null && freshData !== undefined) {
      if (!Array.isArray(freshData) || freshData.length > 0) {
        this.set(key, freshData, ttlMs);
      }
    }
    return freshData;
  }

  /**
   * Return metadata report about the current client cache and cookies
   */
  getCacheStats() {
    return {
      memoryEntries: this.memCache.size,
      cookieCacheStatus: cookieUtils.get("onebite_product_cache"),
      cachedProductsCookie: cookieUtils.get("onebite_cached_products"),
    };
  }
}

export const clientCache = new ClientCache();
