import { useMemo } from 'react';
import { useAppStore } from './store';
import { TMDBMovie, TMDBTVShow } from '../types/tmdb';

// Auth Hooks
export const useAuth = () => {
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    preferences,
    setUser,
    setSession,
    setLoading,
    updatePreferences,
    logout,
  } = useAppStore();

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    preferences,
    setUser,
    setSession,
    setLoading,
    updatePreferences,
    logout,
  };
};

export const useUser = () => {
  const { user, isAuthenticated } = useAuth();
  return { user, isAuthenticated };
};

export const useUserPreferences = () => {
  const { preferences, updatePreferences } = useAuth();
  return { preferences, updatePreferences };
};

// Movie Hooks
export const useMovies = () => {
  const {
    searchResults,
    selectedMovie,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setSearchResults,
    setSelectedMovie,
    setFilters,
    setLoading,
    setError,
    setPage,
    clearSearch,
  } = useAppStore();

  return {
    searchResults,
    selectedMovie,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setSearchResults,
    setSelectedMovie,
    setFilters,
    setLoading,
    setError,
    setPage,
    clearSearch,
  };
};

export const useMovieSearch = () => {
  const { filters, setFilters, clearSearch } = useMovies();

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    clearSearch();
  };

  return {
    filters,
    updateFilters,
    clearFilters,
  };
};

export const useSelectedMovie = () => {
  const { selectedMovie, setSelectedMovie } = useMovies();
  return { selectedMovie, setSelectedMovie };
};

// Watch History Hooks
export const useWatchHistory = () => {
  const {
    items,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setFilters,
    setLoading,
    setError,
    setPage,
  } = useAppStore();

  return {
    items,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setFilters,
    setLoading,
    setError,
    setPage,
  };
};

export const useWatchHistoryActions = () => {
  const { addItem, updateItem, removeItem } = useWatchHistory();

  const addToHistory = (movie: TMDBMovie | TMDBTVShow, rating?: number, notes?: string) => {
    addItem({
      userId: 1, // This should come from auth context
      movieId: movie.id,
      watchedAt: new Date(),
      rating,
      notes,
      movie: {
        id: movie.id,
        tmdbId: movie.id,
        title: 'title' in movie ? movie.title : movie.name,
        posterPath: movie.poster_path,
        releaseDate: 'release_date' in movie ? movie.release_date : movie.first_air_date,
        mediaType: movie.media_type,
      },
    });
  };

  const updateHistoryItem = (id: number, rating?: number, notes?: string) => {
    updateItem(id, { rating, notes, updatedAt: new Date() });
  };

  const removeFromHistory = (id: number) => {
    removeItem(id);
  };

  return {
    addToHistory,
    updateHistoryItem,
    removeFromHistory,
  };
};

// Watchlist Hooks
export const useWatchlist = () => {
  const {
    items,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setFilters,
    setLoading,
    setError,
    setPage,
  } = useAppStore();

  return {
    items,
    filters,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalResults,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setFilters,
    setLoading,
    setError,
    setPage,
  };
};

export const useWatchlistActions = () => {
  const { addItem, updateItem, removeItem } = useWatchlist();

  const addToWatchlist = (movie: TMDBMovie | TMDBTVShow, priority: 'low' | 'medium' | 'high' = 'medium') => {
    addItem({
      userId: 1, // This should come from auth context
      movieId: movie.id,
      addedAt: new Date(),
      priority,
      movie: {
        id: movie.id,
        tmdbId: movie.id,
        title: 'title' in movie ? movie.title : movie.name,
        posterPath: movie.poster_path,
        releaseDate: 'release_date' in movie ? movie.release_date : movie.first_air_date,
        mediaType: movie.media_type,
      },
    });
  };

  const updateWatchlistItem = (id: number, priority: 'low' | 'medium' | 'high') => {
    updateItem(id, { priority });
  };

  const removeFromWatchlist = (id: number) => {
    removeItem(id);
  };

  return {
    addToWatchlist,
    updateWatchlistItem,
    removeFromWatchlist,
  };
};

// UI Hooks
export const useUI = () => {
  const {
    isLoading,
    loadingMessage,
    modals,
    notifications,
    search,
    theme,
    setLoading,
    openModal,
    closeModal,
    closeAllModals,
    addNotification,
    removeNotification,
    clearNotifications,
    setSearchQuery,
    setSearchActive,
    setSearchResults,
    setTheme,
  } = useAppStore();

  return {
    isLoading,
    loadingMessage,
    modals,
    notifications,
    search,
    theme,
    setLoading,
    openModal,
    closeModal,
    closeAllModals,
    addNotification,
    removeNotification,
    clearNotifications,
    setSearchQuery,
    setSearchActive,
    setSearchResults,
    setTheme,
  };
};

export const useModal = (modalId: string) => {
  const { modals, openModal, closeModal } = useUI();

  const modal = modals[modalId] || { isOpen: false, data: null };
  const isOpen = modal.isOpen;
  const data = modal.data;

  return {
    isOpen,
    data,
    open: (data?: unknown) => openModal(modalId, data),
    close: () => closeModal(modalId),
  };
};

export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUI();

  const showSuccess = (title: string, message: string, duration = 5000) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  };

  const showError = (title: string, message: string, duration = 7000) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration,
    });
  };

  const showWarning = (title: string, message: string, duration = 6000) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  };

  const showInfo = (title: string, message: string, duration = 5000) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export const useSearch = () => {
  const { search, setSearchQuery, setSearchActive, setSearchResults } = useUI();

  const setQuery = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setSearchActive(true);
    } else {
      setSearchActive(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchActive(false);
    setSearchResults([]);
  };

  return {
    ...search,
    setQuery,
    clearSearch,
  };
};

// Selectors
export const useAuthSelector = () => {
  return useMemo(() => {
    const { user, isAuthenticated, preferences } = useAppStore.getState();
    return { user, isAuthenticated, preferences };
  }, []);
};

export const useMovieSelector = () => {
  return useMemo(() => {
    const { searchResults, selectedMovie, filters, currentPage, totalResults } = useAppStore.getState();
    return { searchResults, selectedMovie, filters, currentPage, totalResults };
  }, []);
};

export const useWatchHistorySelector = () => {
  return useMemo(() => {
    const { items, filters, currentPage, totalResults } = useAppStore.getState();
    return { items, filters, currentPage, totalResults };
  }, []);
};

export const useWatchlistSelector = () => {
  return useMemo(() => {
    const { items, filters, currentPage, totalResults } = useAppStore.getState();
    return { items, filters, currentPage, totalResults };
  }, []);
};

export const useUISelector = () => {
  return useMemo(() => {
    const { isLoading, modals, notifications, theme } = useAppStore.getState();
    return { isLoading, modals, notifications, theme };
  }, []);
};