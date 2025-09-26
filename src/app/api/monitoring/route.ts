import { NextRequest, NextResponse } from 'next/server';
import monitoring from '@/lib/monitoring';

interface MonitoringEvent {
  type: 'error' | 'performance' | 'user_event';
  data: Record<string, unknown>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: MonitoringEvent = await request.json();

    // Validate required fields
    if (!event.type || !event.data || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid monitoring event: missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes = ['error', 'performance', 'user_event'];
    if (!validTypes.includes(event.type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Process the event based on type
    switch (event.type) {
      case 'error':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monitoring.captureError(event.data as any);
        break;
      case 'performance':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monitoring.capturePerformance(event.data as any);
        break;
      case 'user_event':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monitoring.trackUserEvent(event.data as any);
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error processing monitoring event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Health check endpoint
    const health = await monitoring.healthCheck();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'monitoring-service',
      health,
    });
  } catch {
    return NextResponse.json(
      { error: 'Monitoring service unavailable' },
      { status: 503 }
    );
  }
}