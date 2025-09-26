// Mock implementations for external APIs

// TMDB API mocks
export const mockTMDBApi = {
  search: {
    movies: jest.fn(),
    tv: jest.fn(),
    multi: jest.fn(),
  },
  getMovieDetails: jest.fn(),
  getMovieCredits: jest.fn(),
  getMovieImages: jest.fn(),
  getMovieVideos: jest.fn(),
  getSimilarMovies: jest.fn(),
  getRecommendedMovies: jest.fn(),
  getPopularMovies: jest.fn(),
  getTopRatedMovies: jest.fn(),
  getUpcomingMovies: jest.fn(),
  getNowPlayingMovies: jest.fn(),
  getMovieGenres: jest.fn(),
  getTVDetails: jest.fn(),
  getTVCredits: jest.fn(),
  getTVImages: jest.fn(),
  getTVVideos: jest.fn(),
  getSimilarTV: jest.fn(),
  getRecommendedTV: jest.fn(),
  getPopularTV: jest.fn(),
  getTopRatedTV: jest.fn(),
  getOnTheAirTV: jest.fn(),
  getAiringTodayTV: jest.fn(),
  getTVGenres: jest.fn(),
};

// Database operation mocks
export const mockDatabase = {
  // Watchlist operations
  getWatchlist: jest.fn(),
  addToWatchlist: jest.fn(),
  removeFromWatchlist: jest.fn(),
  updateWatchlistPriority: jest.fn(),
  reorderWatchlist: jest.fn(),
  getWatchlistByPriority: jest.fn(),

  // Watched operations
  getWatched: jest.fn(),
  addToWatched: jest.fn(),
  updateWatched: jest.fn(),
  removeFromWatched: jest.fn(),
  getWatchedByRating: jest.fn(),

  // User operations
  getUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),

  // Movie operations
  getMovie: jest.fn(),
  getMovies: jest.fn(),
  updateMovie: jest.fn(),
  deleteMovie: jest.fn(),
  syncMovieData: jest.fn(),
};

// Auth mocks
export const mockAuth = {
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getUser: jest.fn(),
  updateUser: jest.fn(),
};

// File system mocks
export const mockFileSystem = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(),
  getFileStats: jest.fn(),
};

// Network mocks
export const mockNetwork = {
  fetch: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

// Cache mocks
export const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
};

// Logger mocks
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Utility mocks
export const mockUtils = {
  formatDate: jest.fn(),
  formatDuration: jest.fn(),
  formatRating: jest.fn(),
  truncateText: jest.fn(),
  slugify: jest.fn(),
  generateId: jest.fn(),
  debounce: jest.fn(),
  throttle: jest.fn(),
};