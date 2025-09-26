interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  timeout?: number;
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitBreakerState = 'CLOSED';

  constructor(private options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      ...options,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout!) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold!) {
      this.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

class RetryManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
    circuitBreakerKey?: string
  ): Promise<T> {
    const retryOptions: Required<RetryOptions> = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: () => true,
      onRetry: () => {},
      timeout: 30000,
      ...options,
    };

    let lastError: Error;
    let circuitBreaker: CircuitBreaker | undefined;

    if (circuitBreakerKey) {
      circuitBreaker = this.getCircuitBreaker(circuitBreakerKey);
    }

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), retryOptions.timeout);
        });

        const result = await Promise.race([
          circuitBreaker
            ? circuitBreaker.execute(operation)
            : operation(),
          timeoutPromise,
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (
          attempt === retryOptions.maxAttempts ||
          !retryOptions.retryCondition(lastError)
        ) {
          throw lastError;
        }

        // Call retry callback
        retryOptions.onRetry(attempt, lastError);

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryOptions.baseDelay * Math.pow(retryOptions.backoffFactor, attempt - 1),
          retryOptions.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError!;
  }

  private getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker());
    }
    return this.circuitBreakers.get(key)!;
  }

  // Specialized retry methods for common scenarios
  async withApiRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      maxAttempts: 3,
      retryCondition: (error: Error) => {
        // Retry on network errors, 5xx status codes, and timeouts
        const message = error.message.toLowerCase();
        return (
          message.includes('network') ||
          message.includes('timeout') ||
          message.includes('fetch') ||
          message.includes('5') ||
          message.includes('502') ||
          message.includes('503') ||
          message.includes('504')
        );
      },
      onRetry: (attempt, error) => {
        console.warn(`API retry attempt ${attempt}:`, error.message);
      },
      ...options,
    }, 'api');
  }

  async withDatabaseRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      maxAttempts: 5,
      retryCondition: (error: Error) => {
        // Retry on connection errors, deadlocks, and temporary failures
        const message = error.message.toLowerCase();
        return (
          message.includes('connection') ||
          message.includes('deadlock') ||
          message.includes('timeout') ||
          message.includes('temporary') ||
          message.includes('unavailable')
        );
      },
      onRetry: (attempt, error) => {
        console.warn(`Database retry attempt ${attempt}:`, error.message);
      },
      ...options,
    }, 'database');
  }

  async withExternalServiceRetry<T>(
    operation: () => Promise<T>,
    serviceName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      maxAttempts: 4,
      retryCondition: (error: Error) => {
        // Retry on external service errors
        const message = error.message.toLowerCase();
        return (
          message.includes('timeout') ||
          message.includes('unavailable') ||
          message.includes('503') ||
          message.includes('502') ||
          message.includes('rate limit')
        );
      },
      onRetry: (attempt, error) => {
        console.warn(`${serviceName} retry attempt ${attempt}:`, error.message);
      },
      ...options,
    }, `external-${serviceName}`);
  }

  // Get circuit breaker stats for monitoring
  getCircuitBreakerStats(): Record<string, {
    state: CircuitBreakerState;
    failures: number;
    lastFailureTime: number;
  }> {
    const stats: Record<string, any> = {};
    for (const [key, breaker] of this.circuitBreakers) {
      stats[key] = {
        state: breaker.getState(),
        failures: breaker.getFailures(),
        lastFailureTime: this.circuitBreakers.get(key)?.['lastFailureTime'] || 0,
      };
    }
    return stats;
  }
}

// Create singleton instance
const retryManager = new RetryManager();

// Export singleton and class for testing
export { RetryManager, CircuitBreaker };
export default retryManager;