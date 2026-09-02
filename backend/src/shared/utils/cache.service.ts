export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
}

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number | null; // null for no expiration
  tags: string[];
  lastAccessed: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private tagToKeys = new Map<string, Set<string>>();
  private maxEntries: number;
  private defaultTtlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(options?: { maxEntries?: number; defaultTtlSeconds?: number }) {
    this.maxEntries = options?.maxEntries ?? 2000;
    this.defaultTtlMs = (options?.defaultTtlSeconds ?? 300) * 1000; // default 5 minutes
  }

  /**
   * Set a key-value pair in cache with optional TTL and tags
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    this.evictIfFull();

    const ttlMs = options?.ttlSeconds !== undefined ? options.ttlSeconds * 1000 : this.defaultTtlMs;
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;
    const tags = options?.tags ?? [];

    // If key already exists, clean old tags
    this.removeKeyFromTags(key);

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      tags,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry as CacheEntry);

    // Register tags
    for (const tag of tags) {
      if (!this.tagToKeys.has(tag)) {
        this.tagToKeys.set(tag, new Set());
      }
      this.tagToKeys.get(tag)!.add(key);
    }
  }

  /**
   * Get a value from cache. Returns null if expired or not found.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    this.hits++;
    return entry.value as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    this.removeKeyFromTags(key);
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys associated with a specific tag
   */
  invalidateTag(tag: string): number {
    const keys = this.tagToKeys.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    for (const key of Array.from(keys)) {
      this.cache.delete(key);
      count++;
    }
    this.tagToKeys.delete(tag);
    return count;
  }

  /**
   * Invalidate multiple tags
   */
  invalidateTags(tags: string[]): number {
    let count = 0;
    for (const tag of tags) {
      count += this.invalidateTag(tag);
    }
    return count;
  }

  /**
   * Invalidate keys starting with a prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.tagToKeys.clear();
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : "0.00",
      registeredTags: Array.from(this.tagToKeys.keys()),
    };
  }

  private removeKeyFromTags(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    for (const tag of entry.tags) {
      const keys = this.tagToKeys.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagToKeys.delete(tag);
        }
      }
    }
  }

  private evictIfFull(): void {
    if (this.cache.size < this.maxEntries) return;

    // First, evict expired keys
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.delete(key);
      }
    }

    // If still full, evict least recently accessed (LRU)
    if (this.cache.size >= this.maxEntries) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.delete(oldestKey);
      }
    }
  }
}

export const cacheService = new CacheService({
  maxEntries: 2000,
  defaultTtlSeconds: 300, // 5 minutes
});
