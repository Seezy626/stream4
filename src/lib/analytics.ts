import configService from './config';
import logger from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  page?: string;
  userAgent?: string;
}

interface PageViewEvent extends AnalyticsEvent {
  name: 'page_view';
  properties: {
    page: string;
    title?: string;
    referrer?: string;
    duration?: number;
  };
}

interface UserActionEvent extends AnalyticsEvent {
  name: 'user_action';
  properties: {
    action: string;
    category: string;
    label?: string;
    value?: number;
  };
}

interface ErrorEvent extends AnalyticsEvent {
  name: 'error';
  properties: {
    error: string;
    message: string;
    stack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
  };
}

interface PerformanceEvent extends AnalyticsEvent {
  name: 'performance';
  properties: {
    metric: string;
    value: number;
    unit: string;
    context?: Record<string, any>;
  };
}

type EventType = PageViewEvent | UserActionEvent | ErrorEvent | PerformanceEvent | AnalyticsEvent;

class AnalyticsService {
  private config = configService.getConfig();
  private sessionId: string;
  private isClient: boolean;
  private eventQueue: EventType[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly batchSize = 10;
  private readonly flushIntervalMs = 5000; // 5 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isClient = typeof window !== 'undefined';

    if (this.isClient && this.config.monitoring.enabled) {
      this.initializeClient();
      this.startBatchFlush();
    }
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeClient(): void {
    if (!this.isClient) return;

    // Initialize Google Analytics if configured
    if (this.config.monitoring.analyticsId) {
      this.initializeGoogleAnalytics();
    }

    // Initialize other analytics providers as needed
    this.initializeCustomAnalytics();
  }

  private initializeGoogleAnalytics(): void {
    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.monitoring.analyticsId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;

      gtag('js', new Date());
      gtag('config', this.config.monitoring.analyticsId, {
        send_page_view: false, // We'll handle page views manually
        custom_map: {
          session_id: this.sessionId,
        },
      });

      logger.info('Google Analytics initialized', {
        analyticsId: this.config.monitoring.analyticsId,
      });
    } catch (error) {
      logger.error('Failed to initialize Google Analytics', error);
    }
  }

  private initializeCustomAnalytics(): void {
    // Initialize custom analytics endpoint if configured
    if (this.config.monitoring.monitoringEndpoint) {
      logger.info('Custom analytics endpoint configured', {
        endpoint: this.config.monitoring.monitoringEndpoint,
      });
    }
  }

  private startBatchFlush(): void {
    if (!this.isClient) return;

    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, this.flushIntervalMs);
  }

  private stopBatchFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEventsToAnalytics(eventsToFlush);
    } catch (error) {
      logger.error('Failed to flush analytics events', error, {
        eventCount: eventsToFlush.length,
      });

      // Re-queue events if sending fails
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private async sendEventsToAnalytics(events: EventType[]): Promise<void> {
    const endpoint = this.config.monitoring.monitoringEndpoint || '/api/analytics';

    if (endpoint.startsWith('/api/')) {
      // Send to internal API endpoint
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
    } else {
      // Send to external analytics service
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
        },
        body: JSON.stringify({ events }),
      });
    }
  }

  private createBaseEvent(name: string, properties?: Record<string, any>): AnalyticsEvent {
    return {
      name,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      page: this.isClient ? window.location.pathname : undefined,
      userAgent: this.isClient ? navigator.userAgent : undefined,
    };
  }

  private queueEvent(event: EventType): void {
    this.eventQueue.push(event);

    // Flush immediately if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  // Public API methods

  /**
   * Track a page view
   */
  trackPageView(page: string, title?: string, referrer?: string): void {
    if (!this.config.monitoring.enabled) return;

    const event: PageViewEvent = {
      ...this.createBaseEvent('page_view', {
        page,
        title: title || document.title,
        referrer: referrer || document.referrer,
      }),
    } as PageViewEvent;

    this.queueEvent(event);

    // Send to Google Analytics if available
    if (this.isClient && (window as any).gtag) {
      (window as any).gtag('config', this.config.monitoring.analyticsId, {
        page_path: page,
        page_title: title || document.title,
      });
    }

    logger.debug('Page view tracked', { page, title });
  }

  /**
   * Track a user action
   */
  trackUserAction(action: string, category: string, label?: string, value?: number): void {
    if (!this.config.monitoring.enabled) return;

    const event: UserActionEvent = {
      ...this.createBaseEvent('user_action', {
        action,
        category,
        label,
        value,
      }),
    } as UserActionEvent;

    this.queueEvent(event);

    // Send to Google Analytics if available
    if (this.isClient && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        custom_map: {
          session_id: this.sessionId,
        },
      });
    }

    logger.debug('User action tracked', { action, category, label, value });
  }

  /**
   * Track an error
   */
  trackError(error: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', context?: Record<string, any>): void {
    if (!this.config.monitoring.enabled) return;

    const event: ErrorEvent = {
      ...this.createBaseEvent('error', {
        error,
        message,
        severity,
        context,
      }),
    } as ErrorEvent;

    this.queueEvent(event);

    // Send to Google Analytics if available
    if (this.isClient && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${error}: ${message}`,
        fatal: severity === 'critical',
        custom_map: {
          session_id: this.sessionId,
        },
      });
    }

    logger.warn('Error tracked', { error, message, severity });
  }

  /**
   * Track a performance metric
   */
  trackPerformance(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    if (!this.config.monitoring.enabled || !this.config.features.advancedAnalytics) return;

    const event: PerformanceEvent = {
      ...this.createBaseEvent('performance', {
        metric,
        value,
        unit,
        context,
      }),
    } as PerformanceEvent;

    this.queueEvent(event);

    logger.debug('Performance metric tracked', { metric, value, unit });
  }

  /**
   * Track custom event
   */
  trackCustomEvent(name: string, properties?: Record<string, any>): void {
    if (!this.config.monitoring.enabled) return;

    const event = this.createBaseEvent(name, properties);
    this.queueEvent(event);

    logger.debug('Custom event tracked', { name, properties });
  }

  /**
   * Set user context for analytics
   */
  setUserContext(userId: string): void {
    logger.info('Analytics user context set', { userId });

    // Update Google Analytics user properties if available
    if (this.isClient && (window as any).gtag) {
      (window as any).gtag('config', this.config.monitoring.analyticsId, {
        user_id: userId,
        custom_map: {
          session_id: this.sessionId,
        },
      });
    }
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    logger.info('Analytics user context cleared');
  }

  /**
   * Get analytics configuration summary
   */
  getConfigSummary(): Record<string, any> {
    return {
      enabled: this.config.monitoring.enabled,
      hasGoogleAnalytics: !!this.config.monitoring.analyticsId,
      hasCustomEndpoint: !!this.config.monitoring.monitoringEndpoint,
      sessionId: this.sessionId,
      batchSize: this.batchSize,
      flushIntervalMs: this.flushIntervalMs,
      queuedEvents: this.eventQueue.length,
      advancedAnalytics: this.config.features.advancedAnalytics,
    };
  }

  /**
   * Force flush all queued events
   */
  async forceFlush(): Promise<void> {
    await this.flushEvents();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopBatchFlush();
    this.forceFlush();
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export singleton and class for testing
export { AnalyticsService };
export default analyticsService;