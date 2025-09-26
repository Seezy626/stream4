import { tmdbClient } from './client';
import {
  TMDBMovieDetails,
  TMDBMovieCredits,
  TMDBMovieImages,
  TMDBMovieVideos,
  TMDBMovieReviews,
  TMDBMovie,
} from '@/types/tmdb';

export class TMDBMovies {
  /**
   * Get detailed information about a specific movie
   */
  async getMovieDetails(
    movieId: number,
    options: {
      language?: string;
      append_to_response?: string[];
    } = {}
  ): Promise<TMDBMovieDetails> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
      append_to_response: options.append_to_response?.join(','),
    };

    return tmdbClient.get<TMDBMovieDetails>(`/movie/${movieId}`, params);
  }

  /**
   * Get the cast and crew information for a specific movie
   */
  async getMovieCredits(movieId: number): Promise<TMDBMovieCredits> {
    return tmdbClient.get<TMDBMovieCredits>(`/movie/${movieId}/credits`);
  }

  /**
   * Get the images (posters, backdrops, logos) for a specific movie
   */
  async getMovieImages(
    movieId: number,
    options: {
      language?: string;
      include_image_language?: string[];
    } = {}
  ): Promise<TMDBMovieImages> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
      include_image_language: options.include_image_language?.join(','),
    };

    return tmdbClient.get<TMDBMovieImages>(`/movie/${movieId}/images`, params);
  }

  /**
   * Get the videos (trailers, teasers, clips) for a specific movie
   */
  async getMovieVideos(
    movieId: number,
    options: {
      language?: string;
    } = {}
  ): Promise<TMDBMovieVideos> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
    };

    return tmdbClient.get<TMDBMovieVideos>(`/movie/${movieId}/videos`, params);
  }

  /**
   * Get the user reviews for a specific movie
   */
  async getMovieReviews(
    movieId: number,
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<TMDBMovieReviews> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    return tmdbClient.get<TMDBMovieReviews>(`/movie/${movieId}/reviews`, params);
  }

  /**
   * Get movies similar to a specific movie
   */
  async getSimilarMovies(
    movieId: number,
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>(`/movie/${movieId}/similar`, params);

    return response;
  }

  /**
   * Get movie recommendations based on a specific movie
   */
  async getRecommendations(
    movieId: number,
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>(`/movie/${movieId}/recommendations`, params);

    return response;
  }

  /**
   * Get movies that belong to a specific collection
   */
  async getCollection(
    collectionId: number,
    options: {
      language?: string;
    } = {}
  ): Promise<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: TMDBMovie[];
  }> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
    };

    return tmdbClient.get<{
      id: number;
      name: string;
      overview: string;
      poster_path: string | null;
      backdrop_path: string | null;
      parts: TMDBMovie[];
    }>(`/collection/${collectionId}`, params);
  }

  /**
   * Get the latest released movie
   */
  async getLatestMovie(options: {
    language?: string;
  } = {}): Promise<TMDBMovieDetails> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
    };

    return tmdbClient.get<TMDBMovieDetails>('/movie/latest', params);
  }

  /**
   * Get movies now playing in theaters
   */
  async getNowPlayingMovies(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/now_playing', params);

    return response;
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/popular', params);

    return response;
  }

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/top_rated', params);

    return response;
  }

  /**
   * Get upcoming movies
   */
  async getUpcomingMovies(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
      region: options.region,
    };

    const response = await tmdbClient.get<{
      results: TMDBMovie[];
      total_pages: number;
      total_results: number;
    }>('/movie/upcoming', params);

    return response;
  }

  /**
   * Get movies currently playing in theaters
   */
  async getNowPlaying(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.getNowPlayingMovies(options);
  }

  /**
   * Get movies that are currently popular
   */
  async getPopular(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.getPopularMovies(options);
  }

  /**
   * Get the highest rated movies
   */
  async getTopRated(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.getTopRatedMovies(options);
  }

  /**
   * Get movies that are coming soon
   */
  async getUpcoming(options: {
    page?: number;
    language?: string;
    region?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.getUpcomingMovies(options);
  }

  /**
   * Get movies similar to the specified movie
   */
  async getSimilar(movieId: number, options: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.getSimilarMovies(movieId, options);
  }

  /**
   * Get movie recommendations based on the specified movie
   */
  async getRecommended(movieId: number, options: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    return this.getRecommendations(movieId, options);
  }

  /**
   * Get all images for a movie (posters, backdrops, logos)
   */
  async getImages(movieId: number, options: {
    language?: string;
    include_image_language?: string[];
  } = {}): Promise<TMDBMovieImages> {
    return this.getMovieImages(movieId, options);
  }

  /**
   * Get all videos for a movie (trailers, teasers, clips)
   */
  async getVideos(movieId: number, options: {
    language?: string;
  } = {}): Promise<TMDBMovieVideos> {
    return this.getMovieVideos(movieId, options);
  }

  /**
   * Get all reviews for a movie
   */
  async getReviews(movieId: number, options: {
    page?: number;
    language?: string;
  } = {}): Promise<TMDBMovieReviews> {
    return this.getMovieReviews(movieId, options);
  }

  /**
   * Get the cast and crew for a movie
   */
  async getCredits(movieId: number): Promise<TMDBMovieCredits> {
    return this.getMovieCredits(movieId);
  }
}

// Export singleton instance
export const tmdbMovies = new TMDBMovies();