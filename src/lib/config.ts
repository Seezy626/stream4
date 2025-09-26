interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    url: string;
    environment: 'development' | 'staging' | 'production';
    isProduction: boolean;
    isDevelopment: boolean;
    isStaging: boolean;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    baseUrl: string;
  };
  cache: {
    ttl: number;
    redisTtl: number;
    memoryMaxSize: number;
  };
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    corsOrigins: string[];
    allowedOrigins: string[];
    sessionMaxAge: number;
    cookieSecure: boolean;
  };
  features: {
    userRegistration: boolean;
    socialLogin: boolean;
    advancedAnalytics: boolean;
    performanceMonitoring: boolean;
    maintenanceMode: boolean;
  };
  monitoring: {
    enabled: boolean;
    analyticsId?: string;
    sentryDsn?: string;
    monitoringEndpoint?: string;
  };
  database: {
    connectionTimeout: number;
    queryTimeout: number;
    maxConnections: number;
  };
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
    uploadPath: string;
  };
  email: {
    enabled: boolean;
    server?: {
      host: string;
      port: number;
      user: string;
      password: string;
      from: string;
    };
  };
}

class ConfigurationService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EnvironmentConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'staging';

    // Base configuration
    const baseConfig: EnvironmentConfig = {
      app: {
        name: 'MovieTracker',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        environment: isProduction ? 'production' : isStaging ? 'staging' : 'development',
        isProduction,
        isDevelopment,
        isStaging,
      },
      api: {
        timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
        retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
        retryDelay: parseInt(process.env.API_RETRY_DELAY || '1000', 10),
        baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
      },
      cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
        redisTtl: parseInt(process.env.REDIS_CACHE_TTL || '7200', 10),
        memoryMaxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE || '100000000', 10),
      },
      security: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
        sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400', 10),
        cookieSecure: process.env.COOKIE_SECURE === 'true' || isProduction,
      },
      features: {
        userRegistration: process.env.ENABLE_USER_REGISTRATION !== 'false',
        socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
        advancedAnalytics: process.env.ENABLE_ADVANCED_ANALYTICS === 'true',
        performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      },
      monitoring: {
        enabled: isProduction || process.env.ENABLE_MONITORING === 'true',
        analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
        sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        monitoringEndpoint: process.env.NEXT_PUBLIC_MONITORING_ENDPOINT,
      },
      database: {
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
      },
      fileUpload: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp').split(','),
        uploadPath: process.env.UPLOAD_PATH || './uploads',
      },
      email: {
        enabled: process.env.EMAIL_ENABLED !== 'false',
        server: process.env.EMAIL_SERVER_HOST ? {
          host: process.env.EMAIL_SERVER_HOST,
          port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
          user: process.env.EMAIL_SERVER_USER || '',
          password: process.env.EMAIL_SERVER_PASSWORD || '',
          from: process.env.EMAIL_FROM || 'noreply@localhost',
        } : undefined,
      },
    };

    // Environment-specific overrides
    if (isProduction) {
      return {
        ...baseConfig,
        cache: {
          ...baseConfig.cache,
          ttl: 7200, // Longer cache in production
          redisTtl: 14400,
        },
        security: {
          ...baseConfig.security,
          rateLimitWindowMs: 60000,
          rateLimitMaxRequests: 100,
        },
        features: {
          ...baseConfig.features,
          performanceMonitoring: true,
          advancedAnalytics: true,
        },
      };
    } else if (isStaging) {
      return {
        ...baseConfig,
        features: {
          ...baseConfig.features,
          performanceMonitoring: true,
          advancedAnalytics: false, // Disable analytics in staging
        },
      };
    } else {
      // Development defaults
      return {
        ...baseConfig,
        cache: {
          ...baseConfig.cache,
          ttl: 300, // Shorter cache in development for easier testing
          redisTtl: 600,
        },
        security: {
          ...baseConfig.security,
          rateLimitWindowMs: 60000,
          rateLimitMaxRequests: 1000, // Higher limits in development
        },
      };
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Get a specific configuration section
   */
  get<K extends keyof EnvironmentConfig>(section: K): EnvironmentConfig[K] {
    return { ...this.config[section] };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.config.monitoring.enabled;
  }

  /**
   * Get environment-specific settings
   */
  getEnvironmentSettings() {
    return {
      isProduction: this.config.app.isProduction,
      isDevelopment: this.config.app.isDevelopment,
      isStaging: this.config.app.isStaging,
      environment: this.config.app.environment,
      appUrl: this.config.app.url,
      apiUrl: this.config.api.baseUrl,
    };
  }

  /**
   * Get security settings
   */
  getSecuritySettings() {
    return {
      corsOrigins: this.config.security.corsOrigins,
      allowedOrigins: this.config.security.allowedOrigins,
      cookieSecure: this.config.security.cookieSecure,
      sessionMaxAge: this.config.security.sessionMaxAge,
    };
  }

  /**
   * Get performance settings
   */
  getPerformanceSettings() {
    return {
      cacheTtl: this.config.cache.ttl,
      redisTtl: this.config.cache.redisTtl,
      memoryMaxSize: this.config.cache.memoryMaxSize,
      apiTimeout: this.config.api.timeout,
      apiRetryAttempts: this.config.api.retryAttempts,
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required environment variables
    if (!process.env.NEXTAUTH_SECRET) {
      errors.push('NEXTAUTH_SECRET is required');
    }

    if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
      errors.push('NEXT_PUBLIC_TMDB_API_KEY is required');
    }

    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required');
    }

    // Validate URLs
    try {
      new URL(this.config.app.url);
    } catch {
      errors.push('NEXT_PUBLIC_APP_URL must be a valid URL');
    }

    try {
      new URL(this.config.api.baseUrl);
    } catch {
      errors.push('NEXT_PUBLIC_API_URL must be a valid URL');
    }

    // Validate numeric values
    if (this.config.api.timeout < 1000) {
      errors.push('API_TIMEOUT must be at least 1000ms');
    }

    if (this.config.cache.ttl < 60) {
      errors.push('CACHE_TTL must be at least 60 seconds');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigSummary(): Record<string, any> {
    const validation = this.validateConfig();

    return {
      app: {
        name: this.config.app.name,
        version: this.config.app.version,
        environment: this.config.app.environment,
        isProduction: this.config.app.isProduction,
        isDevelopment: this.config.app.isDevelopment,
        isStaging: this.config.app.isStaging,
      },
      features: this.config.features,
      monitoring: {
        enabled: this.config.monitoring.enabled,
        hasAnalytics: !!this.config.monitoring.analyticsId,
        hasSentry: !!this.config.monitoring.sentryDsn,
      },
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
      },
      cache: {
        ttl: this.config.cache.ttl,
        redisTtl: this.config.cache.redisTtl,
        memoryMaxSize: this.config.cache.memoryMaxSize,
      },
      security: {
        corsOriginsCount: this.config.security.corsOrigins.length,
        allowedOriginsCount: this.config.security.allowedOrigins.length,
        cookieSecure: this.config.security.cookieSecure,
      },
    };
  }
}

// Create singleton instance
const configService = new ConfigurationService();

// Export singleton and class for testing
export { ConfigurationService };
export default configService;