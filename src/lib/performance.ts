import monitoring from './monitoring';
import logger from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled = process.env.NODE_ENV === 'production';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializePerformanceObserver();
      this.trackPageLoadMetrics();
    }
  }

  private initializeWebVitals(): void {
    // Track Core Web Vitals
    this.trackWebVital('FCP', 'first-contentful-paint');
    this.trackWebVital('LCP', 'largest-contentful-paint');
    this.trackWebVital('CLS', 'layout-shift');
    this.trackWebVital('FID', 'first-input');
    this.trackWebVital('TTFB', 'navigation');
  }

  private initializePerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Track Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Only track tasks longer than 50ms
            this.recordMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              entryType: entry.entryType,
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Track Navigation Timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.recordMetric('load-complete', navEntry.loadEventEnd - navEntry.loadEventStart);
          this.recordMetric('total-load-time', navEntry.loadEventEnd - navEntry.navigationStart);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Track Resource Timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.duration > 1000) { // Only track slow resources
            this.recordMetric('slow-resource', resourceEntry.duration, {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

    } catch (error) {
      logger.warn('Failed to initialize performance observers', { error: error.message });
    }
  }

  private trackWebVital(name: WebVitalsMetric['name'], entryType: string): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = this.getWebVitalValue(entry, name);
          if (value !== null) {
            const rating = this.getWebVitalRating(name, value);
            this.recordWebVital({ name, value, rating });
          }
        }
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn(`Failed to track ${name} web vital`, { error: error.message });
    }
  }

  private getWebVitalValue(entry: PerformanceEntry, name: WebVitalsMetric['name']): number | null {
    switch (name) {
      case 'FCP':
        return (entry as any).processingStart || null;
      case 'LCP':
        return (entry as any).renderTime || (entry as any).loadEventEnd || null;
      case 'CLS':
        return (entry as any).value || null;
      case 'FID':
        return (entry as any).processingStart || null;
      case 'TTFB':
        return (entry as PerformanceNavigationTiming).responseStart || null;
      default:
        return null;
    }
  }

  private getWebVitalRating(name: WebVitalsMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private trackPageLoadMetrics(): void {
    if (typeof window === 'undefined') return;

    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordMetric('page-load-time', loadTime);

      // Track if page load is slow
      if (loadTime > 3000) {
        logger.warn('Slow page load detected', { loadTime });
      }
    });

    // Track visibility changes for performance optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordMetric('page-hidden', Date.now());
      } else {
        this.recordMetric('page-visible', Date.now());
      }
    });
  }

  recordMetric(name: string, value: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);

    // Log performance metrics
    logger.logPerformance(name, value, context);

    // Send to monitoring service
    monitoring.capturePerformance({
      name,
      value,
      context,
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  recordWebVital(metric: WebVitalsMetric): void {
    this.recordMetric(`web-vitals-${metric.name}`, metric.value, {
      rating: metric.rating,
      webVital: true,
    });

    // Log web vitals with special formatting
    logger.info(`Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      unit: this.getWebVitalUnit(metric.name),
    });
  }

  private getWebVitalUnit(name: WebVitalsMetric['name']): string {
    switch (name) {
      case 'CLS':
        return 'score';
      case 'FID':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        return 'milliseconds';
      default:
        return 'unknown';
    }
  }

  // Public API methods
  measureExecutionTime<T>(
    name: string,
    fn: () => T,
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    const duration = endTime - startTime;
    this.recordMetric(`${name}-execution-time`, duration, context);

    return result;
  }

  async measureAsyncExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();

    const duration = endTime - startTime;
    this.recordMetric(`${name}-execution-time`, duration, context);

    return result;
  }

  startTimer(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(`${name}-duration`, duration);
    };
  }

  // Get performance summary
  getPerformanceSummary(): {
    webVitals: Record<string, WebVitalsMetric>;
    averageLoadTime: number;
    slowResources: number;
    longTasks: number;
    totalMetrics: number;
  } {
    const webVitals: Record<string, WebVitalsMetric> = {};
    const loadTimes: number[] = [];
    let slowResources = 0;
    let longTasks = 0;

    this.metrics.forEach(metric => {
      if (metric.name.startsWith('web-vitals-')) {
        const name = metric.name.replace('web-vitals-', '');
        webVitals[name] = {
          name: name as WebVitalsMetric['name'],
          value: metric.value,
          rating: metric.context?.rating || 'good',
        };
      } else if (metric.name === 'page-load-time') {
        loadTimes.push(metric.value);
      } else if (metric.name === 'slow-resource') {
        slowResources++;
      } else if (metric.name === 'long-task') {
        longTasks++;
      }
    });

    const averageLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      : 0;

    return {
      webVitals,
      averageLoadTime,
      slowResources,
      longTasks,
      totalMetrics: this.metrics.length,
    };
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }

  // Get current performance metrics
  getCurrentMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export singleton and class for testing
export { PerformanceMonitor };
export default performanceMonitor;