import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWatchHistoryById,
  updateWatchHistory,
  deleteWatchHistory,
  UpdateWatchHistoryData
} from '@/lib/db/watch-history';

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
    const watchHistoryId = parseInt(id);

    if (isNaN(watchHistoryId)) {
      return NextResponse.json(
        { error: 'Invalid watch history ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const watchHistoryItem = await getWatchHistoryById(watchHistoryId);

    // Check if the watch history belongs to the authenticated user
    if (watchHistoryItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(watchHistoryItem);
  } catch (error) {
    console.error('Error fetching watch history item:', error);

    if (error instanceof Error && error.message === 'Watch history entry not found') {
      return NextResponse.json(
        { error: 'Watch history entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch watch history item' },
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
    const watchHistoryId = parseInt(id);

    if (isNaN(watchHistoryId)) {
      return NextResponse.json(
        { error: 'Invalid watch history ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { watchedAt, rating, notes } = body;

    // Validation
    if (rating !== undefined && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id as string);

    // First check if the watch history belongs to the authenticated user
    const existingItem = await getWatchHistoryById(watchHistoryId);
    if (existingItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const updateData: UpdateWatchHistoryData = {
      watchedAt: watchedAt ? new Date(watchedAt) : undefined,
      rating,
      notes,
    };

    const updatedItem = await updateWatchHistory(watchHistoryId, updateData);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating watch history item:', error);

    if (error instanceof Error && error.message === 'Watch history entry not found') {
      return NextResponse.json(
        { error: 'Watch history entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update watch history item' },
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
    const watchHistoryId = parseInt(id);

    if (isNaN(watchHistoryId)) {
      return NextResponse.json(
        { error: 'Invalid watch history ID' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id as string);

    // First check if the watch history belongs to the authenticated user
    const existingItem = await getWatchHistoryById(watchHistoryId);
    if (existingItem.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await deleteWatchHistory(watchHistoryId);

    return NextResponse.json({ message: 'Watch history entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting watch history item:', error);

    if (error instanceof Error && error.message === 'Watch history entry not found') {
      return NextResponse.json(
        { error: 'Watch history entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete watch history item' },
      { status: 500 }
    );
  }
}