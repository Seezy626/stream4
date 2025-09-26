import { tmdbClient } from './client';
import {
  TMDBSearchResults,
  TMDBSearchFilters,
  TMDBMovie,
  TMDBTVShow,
  TMDBPerson,
} from '@/types/tmdb';

export class TMDBSearch {
  /**
   * Perform a multi-search across movies, TV shows, and people
   */
  async multiSearch(filters: TMDBSearchFilters): Promise<TMDBSearchResults> {
    const params: Record<string, unknown> = {
      query: filters.query,
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
      include_adult: filters.include_adult || false,
    };

    return tmdbClient.get<TMDBSearchResults>('/search/multi', params);
  }

  /**
   * Search for movies with advanced filtering
   */
  async searchMovies(filters: TMDBSearchFilters & {
    year?: number;
    primary_release_year?: number;
    sort_by?: 'popularity.desc' | 'popularity.asc' | 'release_date.desc' | 'release_date.asc' | 'vote_average.desc' | 'vote_average.asc';
  }): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      query: filters.query,
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
      year: filters.year,
      primary_release_year: filters.primary_release_year,
      include_adult: filters.include_adult || false,
      sort_by: filters.sort_by || 'popularity.desc',
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/search/movie', params);

    return response;
  }

  /**
   * Search for TV shows with advanced filtering
   */
  async searchTVShows(filters: TMDBSearchFilters & {
    first_air_date_year?: number;
    sort_by?: 'popularity.desc' | 'popularity.asc' | 'first_air_date.desc' | 'first_air_date.asc' | 'vote_average.desc' | 'vote_average.asc';
  }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      query: filters.query,
      page: filters.page || 1,
      language: filters.language || 'en-US',
      first_air_date_year: filters.first_air_date_year,
      include_adult: filters.include_adult || false,
      sort_by: filters.sort_by || 'popularity.desc',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/search/tv', params);

    return response;
  }

  /**
   * Search for people (actors, directors, etc.)
   */
  async searchPeople(filters: TMDBSearchFilters): Promise<{ results: TMDBPerson[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      query: filters.query,
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
      include_adult: filters.include_adult || false,
    };

    const response = await tmdbClient.get<{
      results: TMDBPerson[];
      total_pages: number;
      total_results: number;
    }>('/search/person', params);

    return response;
  }

  /**
   * Search for movies by genre
   */
  async discoverMovies(filters: {
    page?: number;
    language?: string;
    sort_by?: 'popularity.desc' | 'popularity.asc' | 'release_date.desc' | 'release_date.asc' | 'vote_average.desc' | 'vote_average.asc';
    with_genres?: number[];
    without_genres?: number[];
    primary_release_year?: number;
    release_date_gte?: string;
    release_date_lte?: string;
    vote_average_gte?: number;
    vote_average_lte?: number;
    vote_count_gte?: number;
    with_runtime_gte?: number;
    with_runtime_lte?: number;
    include_adult?: boolean;
  }): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
      sort_by: filters.sort_by || 'popularity.desc',
      with_genres: filters.with_genres?.join(','),
      without_genres: filters.without_genres?.join(','),
      primary_release_year: filters.primary_release_year,
      'release_date.gte': filters.release_date_gte,
      'release_date.lte': filters.release_date_lte,
      'vote_average.gte': filters.vote_average_gte,
      'vote_average.lte': filters.vote_average_lte,
      'vote_count.gte': filters.vote_count_gte,
      'with_runtime.gte': filters.with_runtime_gte,
      'with_runtime.lte': filters.with_runtime_lte,
      include_adult: filters.include_adult || false,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/discover/movie', params);

    return response;
  }

  /**
   * Search for TV shows by genre
   */
  async discoverTVShows(filters: {
    page?: number;
    language?: string;
    sort_by?: 'popularity.desc' | 'popularity.asc' | 'first_air_date.desc' | 'first_air_date.asc' | 'vote_average.desc' | 'vote_average.asc';
    with_genres?: number[];
    without_genres?: number[];
    first_air_date_year?: number;
    first_air_date_gte?: string;
    first_air_date_lte?: string;
    vote_average_gte?: number;
    vote_average_lte?: number;
    vote_count_gte?: number;
    include_adult?: boolean;
  }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
      sort_by: filters.sort_by || 'popularity.desc',
      with_genres: filters.with_genres?.join(','),
      without_genres: filters.without_genres?.join(','),
      first_air_date_year: filters.first_air_date_year,
      'first_air_date.gte': filters.first_air_date_gte,
      'first_air_date.lte': filters.first_air_date_lte,
      'vote_average.gte': filters.vote_average_gte,
      'vote_average.lte': filters.vote_average_lte,
      'vote_count.gte': filters.vote_count_gte,
      include_adult: filters.include_adult || false,
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/discover/tv', params);

    return response;
  }

  /**
   * Get trending movies
   */
  async getTrendingMovies(filters: {
    time_window?: 'day' | 'week';
    page?: number;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>(`/trending/movie/${filters.time_window || 'week'}`, params);

    return response;
  }

  /**
   * Get trending TV shows
   */
  async getTrendingTVShows(filters: {
    time_window?: 'day' | 'week';
    page?: number;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>(`/trending/tv/${filters.time_window || 'week'}`, params);

    return response;
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(filters: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/popular', params);

    return response;
  }

  /**
   * Get popular TV shows
   */
  async getPopularTVShows(filters: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/popular', params);

    return response;
  }

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(filters: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/top_rated', params);

    return response;
  }

  /**
   * Get top rated TV shows
   */
  async getTopRatedTVShows(filters: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/top_rated', params);

    return response;
  }

  /**
   * Get now playing movies
   */
  async getNowPlayingMovies(filters: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/now_playing', params);

    return response;
  }

  /**
   * Get upcoming movies
   */
  async getUpcomingMovies(filters: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
      region: filters.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/upcoming', params);

    return response;
  }

  /**
   * Get airing today TV shows
   */
  async getAiringTodayTVShows(filters: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/airing_today', params);

    return response;
  }

  /**
   * Get on the air TV shows
   */
  async getOnTheAirTVShows(filters: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params = {
      page: filters.page || 1,
      language: filters.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/on_the_air', params);

    return response;
  }
}

// Export singleton instance
export const tmdbSearch = new TMDBSearch();