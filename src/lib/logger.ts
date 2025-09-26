import configService from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  environment?: string;
  appVersion?: string;
}

class Logger {
  private config = configService.getConfig();
  private logLevel: LogLevel;
  private sessionId: string;
  private isClient: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isClient = typeof window !== 'undefined';
    this.logLevel = this.getLogLevelFromConfig();
  }

  private getLogLevelFromConfig(): LogLevel {
    const logLevel = process.env.LOG_LEVEL || 'info';

    // Environment-specific log levels
    if (this.config.app.isProduction) {
      return logLevel as LogLevel;
    } else if (this.config.app.isStaging) {
      return logLevel === 'debug' ? 'info' : logLevel as LogLevel;
    } else {
      // Development - allow debug logging
      return logLevel as LogLevel;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      sessionId: this.sessionId,
      url: this.isClient ? window.location.href : undefined,
      userAgent: this.isClient ? navigator.userAgent : undefined,
      environment: this.config.app.environment,
      appVersion: this.config.app.version,
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);

    // Console logging
    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage, entry.context);
        break;
      case 'info':
        console.info(formattedMessage, entry.context);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context);
        break;
      case 'error':
        console.error(formattedMessage, entry.error || entry.context);
        break;
    }

    // In production, send to monitoring service
    if (!this.config.app.isDevelopment && entry.level !== 'debug') {
      this.sendToMonitoring(entry);
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      const monitoringConfig = this.config.monitoring;

      if (!monitoringConfig.enabled) {
        return;
      }

      const monitoringEndpoint = monitoringConfig.monitoringEndpoint || '/api/logs';

      if (monitoringEndpoint.startsWith('/api/')) {
        // Send to internal API endpoint
        await fetch(monitoringEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      } else {
        // Send to external monitoring service
        await fetch(monitoringEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`,
          },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      // Fallback: log to console if monitoring fails
      console.error('Failed to send log to monitoring service:', error);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(this.createLogEntry('error', message, context, error));
  }

  // Specialized logging methods
  logApiError(endpoint: string, error: Error, context?: Record<string, unknown>): void {
    this.error(`API Error: ${endpoint}`, error, {
      endpoint,
      ...context,
    });
  }

  logUserAction(action: string, context?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, {
      action,
      ...context,
    });
  }

  logPerformance(operation: string, duration: number, context?: Record<string, unknown>): void {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...context,
    });
  }

  logSecurity(event: string, context?: Record<string, unknown>): void {
    this.warn(`Security Event: ${event}`, {
      event,
      ...context,
    });
  }

  // Set user context for logging
  setUserContext(userId: string): void {
    this.info('User context set', { userId });
  }

  // Clear user context
  clearUserContext(): void {
    this.info('User context cleared');
  }

  // Update log level
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level set to ${level}`, {
      previousLevel: this.logLevel,
      newLevel: level,
      environment: this.config.app.environment,
    });
  }

  // Reload configuration (useful for testing or dynamic config changes)
  reloadConfig(): void {
    this.config = configService.getConfig();
    this.logLevel = this.getLogLevelFromConfig();
    this.info('Configuration reloaded', {
      environment: this.config.app.environment,
      newLogLevel: this.logLevel,
    });
  }

  // Get current configuration summary
  getConfigSummary(): Record<string, unknown> {
    return {
      environment: this.config.app.environment,
      logLevel: this.logLevel,
      isProduction: this.config.app.isProduction,
      isDevelopment: this.config.app.isDevelopment,
      isStaging: this.config.app.isStaging,
      monitoringEnabled: this.config.monitoring.enabled,
      features: this.config.features,
    };
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton and class for testing
export { Logger };
export default logger;