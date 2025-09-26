import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import rateLimitService from '@/lib/rate-limit';

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Generate unique identifier for rate limiting
    const identifier = `${ip}:${userAgent}`;

    // Apply rate limiting to API routes
    if (pathname.startsWith('/api/')) {
      let rateLimitResult;

      // Different rate limits for different API endpoints
      if (pathname.startsWith('/api/auth/')) {
        rateLimitResult = await rateLimitService.checkAuth(identifier);
      } else if (pathname.includes('/search') || pathname.includes('/discover')) {
        rateLimitResult = await rateLimitService.checkSearchApi(identifier);
      } else if (pathname.includes('/tmdb/')) {
        rateLimitResult = await rateLimitService.checkTMDB(identifier);
      } else {
        rateLimitResult = await rateLimitService.checkGeneralApi(identifier);
      }

      // Check if rate limit exceeded
      if (!rateLimitResult.success) {
        const resetDate = new Date(rateLimitResult.resetTime);
        const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter,
            resetTime: resetDate.toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.isBlocked
                ? '0'
                : String(
                    pathname.startsWith('/api/auth/') ? 5 :
                    pathname.includes('/search') || pathname.includes('/discover') ? 30 :
                    pathname.includes('/tmdb/') ? 40 : 100
                  ),
              'X-RateLimit-Remaining': String(rateLimitResult.remainingRequests),
              'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
              'Retry-After': String(retryAfter),
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set(
        'X-RateLimit-Limit',
        pathname.startsWith('/api/auth/') ? '5' :
        pathname.includes('/search') || pathname.includes('/discover') ? '30' :
        pathname.includes('/tmdb/') ? '40' : '100'
      );
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remainingRequests));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));

      return response;
    }

    // Add security headers for all requests
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/auth/error',
          '/auth/verify-request',
          '/api/auth',
        ];

        // Check if the current path is public
        const isPublicRoute = publicRoutes.some(route =>
          pathname === route || pathname.startsWith(route)
        );

        // Allow access to public routes
        if (isPublicRoute) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};