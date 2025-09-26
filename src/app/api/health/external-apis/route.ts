import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

interface ApiHealthCheck {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  message: string;
  details?: Record<string, unknown>;
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Check TMDB API
    const tmdbCheck = await checkTmdbApi();

    // Check other external APIs as needed
    const otherApisChecks: ApiHealthCheck[] = [];

    // Add more API checks here as needed
    // const anotherApiCheck = await checkAnotherApi();

    const allChecks = [tmdbCheck, ...otherApisChecks];

    // Determine overall status
    const overallStatus = allChecks.some(check => check.status === 'down') ? 'down' :
                         allChecks.some(check => check.status === 'degraded') ? 'degraded' : 'up';

    const responseTime = Date.now() - startTime;

    const result = {
      status: overallStatus,
      responseTime,
      timestamp: new Date().toISOString(),
      externalApis: {
        checks: allChecks,
        summary: {
          total: allChecks.length,
          up: allChecks.filter(c => c.status === 'up').length,
          degraded: allChecks.filter(c => c.status === 'degraded').length,
          down: allChecks.filter(c => c.status === 'down').length,
        },
      },
    };

    logger.debug('External APIs health check completed', {
      status: overallStatus,
      responseTime,
      totalApis: allChecks.length,
      upCount: allChecks.filter(c => c.status === 'up').length,
    });

    return NextResponse.json(result, {
      status: overallStatus === 'up' ? 200 : overallStatus === 'degraded' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('External APIs health check endpoint error', error as Error);

    return NextResponse.json(
      {
        status: 'down',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: 'External APIs health check failed',
      },
      { status: 503 }
    );
  }
}

async function checkTmdbApi(): Promise<ApiHealthCheck> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    if (!apiKey) {
      return {
        name: 'TMDB API',
        status: 'down',
        responseTime: 0,
        message: 'TMDB API key not configured',
        details: {
          configured: false,
        },
      };
    }

    // Test TMDB API with a simple search
    const searchQuery = 'test';
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}&page=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`TMDB API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check response time
    const isDegraded = responseTime > 2000; // 2 second threshold

    return {
      name: 'TMDB API',
      status: isDegraded ? 'degraded' : 'up',
      responseTime,
      message: isDegraded ? 'TMDB API response time degraded' : 'TMDB API is healthy',
      details: {
        statusCode: response.status,
        resultCount: data.results?.length || 0,
        totalResults: data.total_results || 0,
        threshold: 2000,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      name: 'TMDB API',
      status: 'down',
      responseTime,
      message: 'TMDB API is unavailable',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        configured: !!process.env.NEXT_PUBLIC_TMDB_API_KEY,
      },
    };
  }
}

// Add more API health checks as needed
// async function checkAnotherApi(): Promise<ApiHealthCheck> {
//   const startTime = Date.now();
//
//   try {
//     // Implement health check for another API
//     const response = await fetch('https://api.example.com/health', {
//       method: 'GET',
//       signal: AbortSignal.timeout(5000),
//     });
//
//     const responseTime = Date.now() - startTime;
//     const isDegraded = responseTime > 1000;
//
//     return {
//       name: 'Another API',
//       status: isDegraded ? 'degraded' : 'up',
//       responseTime,
//       message: isDegraded ? 'API response time degraded' : 'API is healthy',
//       details: {
//         statusCode: response.status,
//       },
//     };
//   } catch (error) {
//     return {
//       name: 'Another API',
//       status: 'down',
//       responseTime: Date.now() - startTime,
//       message: 'API is unavailable',
//       details: {
//         error: error instanceof Error ? error.message : 'Unknown error',
//       },
//     };
//   }
// }