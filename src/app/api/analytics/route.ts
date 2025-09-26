import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import configService from '@/lib/config';

// Analytics event schema
const analyticsEventSchema = z.object({
  name: z.string(),
  properties: z.record(z.any()).optional(),
  timestamp: z.string(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  page: z.string().optional(),
  userAgent: z.string().optional(),
  environment: z.string().optional(),
  appVersion: z.string().optional(),
});

const analyticsPayloadSchema = z.object({
  events: z.array(analyticsEventSchema),
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

// In-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  clientData.count++;
  return false;
}

function getClientId(request: NextRequest): string {
  // Use IP address as client identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

  return clientIp;
}

export async function POST(request: NextRequest) {
  try {
    const config = configService.getConfig();

    // Check if analytics is enabled
    if (!config.monitoring.enabled) {
      logger.warn('Analytics endpoint called but analytics is disabled');
      return NextResponse.json(
        { error: 'Analytics not enabled' },
        { status: 403 }
      );
    }

    // Rate limiting
    const clientId = getClientId(request);
    if (isRateLimited(clientId)) {
      logger.warn('Rate limit exceeded for analytics', { clientId });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = analyticsPayloadSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Invalid analytics payload', {
        errors: validationResult.error.errors,
        clientId,
      });
      return NextResponse.json(
        { error: 'Invalid payload', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { events } = validationResult.data;

    // Log analytics events
    logger.info('Analytics events received', {
      eventCount: events.length,
      clientId,
      firstEvent: events[0]?.name,
      lastEvent: events[events.length - 1]?.name,
    });

    // Process events based on type
    for (const event of events) {
      await processAnalyticsEvent(event);
    }

    // Store events in database (if configured)
    if (config.monitoring.monitoringEndpoint?.startsWith('/api/')) {
      await storeEventsInDatabase(events);
    }

    // Send to external analytics services if configured
    await sendToExternalAnalytics(events);

    return NextResponse.json({
      success: true,
      processed: events.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Analytics endpoint error', error, {
      url: request.url,
      method: request.method,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAnalyticsEvent(event: z.infer<typeof analyticsEventSchema>): Promise<void> {
  const { name, properties, timestamp } = event;

  // Add environment and app version if not present
  const enrichedEvent = {
    ...event,
    environment: event.environment || configService.getConfig().app.environment,
    appVersion: event.appVersion || configService.getConfig().app.version,
  };

  // Process based on event type
  switch (name) {
    case 'page_view':
      await processPageViewEvent(enrichedEvent);
      break;
    case 'user_action':
      await processUserActionEvent(enrichedEvent);
      break;
    case 'error':
      await processErrorEvent(enrichedEvent);
      break;
    case 'performance':
      await processPerformanceEvent(enrichedEvent);
      break;
    default:
      await processCustomEvent(enrichedEvent);
      break;
  }
}

async function processPageViewEvent(event: any): Promise<void> {
  logger.debug('Processing page view event', {
    page: event.properties?.page,
    title: event.properties?.title,
    sessionId: event.sessionId,
  });

  // Store page view analytics
  // This could be used for analytics dashboards, A/B testing, etc.
}

async function processUserActionEvent(event: any): Promise<void> {
  logger.debug('Processing user action event', {
    action: event.properties?.action,
    category: event.properties?.category,
    sessionId: event.sessionId,
  });

  // Store user action analytics
  // This could be used for feature usage tracking, conversion funnels, etc.
}

async function processErrorEvent(event: any): Promise<void> {
  logger.warn('Processing error event', {
    error: event.properties?.error,
    message: event.properties?.message,
    severity: event.properties?.severity,
    sessionId: event.sessionId,
  });

  // Store error analytics
  // This could be used for error tracking, alerting, etc.
}

async function processPerformanceEvent(event: any): Promise<void> {
  logger.debug('Processing performance event', {
    metric: event.properties?.metric,
    value: event.properties?.value,
    unit: event.properties?.unit,
    sessionId: event.sessionId,
  });

  // Store performance analytics
  // This could be used for performance monitoring, alerting, etc.
}

async function processCustomEvent(event: any): Promise<void> {
  logger.debug('Processing custom event', {
    name: event.name,
    properties: event.properties,
    sessionId: event.sessionId,
  });

  // Store custom event analytics
}

async function storeEventsInDatabase(events: any[]): Promise<void> {
  try {
    // Store events in database for internal analytics
    // This would typically involve inserting into an analytics table
    logger.debug('Storing events in database', { eventCount: events.length });
  } catch (error) {
    logger.error('Failed to store events in database', error);
  }
}

async function sendToExternalAnalytics(events: any[]): Promise<void> {
  try {
    const config = configService.getConfig();

    // Send to external analytics services if configured
    if (config.monitoring.analyticsId) {
      // Send to Google Analytics
      await sendToGoogleAnalytics(events);
    }

    // Send to other external services as needed
  } catch (error) {
    logger.error('Failed to send events to external analytics', error);
  }
}

async function sendToGoogleAnalytics(events: any[]): Promise<void> {
  try {
    // Send events to Google Analytics Measurement Protocol
    // This is a simplified implementation - in production you'd want to batch these
    for (const event of events) {
      // Implementation would depend on your Google Analytics setup
      logger.debug('Sending event to Google Analytics', {
        name: event.name,
        sessionId: event.sessionId,
      });
    }
  } catch (error) {
    logger.error('Failed to send events to Google Analytics', error);
  }
}

// Health check endpoint
export async function GET() {
  try {
    const config = configService.getConfig();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      analytics: {
        enabled: config.monitoring.enabled,
        hasGoogleAnalytics: !!config.monitoring.analyticsId,
        hasCustomEndpoint: !!config.monitoring.monitoringEndpoint,
      },
      rateLimiting: {
        windowMs: RATE_LIMIT_WINDOW_MS,
        maxRequests: RATE_LIMIT_MAX_REQUESTS,
      },
    });
  } catch (error) {
    logger.error('Analytics health check failed', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 500 }
    );
  }
}