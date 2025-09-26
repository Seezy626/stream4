import logger from './logger';
import monitoring from './monitoring';

interface SecurityEvent {
  type: 'suspicious_activity' | 'failed_login' | 'brute_force' | 'xss_attempt' | 'sql_injection' | 'unauthorized_access' | 'data_breach' | 'malicious_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
}

interface SecurityAlert {
  id: string;
  event: SecurityEvent;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

class SecurityMonitor {
  private securityEvents: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private threatThresholds = {
    failedLogins: { threshold: 5, windowMs: 300000 }, // 5 failed logins in 5 minutes
    suspiciousRequests: { threshold: 10, windowMs: 60000 }, // 10 suspicious requests per minute
    bruteForceAttempts: { threshold: 20, windowMs: 3600000 }, // 20 attempts per hour
  };

  /**
   * Log a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.securityEvents.push(securityEvent);

    // Log to our logger with security context
    logger.logSecurity(event.type, {
      description: event.description,
      source: event.source,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      context: event.context,
      evidence: event.evidence,
    });

    // Send to monitoring service
    monitoring.trackUserEvent({
      action: 'security_event',
      category: 'security',
      label: event.type,
      value: this.getSeverityScore(event.severity),
      context: {
        description: event.description,
        source: event.source,
        severity: event.severity,
        userId: event.userId,
        ip: event.ip,
      },
    });

    // Check if we need to create an alert
    this.checkAlertThresholds(securityEvent);

    // Keep only recent events (last 24 hours)
    this.cleanupOldEvents();
  }

  /**
   * Check if security event triggers an alert
   */
  private checkAlertThresholds(event: SecurityEvent): void {
    const now = Date.now();
    const recentEvents = this.securityEvents.filter(e =>
      e.timestamp > now - 3600000 // Last hour
    );

    // Check for brute force attacks
    if (event.type === 'failed_login') {
      const failedLogins = recentEvents.filter(e =>
        e.type === 'failed_login' && e.ip === event.ip
      );

      if (failedLogins.length >= this.threatThresholds.failedLogins.threshold) {
        this.createAlert({
          type: 'brute_force',
          severity: 'high',
          description: `Brute force attack detected from IP ${event.ip}`,
          source: 'security_monitor',
          ip: event.ip,
          context: {
            failedLoginCount: failedLogins.length,
            timeWindow: this.threatThresholds.failedLogins.windowMs,
          },
        });
      }
    }

    // Check for suspicious activity patterns
    if (event.type === 'suspicious_activity') {
      const suspiciousRequests = recentEvents.filter(e =>
        e.type === 'suspicious_activity' && e.ip === event.ip
      );

      if (suspiciousRequests.length >= this.threatThresholds.suspiciousRequests.threshold) {
        this.createAlert({
          type: 'suspicious_activity',
          severity: 'medium',
          description: `High volume of suspicious requests from IP ${event.ip}`,
          source: 'security_monitor',
          ip: event.ip,
          context: {
            suspiciousRequestCount: suspiciousRequests.length,
            timeWindow: this.threatThresholds.suspiciousRequests.windowMs,
          },
        });
      }
    }

    // Check for XSS attempts
    if (event.type === 'xss_attempt') {
      this.createAlert({
        type: 'xss_attempt',
        severity: 'high',
        description: `XSS attack attempt detected`,
        source: 'security_monitor',
        ip: event.ip,
        userId: event.userId,
        context: event.context,
        evidence: event.evidence,
      });
    }

    // Check for SQL injection attempts
    if (event.type === 'sql_injection') {
      this.createAlert({
        type: 'sql_injection',
        severity: 'critical',
        description: `SQL injection attempt detected`,
        source: 'security_monitor',
        ip: event.ip,
        userId: event.userId,
        context: event.context,
        evidence: event.evidence,
      });
    }
  }

  /**
   * Create a security alert
   */
  private createAlert(event: Omit<SecurityEvent, 'timestamp'>): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: {
        ...event,
        timestamp: Date.now(),
      },
      status: 'new',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.alerts.push(alert);

    // Log the alert
    logger.warn(`Security Alert Created: ${alert.event.type}`, {
      alertId: alert.id,
      severity: alert.event.severity,
      description: alert.event.description,
      source: alert.event.source,
    });

