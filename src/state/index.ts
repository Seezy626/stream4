// Main store export
export { useAppStore, store } from './store';
export type { AppStore, AppState, AppActions } from './store';

// Types export
export type {
  User,
  UserPreferences,
  AuthState,
  MovieFilters,
  MovieState,
  WatchHistoryItem,
  WatchHistoryFilters,
  WatchHistoryState,
  WatchlistItem,
  WatchlistFilters,
  WatchlistState,
  UIState,
  Notification,
  AuthActions,
  MovieActions,
  WatchHistoryActions,
  WatchlistActions,
  UIActions,
} from './types';

// Hooks export
export {
  useAuth,
  useUser,
  useUserPreferences,
  useMovies,
  useMovieSearch,
  useSelectedMovie,
  useWatchHistory,
  useWatchHistoryActions,
  useWatchlist,
  useWatchlistActions,
  useUI,
  useModal,
  useNotifications,
  useSearch,
  useAuthSelector,
  useMovieSelector,
  useWatchHistorySelector,
  useWatchlistSelector,
  useUISelector,
} from './hooks';

// Slice exports (for advanced usage)
export { authSlice } from './slices/auth-slice';
export { movieSlice } from './slices/movie-slice';
export { watchHistorySlice } from './slices/watch-history-slice';
export { watchlistSlice } from './slices/watchlist-slice';
export { uiSlice } from './slices/ui-slice';