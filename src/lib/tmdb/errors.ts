import { TMDBApiError, TMDBRateLimitError } from './client';

/**
 * Custom error classes for TMDB API operations
 */
export class TMDBValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'TMDBValidationError';
  }
}

export class TMDBNetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'TMDBNetworkError';
  }
}

export class TMDBTimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TMDBTimeoutError';
  }
}

export class TMDBAuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'TMDBAuthenticationError';
  }
}

export class TMDBResourceNotFoundError extends Error {
  constructor(resource: string, id: string | number) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'TMDBResourceNotFoundError';
  }
}

export class TMDBInvalidRequestError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'TMDBInvalidRequestError';
  }
}

/**
 * Error handler utility class
 */
export class TMDBErrorHandler {
  /**
   * Parse and handle TMDB API errors
   */
  static handleAPIError(error: any): never {
    // Handle rate limiting
    if (error instanceof TMDBRateLimitError) {
      throw new TMDBRateLimitError(error.message);
    }

    // Handle API errors
    if (error instanceof TMDBApiError) {
      const statusCode = error.statusCode || 500;

      switch (statusCode) {
        case 401:
          throw new TMDBAuthenticationError('Invalid API key');
        case 404:
          throw new TMDBResourceNotFoundError('Resource', 'unknown');
        case 400:
          throw new TMDBInvalidRequestError(error.message, statusCode);
        case 422:
          throw new TMDBValidationError(error.message);
        default:
          throw new TMDBApiError(error.message);
      }
    }

    // Handle network errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new TMDBTimeoutError();
    }

    // Handle network connectivity issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new TMDBNetworkError('Network connection failed', error);
    }

    // Handle generic errors
    if (error instanceof Error) {
      throw new TMDBNetworkError(error.message, error);
    }

    // Handle unknown errors
    throw new TMDBApiError('An unknown error occurred');
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    if (error instanceof TMDBAuthenticationError) {
      return 'Authentication failed. Please check your API configuration.';
    }

    if (error instanceof TMDBRateLimitError) {
      return 'Too many requests. Please try again in a moment.';
    }

    if (error instanceof TMDBTimeoutError) {
      return 'Request timed out. Please try again.';
    }

    if (error instanceof TMDBNetworkError) {
      return 'Network connection failed. Please check your internet connection.';
    }

    if (error instanceof TMDBResourceNotFoundError) {
      return 'The requested content was not found.';
    }

    if (error instanceof TMDBValidationError) {
      return 'Invalid request parameters.';
    }

    if (error instanceof TMDBInvalidRequestError) {
      return 'Invalid request. Please check your input.';
    }

    if (error instanceof TMDBApiError) {
      return 'Service temporarily unavailable. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    if (error instanceof TMDBRateLimitError) {
      return true;
    }

    if (error instanceof TMDBTimeoutError) {
      return true;
    }

    if (error instanceof TMDBNetworkError) {
      return true;
    }

    if (error instanceof TMDBApiError) {
      const statusCode = error.statusCode;
      // Retry on server errors (5xx) but not client errors (4xx)
      return statusCode >= 500;
    }

    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Log error with context
   */
  static logError(error: any, context: {
    endpoint?: string;
    params?: Record<string, any>;
    attempt?: number;
    userId?: string;
  } = {}): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('TMDB Error:', JSON.stringify(logData, null, 2));
  }
}

/**
 * Retry utility with exponential backoff
 */
export class TMDBRetry {
  /**
   * Execute function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      onRetry?: (error: any, attempt: number) => void;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      onRetry,
      shouldRetry = TMDBErrorHandler.isRetryableError,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === maxAttempts || !shouldRetry(error)) {
          break;
        }

        // Calculate delay and wait
        const delay = TMDBErrorHandler.calculateRetryDelay(attempt, baseDelay);

        if (onRetry) {
          onRetry(error, attempt);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Execute function with rate limit handling
   */
  static async withRateLimitRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      onRateLimit?: (retryAfter: number) => void;
    } = {}
  ): Promise<T> {
    const { maxAttempts = 5, onRateLimit } = options;

    return this.withRetry(fn, {
      maxAttempts,
      shouldRetry: (error) => {
        if (error instanceof TMDBRateLimitError) {
          if (onRateLimit && error.retryAfter) {
            onRateLimit(error.retryAfter);
          }
          return true;
        }
        return TMDBErrorHandler.isRetryableError(error);
      },
    });
  }
}

/**
 * Validation utilities
 */
export class TMDBValidator {
  /**
   * Validate TMDB API key format
   */
  static validateApiKey(apiKey: string): boolean {
    return /^[a-f0-9]{32}$/.test(apiKey);
  }

  /**
   * Validate movie/TV show ID
   */
  static validateMediaId(id: any): id is number {
    return typeof id === 'number' && id > 0 && Number.isInteger(id);
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(query: string): boolean {
    return typeof query === 'string' && query.trim().length >= 2 && query.trim().length <= 100;
  }

  /**
   * Validate page number
   */
  static validatePage(page: any): boolean {
    return typeof page === 'number' && page > 0 && page <= 1000 && Number.isInteger(page);
  }

  /**
   * Validate year
   */
  static validateYear(year: any): boolean {
    return typeof year === 'number' && year >= 1900 && year <= new Date().getFullYear() + 5 && Number.isInteger(year);
  }

  /**
   * Validate language code
   */
  static validateLanguageCode(lang: string): boolean {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(lang);
  }

  /**
   * Validate genre IDs
   */
  static validateGenreIds(genres: any[]): genres is number[] {
    return Array.isArray(genres) &&
           genres.every(id => typeof id === 'number' && id > 0 && Number.isInteger(id));
  }

  /**
   * Sanitize search parameters
   */
  static sanitizeSearchParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    if (params.query && this.validateSearchQuery(params.query)) {
      sanitized.query = params.query.trim();
    }

    if (params.page && this.validatePage(params.page)) {
      sanitized.page = params.page;
    }

    if (params.language && this.validateLanguageCode(params.language)) {
      sanitized.language = params.language;
    }

    if (params.year && this.validateYear(params.year)) {
      sanitized.year = params.year;
    }

    if (params.region && this.validateLanguageCode(params.region)) {
      sanitized.region = params.region;
    }

    return sanitized;
  }
}