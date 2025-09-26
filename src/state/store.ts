import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppStore, AppState, AppActions } from './types';
import { authSlice } from './slices/auth-slice';
import { movieSlice } from './slices/movie-slice';
import { watchHistorySlice } from './slices/watch-history-slice';
import { watchlistSlice } from './slices/watchlist-slice';
import { uiSlice } from './slices/ui-slice';

// Initial state
const initialState: AppState = {
  // Auth state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  preferences: {
    theme: 'system',
    language: 'en',
    autoplay: false,
    notifications: true,
  },

  // Movie state
  searchResults: [],
  selectedMovie: null,
  filters: {},
  currentPage: 1,
  totalPages: 0,
  totalResults: 0,
  error: null,

  // Watch history state
  items: [],
  watchHistoryFilters: {},
  watchHistoryCurrentPage: 1,
  watchHistoryTotalPages: 0,
  watchHistoryTotalResults: 0,

  // Watchlist state
  watchlistItems: [],
  watchlistFilters: {},
  watchlistCurrentPage: 1,
  watchlistTotalPages: 0,
  watchlistTotalResults: 0,

  // UI state
  loading: false,
  loadingMessage: null,
  modals: {},
  notifications: [],
  search: {
    query: '',
    isActive: false,
    results: [],
  },
  theme: 'system',
};

// Create the main store with all slices
export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...initialState,
      ...authSlice(...a),
      ...movieSlice(...a),
      ...watchHistorySlice(...a),
      ...watchlistSlice(...a),
      ...uiSlice(...a),
    }),
    {
      name: 'movie-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist certain parts of the state
        user: state.user,
        preferences: state.preferences,
        theme: state.theme,
        language: state.preferences.language,
        // Don't persist loading states, errors, or temporary data
      }),
      // Custom merge function for hydration
      merge: (persistedState: Partial<AppState>, currentState: AppState) => {
        return {
          ...currentState,
          ...persistedState,
          // Reset loading states on hydration
          isLoading: false,
          loading: false,
          loadingMessage: null,
          error: null,
          // Reset modal states
          modals: {},
          notifications: [],
          search: {
            query: '',
            isActive: false,
            results: [],
          },
        };
      },
    }
  )
);

// Export the store for debugging and testing
export { useAppStore as store };

// Export types for external use
export type { AppStore, AppState, AppActions };