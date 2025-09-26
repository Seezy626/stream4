import { NextResponse } from 'next/server';
import configService from '@/lib/config';
import logger from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();

  try {
    const config = configService.getConfig();

    // Check memory usage
    const memoryCheck = await checkMemoryUsage();

    const responseTime = Date.now() - startTime;

    const result = {
      status: memoryCheck.status,
      responseTime,
      timestamp: new Date().toISOString(),
      memory: memoryCheck,
      thresholds: {
        warning: 0.8, // 80% usage
        critical: 0.9, // 90% usage
      },
    };

    logger.debug('Memory health check completed', {
      status: memoryCheck.status,
      responseTime,
      usage: memoryCheck.details?.usage,
    });

    return NextResponse.json(result, {
      status: memoryCheck.status === 'up' ? 200 : 200, // Always return 200 for memory
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Memory health check endpoint error', error);

    return NextResponse.json(
      {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: 'Memory health check failed',
      },
      { status: 200 }
    );
  }
}

async function checkMemoryUsage(): Promise<{ status: 'up' | 'down' | 'degraded'; responseTime: number; message: string; details?: any }> {
  const startTime = Date.now();

  try {
    // Get memory usage information
    const memoryInfo = await getMemoryUsage();
    const usage = memoryInfo.used / memoryInfo.total;
    const responseTime = Date.now() - startTime;

    // Determine status based on usage thresholds
    let status: 'up' | 'down' | 'degraded' = 'up';
    let message = 'Memory usage is normal';

    if (usage >= 0.9) {
      status = 'down';
      message = 'Critical memory usage';
    } else if (usage >= 0.8) {
      status = 'degraded';
      message = 'High memory usage';
    }

    return {
      status,
      responseTime,
      message,
      details: {
        usage,
        used: memoryInfo.used,
        available: memoryInfo.available,
        total: memoryInfo.total,
        usedPercentage: Math.round(usage * 100),
        availablePercentage: Math.round((memoryInfo.available / memoryInfo.total) * 100),
        thresholds: {
          warning: 0.8,
          critical: 0.9,
        },
        breakdown: memoryInfo.breakdown,
      },
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      message: 'Memory usage check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Memory monitoring may not be available in this environment',
      },
    };
  }
}

async function getMemoryUsage(): Promise<{
  used: number;
  available: number;
  total: number;
  breakdown?: Record<string, number>;
}> {
  // This is a mock implementation for demonstration
  // In a real implementation, you would use:
  // - Node.js process.memoryUsage() for server-side
  // - Performance API for browser
  // - System monitoring APIs for server environments

  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      // Mock memory usage data
      const total = 1024 * 1024 * 1024; // 1GB total
      const used = 512 * 1024 * 1024; // 512MB used
      const available = total - used;

      resolve({
        used,
        available,
        total,
        breakdown: {
          rss: used * 0.7, // Resident Set Size
          heapTotal: total * 0.6,
          heapUsed: used * 0.6,
          external: used * 0.1,
          arrayBuffers: used * 0.05,
        },
      });
    }, 100);
  });
}