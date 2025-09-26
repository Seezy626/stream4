import { MovieState, MovieActions, MovieFilters } from '../types';

export interface MovieSlice extends MovieState, MovieActions {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const movieSlice = (set: any, get: any) => ({
  // Initial movie state
  searchResults: [],
  selectedMovie: null,
  movieFilters: {},
  movieIsLoading: false,
  movieError: null,
  movieCurrentPage: 1,
  movieTotalPages: 0,
  movieTotalResults: 0,

  // Movie actions
  setSearchResults: (results: unknown[], totalPages: number, totalResults: number) => {
    set({
      searchResults: results,
      movieTotalPages: totalPages,
      movieTotalResults: totalResults,
      movieError: null,
    });
  },

  setSelectedMovie: (movie: unknown | null) => {
    set({ selectedMovie: movie });
  },

  setMovieFilters: (filters: Partial<MovieFilters>) => {
    const currentFilters = get().movieFilters;
    set({
      movieFilters: {
        ...currentFilters,
        ...filters,
      },
      movieCurrentPage: 1, // Reset to first page when filters change
    });
  },

  setMovieLoading: (isLoading: boolean) => {
    set({ movieIsLoading: isLoading });
  },

  setMovieError: (error: string | null) => {
    set({ movieError: error, movieIsLoading: false });
  },

  setMoviePage: (page: number) => {
    set({ movieCurrentPage: page });
  },

  clearSearch: () => {
    set({
      searchResults: [],
      selectedMovie: null,
      movieFilters: {},
      movieCurrentPage: 1,
      movieTotalPages: 0,
      movieTotalResults: 0,
      movieError: null,
    });
  },
});