import { StateCreator } from 'zustand';
import { AppState, WatchlistState, WatchlistActions, WatchlistItem } from '../types';

export interface WatchlistSlice extends WatchlistState, WatchlistActions {}

export const watchlistSlice: StateCreator<
  AppState & WatchlistActions,
  [],
  [],
  WatchlistSlice
> = (set, get) => ({
  // Initial watchlist state
  items: [],
  filters: {},
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalResults: 0,

  // Watchlist actions
  setItems: (items) => {
    set({
      items,
      error: null,
    });
  },

  addItem: (item) => {
    const currentItems = get().items;
    const newItem: WatchlistItem = {
      ...item,
      id: Date.now(), // Temporary ID for optimistic updates
    };

    set({
      items: [newItem, ...currentItems],
      error: null,
    });
  },

  updateItem: (id, updates) => {
    const currentItems = get().items;
    set({
      items: currentItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
      error: null,
    });
  },

  removeItem: (id) => {
    const currentItems = get().items;
    set({
      items: currentItems.filter((item) => item.id !== id),
      error: null,
    });
  },

  setFilters: (filters) => {
    const currentFilters = get().filters;
    set({
      filters: {
        ...currentFilters,
        ...filters,
      },
      currentPage: 1, // Reset to first page when filters change
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error, isLoading: false });
  },

  setPage: (page) => {
    set({ currentPage: page });
  },

  // API integration actions
  fetchWatchlist: async (page = 1, search = '', filters = {}) => {
    const { setLoading, setError, setItems } = get();

    try {
      setLoading(true);
      setError(null);

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
        setItems(data.items);
      } else {
        const currentItems = get().items;
        setItems([...currentItems, ...data.items]);
      }

      set({
        currentPage: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalResults: data.pagination.total,
      });
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  },

  addToWatchlist: async (data) => {
    const { addItem, setError } = get();

    try {
      setError(null);

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
      addItem(result);

      return result;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to add movie to watchlist');
      throw error;
    }
  },

  updateWatchlist: async (id, updates) => {
    const { updateItem, setError } = get();

    try {
      setError(null);

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
      updateItem(id, result);

      return result;
    } catch (error) {
      console.error('Error updating watchlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to update watchlist entry');
      throw error;
    }
  },

  updateWatchlistPriority: async (id, priority) => {
    const { updateItem, setError } = get();

    try {
      setError(null);

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
      updateItem(id, result);

      return result;
    } catch (error) {
      console.error('Error updating watchlist priority:', error);
      setError(error instanceof Error ? error.message : 'Failed to update watchlist priority');
      throw error;
    }
  },

  removeFromWatchlist: async (id) => {
    const { removeItem, setError } = get();

    try {
      setError(null);

      const response = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to remove movie from watchlist');
      }

      // Remove from local state
      removeItem(id);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove movie from watchlist');
      throw error;
    }
  },

  searchWatchlist: async (query, page = 1) => {
    const { fetchWatchlist } = get();
    return fetchWatchlist(page, query);
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
  bulkUpdatePriorities: async (updates) => {
    const { setError, setItems } = get();

    try {
      setError(null);

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
      const currentItems = get().items;
      const updatedItems = currentItems.map(item => {
        const update = results.find((u: any) => u.id === item.id);
        return update || item;
      });

      setItems(updatedItems);

      return results;
    } catch (error) {
      console.error('Error bulk updating priorities:', error);
      setError(error instanceof Error ? error.message : 'Failed to bulk update priorities');
      throw error;
    }
  },
});