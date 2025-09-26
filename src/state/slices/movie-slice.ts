import { StateCreator } from 'zustand';
import { AppState, MovieState, MovieActions } from '../types';

export interface MovieSlice extends MovieState, MovieActions {}

export const movieSlice: StateCreator<
  AppState & MovieActions,
  [],
  [],
  MovieSlice
> = (set, get) => ({
  // Initial movie state
  searchResults: [],
  selectedMovie: null,
  filters: {},
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalResults: 0,

  // Movie actions
  setSearchResults: (results, totalPages, totalResults) => {
    set({
      searchResults: results,
      totalPages,
      totalResults,
      error: null,
    });
  },

  setSelectedMovie: (movie) => {
    set({ selectedMovie: movie });
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

  clearSearch: () => {
    set({
      searchResults: [],
      selectedMovie: null,
      filters: {},
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
      error: null,
    });
  },
});