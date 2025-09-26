import { WatchHistoryState, WatchHistoryActions, WatchHistoryItem, WatchHistoryFilters } from '../types';

export interface WatchHistorySlice extends WatchHistoryState, WatchHistoryActions {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const watchHistorySlice = (set: any, get: any) => ({
  // Initial watch history state
  watchHistoryItems: [],
  watchHistoryFilters: {},
  watchHistoryIsLoading: false,
  watchHistoryError: null,
  watchHistoryCurrentPage: 1,
  watchHistoryTotalPages: 0,
  watchHistoryTotalResults: 0,

  // Watch history actions
  setWatchHistoryItems: (items: WatchHistoryItem[]) => {
    set({
      watchHistoryItems: items,
      watchHistoryError: null,
    });
  },

  addWatchHistoryItem: (item: Omit<WatchHistoryItem, 'id'>) => {
    const currentItems = get().watchHistoryItems;
    const newItem: WatchHistoryItem = {
      ...item,
      id: Date.now(), // Temporary ID for optimistic updates
    };

    set({
      watchHistoryItems: [newItem, ...currentItems],
      watchHistoryError: null,
    });
  },

  updateWatchHistoryItem: (id: number, updates: Partial<WatchHistoryItem>) => {
    const currentItems = get().watchHistoryItems;
    set({
      watchHistoryItems: currentItems.map((item: WatchHistoryItem) =>
        item.id === id ? { ...item, ...updates } : item
      ),
      watchHistoryError: null,
    });
  },

  removeWatchHistoryItem: (id: number) => {
    const currentItems = get().watchHistoryItems;
    set({
      watchHistoryItems: currentItems.filter((item: WatchHistoryItem) => item.id !== id),
      watchHistoryError: null,
    });
  },

  setWatchHistoryFilters: (filters: Partial<WatchHistoryFilters>) => {
    const currentFilters = get().watchHistoryFilters;
    set({
      watchHistoryFilters: {
        ...currentFilters,
        ...filters,
      },
      watchHistoryCurrentPage: 1, // Reset to first page when filters change
    });
  },

  setWatchHistoryLoading: (isLoading: boolean) => {
    set({ watchHistoryIsLoading: isLoading });
  },

  setWatchHistoryError: (error: string | null) => {
    set({ watchHistoryError: error, watchHistoryIsLoading: false });
  },

  setWatchHistoryPage: (page: number) => {
    set({ watchHistoryCurrentPage: page });
  },

  // API integration actions
  fetchWatchHistory: async (page = 1, search = '', filters: Partial<WatchHistoryFilters> = {}) => {
    set({ watchHistoryIsLoading: true });
    set({ watchHistoryError: null });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (filters.year) params.append('year', filters.year.toString());

      const response = await fetch(`/api/watch-history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch watch history');
      }

      if (page === 1) {
        set({ watchHistoryItems: data.items });
      } else {
        const currentItems = get().watchHistoryItems;
        set({ watchHistoryItems: [...currentItems, ...data.items] });
      }

      set({
        watchHistoryCurrentPage: data.pagination.page,
        watchHistoryTotalPages: data.pagination.totalPages,
        watchHistoryTotalResults: data.pagination.total,
      });
    } catch (error) {
      console.error('Error fetching watch history:', error);
      set({ watchHistoryError: error instanceof Error ? error.message : 'Failed to fetch watch history' });
    } finally {
      set({ watchHistoryIsLoading: false });
    }
  },

  addToWatchHistory: async (data: { movieId: number; watchedAt: Date; rating?: number; notes?: string; }) => {
    set({ watchHistoryError: null });

    try {
      const response = await fetch('/api/watch-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add movie to watch history');
      }

      // Add to local state (optimistic update)
      const currentItems = get().watchHistoryItems;
      const newItem: WatchHistoryItem = {
        ...result,
        id: Date.now(), // Temporary ID for optimistic updates
      };
      set({ watchHistoryItems: [newItem, ...currentItems] });

      return result;
    } catch (error) {
      console.error('Error adding to watch history:', error);
      set({ watchHistoryError: error instanceof Error ? error.message : 'Failed to add movie to watch history' });
      throw error;
    }
  },

  updateWatchHistory: async (id: number, updates: { watchedAt?: Date; rating?: number; notes?: string; }) => {
    set({ watchHistoryError: null });

    try {
      const response = await fetch(`/api/watch-history/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update watch history entry');
      }

      // Update local state
      const currentItems = get().watchHistoryItems;
      set({
        watchHistoryItems: currentItems.map((item: WatchHistoryItem) =>
          item.id === id ? { ...item, ...result } : item
        )
      });

      return result;
    } catch (error) {
      console.error('Error updating watch history:', error);
      set({ watchHistoryError: error instanceof Error ? error.message : 'Failed to update watch history entry' });
      throw error;
    }
  },

  deleteWatchHistory: async (id: number) => {
    set({ watchHistoryError: null });

    try {
      const response = await fetch(`/api/watch-history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete watch history entry');
      }

      // Remove from local state
      const currentItems = get().watchHistoryItems;
      set({ watchHistoryItems: currentItems.filter((item: WatchHistoryItem) => item.id !== id) });
    } catch (error) {
      console.error('Error deleting watch history:', error);
      set({ watchHistoryError: error instanceof Error ? error.message : 'Failed to delete watch history entry' });
      throw error;
    }
  },

  searchWatchHistory: async (query: string, page = 1) => {
    set({ watchHistoryIsLoading: true });
    set({ watchHistoryError: null });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: query,
      });

      const response = await fetch(`/api/watch-history?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search watch history');
      }

      if (page === 1) {
        set({ watchHistoryItems: data.items });
      } else {
        const currentItems = get().watchHistoryItems;
        set({ watchHistoryItems: [...currentItems, ...data.items] });
      }

      set({
        watchHistoryCurrentPage: data.pagination.page,
        watchHistoryTotalPages: data.pagination.totalPages,
        watchHistoryTotalResults: data.pagination.total,
      });
    } catch (error) {
      console.error('Error searching watch history:', error);
      set({ watchHistoryError: error instanceof Error ? error.message : 'Failed to search watch history' });
    } finally {
      set({ watchHistoryIsLoading: false });
    }
  },

  getWatchHistoryStats: async () => {
    try {
      const response = await fetch('/api/watch-history', {
        method: 'PATCH',
      });

      const stats = await response.json();

      if (!response.ok) {
        throw new Error(stats.error || 'Failed to fetch watch history statistics');
      }

      return stats;
    } catch (error) {
      console.error('Error fetching watch history stats:', error);
      throw error;
    }
  },
});