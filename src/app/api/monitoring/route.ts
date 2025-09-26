import { NextRequest, NextResponse } from 'next/server';
import monitoring from '@/lib/monitoring';

interface MonitoringEvent {
  type: 'error' | 'performance' | 'user_event';
  data: any;
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
        monitoring.captureError(event.data);
        break;
      case 'performance':
        monitoring.capturePerformance(event.data);
        break;
      case 'user_event':
        monitoring.trackUserEvent(event.data);
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Monitoring service unavailable' },
      { status: 503 }
    );
  }
}