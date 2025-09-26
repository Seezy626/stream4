import { tmdbEnhancedClient } from './enhanced-client';
import { db } from '../db';
import { movies } from '../schema';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  media_type: 'movie' | 'tv';
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  media_type: 'movie' | 'tv';
}

/**
 * Sync TMDB movie data with local database
 */
export async function syncMovieWithTMDB(tmdbId: number): Promise<number> {
  try {
    // Check if movie already exists
    const existingMovie = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);

    if (existingMovie.length > 0) {
      return existingMovie[0].id;
    }

    // Fetch movie details from TMDB
    const movieDetails = await tmdbEnhancedClient.getMovieDetails(tmdbId);

    // Insert movie into database
    const [newMovie] = await db
      .insert(movies)
      .values({
        tmdbId: movieDetails.id,
        title: movieDetails.title,
        overview: movieDetails.overview,
        releaseDate: movieDetails.release_date,
        posterPath: movieDetails.poster_path,
        backdropPath: movieDetails.backdrop_path,
        voteAverage: movieDetails.vote_average,
        voteCount: movieDetails.vote_count,
        genreIds: movieDetails.genres?.map((g: any) => g.id) || [],
        mediaType: 'movie',
      })
      .returning();

    return newMovie.id;
  } catch (error) {
    console.error('Error syncing movie with TMDB:', error);
    throw new Error('Failed to sync movie data');
  }
}

/**
 * Sync TMDB TV show data with local database
 */
export async function syncTVShowWithTMDB(tmdbId: number): Promise<number> {
  try {
    // Check if TV show already exists
    const existingMovie = await db
      .select()
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);

    if (existingMovie.length > 0) {
      return existingMovie[0].id;
    }

    // Fetch TV show details from TMDB
    const tvDetails = await tmdbEnhancedClient.getTVShowDetails(tmdbId);

    // Insert TV show into database
    const [newMovie] = await db
      .insert(movies)
      .values({
        tmdbId: tvDetails.id,
        title: tvDetails.name,
        overview: tvDetails.overview,
        releaseDate: tvDetails.first_air_date,
        posterPath: tvDetails.poster_path,
        backdropPath: tvDetails.backdrop_path,
        voteAverage: tvDetails.vote_average,
        voteCount: tvDetails.vote_count,
        genreIds: tvDetails.genres?.map((g: any) => g.id) || [],
        mediaType: 'tv',
      })
      .returning();

    return newMovie.id;
  } catch (error) {
    console.error('Error syncing TV show with TMDB:', error);
    throw new Error('Failed to sync TV show data');
  }
}

/**
 * Sync TMDB search result with local database
 */
export async function syncSearchResultWithTMDB(result: TMDBMovie | TMDBTVShow): Promise<number> {
  try {
    if (result.media_type === 'movie') {
      return await syncMovieWithTMDB(result.id);
    } else if (result.media_type === 'tv') {
      return await syncTVShowWithTMDB(result.id);
    } else {
      throw new Error('Unsupported media type');
    }
  } catch (error) {
    console.error('Error syncing search result with TMDB:', error);
    throw new Error('Failed to sync search result');
  }
}

/**
 * Search TMDB and sync results with local database
 */
export async function searchAndSyncTMDB(
  query: string,
  options: {
    type?: 'movie' | 'tv' | 'multi';
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  results: (TMDBMovie | TMDBTVShow)[];
  totalResults: number;
  totalPages: number;
}> {
  try {
    const { type = 'multi', page = 1, limit = 20 } = options;

    let searchResults;

    switch (type) {
      case 'movie':
        searchResults = await tmdbEnhancedClient.searchMovies(query, { page });
        break;
      case 'tv':
        searchResults = await tmdbEnhancedClient.searchTVShows(query, { page });
        break;
      case 'multi':
      default:
        searchResults = await tmdbEnhancedClient.multiSearch(query, { page });
        break;
    }

    // Filter out person results and limit results
    const filteredResults = (searchResults.results || [])
      .filter((result: any) => result.media_type === 'movie' || result.media_type === 'tv')
      .slice(0, limit);

    return {
      results: filteredResults,
      totalResults: searchResults.total_results || 0,
      totalPages: searchResults.total_pages || 0,
    };
  } catch (error) {
    console.error('Error searching TMDB:', error);
    throw new Error('Failed to search TMDB');
  }
}

/**
 * Get movie details from TMDB with local sync
 */
export async function getMovieWithSync(tmdbId: number): Promise<{
  localId: number;
  tmdbData: any;
}> {
  try {
    const localId = await syncMovieWithTMDB(tmdbId);
    const tmdbData = await tmdbEnhancedClient.getMovieDetails(tmdbId);

    return { localId, tmdbData };
  } catch (error) {
    console.error('Error getting movie with sync:', error);
    throw new Error('Failed to get movie data');
  }
}

/**
 * Get TV show details from TMDB with local sync
 */
export async function getTVShowWithSync(tmdbId: number): Promise<{
  localId: number;
  tmdbData: any;
}> {
  try {
    const localId = await syncTVShowWithTMDB(tmdbId);
    const tmdbData = await tmdbEnhancedClient.getTVShowDetails(tmdbId);

    return { localId, tmdbData };
  } catch (error) {
    console.error('Error getting TV show with sync:', error);
    throw new Error('Failed to get TV show data');
  }
}