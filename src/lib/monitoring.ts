import logger from './logger';

interface ErrorEvent {
  error: Error;
  context?: Record<string, unknown>;
  tags?: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  request?: {
    url?: string;
    method?: string;
    userAgent?: string;
  };
  extra?: Record<string, unknown>;
}

interface PerformanceEvent {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  context?: Record<string, unknown>;
}

interface UserEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  context?: Record<string, unknown>;
}

class MonitoringService {
  private isEnabled = process.env.NODE_ENV === 'production';
  private sentryDsn?: string;
  private analyticsId?: string;

  constructor() {
    this.sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    this.analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID;

    if (this.isEnabled && this.sentryDsn) {
      this.initializeSentry();
    }
  }

  private initializeSentry(): void {
    // Initialize Sentry in production
    if (typeof window !== 'undefined') {
      // Browser initialization would go here
      console.log('Sentry initialized for browser');
    } else {
      // Server initialization would go here
      console.log('Sentry initialized for server');
    }
  }

  // Error tracking
  captureError(errorEvent: ErrorEvent): void {
    if (!this.isEnabled) {
      console.error('Error tracking disabled:', errorEvent);
      return;
    }

    // Log to our internal logger first
    logger.error(errorEvent.error.message, errorEvent.error, {
      context: errorEvent.context,
      tags: errorEvent.tags,
      user: errorEvent.user,
      request: errorEvent.request,
      extra: errorEvent.extra,
    });

    // Send to external monitoring service
    this.sendToExternalService('error', errorEvent);
  }

  // Performance monitoring
  capturePerformance(performanceEvent: PerformanceEvent): void {
    if (!this.isEnabled) {
      logger.info(`Performance: ${performanceEvent.name}`, {
        value: performanceEvent.value,
        unit: performanceEvent.unit,
        ...performanceEvent.context,
      });
      return;
    }

    logger.logPerformance(performanceEvent.name, performanceEvent.value, {
      unit: performanceEvent.unit,
      ...performanceEvent.context,
    });

    this.sendToExternalService('performance', performanceEvent);
  }

  // User analytics
  trackUserEvent(userEvent: UserEvent): void {
    if (!this.isEnabled) {
      logger.info(`User Event: ${userEvent.action}`, {
        category: userEvent.category,
        label: userEvent.label,
        value: userEvent.value,
        ...userEvent.context,
      });
      return;
    }

    logger.logUserAction(userEvent.action, {
      category: userEvent.category,
      label: userEvent.label,
      value: userEvent.value,
      ...userEvent.context,
    });

    this.sendToExternalService('user_event', userEvent);
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    metrics: Record<string, number>;
  }> {
    const services = {
      database: await this.checkDatabaseHealth(),
      external_apis: await this.checkExternalApisHealth(),
      logging: await this.checkLoggingHealth(),
    };

    const allHealthy = Object.values(services).every(status => status);
    const anyUnhealthy = Object.values(services).some(status => !status);

    const status = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';

    const metrics = {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      response_time: Date.now(),
    };

    return { status, services, metrics };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // TODO: Implement actual database health check
      return true;
    } catch {
      return false;
    }
  }

  private async checkExternalApisHealth(): Promise<boolean> {
    try {
      // TODO: Implement external API health checks
      return true;
    } catch {
      return false;
    }
  }

  private async checkLoggingHealth(): Promise<boolean> {
    try {
      // Test logging endpoint
      const response = await fetch('/api/logs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async sendToExternalService(type: string, data: unknown): Promise<void> {
    try {
      if (this.sentryDsn && type === 'error') {
        await this.sendToSentry(data as ErrorEvent);
      }

      if (this.analyticsId && type === 'user_event') {
        await this.sendToAnalytics(data as UserEvent);
      }

      // Send to our internal monitoring endpoint
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, timestamp: new Date().toISOString() }),
      });
    } catch (error) {
      // Don't throw - monitoring failures shouldn't break the app
      console.error('Failed to send to external monitoring service:', error);
    }
  }

  private async sendToSentry(errorEvent: ErrorEvent): Promise<void> {
    // TODO: Implement Sentry integration
    console.log('Would send to Sentry:', errorEvent);
  }

  private async sendToAnalytics(userEvent: UserEvent): Promise<void> {
    // TODO: Implement Google Analytics or similar
    console.log('Would send to Analytics:', userEvent);
  }

  // Utility methods for common tracking scenarios
  trackPageView(page: string, context?: Record<string, unknown>): void {
    this.trackUserEvent({
      action: 'page_view',
      category: 'navigation',
      label: page,
      context,
    });
  }

  trackFeatureUsage(feature: string, context?: Record<string, unknown>): void {
    this.trackUserEvent({
      action: 'feature_used',
      category: 'engagement',
      label: feature,
      context,
    });
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.captureError({
      error,
      context: {
        source: 'manual_tracking',
        ...context,
      },
    });
  }

  trackPerformanceMetric(name: string, value: number, context?: Record<string, unknown>): void {
    this.capturePerformance({
      name,
      value,
      context,
    });
  }

  // Set user context for tracking
  setUserContext(user: { id?: string; email?: string; username?: string }): void {
    logger.setUserContext(user.id || 'anonymous');
  }

  clearUserContext(): void {
    logger.clearUserContext();
  }
}

// Create singleton instance
const monitoring = new MonitoringService();

// Export singleton and class for testing
export { MonitoringService };
export default monitoring;