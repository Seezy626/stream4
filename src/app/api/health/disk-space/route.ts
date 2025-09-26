import { NextResponse } from 'next/server';
import configService from '@/lib/config';
import logger from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check disk space (server-side only)
    const diskSpaceCheck = await checkDiskSpace();

    const responseTime = Date.now() - startTime;

    const result = {
      status: diskSpaceCheck.status,
      responseTime,
      timestamp: new Date().toISOString(),
      diskSpace: diskSpaceCheck,
      thresholds: {
        warning: 0.8, // 80% usage
        critical: 0.9, // 90% usage
      },
    };

    logger.debug('Disk space health check completed', {
      status: diskSpaceCheck.status,
      responseTime,
      usage: diskSpaceCheck.details?.usage,
    });

    return NextResponse.json(result, {
      status: diskSpaceCheck.status === 'up' ? 200 : 200, // Always return 200 for disk space
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Disk space health check endpoint error', error as Error);

    return NextResponse.json(
      {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: 'Disk space health check failed',
      },
      { status: 200 }
    );
  }
}

async function checkDiskSpace(): Promise<{ status: 'up' | 'down' | 'degraded'; responseTime: number; message: string; details?: Record<string, unknown> }> {
  const startTime = Date.now();

  try {
    // Get disk usage information
    // Note: This is a simplified implementation for demonstration
    // In a real server environment, you would use system calls or file system APIs

    // For Vercel deployments, disk space is managed by the platform
    // This check would be more relevant for self-hosted deployments

    const diskInfo = await getDiskSpaceInfo();
    const usage = diskInfo.used / diskInfo.total;
    const responseTime = Date.now() - startTime;

    // Determine status based on usage thresholds
    let status: 'up' | 'down' | 'degraded' = 'up';
    let message = 'Disk space usage is normal';

    if (usage >= 0.9) {
      status = 'down';
      message = 'Critical disk space usage';
    } else if (usage >= 0.8) {
      status = 'degraded';
      message = 'High disk space usage';
    }

    return {
      status,
      responseTime,
      message,
      details: {
        usage,
        used: diskInfo.used,
        available: diskInfo.available,
        total: diskInfo.total,
        usedPercentage: Math.round(usage * 100),
        availablePercentage: Math.round((diskInfo.available / diskInfo.total) * 100),
        thresholds: {
          warning: 0.8,
          critical: 0.9,
        },
      },
    };
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      message: 'Disk space check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Disk space monitoring may not be available in this environment',
      },
    };
  }
}

async function getDiskSpaceInfo(): Promise<{ used: number; available: number; total: number }> {
  // This is a mock implementation for demonstration
  // In a real implementation, you would use:
  // - Node.js fs module for local file system
  // - System calls for server environments
  // - Cloud provider APIs for cloud deployments

  // For Vercel, disk space is managed by the platform
  // This would return mock data or actual platform metrics

  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      resolve({
        used: 1024 * 1024 * 1024, // 1GB used
        available: 4 * 1024 * 1024 * 1024, // 4GB available
        total: 5 * 1024 * 1024 * 1024, // 5GB total
      });
    }, 100);
  });
}