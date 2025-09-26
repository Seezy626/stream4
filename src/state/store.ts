import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppStore, AppState, AppActions } from './types';
import { authSlice } from './slices/auth-slice';
import { movieSlice } from './slices/movie-slice';
import { watchHistorySlice } from './slices/watch-history-slice';
import { watchlistSlice } from './slices/watchlist-slice';
import { uiSlice } from './slices/ui-slice';


// Create the main store with all slices
export const useAppStore = create<AppStore>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((set: any, get: any) => ({
      ...authSlice(set, get),
      ...movieSlice(set, get),
      ...watchHistorySlice(set, get),
      ...watchlistSlice(set, get),
      ...uiSlice(set, get),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
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
      merge: (persistedState: unknown, currentState: unknown) => {
        const persisted = persistedState as Partial<AppState>;
        const current = currentState as AppState;
        return {
          ...current,
          ...persisted,
          // Reset loading states on hydration
          isLoading: false,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any
);

// Export the store for debugging and testing
export { useAppStore as store };

// Export types for external use
export type { AppStore, AppState, AppActions };