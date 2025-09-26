import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  try {
    const logEntry: LogEntry = await request.json();

    // Validate required fields
    if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
      return NextResponse.json(
        { error: 'Invalid log entry: missing required fields' },
        { status: 400 }
      );
    }

    // Validate log level
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(logEntry.level)) {
      return NextResponse.json(
        { error: 'Invalid log level' },
        { status: 400 }
      );
    }

    // Add server-side context
    const enrichedLogEntry = {
      ...logEntry,
      serverTimestamp: new Date().toISOString(),
      ip: (request as unknown as { ip?: string }).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: logEntry.userAgent || request.headers.get('user-agent') || undefined,
    };

    // Log to our logger (which will handle console output and external monitoring)
    switch (logEntry.level) {
      case 'debug':
        logger.debug(logEntry.message, { ...logEntry.context, serverContext: enrichedLogEntry });
        break;
      case 'info':
        logger.info(logEntry.message, { ...logEntry.context, serverContext: enrichedLogEntry });
        break;
      case 'warn':
        logger.warn(logEntry.message, { ...logEntry.context, serverContext: enrichedLogEntry });
        break;
      case 'error':
        logger.error(logEntry.message, logEntry.error, { ...logEntry.context, serverContext: enrichedLogEntry });
        break;
    }

    // Store in database for analysis (optional - could be expensive)
    if (process.env.NODE_ENV === 'production' && logEntry.level !== 'debug') {
      await storeLogInDatabase(enrichedLogEntry);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error processing log entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Store log entry in database for analysis
async function storeLogInDatabase(logEntry: LogEntry & { serverTimestamp: string; ip: string }) {
  try {
    // This would typically use your database client
    // For now, we'll just log it to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Would store log in database:', logEntry);
      return;
    }

    // TODO: Implement actual database storage
    // Example with a logging table:
    /*
    await db.insert(logsTable).values({
      level: logEntry.level,
      message: logEntry.message,
      timestamp: logEntry.timestamp,
      context: logEntry.context,
      error: logEntry.error?.message,
      stack: logEntry.error?.stack,
      userId: logEntry.userId,
      sessionId: logEntry.sessionId,
      url: logEntry.url,
      userAgent: logEntry.userAgent,
      ip: logEntry.ip,
      serverTimestamp: logEntry.serverTimestamp,
    });
    */
  } catch (error) {
    console.error('Error storing log in database:', error);
    // Don't throw - we don't want logging errors to break the app
  }
}

// Health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'logging-service',
    });
  } catch {
    return NextResponse.json(
      { error: 'Logging service unavailable' },
      { status: 503 }
    );
  }
}