/**
 * High-performance Client Cache Utility for Onebite Bakery Platform
 * Combines Fast In-Memory cache with SessionStorage persistence.
 * Prevents redundant database hits and makes page navigation instantaneous (0ms).
 */

interface CacheEntry<T> {
  data: T;
  expiry: number; // timestamp in ms
}

class ClientCache {
  private memCache = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieve cached data if present and not expired.
   */
  get<T>(key: string): T | null {
    const now = Date.now();

    // 1. Try memory cache first (instant)
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

    // 2. Try sessionStorage fallback
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const item = sessionStorage.getItem(`app_cache_${key}`);
        if (item) {
          const parsed = JSON.parse(item) as CacheEntry<T>;
          if (parsed && parsed.expiry > now) {
            if (Array.isArray(parsed.data) && parsed.data.length === 0) {
              sessionStorage.removeItem(`app_cache_${key}`);
            } else {
              // Restore into memory cache for faster subsequent reads
              this.memCache.set(key, parsed);
              return parsed.data;
            }
          } else {
            sessionStorage.removeItem(`app_cache_${key}`);
          }
        }
      }
    } catch {
      // sessionStorage might be restricted or full, ignore gracefully
    }

    return null;
  }

  /**
   * Save data into cache with a Time-To-Live (TTL).
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

    // Set memory cache
    this.memCache.set(key, entry as CacheEntry<unknown>);

    // Set sessionStorage
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
      }
    } catch {
      // ignore quota exceeded errors
    }
  }

  /**
   * Remove a specific key or all keys matching a prefix.
   */
  invalidate(keyOrPrefix?: string): void {
    if (!keyOrPrefix) {
      this.memCache.clear();
      try {
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
      } catch {
        // ignore
      }
      return;
    }

    // Invalidate matching prefix
    for (const k of this.memCache.keys()) {
      if (k.startsWith(keyOrPrefix)) {
        this.memCache.delete(k);
      }
    }

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
   * Clear all cached entries in memory and sessionStorage.
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
}

export const clientCache = new ClientCache();
