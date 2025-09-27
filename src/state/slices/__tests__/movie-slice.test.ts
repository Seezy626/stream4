import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { movieSlice } from '../movie-slice';
import { MovieFilters } from '../../types';
import { createMockMovie } from '../../../utils/test-factories';

// Mock the StateCreator type

const mockSet = jest.fn();
const mockGet = jest.fn();

const createMockStore = (initialState = {}) => {
  const defaultState = {
    searchResults: [],
    selectedMovie: null,
    movieFilters: {},
    movieIsLoading: false,
    movieError: null,
    movieCurrentPage: 1,
    movieTotalPages: 0,
    movieTotalResults: 0,
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
      expect(store.movieFilters).toEqual({});
      expect(store.movieIsLoading).toBe(false);
      expect(store.movieError).toBeNull();
      expect(store.movieCurrentPage).toBe(1);
      expect(store.movieTotalPages).toBe(0);
      expect(store.movieTotalResults).toBe(0);
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
        movieTotalPages: totalPages,
        movieTotalResults: totalResults,
        movieError: null,
      });
    });

    it('should clear error when setting search results', () => {
      const store = createMockStore({ movieError: 'Previous error' });
      const mockResults = [createMockMovie()];

      store.setSearchResults(mockResults, 1, 1);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          movieError: null,
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

  describe('setMovieFilters', () => {
    it('should merge new filters with existing ones', () => {
      const initialFilters: MovieFilters = {
        genre: [28, 12],
        sortBy: 'popularity.desc',
      };
      const store = createMockStore({ movieFilters: initialFilters });
      const newFilters: Partial<MovieFilters> = {
        year: 2023,
        minRating: 7.5,
      };

      store.setMovieFilters(newFilters);

      expect(mockSet).toHaveBeenCalledWith({
        movieFilters: {
          ...initialFilters,
          ...newFilters,
        },
        movieCurrentPage: 1, // Should reset to first page
      });
    });

    it('should reset to page 1 when filters change', () => {
      const store = createMockStore({ movieCurrentPage: 5 });

      store.setMovieFilters({ genre: [28] });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          movieCurrentPage: 1,
        })
      );
    });

    it('should handle empty filters object', () => {
      const store = createMockStore();

      store.setMovieFilters({});

      expect(mockSet).toHaveBeenCalledWith({
        movieFilters: {},
        movieCurrentPage: 1,
      });
    });
  });

  describe('setMovieLoading', () => {
    it('should set loading state', () => {
      const store = createMockStore();

      store.setMovieLoading(true);
      expect(mockSet).toHaveBeenCalledWith({ movieIsLoading: true });

      store.setMovieLoading(false);
      expect(mockSet).toHaveBeenCalledWith({ movieIsLoading: false });
    });
  });

  describe('setMovieError', () => {
    it('should set error and clear loading', () => {
      const store = createMockStore({ movieIsLoading: true });
      const errorMessage = 'Failed to fetch movies';

      store.setMovieError(errorMessage);

      expect(mockSet).toHaveBeenCalledWith({
        movieError: errorMessage,
        movieIsLoading: false,
      });
    });

    it('should clear error when passed null', () => {
      const store = createMockStore({ movieError: 'Previous error' });

      store.setMovieError(null);

      expect(mockSet).toHaveBeenCalledWith({
        movieError: null,
        movieIsLoading: false,
      });
    });
  });

  describe('setMoviePage', () => {
    it('should set current page', () => {
      const store = createMockStore();

      store.setMoviePage(3);

      expect(mockSet).toHaveBeenCalledWith({
        movieCurrentPage: 3,
      });
    });

    it('should handle page 1', () => {
      const store = createMockStore({ movieCurrentPage: 5 });

      store.setMoviePage(1);

      expect(mockSet).toHaveBeenCalledWith({
        movieCurrentPage: 1,
      });
    });
  });

  describe('clearSearch', () => {
    it('should reset all search-related state', () => {
      const initialState = {
        searchResults: [createMockMovie()],
        selectedMovie: createMockMovie(),
        movieFilters: { genre: [28] },
        movieCurrentPage: 5,
        movieTotalPages: 10,
        movieTotalResults: 200,
        movieError: 'Some error',
      };
      const store = createMockStore(initialState);

      store.clearSearch();

      expect(mockSet).toHaveBeenCalledWith({
        searchResults: [],
        selectedMovie: null,
        movieFilters: {},
        movieCurrentPage: 1,
        movieTotalPages: 0,
        movieTotalResults: 0,
        movieError: null,
      });
    });

    it('should preserve non-search related state', () => {
      const store = createMockStore({
        movieIsLoading: true,
      });

      store.clearSearch();

      // clearSearch should not change movieIsLoading
      expect(mockSet).toHaveBeenCalledWith({
        searchResults: [],
        selectedMovie: null,
        movieFilters: {},
        movieCurrentPage: 1,
        movieTotalPages: 0,
        movieTotalResults: 0,
        movieError: null,
      });
    });
  });


  describe('integration with get function', () => {
    it('should use get function to access current filters in setMovieFilters', () => {
      const currentFilters: MovieFilters = {
        genre: [28],
        sortBy: 'popularity.desc',
      };
      const store = createMockStore({ movieFilters: currentFilters });

      store.setMovieFilters({ year: 2023 });

      expect(mockGet).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({
        movieFilters: {
          ...currentFilters,
          year: 2023,
        },
        movieCurrentPage: 1,
      });
    });
  });
});