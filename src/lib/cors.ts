import { NextRequest, NextResponse } from 'next/server';

interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_OPTIONS: Required<CorsOptions> = {
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
    'X-Page-Count',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

class CorsHandler {
  private options: Required<CorsOptions>;

  constructor(options: CorsOptions = {}) {
    this.options = { ...DEFAULT_CORS_OPTIONS, ...options };

    // Add production origin if available
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
      if (Array.isArray(this.options.origin)) {
        this.options.origin.push(process.env.NEXT_PUBLIC_APP_URL);
      }
    }
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string): boolean {
    if (this.options.origin.includes('*')) {
      return true;
    }

    return this.options.origin.includes(origin);
  }

  /**
   * Handle preflight OPTIONS request
   */
  handlePreflight(request: NextRequest): NextResponse {
    const origin = request.headers.get('origin') || '';
    const requestMethod = request.headers.get('access-control-request-method') || '';

    // Check if origin is allowed
    if (!this.isOriginAllowed(origin)) {
      return new NextResponse('CORS origin not allowed', { status: 403 });
    }

    // Check if method is allowed
    if (!this.options.methods.includes(requestMethod)) {
      return new NextResponse('CORS method not allowed', { status: 405 });
    }

    const response = new NextResponse(null, { status: 200 });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', this.options.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Expose-Headers', this.options.exposedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', String(this.options.maxAge));

    if (this.options.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  /**
   * Add CORS headers to response
   */
  addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin') || '';

    // Check if origin is allowed
    if (!this.isOriginAllowed(origin)) {
      return response;
    }

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', this.options.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Expose-Headers', this.options.exposedHeaders.join(', '));

    if (this.options.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  /**
   * Create CORS-enabled response
   */
  createCorsResponse(
    request: NextRequest,
    data: unknown,
    status: number = 200,
    headers: Record<string, string> = {}
  ): NextResponse {
    const response = NextResponse.json(data, { status });

    // Add custom headers
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return this.addCorsHeaders(request, response);
  }

  /**
   * Create CORS error response
   */
  createCorsError(
    request: NextRequest,
    message: string,
    status: number = 400,
    headers: Record<string, string> = {}
  ): NextResponse {
    return this.createCorsResponse(request, { error: message }, status, headers);
  }

  /**
   * Update CORS options
   */
  updateOptions(newOptions: Partial<CorsOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current CORS options
   */
  getOptions(): Required<CorsOptions> {
    return { ...this.options };
  }
}

// Pre-configured CORS handlers for different use cases
class CorsService {
  // General API CORS handler
  private generalApiCors = new CorsHandler({
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_APP_URL || ''].filter(Boolean)
      : ['http://localhost:3000', 'https://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Public API CORS handler (no credentials)
  private publicApiCors = new CorsHandler({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    credentials: false,
  });

  // Authentication API CORS handler
  private authApiCors = new CorsHandler({
    origin: process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_APP_URL || ''].filter(Boolean)
      : ['http://localhost:3000', 'https://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 300, // Shorter cache for auth endpoints
  });

  /**
   * Handle CORS for general API endpoints
   */
  handleGeneralApi(request: NextRequest, response?: NextResponse): NextResponse | void {
    if (request.method === 'OPTIONS') {
      return this.generalApiCors.handlePreflight(request);
    }

    if (response) {
      return this.generalApiCors.addCorsHeaders(request, response);
    }
  }

  /**
   * Handle CORS for public API endpoints
   */
  handlePublicApi(request: NextRequest, response?: NextResponse): NextResponse | void {
    if (request.method === 'OPTIONS') {
      return this.publicApiCors.handlePreflight(request);
    }

    if (response) {
      return this.publicApiCors.addCorsHeaders(request, response);
    }
  }

  /**
   * Handle CORS for authentication API endpoints
   */
  handleAuthApi(request: NextRequest, response?: NextResponse): NextResponse | void {
    if (request.method === 'OPTIONS') {
      return this.authApiCors.handlePreflight(request);
    }

    if (response) {
      return this.authApiCors.addCorsHeaders(request, response);
    }
  }

  /**
   * Create CORS response for general API
   */
  createGeneralApiResponse(
    request: NextRequest,
    data: unknown,
    status: number = 200,
    headers: Record<string, string> = {}
  ): NextResponse {
    return this.generalApiCors.createCorsResponse(request, data, status, headers);
  }

  /**
   * Create CORS response for public API
   */
  createPublicApiResponse(
    request: NextRequest,
    data: unknown,
    status: number = 200,
    headers: Record<string, string> = {}
  ): NextResponse {
    return this.publicApiCors.createCorsResponse(request, data, status, headers);
  }

  /**
   * Create CORS response for auth API
   */
  createAuthApiResponse(
    request: NextRequest,
    data: unknown,
    status: number = 200,
    headers: Record<string, string> = {}
  ): NextResponse {
    return this.authApiCors.createCorsResponse(request, data, status, headers);
  }

  /**
   * Create CORS error response
   */
  createCorsError(
    request: NextRequest,
    message: string,
    status: number = 400,
    corsType: 'general' | 'public' | 'auth' = 'general'
  ): NextResponse {
    const handler = corsType === 'public' ? this.publicApiCors :
                   corsType === 'auth' ? this.authApiCors : this.generalApiCors;

    return handler.createCorsError(request, message, status);
  }
}

// Create singleton instance
const corsService = new CorsService();

// Export singleton and classes for testing
export { CorsHandler, CorsService };
export default corsService;