    // Send high-priority alerts to monitoring
    if (alert.event.severity === 'critical' || alert.event.severity === 'high') {
      monitoring.captureError({
        error: new Error(`Security Alert: ${alert.event.description}`),
        context: {
          alertId: alert.id,
          severity: alert.event.severity,
          type: alert.event.type,
          source: alert.event.source,
        },
      });
    }
  }

  /**
   * Get security events with filtering
   */
  getSecurityEvents(filters?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    userId?: string;
    ip?: string;
    since?: number;
    limit?: number;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (filters) {
      if (filters.type) {
        events = events.filter(e => e.type === filters.type);
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.ip) {
        events = events.filter(e => e.ip === filters.ip);
      }
      if (filters.since) {
        const since = filters.since;
        events = events.filter(e => e.timestamp >= since);
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * Get security alerts
   */
  getSecurityAlerts(filters?: {
    status?: SecurityAlert['status'];
    severity?: SecurityEvent['severity'];
    limit?: number;
  }): SecurityAlert[] {
    let alerts = [...this.alerts];

    if (filters) {
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.event.severity === filters.severity);
      }
    }

    // Sort by creation time (newest first)
    alerts.sort((a, b) => b.createdAt - a.createdAt);

    if (filters?.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  /**
   * Update alert status
   */
  updateAlertStatus(alertId: string, status: SecurityAlert['status'], notes?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);

    if (!alert) {
      return false;
    }

    alert.status = status;
    alert.updatedAt = Date.now();

    if (notes) {
      alert.notes = notes;
    }

    logger.info(`Security alert updated: ${alertId}`, {
      status,
      notes,
    });

    return true;
  }

  /**
   * Get security summary
   */
  getSecuritySummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentAlerts: number;
    activeAlerts: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const now = Date.now();
    const recentThreshold = now - 3600000; // Last hour

    this.securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const recentEvents = this.securityEvents.filter(e => e.timestamp > recentThreshold);
    const recentAlerts = this.alerts.filter(a => a.createdAt > recentThreshold);
    const activeAlerts = this.alerts.filter(a => a.status === 'new' || a.status === 'investigating');

    // Calculate threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (activeAlerts.some(a => a.event.severity === 'critical')) {
      threatLevel = 'critical';
    } else if (activeAlerts.some(a => a.event.severity === 'high')) {
      threatLevel = 'high';
    } else if (recentEvents.length > 50 || activeAlerts.length > 5) {
      threatLevel = 'medium';
    }

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      recentAlerts: recentAlerts.length,
      activeAlerts: activeAlerts.length,
      threatLevel,
    };
  }

  /**
   * Cleanup old events and alerts
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - 86400000; // 24 hours ago
    this.securityEvents = this.securityEvents.filter(e => e.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.createdAt > cutoff);
  }

  /**
   * Get severity score for monitoring
   */
  private getSeverityScore(severity: SecurityEvent['severity']): number {
    const scores = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return scores[severity];
  }

  /**
   * Monitor for common attack patterns
   */
  detectAttackPatterns(input: string, context: Record<string, unknown> = {}): void {
    // SQL injection patterns
    const sqlPatterns = [
      /(\bselect\b|\bunion\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\balter\b)/i,
      /(--|#|\/\*|\*\/)/,
      /(\bor\b\s+\d+\s*=\s*\d+)/i,
      /(\band\b\s+\d+\s*=\s*\d+)/i,
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];

    const lowerInput = input.toLowerCase();

    // Check for SQL injection
    for (const pattern of sqlPatterns) {
      if (pattern.test(lowerInput)) {
        this.logSecurityEvent({
          type: 'sql_injection',
          severity: 'critical',
          description: 'Potential SQL injection attempt detected',
          source: 'input_validation',
          context: {
            input: input.substring(0, 100), // Truncate for logging
            pattern: pattern.toString(),
            ...context,
          },
          evidence: {
            matchedPattern: pattern.toString(),
            inputSnippet: input.substring(0, 200),
          },
        });
        break;
      }
    }

    // Check for XSS
    for (const pattern of xssPatterns) {
      if (pattern.test(lowerInput)) {
        this.logSecurityEvent({
          type: 'xss_attempt',
          severity: 'high',
          description: 'Potential XSS attempt detected',
          source: 'input_validation',
          context: {
            input: input.substring(0, 100),
            pattern: pattern.toString(),
            ...context,
          },
          evidence: {
            matchedPattern: pattern.toString(),
            inputSnippet: input.substring(0, 200),
          },
        });
        break;
      }
    }
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Export singleton and class for testing
export { SecurityMonitor };
export default securityMonitor;