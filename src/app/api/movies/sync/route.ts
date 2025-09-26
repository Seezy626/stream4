import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncMovieWithTMDB, syncTVShowWithTMDB } from '@/lib/tmdb/sync';

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
    const { tmdbId, mediaType } = body;

    if (!tmdbId || !mediaType) {
      return NextResponse.json(
        { error: 'TMDB ID and media type are required' },
        { status: 400 }
      );
    }

    if (!['movie', 'tv'].includes(mediaType)) {
      return NextResponse.json(
        { error: 'Media type must be either "movie" or "tv"' },
        { status: 400 }
      );
    }

    let movieId: number;

    try {
      if (mediaType === 'movie') {
        movieId = await syncMovieWithTMDB(tmdbId);
      } else {
        movieId = await syncTVShowWithTMDB(tmdbId);
      }
    } catch (error) {
      console.error('Error syncing with TMDB:', error);
      return NextResponse.json(
        { error: 'Failed to sync movie data with TMDB' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      movieId,
      message: 'Movie synced successfully',
    });
  } catch (error) {
    console.error('Error syncing movie:', error);
    return NextResponse.json(
      { error: 'Failed to sync movie' },
      { status: 500 }
    );
  }
}