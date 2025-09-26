import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWatchlistById,
  updateWatchlist,
  updateWatchlistPriority,
  removeFromWatchlist,
  UpdateWatchlistData
} from '@/lib/db/watchlist';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const watchlistId = parseInt(id);

    if (isNaN(watchlistId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;
    const watchlistItem = await getWatchlistById(watchlistId);

    // Check if the watchlist item belongs to the authenticated user
    if (watchlistItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(watchlistItem);
  } catch (error) {
    console.error('Error fetching watchlist item:', error);

    if (error instanceof Error && error.message === 'Watchlist entry not found') {
      return NextResponse.json(
        { error: 'Watchlist entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch watchlist item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const watchlistId = parseInt(id);

    if (isNaN(watchlistId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { priority } = body;

    // Validation
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be low, medium, or high' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // First check if the watchlist item belongs to the authenticated user
    const existingItem = await getWatchlistById(watchlistId);
    if (existingItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let updatedItem;

    if (priority) {
      // Use the specific priority update function
      updatedItem = await updateWatchlistPriority(watchlistId, priority);
    } else {
      // Use general update function for other fields
      const updateData: UpdateWatchlistData = {
        priority,
      };

      updatedItem = await updateWatchlist(watchlistId, updateData);
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating watchlist item:', error);

    if (error instanceof Error && error.message === 'Watchlist entry not found') {
      return NextResponse.json(
        { error: 'Watchlist entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update watchlist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const watchlistId = parseInt(id);

    if (isNaN(watchlistId)) {
      return NextResponse.json(
        { error: 'Invalid watchlist ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // First check if the watchlist item belongs to the authenticated user
    const existingItem = await getWatchlistById(watchlistId);
    if (existingItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await removeFromWatchlist(watchlistId);

    return NextResponse.json({ message: 'Watchlist entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting watchlist item:', error);

    if (error instanceof Error && error.message === 'Watchlist entry not found') {
      return NextResponse.json(
        { error: 'Watchlist entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete watchlist item' },
      { status: 500 }
    );
  }
}