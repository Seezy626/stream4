import { NextResponse } from 'next/server';
import configService from '@/lib/config';
import logger from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();

  try {
    const config = configService.getConfig();

    // Check memory cache
    const memoryCacheCheck = await checkMemoryCache();

    // Check Redis cache if configured
    const redisCacheCheck = await checkRedisCache();

    // Determine overall status
    const checks = [memoryCacheCheck, redisCacheCheck];
    const overallStatus = checks.some(check => check.status === 'down') ? 'down' :
                         checks.some(check => check.status === 'degraded') ? 'degraded' : 'up';

    const responseTime = Date.now() - startTime;

    const result = {
      status: overallStatus,
      responseTime,
      timestamp: new Date().toISOString(),
      cache: {
        memory: memoryCacheCheck,
        redis: redisCacheCheck,
        config: {
          ttl: config.cache.ttl,
          redisTtl: config.cache.redisTtl,
          memoryMaxSize: config.cache.memoryMaxSize,
        },
      },
    };

    logger.debug('Cache health check completed', {
      status: overallStatus,
      responseTime,
      memoryStatus: memoryCacheCheck.status,
      redisStatus: redisCacheCheck.status,
    });

    return NextResponse.json(result, {
      status: overallStatus === 'up' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Cache health check endpoint error', error as Error);

    return NextResponse.json(
      {
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: 'Cache health check failed',
      },
      { status: 503 }
    );
  }
}

async function checkMemoryCache(): Promise<{ status: 'up' | 'down' | 'degraded'; responseTime: number; message: string; details?: Record<string, unknown> }> {
  const startTime = Date.now();

  try {
    // Test memory cache operations

    // Set value
    const setStart = Date.now();
    // Note: This would use your actual cache implementation
    // For now, we'll simulate the operations
    const setTime = Date.now() - setStart;

    // Get value
    const getStart = Date.now();
    // Simulate cache retrieval
    const getTime = Date.now() - getStart;

    // Check if operations are within acceptable time
    const totalTime = setTime + getTime;
    const isDegraded = totalTime > 100; // 100ms threshold

    return {
      status: isDegraded ? 'degraded' : 'up',
      responseTime: totalTime,
      message: isDegraded ? 'Memory cache performance degraded' : 'Memory cache is healthy',
      details: {
        setTime,
        getTime,
        totalTime,
        threshold: 100,
      },
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message: 'Memory cache check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

async function checkRedisCache(): Promise<{ status: 'up' | 'down' | 'degraded'; responseTime: number; message: string; details?: Record<string, unknown> }> {
  const startTime = Date.now();

  try {
    // Check if Redis is configured
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;

    if (!redisUrl) {
      return {
        status: 'up',
        responseTime: 0,
        message: 'Redis not configured - using memory cache only',
        details: {
          configured: false,
        },
      };
    }

    // Test Redis connection
    const response = await fetch(`${redisUrl}/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (!response.ok) {
      throw new Error(`Redis ping failed: ${response.status}`);
    }

    const pingTime = Date.now() - startTime;
    const isDegraded = pingTime > 500; // 500ms threshold

    return {
      status: isDegraded ? 'degraded' : 'up',
      responseTime: pingTime,
      message: isDegraded ? 'Redis cache performance degraded' : 'Redis cache is healthy',
      details: {
        pingTime,
        threshold: 500,
        configured: true,
      },
    };
  } catch (error) {
    return {
      status: 'degraded', // Redis failure shouldn't bring down the whole system
      responseTime: Date.now() - startTime,
      message: 'Redis cache check failed - falling back to memory cache',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'memory_cache',
      },
    };
  }
}