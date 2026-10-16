/**
 * High-performance Image Cache for Onebite Bakery Platform.
 * Stores product images directly into browser Cache Storage (Cache Memory)
 * and in-memory Blob/Object URLs so images load instantaneously (0ms)
 * and never need to be fetched repeatedly from the server or database.
 */

const CACHE_NAME = 'onebite-product-images-cache';

class ImageCache {
  private inMemoryCachedUrls = new Set<string>();
  private activeFetches = new Map<string, Promise<void>>();

  constructor() {
    this.hydrateFromCacheStorage();
  }

  /**
   * Populate in-memory set with keys already present in Cache Storage
   */
  private async hydrateFromCacheStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        keys.forEach((request) => {
          this.inMemoryCachedUrls.add(request.url);
        });
      }
    } catch {
      // Ignore restriction in private browsing or iframe
    }
  }

  /**
   * Check if an image is already saved in Cache Memory
   */
  isCached(url: string): boolean {
    if (!url) return false;
    return this.inMemoryCachedUrls.has(url);
  }

  /**
   * Download and persist an image to Cache Storage (Cache Memory)
   */
  async cacheImage(url: string): Promise<void> {
    if (!url || typeof url !== 'string') return;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg')) {
      return;
    }

    if (this.inMemoryCachedUrls.has(url)) {
      return;
    }

    if (this.activeFetches.has(url)) {
      return this.activeFetches.get(url);
    }

    const fetchPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          const match = await cache.match(url);
          if (match) {
            this.inMemoryCachedUrls.add(url);
            return;
          }

          // Fetch with cors, fallback to default
          let response: Response | null = null;
          try {
            response = await fetch(url, { mode: 'cors', credentials: 'omit' });
          } catch {
            try {
              response = await fetch(url, { mode: 'no-cors' });
            } catch {
              response = null;
            }
          }

          if (response && (response.ok || response.type === 'opaque')) {
            await cache.put(url, response);
            this.inMemoryCachedUrls.add(url);
          }
        }
      } catch {
        // Cache put failed (e.g. storage quota), ignore gracefully
      } finally {
        this.activeFetches.delete(url);
      }
    })();

    this.activeFetches.set(url, fetchPromise);
    return fetchPromise;
  }

  /**
   * Batch pre-cache multiple product image URLs in background
   */
  cacheImages(urls: (string | undefined | null)[]): void {
    if (!urls || !Array.isArray(urls)) return;

    const validUrls = Array.from(new Set(urls.filter((u): u is string => Boolean(u && typeof u === 'string'))));
    
    // Process in background without blocking rendering
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        validUrls.forEach((u) => void this.cacheImage(u));
      });
    } else {
      setTimeout(() => {
        validUrls.forEach((u) => void this.cacheImage(u));
      }, 50);
    }
  }

  /**
   * Retrieve cached image Response as Blob URL for immediate zero-latency display
   */
  async getCachedBlobUrl(url: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(url);
        if (response) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Get total number of cached images in memory
   */
  getCachedCount(): number {
    return this.inMemoryCachedUrls.size;
  }

  /**
   * Clear all cached images from Cache Storage
   */
  async clear(): Promise<void> {
    this.inMemoryCachedUrls.clear();
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        await caches.delete(CACHE_NAME);
      }
    } catch {
      // Ignore
    }
  }
}

export const imageCache = new ImageCache();
