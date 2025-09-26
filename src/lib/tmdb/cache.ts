import { Redis } from '@upstash/redis';
import { TMDBCacheEntry, TMDBCacheOptions } from '@/types/tmdb';

class TMDBCache {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour default TTL

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  /**
   * Generate cache key for TMDB data
   */
  private generateCacheKey(endpoint: string, params: Record<string, unknown> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, unknown>);

    const paramString = JSON.stringify(sortedParams);
    return `tmdb:${endpoint}:${paramString}`;
  }

  /**
   * Set cache entry with TTL
   */
  async set<T>(
    endpoint: string,
    params: Record<string, unknown>,
    data: T,
    options: TMDBCacheOptions = {}
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const ttl = options.ttl || this.defaultTTL;

    const cacheEntry: TMDBCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache TMDB data:', error);
      // Don't throw error - caching is optional
    }
  }

  /**
   * Get cache entry
   */
  async get<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<T | null> {
    const cacheKey = this.generateCacheKey(endpoint, params);

    try {
      const cachedData = await this.redis.get<string>(cacheKey);

      if (!cachedData) {
        return null;
      }

      const cacheEntry: TMDBCacheEntry<T> = JSON.parse(cachedData);

      // Check if cache entry has expired
      const now = Date.now();
      const expiresAt = cacheEntry.timestamp + (cacheEntry.ttl * 1000);

      if (now > expiresAt) {
        // Cache expired, remove it
        await this.redis.del(cacheKey);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached TMDB data:', error);
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(endpoint: string, params: Record<string, unknown> = {}): Promise<void> {
    const cacheKey = this.generateCacheKey(endpoint, params);

    try {
      await this.redis.del(cacheKey);
    } catch (error) {
      console.warn('Failed to delete cached TMDB data:', error);
    }
  }

  /**
   * Delete all cache entries for a specific endpoint
   */
  async deleteByEndpoint(endpoint: string): Promise<void> {
    try {
      const pattern = `tmdb:${endpoint}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Failed to delete cached TMDB data by endpoint:', error);
    }
  }

  /**
   * Delete all TMDB cache entries
   */
  async clearAll(): Promise<void> {
    try {
      const pattern = 'tmdb:*';
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Failed to clear TMDB cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage?: number;
  }> {
    try {
      const pattern = 'tmdb:*';
      const keys = await this.redis.keys(pattern);

      return {
        totalKeys: keys.length,
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { totalKeys: 0 };
    }
  }

  /**
   * Check if cache is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get or set cache with factory function
   */
  async getOrSet<T>(
    endpoint: string,
    params: Record<string, unknown>,
    factory: () => Promise<T>,
    options: TMDBCacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cachedData = await this.get<T>(endpoint, params);

    if (cachedData !== null) {
      return cachedData;
    }

    // Cache miss - get fresh data
    const freshData = await factory();

    // Cache the fresh data
    await this.set(endpoint, params, freshData, options);

    return freshData;
  }

  /**
   * Invalidate cache for specific movie
   */
  async invalidateMovie(movieId: number): Promise<void> {
    const endpoints = [
      `/movie/${movieId}`,
      `/movie/${movieId}/credits`,
      `/movie/${movieId}/images`,
      `/movie/${movieId}/videos`,
      `/movie/${movieId}/reviews`,
      `/movie/${movieId}/similar`,
      `/movie/${movieId}/recommendations`,
    ];

    await Promise.all(
      endpoints.map(endpoint => this.deleteByEndpoint(endpoint))
    );
  }

  /**
   * Invalidate cache for specific TV show
   */
  async invalidateTVShow(tvId: number): Promise<void> {
    const endpoints = [
      `/tv/${tvId}`,
      `/tv/${tvId}/credits`,
      `/tv/${tvId}/images`,
      `/tv/${tvId}/videos`,
      `/tv/${tvId}/similar`,
      `/tv/${tvId}/recommendations`,
    ];

    await Promise.all(
      endpoints.map(endpoint => this.deleteByEndpoint(endpoint))
    );
  }

  /**
   * Invalidate cache for search queries
   */
  async invalidateSearch(query: string): Promise<void> {
    const searchEndpoints = [
      '/search/multi',
      '/search/movie',
      '/search/tv',
      '/search/person',
    ];

    await Promise.all(
      searchEndpoints.map(endpoint => this.delete(endpoint, { query }))
    );
  }

  /**
   * Invalidate cache for trending content
   */
  async invalidateTrending(): Promise<void> {
    const trendingEndpoints = [
      '/trending/movie/week',
      '/trending/movie/day',
      '/trending/tv/week',
      '/trending/tv/day',
    ];

    await Promise.all(
      trendingEndpoints.map(endpoint => this.deleteByEndpoint(endpoint))
    );
  }

  /**
   * Invalidate cache for popular content
   */
  async invalidatePopular(): Promise<void> {
    const popularEndpoints = [
      '/movie/popular',
      '/tv/popular',
    ];

    await Promise.all(
      popularEndpoints.map(endpoint => this.deleteByEndpoint(endpoint))
    );
  }

  /**
   * Invalidate cache for top rated content
   */
  async invalidateTopRated(): Promise<void> {
    const topRatedEndpoints = [
      '/movie/top_rated',
      '/tv/top_rated',
    ];

    await Promise.all(
      topRatedEndpoints.map(endpoint => this.deleteByEndpoint(endpoint))
    );
  }

  /**
   * Set custom TTL for cache entries
   */
  updateDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Get current default TTL
   */
  getDefaultTTL(): number {
    return this.defaultTTL;
  }
}

// Export singleton instance
export const tmdbCache = new TMDBCache();

// Export class for testing or multiple instances
export { TMDBCache };