import { tmdbCache } from './tmdb/cache';
import retryManager from './retry';

// Cache configuration
interface CacheConfig {
  ttl: number;
  maxSize?: number;
  strategy: 'memory' | 'redis' | 'both';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size: number;
}

// In-memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100 * 1024 * 1024; // 100MB default
  private currentSize = 0;

  constructor(maxSize?: number) {
    if (maxSize) {
      this.maxSize = maxSize;
    }
  }

  set<T>(key: string, data: T, ttl: number = 3600): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      size: JSON.stringify(data).length,
    };

    // Check if we need to evict entries
    if (this.currentSize + entry.size > this.maxSize) {
      this.evictEntries();
    }

    this.cache.set(key, entry);
    this.currentSize += entry.size;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    const expiresAt = entry.timestamp + (entry.ttl * 1000);

    if (now > expiresAt) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  private evictEntries(): void {
    // Simple LRU eviction - remove oldest entries first
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp);

    let freedSpace = 0;
    const targetSpace = this.maxSize * 0.8; // Target 80% of max size

    for (const [key, entry] of entries) {
      if (this.currentSize - freedSpace <= targetSpace) {
        break;
      }

      this.cache.delete(key);
      freedSpace += entry.size;
    }

    this.currentSize -= freedSpace;
  }

  getStats(): { entries: number; size: number; maxSize: number } {
    return {
      entries: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
    };
  }
}

// HTTP Response caching
class HTTPResponseCache {
  private cacheName = 'movie-app-http-cache';
  private maxAge = 3600; // 1 hour default

  constructor(maxAge?: number) {
    if (maxAge) {
      this.maxAge = maxAge;
    }
  }

  async set(request: Request, response: Response): Promise<void> {
    if (!('caches' in window)) {
      return; // Service Worker not supported
    }

    try {
      const cache = await caches.open(this.cacheName);

      // Clone response as it can only be consumed once
      const responseToCache = response.clone();

      // Only cache successful GET requests
      if (request.method === 'GET' && response.status === 200) {
        await cache.put(request, responseToCache);
      }
    } catch (error) {
      console.warn('Failed to cache HTTP response:', error);
    }
  }

  async get(request: Request): Promise<Response | null> {
    if (!('caches' in window)) {
      return null; // Service Worker not supported
    }

    try {
      const cache = await caches.open(this.cacheName);
      const cachedResponse = await cache.match(request);

      if (!cachedResponse) {
        return null;
      }

      // Check if cache is still valid
      const date = cachedResponse.headers.get('date');
      if (date) {
        const cacheTime = new Date(date).getTime();
        const now = Date.now();

        if (now - cacheTime > this.maxAge * 1000) {
          await cache.delete(request);
          return null;
        }
      }

      return cachedResponse;
    } catch (error) {
      console.warn('Failed to get cached HTTP response:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open(this.cacheName);
      await cache.keys().then(keys => {
        keys.forEach(key => cache.delete(key));
      });
    } catch (error) {
      console.warn('Failed to clear HTTP cache:', error);
    }
  }
}

// Main caching service
class CacheService {
  private memoryCache: MemoryCache;
  private httpCache: HTTPResponseCache;
  private tmdbCacheAvailable = false;

  constructor() {
    this.memoryCache = new MemoryCache();
    this.httpCache = new HTTPResponseCache();

    // Check if TMDB cache is available
    this.initializeTMDBCache();
  }

  private async initializeTMDBCache(): Promise<void> {
    try {
      this.tmdbCacheAvailable = await tmdbCache.isAvailable();
    } catch {
      this.tmdbCacheAvailable = false;
    }
  }

  // Generic caching with fallback strategy
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try memory cache first
    const memoryData = this.memoryCache.get<T>(key);
    if (memoryData !== null) {
      return memoryData;
    }

    // Try TMDB cache for movie-related data
    if (this.tmdbCacheAvailable && key.startsWith('tmdb:')) {
      try {
        const tmdbData = await tmdbCache.get<T>(key.replace('tmdb:', ''), {});
        if (tmdbData !== null) {
          this.memoryCache.set(key, tmdbData, config.ttl);
          return tmdbData;
        }
      } catch {
        // Fall back to factory
      }
    }

    // Get fresh data
    const freshData = await retryManager.withRetry(
      factory,
      {
        maxAttempts: 3,
        retryCondition: (error) => {
          const message = error.message.toLowerCase();
          return message.includes('network') || message.includes('timeout');
        },
      }
    );

    // Cache the data
    this.memoryCache.set(key, freshData, config.ttl);

    if (this.tmdbCacheAvailable && key.startsWith('tmdb:')) {
      try {
        await tmdbCache.set(key.replace('tmdb:', ''), {}, freshData, { ttl: config.ttl });
      } catch {
        // TMDB cache failed, but we have memory cache
      }
    }

    return freshData;
  }

  // HTTP response caching
  async cacheResponse(request: Request, response: Response): Promise<void> {
    await this.httpCache.set(request, response);
  }

  async getCachedResponse(request: Request): Promise<Response | null> {
    return this.httpCache.get(request);
  }

  // Cache invalidation
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache entries matching pattern
    const keys = Array.from(this.memoryCache['cache'].keys())
      .filter(key => key.includes(pattern));

    keys.forEach(key => this.memoryCache.delete(key));

    // Clear TMDB cache if pattern matches
    if (this.tmdbCacheAvailable && pattern.startsWith('tmdb:')) {
      try {
        await tmdbCache.deleteByEndpoint(pattern.replace('tmdb:', ''));
      } catch {
        // TMDB cache failed, but memory cache is cleared
      }
    }
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    await this.httpCache.clear();

    if (this.tmdbCacheAvailable) {
      try {
        await tmdbCache.clearAll();
      } catch {
        // TMDB cache failed, but other caches are cleared
      }
    }
  }

  // Get cache statistics
  getStats(): {
    memory: { entries: number; size: number; maxSize: number };
    tmdbAvailable: boolean;
  } {
    return {
      memory: this.memoryCache.getStats(),
      tmdbAvailable: this.tmdbCacheAvailable,
    };
  }

  // Specialized caching methods
  async getMovieData<T>(movieId: number, factory: () => Promise<T>): Promise<T> {
    const key = `movie:${movieId}`;
    return this.getOrSet(key, factory, {
      ttl: 3600 * 24, // 24 hours for movie data
      strategy: 'both',
    });
  }

  async getSearchResults<T>(query: string, factory: () => Promise<T>): Promise<T> {
    const key = `search:${query}`;
    return this.getOrSet(key, factory, {
      ttl: 3600 * 6, // 6 hours for search results
      strategy: 'both',
    });
  }

  async getUserData<T>(userId: string, factory: () => Promise<T>): Promise<T> {
    const key = `user:${userId}`;
    return this.getOrSet(key, factory, {
      ttl: 3600, // 1 hour for user data
      strategy: 'memory', // User data should not be cached in Redis for privacy
    });
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Export singleton and classes for testing
export { CacheService, MemoryCache, HTTPResponseCache };
export default cacheService;