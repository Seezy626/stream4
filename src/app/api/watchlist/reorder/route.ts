import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reorderWatchlist } from '@/lib/db/watchlist';

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
    const { orderedIds } = body;

    // Validation
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds must be an array' },
        { status: 400 }
      );
    }

    if (orderedIds.length === 0) {
      return NextResponse.json(
        { error: 'orderedIds array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate that all IDs are numbers
    for (const id of orderedIds) {
      if (typeof id !== 'number' || isNaN(id)) {
        return NextResponse.json(
          { error: 'All IDs in orderedIds must be valid numbers' },
          { status: 400 }
        );
      }
    }

    const userId = parseInt(session.user.id as string);

    // TODO: Add user authorization check for each item
    // For now, we'll assume all items belong to the authenticated user

    const results = await reorderWatchlist(userId, orderedIds);

    return NextResponse.json({
      message: 'Watchlist reordered successfully',
      items: results
    });
  } catch (error) {
    console.error('Error reordering watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to reorder watchlist' },
      { status: 500 }
    );
  }
}