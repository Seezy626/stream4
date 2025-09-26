import { StateCreator } from 'zustand';
import { AppState, WatchHistoryState, WatchHistoryActions, WatchHistoryItem } from '../types';

export interface WatchHistorySlice extends WatchHistoryState, WatchHistoryActions {}

export const watchHistorySlice: StateCreator<
  AppState & WatchHistoryActions,
  [],
  [],
  WatchHistorySlice
> = (set, get) => ({
  // Initial watch history state
  items: [],
  filters: {},
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalResults: 0,

  // Watch history actions
  setItems: (items) => {
    set({
      items,
      error: null,
    });
  },

  addItem: (item) => {
    const currentItems = get().items;
    const newItem: WatchHistoryItem = {
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
  fetchWatchHistory: async (page = 1, search = '', filters = {}) => {
    const { setLoading, setError, setItems } = get();

    try {
      setLoading(true);
      setError(null);

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
      console.error('Error fetching watch history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch watch history');
    } finally {
      setLoading(false);
    }
  },

  addToWatchHistory: async (data) => {
    const { addItem, setError } = get();

    try {
      setError(null);

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
      addItem(result);

      return result;
    } catch (error) {
      console.error('Error adding to watch history:', error);
      setError(error instanceof Error ? error.message : 'Failed to add movie to watch history');
      throw error;
    }
  },

  updateWatchHistory: async (id, updates) => {
    const { updateItem, setError } = get();

    try {
      setError(null);

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
      updateItem(id, result);

      return result;
    } catch (error) {
      console.error('Error updating watch history:', error);
      setError(error instanceof Error ? error.message : 'Failed to update watch history entry');
      throw error;
    }
  },

  deleteWatchHistory: async (id) => {
    const { removeItem, setError } = get();

    try {
      setError(null);

      const response = await fetch(`/api/watch-history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete watch history entry');
      }

      // Remove from local state
      removeItem(id);
    } catch (error) {
      console.error('Error deleting watch history:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete watch history entry');
      throw error;
    }
  },

  searchWatchHistory: async (query, page = 1) => {
    const { fetchWatchHistory } = get();
    return fetchWatchHistory(page, query);
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