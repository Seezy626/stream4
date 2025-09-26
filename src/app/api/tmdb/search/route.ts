import { NextRequest, NextResponse } from 'next/server';
import { tmdbEnhancedClient, TMDBErrorHandler } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'movie'; // movie, tv, multi
  const page = parseInt(searchParams.get('page') || '1');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    let results;

    switch (type) {
      case 'movie':
        results = await tmdbEnhancedClient.searchMovies(query, { page });
        break;
      case 'tv':
        results = await tmdbEnhancedClient.searchTVShows(query, { page });
        break;
      case 'multi':
        results = await tmdbEnhancedClient.multiSearch(query, { page });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid search type. Use: movie, tv, or multi' },
          { status: 400 }
        );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching TMDB:', error);

    const userFriendlyMessage = TMDBErrorHandler.getUserFriendlyMessage(error);

    return NextResponse.json(
      { error: userFriendlyMessage },
      { status: 500 }
    );
  }
}