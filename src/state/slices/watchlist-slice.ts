import { WatchlistState, WatchlistActions, WatchlistItem, WatchlistFilters } from '../types';

export interface WatchlistSlice extends WatchlistState, WatchlistActions {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const watchlistSlice = (set: any, get: any) => ({
  // Initial watchlist state
  watchlistItems: [],
  watchlistFilters: {},
  watchlistIsLoading: false,
  watchlistError: null,
  watchlistCurrentPage: 1,
  watchlistTotalPages: 0,
  watchlistTotalResults: 0,

  // Watchlist actions
  setWatchlistItems: (items: WatchlistItem[]) => {
    set({
      watchlistItems: items,
      watchlistError: null,
    });
  },

  addWatchlistItem: (item: Omit<WatchlistItem, 'id'>) => {
    const currentItems = get().watchlistItems;
    const newItem: WatchlistItem = {
      ...item,
      id: Date.now(), // Temporary ID for optimistic updates
    };

    set({
      watchlistItems: [newItem, ...currentItems],
      watchlistError: null,
    });
  },

  updateWatchlistItem: (id: number, updates: Partial<WatchlistItem>) => {
    const currentItems = get().watchlistItems;
    set({
      watchlistItems: currentItems.map((item: WatchlistItem) =>
        item.id === id ? { ...item, ...updates } : item
      ),
      watchlistError: null,
    });
  },

  removeWatchlistItem: (id: number) => {
    const currentItems = get().watchlistItems;
    set({
      watchlistItems: currentItems.filter((item: WatchlistItem) => item.id !== id),
      watchlistError: null,
    });
  },

  setWatchlistFilters: (filters: Partial<WatchlistFilters>) => {
    const currentFilters = get().watchlistFilters;
    set({
      watchlistFilters: {
        ...currentFilters,
        ...filters,
      },
      watchlistCurrentPage: 1, // Reset to first page when filters change
    });
  },

  setWatchlistLoading: (isLoading: boolean) => {
    set({ watchlistIsLoading: isLoading });
  },

  setWatchlistError: (error: string | null) => {
    set({ watchlistError: error, watchlistIsLoading: false });
  },

  setWatchlistPage: (page: number) => {
    set({ watchlistCurrentPage: page });
  },

  // API integration actions
  fetchWatchlist: async (page = 1, search = '', filters: Partial<WatchlistFilters> = {}) => {
    set({ watchlistIsLoading: true });
    set({ watchlistError: null });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await fetch(`/api/watchlist?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch watchlist');
      }

      if (page === 1) {
        set({ watchlistItems: data.items });
      } else {
        const currentItems = get().watchlistItems;
        set({ watchlistItems: [...currentItems, ...data.items] });
      }

      set({
        watchlistCurrentPage: data.pagination.page,
        watchlistTotalPages: data.pagination.totalPages,
        watchlistTotalResults: data.pagination.total,
      });
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to fetch watchlist' });
    } finally {
      set({ watchlistIsLoading: false });
    }
  },

  addToWatchlist: async (data: { movieId: number; priority?: 'low' | 'medium' | 'high'; userId?: number }) => {
    set({ watchlistError: null });

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add movie to watchlist');
      }

      // Add to local state (optimistic update)
      const currentItems = get().watchlistItems;
      const newItem: WatchlistItem = {
        ...result,
        id: Date.now(), // Temporary ID for optimistic updates
      };
      set({ watchlistItems: [newItem, ...currentItems] });

      return result;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to add movie to watchlist' });
      throw error;
    }
  },

  updateWatchlist: async (id: number, updates: Partial<WatchlistItem>) => {
    set({ watchlistError: null });

    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update watchlist entry');
      }

      // Update local state
      const currentItems = get().watchlistItems;
      set({
        watchlistItems: currentItems.map((item: WatchlistItem) =>
          item.id === id ? { ...item, ...result } : item
        )
      });

      return result;
    } catch (error) {
      console.error('Error updating watchlist:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to update watchlist entry' });
      throw error;
    }
  },

  updateWatchlistPriority: async (id: number, priority: 'low' | 'medium' | 'high') => {
    set({ watchlistError: null });

    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update watchlist priority');
      }

      // Update local state
      const currentItems = get().watchlistItems;
      set({
        watchlistItems: currentItems.map((item: WatchlistItem) =>
          item.id === id ? { ...item, ...result } : item
        )
      });

      return result;
    } catch (error) {
      console.error('Error updating watchlist priority:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to update watchlist priority' });
      throw error;
    }
  },

  removeFromWatchlist: async (id: number) => {
    set({ watchlistError: null });

    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to remove movie from watchlist');
      }

      // Remove from local state
      const currentItems = get().watchlistItems;
      set({ watchlistItems: currentItems.filter((item: WatchlistItem) => item.id !== id) });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to remove movie from watchlist' });
      throw error;
    }
  },

  searchWatchlist: async (query: string, page = 1) => {
    set({ watchlistIsLoading: true });
    set({ watchlistError: null });

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: query,
      });

      const response = await fetch(`/api/watchlist?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search watchlist');
      }

      if (page === 1) {
        set({ watchlistItems: data.items });
      } else {
        const currentItems = get().watchlistItems;
        set({ watchlistItems: [...currentItems, ...data.items] });
      }

      set({
        watchlistCurrentPage: data.pagination.page,
        watchlistTotalPages: data.pagination.totalPages,
        watchlistTotalResults: data.pagination.total,
      });
    } catch (error) {
      console.error('Error searching watchlist:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to search watchlist' });
    } finally {
      set({ watchlistIsLoading: false });
    }
  },

  getWatchlistStats: async () => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'PATCH',
      });

      const stats = await response.json();

      if (!response.ok) {
        throw new Error(stats.error || 'Failed to fetch watchlist statistics');
      }

      return stats;
    } catch (error) {
      console.error('Error fetching watchlist stats:', error);
      throw error;
    }
  },

  // Bulk operations for drag-and-drop
  bulkUpdatePriorities: async (updates: { id: number; priority: 'low' | 'medium' | 'high' }[]) => {
    set({ watchlistError: null });

    try {
      const response = await fetch('/api/watchlist/bulk-priority', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const results = await response.json();

      if (!response.ok) {
        throw new Error(results.error || 'Failed to bulk update priorities');
      }

      // Update local state with new order
      const currentItems = get().watchlistItems;
      const updatedItems = currentItems.map((item: WatchlistItem) => {
        const update = results.find((u: { id: number }) => u.id === item.id);
        return update || item;
      });

      set({ watchlistItems: updatedItems });

      return results;
    } catch (error) {
      console.error('Error bulk updating priorities:', error);
      set({ watchlistError: error instanceof Error ? error.message : 'Failed to bulk update priorities' });
      throw error;
    }
  },
});