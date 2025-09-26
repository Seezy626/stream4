import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { watchlistSlice } from '../watchlist-slice';
import { WatchlistFilters, WatchlistItem } from '../../types';
import { createMockWatchlistItem } from '../../../__tests__/utils/test-factories';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the StateCreator type
type MockSetState = jest.MockedFunction<(partial: any) => void>;
type MockGetState = jest.MockedFunction<() => any>;

const mockSet = jest.fn();
const mockGet = jest.fn();

const createMockStore = (initialState = {}) => {
  const defaultState = {
    items: [],
    filters: {},
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    ...initialState,
  };

  mockGet.mockReturnValue(defaultState);
  mockSet.mockClear();

  return watchlistSlice(mockSet as any, mockGet as any);
};

describe('watchlistSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createMockStore();

      expect(store.items).toEqual([]);
      expect(store.filters).toEqual({});
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentPage).toBe(1);
      expect(store.totalPages).toBe(0);
      expect(store.totalResults).toBe(0);
    });
  });

  describe('setItems', () => {
    it('should set items and clear error', () => {
      const store = createMockStore({ error: 'Previous error' });
      const mockItems = [createMockWatchlistItem(), createMockWatchlistItem()];

      store.setItems(mockItems);

      expect(mockSet).toHaveBeenCalledWith({
        items: mockItems,
        error: null,
      });
    });

    it('should replace existing items', () => {
      const existingItems = [createMockWatchlistItem()];
      const store = createMockStore({ items: existingItems });
      const newItems = [createMockWatchlistItem(), createMockWatchlistItem()];

      store.setItems(newItems);

      expect(mockSet).toHaveBeenCalledWith({
        items: newItems,
        error: null,
      });
    });
  });

  describe('addItem', () => {
    it('should add item to beginning of list', () => {
      const existingItems = [createMockWatchlistItem({ id: 1 })];
      const store = createMockStore({ items: existingItems });
      const newItemData = createMockWatchlistItem({ id: 2 });

      store.addItem(newItemData);

      expect(mockSet).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({ id: expect.any(Number) }),
          ...existingItems,
        ]),
        error: null,
      });
    });

    it('should generate temporary ID for new item', () => {
      const store = createMockStore();
      const newItemData = createMockWatchlistItem({ id: undefined });

      store.addItem(newItemData);

      expect(mockSet).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
          }),
        ]),
        error: null,
      });
    });
  });

  describe('updateItem', () => {
    it('should update existing item', () => {
      const existingItem = createMockWatchlistItem({ id: 1, priority: 'low' });
      const store = createMockStore({ items: [existingItem] });
      const updates = { priority: 'high' as const };

      store.updateItem(1, updates);

      expect(mockSet).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            priority: 'high',
          }),
        ]),
        error: null,
      });
    });

    it('should not modify other items', () => {
      const items = [
        createMockWatchlistItem({ id: 1, priority: 'low' }),
        createMockWatchlistItem({ id: 2, priority: 'medium' }),
      ];
      const store = createMockStore({ items });
      const updates = { priority: 'high' as const };

      store.updateItem(1, updates);

      expect(mockSet).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 1, priority: 'high' }),
          expect.objectContaining({ id: 2, priority: 'medium' }),
        ]),
        error: null,
      });
    });

    it('should handle non-existent item gracefully', () => {
      const items = [createMockWatchlistItem({ id: 1 })];
      const store = createMockStore({ items });
      const updates = { priority: 'high' as const };

      store.updateItem(999, updates);

      expect(mockSet).toHaveBeenCalledWith({
        items: items, // Should remain unchanged
        error: null,
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item from list', () => {
      const items = [
        createMockWatchlistItem({ id: 1 }),
        createMockWatchlistItem({ id: 2 }),
        createMockWatchlistItem({ id: 3 }),
      ];
      const store = createMockStore({ items });

      store.removeItem(2);

      expect(mockSet).toHaveBeenCalledWith({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 3 }),
        ]),
        error: null,
      });
      expect(mockSet.mock.calls[0][0].items).toHaveLength(2);
    });

    it('should handle non-existent item gracefully', () => {
      const items = [createMockWatchlistItem({ id: 1 })];
      const store = createMockStore({ items });

      store.removeItem(999);

      expect(mockSet).toHaveBeenCalledWith({
        items: items, // Should remain unchanged
        error: null,
      });
    });
  });

  describe('setFilters', () => {
    it('should merge new filters with existing ones', () => {
      const initialFilters: WatchlistFilters = {
        priority: 'high',
        sortBy: 'added_at',
      };
      const store = createMockStore({ filters: initialFilters });
      const newFilters: Partial<WatchlistFilters> = {
        sortOrder: 'desc',
      };

      store.setFilters(newFilters);

      expect(mockSet).toHaveBeenCalledWith({
        filters: {
          ...initialFilters,
          ...newFilters,
        },
        currentPage: 1, // Should reset to first page
      });
    });

    it('should reset to page 1 when filters change', () => {
      const store = createMockStore({ currentPage: 5 });

      store.setFilters({ priority: 'high' });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: 1,
        })
      );
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = createMockStore();

      store.setLoading(true);
      expect(mockSet).toHaveBeenCalledWith({ isLoading: true });

      store.setLoading(false);
      expect(mockSet).toHaveBeenCalledWith({ isLoading: false });
    });
  });

  describe('setError', () => {
    it('should set error and clear loading', () => {
      const store = createMockStore({ isLoading: true });
      const errorMessage = 'Failed to fetch watchlist';

      store.setError(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        error: errorMessage,
        isLoading: false,
      });
    });

    it('should clear error when passed null', () => {
      const store = createMockStore({ error: 'Previous error' });

      store.setError(null);

      expect(mockSet).toHaveBeenCalledWith({
        error: null,
        isLoading: false,
      });
    });
  });

  describe('setPage', () => {
    it('should set current page', () => {
      const store = createMockStore();

      store.setPage(3);

      expect(mockSet).toHaveBeenCalledWith({
        currentPage: 3,
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
      });

      const store = createMockStore();

      await store.fetchWatchlist();

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist?page=1&limit=20');
      expect(mockSet).toHaveBeenCalledWith({
        isLoading: true,
      });
      expect(mockSet).toHaveBeenCalledWith({
        items: mockResponse.items,
        currentPage: 1,
        totalPages: 1,
        totalResults: 1,
      });
      expect(mockSet).toHaveBeenCalledWith({
        isLoading: false,
      });
    });

    it('should handle search query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], pagination: { page: 1, totalPages: 0, total: 0 } }),
      });

      const store = createMockStore();

      await store.fetchWatchlist(1, 'test search');

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist?page=1&limit=20&search=test%20search');
    });

    it('should handle filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [], pagination: { page: 1, totalPages: 0, total: 0 } }),
      });

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
      });

      const store = createMockStore({ items: existingItems });

      await store.fetchWatchlist(2);

      expect(mockSet).toHaveBeenCalledWith({
        items: [...existingItems, ...newItems],
        currentPage: 2,
        totalPages: 2,
        totalResults: 2,
      });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch watchlist';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      const store = createMockStore();

      await store.fetchWatchlist();

      expect(mockSet).toHaveBeenCalledWith({
        error: errorMessage,
        isLoading: false,
      });
    });

    it('should handle network errors', async () => {
      const errorMessage = 'Network error';

      mockFetch.mockRejectedValueOnce(new Error(errorMessage));

      const store = createMockStore();

      await store.fetchWatchlist();

      expect(mockSet).toHaveBeenCalledWith({
        error: errorMessage,
        isLoading: false,
      });
    });
  });

  describe('addToWatchlist', () => {
    it('should add item to watchlist successfully', async () => {
      const newItem = createMockWatchlistItem({ id: undefined });
      const responseItem = createMockWatchlistItem({ id: 123 });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseItem),
      });

      const store = createMockStore();

      const result = await store.addToWatchlist(newItem);

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      expect(mockSet).toHaveBeenCalledWith({ error: null });
      expect(result).toEqual(responseItem);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to add movie to watchlist';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      const store = createMockStore();

      await expect(store.addToWatchlist(createMockWatchlistItem())).rejects.toThrow(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        error: errorMessage,
      });
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove item from watchlist successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const store = createMockStore();

      await store.removeFromWatchlist(123);

      expect(mockFetch).toHaveBeenCalledWith('/api/watchlist/123', {
        method: 'DELETE',
      });
      expect(mockSet).toHaveBeenCalledWith({ error: null });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to remove movie from watchlist';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      const store = createMockStore();

      await expect(store.removeFromWatchlist(123)).rejects.toThrow(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        error: errorMessage,
      });
    });
  });
});