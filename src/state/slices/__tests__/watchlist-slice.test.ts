/* eslint-disable */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { watchlistSlice } from '../watchlist-slice';
import { WatchlistFilters } from '../../types';
import { createMockWatchlistItem } from '../../../utils/test-factories';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock the StateCreator type

const mockSet = jest.fn();
const mockGet = jest.fn();

const createMockStore = (initialState = {}) => {
  const defaultState = {
    watchlistItems: [],
    watchlistFilters: {},
    watchlistIsLoading: false,
    watchlistError: null,
    watchlistCurrentPage: 1,
    watchlistTotalPages: 0,
    watchlistTotalResults: 0,
    ...initialState,
  };

  mockGet.mockReturnValue(defaultState);
  mockSet.mockClear();

  return watchlistSlice(mockSet as jest.MockedFunction<jest.Mock>, mockGet as jest.MockedFunction<jest.Mock>);
};

describe('watchlistSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createMockStore();

      expect(store.watchlistItems).toEqual([]);
      expect(store.watchlistFilters).toEqual({});
      expect(store.watchlistIsLoading).toBe(false);
      expect(store.watchlistError).toBeNull();
      expect(store.watchlistCurrentPage).toBe(1);
      expect(store.watchlistTotalPages).toBe(0);
      expect(store.watchlistTotalResults).toBe(0);
    });
  });

  describe('setWatchlistItems', () => {
    it('should set items and clear error', () => {
      const store = createMockStore({ watchlistError: 'Previous error' });
      const mockItems = [createMockWatchlistItem(), createMockWatchlistItem()];

      store.setWatchlistItems(mockItems);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: mockItems,
        watchlistError: null,
      });
    });

    it('should replace existing items', () => {
      const existingItems = [createMockWatchlistItem()];
      const store = createMockStore({ watchlistItems: existingItems });
      const newItems = [createMockWatchlistItem(), createMockWatchlistItem()];

      store.setWatchlistItems(newItems);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: newItems,
        watchlistError: null,
      });
    });
  });

  describe('addWatchlistItem', () => {
    it('should add item to beginning of list', () => {
      const existingItems = [createMockWatchlistItem({ id: 1 })];
      const store = createMockStore({ watchlistItems: existingItems });
      const newItemData = createMockWatchlistItem({ id: 2 });

      store.addWatchlistItem(newItemData);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: expect.arrayContaining([
          expect.objectContaining({ id: expect.any(Number) }),
          ...existingItems,
        ]),
        watchlistError: null,
      });
    });

    it('should generate temporary ID for new item', () => {
      const store = createMockStore();
      const newItemData = createMockWatchlistItem({ id: undefined });

      store.addWatchlistItem(newItemData);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
          }),
        ]),
        watchlistError: null,
      });
    });
  });

  describe('updateWatchlistItem', () => {
    it('should update existing item', () => {
      const existingItem = createMockWatchlistItem({ id: 1, priority: 'low' });
      const store = createMockStore({ watchlistItems: [existingItem] });
      const updates = { priority: 'high' as const };

      store.updateWatchlistItem(1, updates);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            priority: 'high',
          }),
        ]),
        watchlistError: null,
      });
    });

    it('should not modify other items', () => {
      const items = [
        createMockWatchlistItem({ id: 1, priority: 'low' }),
        createMockWatchlistItem({ id: 2, priority: 'medium' }),
      ];
      const store = createMockStore({ watchlistItems: items });
      const updates = { priority: 'high' as const };

      store.updateWatchlistItem(1, updates);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: expect.arrayContaining([
          expect.objectContaining({ id: 1, priority: 'high' }),
          expect.objectContaining({ id: 2, priority: 'medium' }),
        ]),
        watchlistError: null,
      });
    });

    it('should handle non-existent item gracefully', () => {
      const items = [createMockWatchlistItem({ id: 1 })];
      const store = createMockStore({ watchlistItems: items });
      const updates = { priority: 'high' as const };

      store.updateWatchlistItem(999, updates);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: items, // Should remain unchanged
        watchlistError: null,
      });
    });
  });

  describe('removeWatchlistItem', () => {
    it('should remove item from list', () => {
      const items = [
        createMockWatchlistItem({ id: 1 }),
        createMockWatchlistItem({ id: 2 }),
        createMockWatchlistItem({ id: 3 }),
      ];
      const store = createMockStore({ watchlistItems: items });

      store.removeWatchlistItem(2);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 3 }),
        ]),
        watchlistError: null,
      });
      expect((mockSet.mock.calls[0][0] as { watchlistItems: unknown[] }).watchlistItems).toHaveLength(2);
    });

    it('should handle non-existent item gracefully', () => {
      const items = [createMockWatchlistItem({ id: 1 })];
      const store = createMockStore({ watchlistItems: items });

      store.removeWatchlistItem(999);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: items, // Should remain unchanged
        watchlistError: null,
      });
    });
  });

  describe('setWatchlistFilters', () => {
    it('should merge new filters with existing ones', () => {
      const initialFilters: WatchlistFilters = {
        priority: 'high',
        sortBy: 'added_at',
      };
      const store = createMockStore({ watchlistFilters: initialFilters });
      const newFilters: Partial<WatchlistFilters> = {
        sortOrder: 'desc',
      };

      store.setWatchlistFilters(newFilters);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistFilters: {
          ...initialFilters,
          ...newFilters,
        },
        watchlistCurrentPage: 1, // Should reset to first page
      });
    });

    it('should reset to page 1 when filters change', () => {
      const store = createMockStore({ watchlistCurrentPage: 5 });

      store.setWatchlistFilters({ priority: 'high' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          watchlistCurrentPage: 1,
        })
      );
    });
  });

  describe('setWatchlistLoading', () => {
    it('should set loading state', () => {
      const store = createMockStore();

      store.setWatchlistLoading(true);
      expect(mockSet).toHaveBeenCalledWith({ watchlistIsLoading: true });

      store.setWatchlistLoading(false);
      expect(mockSet).toHaveBeenCalledWith({ watchlistIsLoading: false });
    });
  });

  describe('setWatchlistError', () => {
    it('should set error and clear loading', () => {
      const store = createMockStore({ watchlistIsLoading: true });
      const errorMessage = 'Failed to fetch watchlist';

      store.setWatchlistError(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistError: errorMessage,
        watchlistIsLoading: false,
      });
    });

    it('should clear error when passed null', () => {
      const store = createMockStore({ watchlistError: 'Previous error' });

      store.setWatchlistError(null);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistError: null,
        watchlistIsLoading: false,
      });
    });
  });

  describe('setWatchlistPage', () => {
    it('should set current page', () => {
      const store = createMockStore();

      store.setWatchlistPage(3);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistCurrentPage: 3,
      });
    });
  });

  describe('fetchWatchlist', () => {
    it('should fetch watchlist successfully', async () => {
      const mockResponse = {
        items: [createMockWatchlistItem()],
        pagination: {
          page: 1,
          totalPages: 1,
          total: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const store = createMockStore();

      await store.fetchWatchlist();

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist?page=1&limit=20');
      expect(mockSet).toHaveBeenCalledWith({
        watchlistIsLoading: true,
      });
      expect(mockSet).toHaveBeenCalledWith({
        watchlistError: null,
      });
      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: mockResponse.items,
      });
      expect(mockSet).toHaveBeenCalledWith({
        watchlistCurrentPage: mockResponse.pagination.page,
        watchlistTotalPages: mockResponse.pagination.totalPages,
        watchlistTotalResults: mockResponse.pagination.total,
      });
      expect(mockSet).toHaveBeenCalledWith({
        watchlistIsLoading: false,
      });
    });

    it('should handle search query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], pagination: { page: 1, totalPages: 0, total: 0 } }),
      } as Response);

      const store = createMockStore();

      await store.fetchWatchlist(1, 'test search');

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist?page=1&limit=20&search=test+search');
    });

    it('should handle filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], pagination: { page: 1, totalPages: 0, total: 0 } }),
      } as Response);

      const store = createMockStore();

      await store.fetchWatchlist(1, '', { priority: 'high' });

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist?page=1&limit=20&priority=high');
    });

    it('should append items for subsequent pages', async () => {
      const existingItems = [createMockWatchlistItem({ id: 1 })];
      const newItems = [createMockWatchlistItem({ id: 2 })];
       
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: newItems,
          pagination: { page: 2, totalPages: 2, total: 2 },
        }),
      } as any);

       
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: newItems,
          pagination: { page: 2, totalPages: 2, total: 2 },
        }),
      } as any);

      const store = createMockStore({ watchlistItems: existingItems });

      await store.fetchWatchlist(2);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistItems: [...existingItems, ...newItems],
      });
      expect(mockSet).toHaveBeenCalledWith({
        watchlistCurrentPage: 2,
        watchlistTotalPages: 2,
        watchlistTotalResults: 2,
      });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch watchlist';

       
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as any);

      const store = createMockStore();

      await store.fetchWatchlist();

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          watchlistError: errorMessage,
        })
      );
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          watchlistIsLoading: false,
        })
      );
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';

      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = createMockStore();

      await store.fetchWatchlist();

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          watchlistError: errorMessage,
        })
      );
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          watchlistIsLoading: false,
        })
      );
    });
  });

  describe('addToWatchlist', () => {
    it('should add item to watchlist successfully', async () => {
      const newItem = { movieId: 123, priority: 'high' as const };
      const responseItem = createMockWatchlistItem({ id: 123 });

       
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseItem),
      } as any);

      const store = createMockStore();

      const result = await store.addToWatchlist(newItem);

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      expect(mockSet).toHaveBeenCalledWith({ watchlistError: null });
      expect(result).toEqual(responseItem);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to add movie to watchlist';

       
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as any);

      const store = createMockStore();

      await expect(store.addToWatchlist({ movieId: 123, priority: 'high' as const })).rejects.toThrow(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistError: errorMessage,
      });
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove item from watchlist successfully', async () => {
       
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as any);

      const store = createMockStore();

      await store.removeFromWatchlist(123);

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist/123', {
        method: 'DELETE',
      });
      expect(mockSet).toHaveBeenCalledWith({ watchlistError: null });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to remove movie from watchlist';

       
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      } as any);

      const store = createMockStore();

      await expect(store.removeFromWatchlist(123)).rejects.toThrow(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        watchlistError: errorMessage,
      });
    });
  });
});