import { NextRequest, NextResponse } from 'next/server';
import healthCheckService from '@/lib/health-check';
import configService from '@/lib/config';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const config = configService.getConfig();
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';
    const format = url.searchParams.get('format') || 'json';

    // Perform health check
    const healthResult = await healthCheckService.performHealthCheck();

    // Add request-specific information
    const responseTime = Date.now() - startTime;
    const enhancedResult = {
      ...healthResult,
      request: {
        responseTime,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        format,
        detailed,
      },
    };

    // Log health check request
    logger.debug('Health check requested', {
      status: healthResult.status,
      responseTime,
      format,
      detailed,
      environment: config.app.environment,
    });

    // Return response based on format
    if (format === 'simple') {
      // Simple format for load balancers and monitoring systems
      return new NextResponse(
        healthResult.status === 'healthy' ? 'OK' : 'NOT OK',
        {
          status: healthResult.status === 'healthy' ? 200 : 503,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    // JSON format
    const statusCode = healthResult.status === 'healthy' ? 200 :
                      healthResult.status === 'degraded' ? 200 : 503;

    const response = NextResponse.json(
      detailed ? await healthCheckService.getDetailedStatus() : enhancedResult,
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Health-Status': healthResult.status,
          'X-Response-Time': responseTime.toString(),
        },
      }
    );

    return response;

  } catch (error) {
    logger.error('Health check endpoint error', error as Error, {
      url: request.url,
      method: request.method,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        responseTime: Date.now() - startTime,
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// Handle HEAD requests for simple health checks
export async function HEAD(_request: NextRequest) {
  try {
    const healthResult = await healthCheckService.performHealthCheck();
    const statusCode = healthResult.status === 'healthy' ? 200 :
                      healthResult.status === 'degraded' ? 200 : 503;

    return new NextResponse(null, {
      status: statusCode,
      headers: {
        'X-Health-Status': healthResult.status,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Health check HEAD error', error as Error);
    return new NextResponse(null, { status: 503 });
  }
}