import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { bulkUpdatePriorities } from '@/lib/db/watchlist';

interface BulkPriorityUpdate {
  id: number;
  priority: 'low' | 'medium' | 'high';
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    // Validation
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.id || !['low', 'medium', 'high'].includes(update.priority)) {
        return NextResponse.json(
          { error: 'Each update must have id and valid priority (low, medium, high)' },
          { status: 400 }
        );
      }
    }

    const userId = parseInt(session.user.id as string);

    // TODO: Add user authorization check for each item
    // For now, we'll assume all items belong to the authenticated user

    const results = await bulkUpdatePriorities(userId, updates);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error bulk updating priorities:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update priorities' },
      { status: 500 }
    );
  }
}