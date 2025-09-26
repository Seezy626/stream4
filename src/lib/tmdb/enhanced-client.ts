import { TMDBClient, TMDBApiError, TMDBRateLimitError } from './client';
import { TMDBCache } from './cache';
import { TMDBErrorHandler, TMDBRetry, TMDBValidator } from './errors';
import { TMDBCacheOptions } from '@/types/tmdb';

class TMDBEnhancedClient extends TMDBClient {
  private cache: TMDBCache;

  constructor() {
    super();
    this.cache = new TMDBCache();
  }

  /**
   * Enhanced GET request with caching and retry logic
   */
  async getWithCache<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    options: {
      cacheOptions?: TMDBCacheOptions;
      useCache?: boolean;
      validateParams?: boolean;
    } = {}
  ): Promise<T> {
    const { cacheOptions = {}, useCache = true, validateParams = true } = options;

    // Validate parameters if requested
    if (validateParams) {
      params = TMDBValidator.sanitizeSearchParams(params);
    }

    // Try cache first if caching is enabled
    if (useCache) {
      const cachedData = await this.cache.get<T>(endpoint, params);
      if (cachedData !== null) {
        return cachedData;
      }
    }

    // Execute request with retry logic
    const data = await TMDBRetry.withRateLimitRetry(async () => {
      try {
        return await this.get<T>(endpoint, params);
      } catch (error) {
        TMDBErrorHandler.logError(error, { endpoint, params });
        TMDBErrorHandler.handleAPIError(error);
        throw error; // This should never be reached
      }
    }, {
      maxAttempts: this.config.retries,
      onRateLimit: (retryAfter) => {
        console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
      },
    });

    // Cache the result if caching is enabled
    if (useCache) {
      await this.cache.set(endpoint, params, data, cacheOptions);
    }

    return data;
  }

  /**
   * Enhanced POST request with retry logic
   */
  async postWithRetry<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    body?: unknown,
    options: {
      validateParams?: boolean;
    } = {}
  ): Promise<T> {
    const { validateParams = true } = options;

    // Validate parameters if requested
    if (validateParams) {
      params = TMDBValidator.sanitizeSearchParams(params);
    }

    return TMDBRetry.withRateLimitRetry(async () => {
      try {
        return await this.post<T>(endpoint, params, body);
      } catch (error) {
        TMDBErrorHandler.logError(error, { endpoint, params });
        TMDBErrorHandler.handleAPIError(error);
        throw error; // This should never be reached
      }
    }, {
      maxAttempts: this.config.retries,
      onRateLimit: (retryAfter) => {
        console.warn(`Rate limited. Retrying after ${retryAfter} seconds.`);
      },
    });
  }

  /**
   * Get movie details with caching
   */
  async getMovieDetails(
    movieId: number,
    options: {
      language?: string;
      append_to_response?: string[];
      cacheOptions?: TMDBCacheOptions;
    } = {}
  ) {
    if (!TMDBValidator.validateMediaId(movieId)) {
      throw new TMDBApiError('Invalid movie ID');
    }

    return this.getWithCache(`/movie/${movieId}`, {
      language: options.language || 'en-US',
      append_to_response: options.append_to_response,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Get TV show details with caching
   */
  async getTVShowDetails(
    tvId: number,
    options: {
      language?: string;
      append_to_response?: string[];
      cacheOptions?: TMDBCacheOptions;
    } = {}
  ) {
    if (!TMDBValidator.validateMediaId(tvId)) {
      throw new TMDBApiError('Invalid TV show ID');
    }

    return this.getWithCache(`/tv/${tvId}`, {
      language: options.language || 'en-US',
      append_to_response: options.append_to_response,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Search movies with caching
   */
  async searchMovies(
    query: string,
    options: {
      page?: number;
      language?: string;
      region?: string;
      year?: number;
      cacheOptions?: TMDBCacheOptions;
    } = {}
  ) {
    if (!TMDBValidator.validateSearchQuery(query)) {
      throw new TMDBApiError('Invalid search query');
    }

    return this.getWithCache('/search/movie', {
      query: query.trim(),
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
      year: options.year,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Search TV shows with caching
   */
  async searchTVShows(
    query: string,
    options: {
      page?: number;
      language?: string;
      first_air_date_year?: number;
      cacheOptions?: TMDBCacheOptions;
    } = {}
  ) {
    if (!TMDBValidator.validateSearchQuery(query)) {
      throw new TMDBApiError('Invalid search query');
    }

    return this.getWithCache('/search/tv', {
      query: query.trim(),
      page: options.page || 1,
      language: options.language || 'en-US',
      first_air_date_year: options.first_air_date_year,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Multi-search with caching
   */
  async multiSearch(
    query: string,
    options: {
      page?: number;
      language?: string;
      region?: string;
      cacheOptions?: TMDBCacheOptions;
    } = {}
  ) {
    if (!TMDBValidator.validateSearchQuery(query)) {
      throw new TMDBApiError('Invalid search query');
    }

    return this.getWithCache('/search/multi', {
      query: query.trim(),
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Get popular movies with caching
   */
  async getPopularMovies(options: {
    page?: number;
    language?: string;
    region?: string;
    cacheOptions?: TMDBCacheOptions;
  } = {}) {
    return this.getWithCache('/movie/popular', {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Get trending movies with caching
   */
  async getTrendingMovies(options: {
    time_window?: 'day' | 'week';
    page?: number;
    cacheOptions?: TMDBCacheOptions;
  } = {}) {
    return this.getWithCache(`/trending/movie/${options.time_window || 'week'}`, {
      page: options.page || 1,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Get popular TV shows with caching
   */
  async getPopularTVShows(options: {
    page?: number;
    language?: string;
    cacheOptions?: TMDBCacheOptions;
  } = {}) {
    return this.getWithCache('/tv/popular', {
      page: options.page || 1,
      language: options.language || 'en-US',
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Get trending TV shows with caching
   */
  async getTrendingTVShows(options: {
    time_window?: 'day' | 'week';
    page?: number;
    cacheOptions?: TMDBCacheOptions;
  } = {}) {
    return this.getWithCache(`/trending/tv/${options.time_window || 'week'}`, {
      page: options.page || 1,
    }, {
      cacheOptions: options.cacheOptions,
    });
  }

  /**
   * Invalidate cache for specific movie
   */
  async invalidateMovieCache(movieId: number): Promise<void> {
    await this.cache.invalidateMovie(movieId);
  }

  /**
   * Invalidate cache for specific TV show
   */
  async invalidateTVShowCache(tvId: number): Promise<void> {
    await this.cache.invalidateTVShow(tvId);
  }

  /**
   * Invalidate cache for search queries
   */
  async invalidateSearchCache(query: string): Promise<void> {
    await this.cache.invalidateSearch(query);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clearAll();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Check if cache is available
   */
  async isCacheAvailable(): Promise<boolean> {
    return this.cache.isAvailable();
  }
}

// Export singleton instance
export const tmdbEnhancedClient = new TMDBEnhancedClient();

// Export class for testing or multiple instances
export { TMDBEnhancedClient };