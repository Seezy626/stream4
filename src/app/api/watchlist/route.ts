import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  addToWatchlist,
  getUserWatchlist,
  searchWatchlist,
  getWatchlistStats,
  CreateWatchlistData,
  WatchlistQueryOptions
} from '@/lib/db/watchlist';

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
    const priority = searchParams.get('priority') as 'low' | 'medium' | 'high' | undefined;
    const sortBy = (searchParams.get('sortBy') as 'added_at' | 'priority' | 'title') || 'added_at';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const userId = session.user.id as string;

    let result;

    if (search) {
      // Search functionality
      result = await searchWatchlist(userId, search, {
        limit,
        offset: (page - 1) * limit,
      });
    } else {
      // Regular watchlist with filters
      const options: WatchlistQueryOptions = {
        userId,
        limit,
        offset: (page - 1) * limit,
        filters: {
          priority,
        },
        sortBy,
        sortOrder,
      };

      result = await getUserWatchlist(userId, options);
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
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
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
    const { movieId, priority } = body;

    // Validation
    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be low, medium, or high' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    const watchlistData: CreateWatchlistData = {
      userId,
      movieId: parseInt(movieId),
      priority: priority as 'low' | 'medium' | 'high' || 'medium',
    };

    const watchlistItem = await addToWatchlist(watchlistData);

    return NextResponse.json(watchlistItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add movie to watchlist' },
      { status: 500 }
    );
  }
}

// Get watchlist statistics
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
    const stats = await getWatchlistStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching watchlist stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist statistics' },
      { status: 500 }
    );
  }
}