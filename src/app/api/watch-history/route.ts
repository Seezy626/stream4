import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  addToWatchHistory,
  getUserWatchHistory,
  searchWatchHistory,
  getWatchHistoryStats,
  CreateWatchHistoryData,
  WatchHistoryQueryOptions
} from '@/lib/db/watch-history';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const sortBy = (searchParams.get('sortBy') as 'watched_at' | 'rating' | 'title') || 'watched_at';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const userId = session.user.id as string;

    let result;

    if (search) {
      // Search functionality
      result = await searchWatchHistory(userId, search, {
        limit,
        offset: (page - 1) * limit,
      });
    } else {
      // Regular watch history with filters
      const options: WatchHistoryQueryOptions = {
        userId,
        limit,
        offset: (page - 1) * limit,
        filters: {
          rating,
          year,
        },
        sortBy,
        sortOrder,
      };

      result = await getUserWatchHistory(userId, options);
    }

    return NextResponse.json({
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { movieId, watchedAt, rating, notes } = body;

    // Validation
    if (!movieId || !watchedAt) {
      return NextResponse.json(
        { error: 'Movie ID and watched date are required' },
        { status: 400 }
      );
    }

    if (rating !== undefined && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    const watchHistoryData: CreateWatchHistoryData = {
      userId,
      movieId: parseInt(movieId),
      watchedAt: new Date(watchedAt),
      rating,
      notes,
    };

    const watchHistoryItem = await addToWatchHistory(watchHistoryData);

    return NextResponse.json(watchHistoryItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to watch history:', error);
    return NextResponse.json(
      { error: 'Failed to add movie to watch history' },
      { status: 500 }
    );
  }
}

// Get watch history statistics
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    const stats = await getWatchHistoryStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching watch history stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch history statistics' },
      { status: 500 }
    );
  }
}