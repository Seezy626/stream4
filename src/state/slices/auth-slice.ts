import { StateCreator } from 'zustand';
import { AppState, AuthState, AuthActions } from '../types';

export interface AuthSlice extends AuthState, AuthActions {}

export const authSlice: StateCreator<
  AppState & AuthActions,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  // Initial auth state
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

  // Auth actions
  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setSession: (session) => {
    set({ session });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  updatePreferences: (preferences) => {
    const currentPrefs = get().preferences;
    set({
      preferences: {
        ...currentPrefs,
        ...preferences,
      },
    });
  },

  logout: () => {
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      // Reset other states on logout
      searchResults: [],
      selectedMovie: null,
      filters: {},
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
      error: null,
      items: [],
      watchHistoryFilters: {},
      watchHistoryCurrentPage: 1,
      watchHistoryTotalPages: 0,
      watchHistoryTotalResults: 0,
      watchlistItems: [],
      watchlistFilters: {},
      watchlistCurrentPage: 1,
      watchlistTotalPages: 0,
      watchlistTotalResults: 0,
      loading: false,
      loadingMessage: null,
      modals: {},
      notifications: [],
      search: {
        query: '',
        isActive: false,
        results: [],
      },
    });
  },
});