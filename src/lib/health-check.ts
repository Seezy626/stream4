import configService from './config';
import logger from './logger';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    cache: HealthCheck;
    externalApis: HealthCheck;
    diskSpace: HealthCheck;
    memory: HealthCheck;
  };
  responseTime: number;
}

interface HealthCheck {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  message?: string;
  details?: Record<string, unknown>;
}

class HealthCheckService {
  private config = configService.getConfig();
  private startTime: number = Date.now();
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Perform all health checks in parallel
      const [databaseCheck, cacheCheck, externalApisCheck, diskSpaceCheck, memoryCheck] = await Promise.all([
        this.checkDatabase(),
        this.checkCache(),
        this.checkExternalApis(),
        this.checkDiskSpace(),
        this.checkMemory(),
      ]);

      // Determine overall status
      const checks = {
        database: databaseCheck,
        cache: cacheCheck,
        externalApis: externalApisCheck,
        diskSpace: diskSpaceCheck,
        memory: memoryCheck,
      };

      const overallStatus = this.determineOverallStatus(checks);
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        version: this.config.app.version,
        environment: this.config.app.environment,
        checks,
        responseTime,
      };

      // Log health check result
      logger.info('Health check completed', {
        status: overallStatus,
        responseTime,
        environment: this.config.app.environment,
      });

      return result;
    } catch (error: unknown) {
      logger.error('Health check failed', error as Error);

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime(),
        version: this.config.app.version,
        environment: this.config.app.environment,
        checks: {
          database: { status: 'down', responseTime: 0, message: 'Health check error' },
          cache: { status: 'down', responseTime: 0, message: 'Health check error' },
          externalApis: { status: 'down', responseTime: 0, message: 'Health check error' },
          diskSpace: { status: 'down', responseTime: 0, message: 'Health check error' },
          memory: { status: 'down', responseTime: 0, message: 'Health check error' },
        },
        responseTime: Date.now() - startTime,
      };
    }
  }

  private determineOverallStatus(checks: HealthCheckResult['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(check => check.status);

    if (statuses.includes('down')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check database connection
      const response = await fetch('/api/health/database', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const data = await response.json();

      return {
        status: response.ok ? 'up' : 'down',
        responseTime: Date.now() - startTime,
        message: data.message || (response.ok ? 'Database is healthy' : 'Database is down'),
        details: data,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: 'Database health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkCache(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check cache health
      const response = await fetch('/api/health/cache', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      const data = await response.json();

      return {
        status: response.ok ? 'up' : 'degraded',
        responseTime: Date.now() - startTime,
        message: data.message || (response.ok ? 'Cache is healthy' : 'Cache is degraded'),
        details: data,
      };
    } catch (error: unknown) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: 'Cache health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkExternalApis(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check external API health (TMDB)
      const response = await fetch('/api/health/external-apis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const data = await response.json();

      return {
        status: response.ok ? 'up' : 'degraded',
        responseTime: Date.now() - startTime,
        message: data.message || (response.ok ? 'External APIs are healthy' : 'External APIs are degraded'),
        details: data,
      };
    } catch (error: unknown) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: 'External APIs health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check disk space (server-side only)
      if (this.isClient) {
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          message: 'Disk space check not available on client',
        };
      }

      const response = await fetch('/api/health/disk-space', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      const data = await response.json();

      return {
        status: response.ok ? 'up' : 'degraded',
        responseTime: Date.now() - startTime,
        message: data.message || (response.ok ? 'Disk space is healthy' : 'Disk space is low'),
        details: data,
      };
    } catch (error) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: 'Disk space health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check memory usage (server-side only)
      if (this.isClient) {
        return {
          status: 'up',
          responseTime: Date.now() - startTime,
          message: 'Memory check not available on client',
        };
      }

      const response = await fetch('/api/health/memory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      const data = await response.json();

      return {
        status: response.ok ? 'up' : 'degraded',
        responseTime: Date.now() - startTime,
        message: data.message || (response.ok ? 'Memory usage is healthy' : 'Memory usage is high'),
        details: data,
      };
    } catch (error) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: 'Memory health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get health check configuration
   */
  getHealthCheckConfig(): Record<string, unknown> {
    return {
      environment: this.config.app.environment,
      isProduction: this.config.app.isProduction,
      isDevelopment: this.config.app.isDevelopment,
      isStaging: this.config.app.isStaging,
      uptime: this.getUptime(),
      version: this.config.app.version,
      checks: {
        database: 'Database connection and query performance',
        cache: 'Cache system health and performance',
        externalApis: 'External API connectivity (TMDB, etc.)',
        diskSpace: 'Disk space usage and availability',
        memory: 'Memory usage and availability',
      },
    };
  }

  /**
   * Check if the service is ready for requests
   */
  async isReady(): Promise<boolean> {
    try {
      const health = await this.performHealthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Get detailed health status for monitoring
   */
  async getDetailedStatus(): Promise<Record<string, unknown>> {
    const health = await this.performHealthCheck();

    return {
      ...health,
      config: this.getHealthCheckConfig(),
      thresholds: {
        databaseResponseTime: 1000, // 1 second
        cacheResponseTime: 500, // 500ms
        externalApiResponseTime: 5000, // 5 seconds
        diskSpaceThreshold: 0.9, // 90%
        memoryThreshold: 0.9, // 90%
      },
    };
  }
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

// Export singleton and class for testing
export { HealthCheckService };
export default healthCheckService;