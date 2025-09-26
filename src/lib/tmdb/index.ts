// Export all TMDB functionality
export * from './client';
export * from './enhanced-client';
export * from './search';
export * from './movies';
export * from './tv';
export * from './utils';
export * from './cache';
export * from './errors';

// Export types
export type {
  TMDBResponse,
  TMDBBaseEntity,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBMovieCredits,
  TMDBMovieImages,
  TMDBMovieVideos,
  TMDBMovieReviews,
  TMDBTVShow,
  TMDBTVShowDetails,
  TMDBTVShowCredits,
  TMDBTVShowImages,
  TMDBTVShowVideos,
  TMDBPerson,
  TMDBPersonDetails,
  TMDBSearchResults,
  TMDBSearchFilters,
  TMDBGenre,
  TMDBCollection,
  TMDBProductionCompany,
  TMDBProductionCountry,
  TMDBSpokenLanguage,
  TMDBCreatedBy,
  TMDBNetwork,
  TMDBCastMember,
  TMDBCrewMember,
  TMDBImageData,
  TMDBVideo,
  TMDBReview,
  TMDBConfig,
  TMDBImageConfig,
  TMDBError,
  TMDBRateLimitError,
  TMDBApiError,
  TMDBCacheEntry,
  TMDBCacheOptions,
  TMDBMediaType,
  TMDBSearchType,
  TMDBImageSize,
  TMDBVideoType,
} from '@/types/tmdb';

// Export singleton instances for easy access
export { tmdbClient } from './client';
export { tmdbEnhancedClient } from './enhanced-client';
export { tmdbSearch } from './search';
export { tmdbMovies } from './movies';
export { tmdbTVShows } from './tv';
export { tmdbUtils } from './utils';
export { tmdbCache } from './cache';

// Re-export commonly used utilities
export const {
  buildImageUrl,
  buildPosterUrl,
  buildBackdropUrl,
  buildProfileUrl,
  buildLogoUrl,
  buildStillUrl,
  formatReleaseDate,
  formatRuntime,
  formatVoteAverage,
  formatVoteAverageDecimal,
  formatNumber,
  formatCurrency,
  getGenreNames,
  getGenreIds,
  truncateText,
  getYouTubeUrl,
  getYouTubeThumbnail,
  isAdultContent,
  getMediaTypeDisplayName,
  getStatusDisplayName,
  getAgeRating,
  calculateAge,
  getPersonAge,
  getDepartmentDisplayName,
  getJobDisplayName,
  getVideoTypeDisplayName,
  isFutureDate,
  isPastDate,
  getRelativeTime,
  validateImageConfig,
  getAvailableImageSizes,
  getBestImageSize,
} = tmdbUtils;