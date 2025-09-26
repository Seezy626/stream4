import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import configService from '@/lib/config';
import logger from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();

  try {
    const config = configService.getConfig();

    // Check database connection
    let connectionCheck: { status: string; message: string; details?: Record<string, unknown> } = { status: 'down', message: 'Database connection failed' };

    try {
      // Test database connection with a simple query
      const result = await sql`SELECT 1 as test, NOW() as timestamp`;
      connectionCheck = {
        status: 'up',
        message: 'Database connection successful',
        details: {
          testResult: result.rows[0],
          queryTime: Date.now() - startTime,
        },
      };
    } catch (dbError) {
      logger.error('Database health check failed', dbError as Error);
      connectionCheck = {
        status: 'down',
        message: 'Database connection failed',
        details: {
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
      };
    }

    // Check database performance
    let performanceCheck: { status: string; message: string; details?: Record<string, unknown> } = { status: 'up', message: 'Database performance normal' };

    try {
      const perfStart = Date.now();
      await sql`SELECT COUNT(*) FROM information_schema.tables`;
      const perfTime = Date.now() - perfStart;

      if (perfTime > 1000) { // 1 second threshold
        performanceCheck = {
          status: 'degraded',
          message: 'Database performance degraded',
          details: { queryTime: perfTime },
        };
      }
    } catch (perfError) {
      logger.warn('Database performance check failed', { error: perfError instanceof Error ? perfError.message : 'Performance check error' });
      performanceCheck = {
        status: 'degraded',
        message: 'Database performance check failed',
        details: {
          error: perfError instanceof Error ? perfError.message : 'Performance check error',
        },
      };
    }

    // Determine overall status
    const overallStatus = connectionCheck.status === 'down' ? 'down' :
                         performanceCheck.status === 'degraded' ? 'degraded' : 'up';

    const responseTime = Date.now() - startTime;

    const result = {
      status: overallStatus,
      responseTime,
      timestamp: new Date().toISOString(),
      database: {
        connection: connectionCheck,
        performance: performanceCheck,
        config: {
          connectionTimeout: config.database.connectionTimeout,
          queryTimeout: config.database.queryTimeout,
          maxConnections: config.database.maxConnections,
        },
      },
    };

    logger.debug('Database health check completed', {
      status: overallStatus,
      responseTime,
      connectionStatus: connectionCheck.status,
      performanceStatus: performanceCheck.status,
    });

    return NextResponse.json(result, {
      status: overallStatus === 'up' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Database health check endpoint error', error as Error);

    return NextResponse.json(
      {
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: 'Database health check failed',
      },
      { status: 503 }
    );
  }
}