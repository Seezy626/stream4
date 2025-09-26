import { TMDBConfig, TMDBError, TMDBApiError, TMDBRateLimitError } from '@/types/tmdb';

class TMDBClient {
  protected config: TMDBConfig;
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitRemaining = 40; // TMDB allows 40 requests per 10 seconds
  private rateLimitResetTime = 0;

  constructor() {
    this.config = {
      apiKey: process.env.TMDB_API_KEY || '',
      baseUrl: 'https://api.themoviedb.org/3',
      imageBaseUrl: 'https://image.tmdb.org/t/p',
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000, // 1 second base delay
    };

    if (!this.config.apiKey) {
      throw new Error('TMDB_API_KEY environment variable is required');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Reset rate limit window if needed
    if (now > this.rateLimitResetTime) {
      this.rateLimitRemaining = 40;
      this.rateLimitResetTime = now + 10000; // 10 seconds from now
    }

    // If we're out of requests, wait for the reset
    if (this.rateLimitRemaining <= 0) {
      const waitTime = this.rateLimitResetTime - now;
      if (waitTime > 0) {
        await this.delay(waitTime);
        this.rateLimitRemaining = 40;
        this.rateLimitResetTime = now + 10000;
      }
    }

    // Enforce minimum delay between requests (250ms)
    if (timeSinceLastRequest < 250) {
      await this.delay(250 - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.rateLimitRemaining--;
  }

  private buildUrl(endpoint: string, params: Record<string, unknown> = {}): string {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.config.apiKey);

    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    options: RequestInit = {}
  ): Promise<T> {
    await this.enforceRateLimit();

    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MovieApp/1.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        throw new TMDBRateLimitError('Rate limit exceeded');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData: TMDBError = await response.json().catch(() => ({
          status_message: response.statusText,
          status_code: response.status,
          success: false,
        }));

        throw new TMDBApiError(errorData.status_message);
      }

      // Handle successful responses
      const data = await response.json();

      // Update rate limit info from headers
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');

      if (remaining) {
        this.rateLimitRemaining = parseInt(remaining);
      }

      if (reset) {
        this.rateLimitResetTime = parseInt(reset) * 1000;
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TMDBRateLimitError || error instanceof TMDBApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TMDBApiError('Request timeout');
        }
        throw new TMDBApiError(`Network error: ${error.message}`);
      }

      throw new TMDBApiError('Unknown error occurred');
    }
  }

  async get<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, params, { method: 'GET' });
  }

  async post<T>(endpoint: string, params: Record<string, unknown> = {}, body?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, params, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Configuration methods
  getConfig(): TMDBConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TMDBConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Rate limit status
  getRateLimitStatus(): {
    remaining: number;
    resetTime: number;
    totalRequests: number;
  } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitResetTime,
      totalRequests: this.requestCount,
    };
  }
}

// Export singleton instance
export const tmdbClient = new TMDBClient();

// Export class for testing or multiple instances
export { TMDBClient };

// Export error classes for external use
export { TMDBApiError, TMDBRateLimitError };