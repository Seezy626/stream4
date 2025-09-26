import { Redis } from '@upstash/redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after limit exceeded
  keyPrefix?: string; // Prefix for Redis keys
}

interface RateLimitResult {
  success: boolean;
  remainingRequests: number;
  resetTime: number;
  isBlocked: boolean;
  blockExpiresAt?: number;
}

class RateLimiter {
  private redis: Redis;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    this.config = {
      blockDurationMs: 60000, // 1 minute default block
      keyPrefix: 'ratelimit',
      ...config,
    };
  }

  /**
   * Check rate limit for a given identifier
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Generate keys
    const requestKey = `${this.config.keyPrefix}:${identifier}:requests`;
    const blockKey = `${this.config.keyPrefix}:${identifier}:blocked`;

    try {
      // Check if user is currently blocked
      const blockExpiry = await this.redis.get<number>(blockKey);
      if (blockExpiry && now < blockExpiry) {
        return {
          success: false,
          remainingRequests: 0,
          resetTime: blockExpiry,
          isBlocked: true,
          blockExpiresAt: blockExpiry,
        };
      }

      // Remove expired block if exists
      if (blockExpiry) {
        await this.redis.del(blockKey);
      }

      // Get current request count
      const requests = await this.redis.zcount(requestKey, windowStart, now);

      if (requests >= this.config.maxRequests) {
        // Rate limit exceeded - block the user
        const blockExpiry = now + this.config.blockDurationMs;
        await this.redis.setex(blockKey, Math.ceil(this.config.blockDurationMs / 1000), blockExpiry);

        return {
          success: false,
          remainingRequests: 0,
          resetTime: blockExpiry,
          isBlocked: true,
          blockExpiresAt: blockExpiry,
        };
      }

      // Add current request to the sorted set
      await this.redis.zadd(requestKey, { score: now, value: now.toString() });

      // Set expiry for the request key
      await this.redis.expire(requestKey, Math.ceil(this.config.windowMs / 1000));

      // Clean up old requests (outside the window)
      await this.redis.zremrangebyscore(requestKey, '-inf', windowStart);

      // Calculate remaining requests and reset time
      const remainingRequests = Math.max(0, this.config.maxRequests - requests - 1);
      const resetTime = windowStart + this.config.windowMs;

      return {
        success: true,
        remainingRequests,
        resetTime,
        isBlocked: false,
      };
    } catch (error) {
      console.warn('Rate limiter error:', error);
      // On error, allow the request to proceed
      return {
        success: true,
        remainingRequests: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        isBlocked: false,
      };
    }
  }

  /**
   * Get current rate limit status without consuming a request
   */
  async getStatus(identifier: string): Promise<{
    requestsInWindow: number;
    isBlocked: boolean;
    blockExpiresAt?: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const requestKey = `${this.config.keyPrefix}:${identifier}:requests`;
    const blockKey = `${this.config.keyPrefix}:${identifier}:blocked`;

    try {
      const blockExpiry = await this.redis.get<number>(blockKey);
      const isBlocked = blockExpiry ? now < blockExpiry : false;

      const requestsInWindow = await this.redis.zcount(requestKey, windowStart, now);

      return {
        requestsInWindow,
        isBlocked,
        blockExpiresAt: blockExpiry || undefined,
        resetTime: windowStart + this.config.windowMs,
      };
    } catch (error) {
      console.warn('Rate limiter status error:', error);
      return {
        requestsInWindow: 0,
        isBlocked: false,
        resetTime: now + this.config.windowMs,
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    const requestKey = `${this.config.keyPrefix}:${identifier}:requests`;
    const blockKey = `${this.config.keyPrefix}:${identifier}:blocked`;

    try {
      await Promise.all([
        this.redis.del(requestKey),
        this.redis.del(blockKey),
      ]);
    } catch (error) {
      console.warn('Rate limiter reset error:', error);
    }
  }

  /**
   * Get rate limit configuration
   */
  getConfig(): Required<RateLimitConfig> {
    return { ...this.config };
  }
}

// Pre-configured rate limiters for different use cases
class RateLimitService {
  // General API rate limiter (100 requests per minute)
  private generalApiLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 300000, // 5 minutes block
  });

  // Search API rate limiter (30 requests per minute)
  private searchApiLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 30,
    blockDurationMs: 600000, // 10 minutes block
  });

  // Authentication rate limiter (5 attempts per 5 minutes)
  private authLimiter = new RateLimiter({
    windowMs: 300000, // 5 minutes
    maxRequests: 5,
    blockDurationMs: 900000, // 15 minutes block
  });

  // TMDB API rate limiter (40 requests per 10 seconds - TMDB limit)
  private tmdbLimiter = new RateLimiter({
    windowMs: 10000, // 10 seconds
    maxRequests: 40,
    blockDurationMs: 60000, // 1 minute block
  });

  // File upload rate limiter (10 uploads per hour)
  private uploadLimiter = new RateLimiter({
    windowMs: 3600000, // 1 hour
    maxRequests: 10,
    blockDurationMs: 7200000, // 2 hours block
  });

  /**
   * Check rate limit for general API endpoints
   */
  async checkGeneralApi(identifier: string): Promise<RateLimitResult> {
    return this.generalApiLimiter.check(identifier);
  }

  /**
   * Check rate limit for search endpoints
   */
  async checkSearchApi(identifier: string): Promise<RateLimitResult> {
    return this.searchApiLimiter.check(identifier);
  }

  /**
   * Check rate limit for authentication endpoints
   */
  async checkAuth(identifier: string): Promise<RateLimitResult> {
    return this.authLimiter.check(identifier);
  }

  /**
   * Check rate limit for TMDB API calls
   */
  async checkTMDB(identifier: string): Promise<RateLimitResult> {
    return this.tmdbLimiter.check(identifier);
  }

  /**
   * Check rate limit for file uploads
   */
  async checkUpload(identifier: string): Promise<RateLimitResult> {
    return this.uploadLimiter.check(identifier);
  }

  /**
   * Get status for all rate limiters
   */
  async getAllStatus(identifier: string): Promise<{
    general: Awaited<ReturnType<typeof this.generalApiLimiter.getStatus>>;
    search: Awaited<ReturnType<typeof this.searchApiLimiter.getStatus>>;
    auth: Awaited<ReturnType<typeof this.authLimiter.getStatus>>;
    tmdb: Awaited<ReturnType<typeof this.tmdbLimiter.getStatus>>;
    upload: Awaited<ReturnType<typeof this.uploadLimiter.getStatus>>;
  }> {
    const [general, search, auth, tmdb, upload] = await Promise.all([
      this.generalApiLimiter.getStatus(identifier),
      this.searchApiLimiter.getStatus(identifier),
      this.authLimiter.getStatus(identifier),
      this.tmdbLimiter.getStatus(identifier),
      this.uploadLimiter.getStatus(identifier),
    ]);

    return { general, search, auth, tmdb, upload };
  }

  /**
   * Reset all rate limits for an identifier
   */
  async resetAll(identifier: string): Promise<void> {
    await Promise.all([
      this.generalApiLimiter.reset(identifier),
      this.searchApiLimiter.reset(identifier),
      this.authLimiter.reset(identifier),
      this.tmdbLimiter.reset(identifier),
      this.uploadLimiter.reset(identifier),
    ]);
  }
}

// Create singleton instance
const rateLimitService = new RateLimitService();

// Export singleton and classes for testing
export { RateLimiter, RateLimitService };
export default rateLimitService;