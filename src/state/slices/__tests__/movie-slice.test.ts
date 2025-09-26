import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { movieSlice } from '../movie-slice';
import { MovieFilters } from '../../types';
import { createMockMovie } from '../../../__tests__/utils/test-factories';

// Mock the StateCreator type

const mockSet = jest.fn();
const mockGet = jest.fn();

const createMockStore = (initialState = {}) => {
  const defaultState = {
    searchResults: [],
    selectedMovie: null,
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

  return movieSlice(mockSet as jest.MockedFunction<jest.Mock>, mockGet as jest.MockedFunction<jest.Mock>);
};

describe('movieSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createMockStore();

      expect(store.searchResults).toEqual([]);
      expect(store.selectedMovie).toBeNull();
      expect(store.filters).toEqual({});
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentPage).toBe(1);
      expect(store.totalPages).toBe(0);
      expect(store.totalResults).toBe(0);
    });
  });

  describe('setSearchResults', () => {
    it('should update search results and pagination', () => {
      const store = createMockStore();
      const mockResults = [createMockMovie(), createMockMovie()];
      const totalPages = 5;
      const totalResults = 100;

      store.setSearchResults(mockResults, totalPages, totalResults);

      expect(mockSet).toHaveBeenCalledWith({
        searchResults: mockResults,
        totalPages,
        totalResults,
        error: null,
      });
    });

    it('should clear error when setting search results', () => {
      const store = createMockStore({ error: 'Previous error' });
      const mockResults = [createMockMovie()];

      store.setSearchResults(mockResults, 1, 1);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          error: null,
        })
      );
    });
  });

  describe('setSelectedMovie', () => {
    it('should set the selected movie', () => {
      const store = createMockStore();
      const mockMovie = createMockMovie();

      store.setSelectedMovie(mockMovie);

      expect(mockSet).toHaveBeenCalledWith({
        selectedMovie: mockMovie,
      });
    });

    it('should clear selected movie when passed null', () => {
      const store = createMockStore({ selectedMovie: createMockMovie() });

      store.setSelectedMovie(null);

      expect(mockSet).toHaveBeenCalledWith({
        selectedMovie: null,
      });
    });
  });

  describe('setFilters', () => {
    it('should merge new filters with existing ones', () => {
      const initialFilters: MovieFilters = {
        genre: [28, 12],
        sortBy: 'popularity.desc',
      };
      const store = createMockStore({ filters: initialFilters });
      const newFilters: Partial<MovieFilters> = {
        year: 2023,
        minRating: 7.5,
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

      store.setFilters({ genre: [28] });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: 1,
        })
      );
    });

    it('should handle empty filters object', () => {
      const store = createMockStore();

      store.setFilters({});

      expect(mockSet).toHaveBeenCalledWith({
        filters: {},
        currentPage: 1,
      });
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
      const errorMessage = 'Failed to fetch movies';

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

    it('should handle page 1', () => {
      const store = createMockStore({ currentPage: 5 });

      store.setPage(1);

      expect(mockSet).toHaveBeenCalledWith({
        currentPage: 1,
      });
    });
  });

  describe('clearSearch', () => {
    it('should reset all search-related state', () => {
      const initialState = {
        searchResults: [createMockMovie()],
        selectedMovie: createMockMovie(),
        filters: { genre: [28] },
        currentPage: 5,
        totalPages: 10,
        totalResults: 200,
        error: 'Some error',
      };
      const store = createMockStore(initialState);

      store.clearSearch();

      expect(mockSet).toHaveBeenCalledWith({
        searchResults: [],
        selectedMovie: null,
        filters: {},
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        error: null,
      });
    });

    it('should preserve non-search related state', () => {
      const store = createMockStore({
        isLoading: true,
      });

      store.clearSearch();

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: true, // Should preserve loading state
        })
      );
    });
  });

  describe('state getters', () => {
    it('should return current state values', () => {
      const mockResults = [createMockMovie(), createMockMovie()];
      const mockMovie = createMockMovie();
      const mockFilters: MovieFilters = {
        genre: [28, 12],
        sortBy: 'popularity.desc',
      };

      const store = createMockStore({
        searchResults: mockResults,
        selectedMovie: mockMovie,
        filters: mockFilters,
        isLoading: true,
        error: 'Test error',
        currentPage: 3,
        totalPages: 10,
        totalResults: 200,
      });

      expect(store.searchResults).toEqual(mockResults);
      expect(store.selectedMovie).toEqual(mockMovie);
      expect(store.filters).toEqual(mockFilters);
      expect(store.isLoading).toBe(true);
      expect(store.error).toBe('Test error');
      expect(store.currentPage).toBe(3);
      expect(store.totalPages).toBe(10);
      expect(store.totalResults).toBe(200);
    });
  });

  describe('integration with get function', () => {
    it('should use get function to access current filters in setFilters', () => {
      const currentFilters: MovieFilters = {
        genre: [28],
        sortBy: 'popularity.desc',
      };
      const store = createMockStore({ filters: currentFilters });

      store.setFilters({ year: 2023 });

      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({
        filters: {
          ...currentFilters,
          year: 2023,
        },
        currentPage: 1,
      });
    });
  });
});