import { tmdbClient } from './client';
import {
  TMDBTVShowDetails,
  TMDBTVShowCredits,
  TMDBTVShowImages,
  TMDBTVShowVideos,
  TMDBTVShow,
  TMDBSeason,
  TMDBEpisode,
} from '@/types/tmdb';

export class TMDBTVShows {
  /**
   * Get detailed information about a specific TV show
   */
  async getTVShowDetails(
    tvId: number,
    options: {
      language?: string;
      append_to_response?: string[];
    } = {}
  ): Promise<TMDBTVShowDetails> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
      append_to_response: options.append_to_response?.join(','),
    };

    return tmdbClient.get<TMDBTVShowDetails>(`/tv/${tvId}`, params);
  }

  /**
   * Get the cast and crew information for a specific TV show
   */
  async getTVShowCredits(tvId: number): Promise<TMDBTVShowCredits> {
    return tmdbClient.get<TMDBTVShowCredits>(`/tv/${tvId}/credits`);
  }

  /**
   * Get the images (posters, backdrops, logos) for a specific TV show
   */
  async getTVShowImages(
    tvId: number,
    options: {
      language?: string;
      include_image_language?: string[];
    } = {}
  ): Promise<TMDBTVShowImages> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
      include_image_language: options.include_image_language?.join(','),
    };

    return tmdbClient.get<TMDBTVShowImages>(`/tv/${tvId}/images`, params);
  }

  /**
   * Get the videos (trailers, teasers, clips) for a specific TV show
   */
  async getTVShowVideos(
    tvId: number,
    options: {
      language?: string;
    } = {}
  ): Promise<TMDBTVShowVideos> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
    };

    return tmdbClient.get<TMDBTVShowVideos>(`/tv/${tvId}/videos`, params);
  }

  /**
   * Get TV shows similar to a specific TV show
   */
  async getSimilarTVShows(
    tvId: number,
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>(`/tv/${tvId}/similar`, params);

    return response;
  }

  /**
   * Get TV show recommendations based on a specific TV show
   */
  async getTVRecommendations(
    tvId: number,
    options: {
      page?: number;
      language?: string;
    } = {}
  ): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>(`/tv/${tvId}/recommendations`, params);

    return response;
  }

  /**
   * Get detailed information about a specific season of a TV show
   */
  async getSeasonDetails(
    tvId: number,
    seasonNumber: number,
    options: {
      language?: string;
      append_to_response?: string[];
    } = {}
  ): Promise<TMDBSeason & { episodes: TMDBEpisode[] }> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
      append_to_response: options.append_to_response?.join(','),
    };

    return tmdbClient.get<TMDBSeason & { episodes: TMDBEpisode[] }>(
      `/tv/${tvId}/season/${seasonNumber}`,
      params
    );
  }

  /**
   * Get detailed information about a specific episode of a TV show
   */
  async getEpisodeDetails(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number,
    options: {
      language?: string;
      append_to_response?: string[];
    } = {}
  ): Promise<TMDBEpisode> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
      append_to_response: options.append_to_response?.join(','),
    };

    return tmdbClient.get<TMDBEpisode>(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
      params
    );
  }

  /**
   * Get the cast and crew information for a specific episode
   */
  async getEpisodeCredits(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<{
    cast: Array<{
      adult: boolean;
      gender: number | null;
      id: number;
      known_for_department: string;
      name: string;
      original_name: string;
      popularity: number;
      profile_path: string | null;
      character: string;
      credit_id: string;
      order: number;
    }>;
    crew: Array<{
      adult: boolean;
      gender: number | null;
      id: number;
      known_for_department: string;
      name: string;
      original_name: string;
      popularity: number;
      profile_path: string | null;
      credit_id: string;
      department: string;
      job: string;
    }>;
    guest_stars: Array<{
      adult: boolean;
      gender: number | null;
      id: number;
      known_for_department: string;
      name: string;
      original_name: string;
      popularity: number;
      profile_path: string | null;
      character: string;
      credit_id: string;
      order: number;
    }>;
  }> {
    return tmdbClient.get(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/credits`
    );
  }

  /**
   * Get the images for a specific episode
   */
  async getEpisodeImages(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<{
    id: number;
    stills: Array<{
      aspect_ratio: number;
      height: number;
      iso_639_1: string | null;
      file_path: string;
      vote_average: number;
      vote_count: number;
      width: number;
    }>;
  }> {
    return tmdbClient.get(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/images`);
  }

  /**
   * Get the videos for a specific episode
   */
  async getEpisodeVideos(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number,
    options: {
      language?: string;
    } = {}
  ): Promise<{
    id: number;
    results: Array<{
      iso_639_1: string;
      iso_3166_1: string;
      name: string;
      key: string;
      site: string;
      size: number;
      type: string;
      official: boolean;
      published_at: string;
      id: string;
    }>;
  }> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
    };

    return tmdbClient.get(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`, params);
  }

  /**
   * Get popular TV shows
   */
  async getPopularTVShows(options: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/popular', params);

    return response;
  }

  /**
   * Get top rated TV shows
   */
  async getTopRatedTVShows(options: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/top_rated', params);

    return response;
  }

  /**
   * Get TV shows that are currently airing
   */
  async getAiringTodayTVShows(options: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/airing_today', params);

    return response;
  }

  /**
   * Get TV shows that are currently on the air
   */
  async getOnTheAirTVShows(options: {
    page?: number;
    language?: string;
  } = {}): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    const params: Record<string, unknown> = {
      page: options.page || 1,
      language: options.language || 'en-US',
    };

    const response = await tmdbClient.get<{
      results: TMDBTVShow[];
      total_pages: number;
      total_results: number;
    }>('/tv/on_the_air', params);

    return response;
  }

  /**
   * Get the latest TV show
   */
  async getLatestTVShow(options: {
    language?: string;
  } = {}): Promise<TMDBTVShowDetails> {
    const params: Record<string, unknown> = {
      language: options.language || 'en-US',
    };

    return tmdbClient.get<TMDBTVShowDetails>('/tv/latest', params);
  }

  // Convenience methods
  async getDetails(tvId: number, options?: { language?: string; append_to_response?: string[] }): Promise<TMDBTVShowDetails> {
    return this.getTVShowDetails(tvId, options);
  }

  async getCredits(tvId: number): Promise<TMDBTVShowCredits> {
    return this.getTVShowCredits(tvId);
  }

  async getImages(tvId: number, options?: { language?: string; include_image_language?: string[] }): Promise<TMDBTVShowImages> {
    return this.getTVShowImages(tvId, options);
  }

  async getVideos(tvId: number, options?: { language?: string }): Promise<TMDBTVShowVideos> {
    return this.getTVShowVideos(tvId, options);
  }

  async getSimilar(tvId: number, options?: { page?: number; language?: string }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    return this.getSimilarTVShows(tvId, options);
  }

  async getRecommendations(tvId: number, options?: { page?: number; language?: string }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    return this.getTVRecommendations(tvId, options);
  }

  async getSeason(tvId: number, seasonNumber: number, options?: { language?: string; append_to_response?: string[] }): Promise<TMDBSeason & { episodes: TMDBEpisode[] }> {
    return this.getSeasonDetails(tvId, seasonNumber, options);
  }

  async getEpisode(tvId: number, seasonNumber: number, episodeNumber: number, options?: { language?: string; append_to_response?: string[] }): Promise<TMDBEpisode> {
    return this.getEpisodeDetails(tvId, seasonNumber, episodeNumber, options);
  }

  async getPopular(options?: { page?: number; language?: string }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    return this.getPopularTVShows(options);
  }

  async getTopRated(options?: { page?: number; language?: string }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    return this.getTopRatedTVShows(options);
  }

  async getAiringToday(options?: { page?: number; language?: string }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    return this.getAiringTodayTVShows(options);
  }

  async getOnTheAir(options?: { page?: number; language?: string }): Promise<{ results: TMDBTVShow[]; total_pages: number; total_results: number }> {
    return this.getOnTheAirTVShows(options);
  }
}

// Export singleton instance
export const tmdbTVShows = new TMDBTVShows();