// TMDB API Response Types
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Base TMDB Entity Types
export interface TMDBBaseEntity {
  id: number;
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  media_type: 'movie' | 'tv' | 'person';
  original_language: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
}

// Movie Types
export interface TMDBMovie extends TMDBBaseEntity {
  media_type: 'movie';
  title: string;
  original_title: string;
  release_date: string;
  video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  belongs_to_collection: TMDBCollection | null;
  budget: number;
  genres: TMDBGenre[];
  homepage: string | null;
  imdb_id: string | null;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string | null;
}

export interface TMDBMovieCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBMovieImages {
  id: number;
  backdrops: TMDBImageData[];
  logos: TMDBImageData[];
  posters: TMDBImageData[];
}

export interface TMDBMovieVideos {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBMovieReviews {
  id: number;
  page: number;
  results: TMDBReview[];
  total_pages: number;
  total_results: number;
}

// TV Show Types
export interface TMDBTVShow extends TMDBBaseEntity {
  media_type: 'tv';
  name: string;
  original_name: string;
  first_air_date: string;
  origin_country: string[];
}

export interface TMDBTVShowDetails extends TMDBTVShow {
  created_by: TMDBCreatedBy[];
  episode_run_time: number[];
  genres: TMDBGenre[];
  homepage: string | null;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: TMDBEpisode | null;
  next_episode_to_air: TMDBEpisode | null;
  networks: TMDBNetwork[];
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  seasons: TMDBSeason[];
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string | null;
  type: string;
}

export interface TMDBSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TMDBEpisode {
  air_date: string;
  episode_number: number;
  episode_type: string;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  runtime: number | null;
  season_number: number;
  show_id: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  crew: TMDBCrewMember[];
  guest_stars: TMDBCastMember[];
}

export interface TMDBTVShowCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBTVShowImages {
  id: number;
  backdrops: TMDBImageData[];
  logos: TMDBImageData[];
  posters: TMDBImageData[];
}

export interface TMDBTVShowVideos {
  id: number;
  results: TMDBVideo[];
}

// Person Types
export interface TMDBPerson extends TMDBBaseEntity {
  media_type: 'person';
  name: string;
  original_name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: (TMDBMovie | TMDBTVShow)[];
}

export interface TMDBPersonDetails extends TMDBPerson {
  also_known_as: string[];
  biography: string;
  birthday: string | null;
  deathday: string | null;
  gender: number;
  homepage: string | null;
  imdb_id: string | null;
  place_of_birth: string | null;
}

// Search Types
export interface TMDBSearchResults {
  page: number;
  results: (TMDBMovie | TMDBTVShow | TMDBPerson)[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchFilters {
  query?: string;
  page?: number;
  language?: string;
  region?: string;
  year?: number;
  primary_release_year?: number;
  first_air_date_year?: number;
  include_adult?: boolean;
  sort_by?: 'popularity.desc' | 'popularity.asc' | 'release_date.desc' | 'release_date.asc' | 'vote_average.desc' | 'vote_average.asc';
}

// Supporting Types
export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TMDBMovie[];
}

export interface TMDBProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBCreatedBy {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

export interface TMDBNetwork {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBCastMember {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}

export interface TMDBCrewMember {
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
}

export interface TMDBImageData {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface TMDBVideo {
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
}

export interface TMDBReview {
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  id: string;
  updated_at: string;
  url: string;
}

// API Configuration Types
export interface TMDBConfig {
  apiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export interface TMDBImageConfig {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
}

// Error Types
export interface TMDBError {
  status_message: string;
  status_code: number;
  success: boolean;
}

export class TMDBRateLimitError extends Error {
  public retryAfter: number;

  constructor(message: string, retryAfter: number = 1) {
    super(message);
    this.name = 'TMDBRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class TMDBApiError extends Error {
  public statusCode: number;
  public statusMessage: string;

  constructor(message: string, statusCode: number = 500, statusMessage: string = 'Internal Server Error') {
    super(message);
    this.name = 'TMDBApiError';
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
  }
}

// Cache Types
export interface TMDBCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface TMDBCacheOptions {
  ttl?: number;
  force?: boolean;
}

// Utility Types
export type TMDBMediaType = 'movie' | 'tv' | 'person';
export type TMDBSearchType = 'movie' | 'tv' | 'person' | 'multi';
export type TMDBImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type TMDBVideoType = 'Trailer' | 'Teaser' | 'Clip' | 'Behind the Scenes' | 'Bloopers' | 'Featurette';