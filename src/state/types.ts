// State Types for Zustand Store
export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoplay: boolean;
  notifications: boolean;
}

export interface AuthState {
  user: User | null;
  session: {
    sessionToken: string;
    expires: Date;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  preferences: UserPreferences;
}

export interface MovieFilters {
  genre?: number[];
  year?: number;
  sortBy?: 'popularity.desc' | 'popularity.asc' | 'release_date.desc' | 'release_date.asc' | 'vote_average.desc' | 'vote_average.asc';
  minRating?: number;
  mediaType?: 'movie' | 'tv' | 'all';
}

export interface MovieState {
  searchResults: unknown[];
  selectedMovie: unknown | null;
  filters: MovieFilters;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export interface WatchHistoryItem {
  id: number;
  userId: string;
  movieId: number;
  watchedAt: Date;
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  movie: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath?: string;
    releaseDate?: string;
    mediaType: string;
  };
}

export interface WatchHistoryFilters {
  rating?: number;
  year?: number;
  sortBy?: 'watched_at' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface WatchHistoryState {
  items: WatchHistoryItem[];
  filters: WatchHistoryFilters;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export interface WatchlistItem {
  id: number;
  userId: string;
  movieId: number;
  addedAt: Date;
  priority: 'low' | 'medium' | 'high';
  movie: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath?: string;
    releaseDate?: string;
    mediaType: string;
  };
}

export interface WatchlistFilters {
  priority?: 'low' | 'medium' | 'high';
  sortBy?: 'added_at' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface WatchlistState {
  watchlistItems: WatchlistItem[];
  filters: WatchlistFilters;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export interface UIState {
  isLoading: boolean;
  loadingMessage: string | null;
  modals: {
    [key: string]: {
      isOpen: boolean;
      data?: unknown;
    };
  };
  notifications: Notification[];
  search: {
    query: string;
    isActive: boolean;
    results: unknown[];
  };
  theme: 'light' | 'dark' | 'system';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Combined Store State
export interface AppState extends AuthState, MovieState, WatchHistoryState, WatchlistState, UIState {}

// Store Actions Types
export interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: AuthState['session']) => void;
  setLoading: (loading: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  logout: () => void;
}

export interface MovieActions {
  setSearchResults: (results: unknown[], totalPages: number, totalResults: number) => void;
  setSelectedMovie: (movie: unknown | null) => void;
  setFilters: (filters: Partial<MovieFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  clearSearch: () => void;
}

export interface WatchHistoryActions {
  setItems: (items: WatchHistoryItem[]) => void;
  addItem: (item: Omit<WatchHistoryItem, 'id'>) => void;
  updateItem: (id: number, updates: Partial<WatchHistoryItem>) => void;
  removeItem: (id: number) => void;
  setFilters: (filters: Partial<WatchHistoryFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  // API integration actions
  fetchWatchHistory: (page?: number, search?: string, filters?: Partial<WatchHistoryFilters>) => Promise<void>;
  addToWatchHistory: (data: {
    movieId: number;
    watchedAt: Date;
    rating?: number;
    notes?: string;
  }) => Promise<WatchHistoryItem>;
  updateWatchHistory: (id: number, updates: {
    watchedAt?: Date;
    rating?: number;
    notes?: string;
  }) => Promise<WatchHistoryItem>;
  deleteWatchHistory: (id: number) => Promise<void>;
  searchWatchHistory: (query: string, page?: number) => Promise<void>;
  getWatchHistoryStats: () => Promise<{
    totalWatched: number;
    averageRating: number;
    thisYear: number;
    thisMonth: number;
  }>;
}

export interface WatchlistActions {
  setItems: (items: WatchlistItem[]) => void;
  addItem: (item: Omit<WatchlistItem, 'id'>) => void;
  updateItem: (id: number, updates: Partial<WatchlistItem>) => void;
  removeItem: (id: number) => void;
  setFilters: (filters: Partial<WatchlistFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  // API integration actions
  fetchWatchlist: (page?: number, search?: string, filters?: Partial<WatchlistFilters>) => Promise<void>;
  addToWatchlist: (data: { movieId: number; priority?: 'low' | 'medium' | 'high'; userId?: number }) => Promise<WatchlistItem>;
  updateWatchlist: (id: number, updates: Partial<WatchlistItem>) => Promise<WatchlistItem>;
  updateWatchlistPriority: (id: number, priority: 'low' | 'medium' | 'high') => Promise<WatchlistItem>;
  removeFromWatchlist: (id: number) => Promise<void>;
  searchWatchlist: (query: string, page?: number) => Promise<void>;
  getWatchlistStats: () => Promise<unknown>;
  bulkUpdatePriorities: (updates: { id: number; priority: 'low' | 'medium' | 'high' }[]) => Promise<unknown>;
}

export interface UIActions {
  setLoading: (loading: boolean, message?: string) => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setSearchQuery: (query: string) => void;
  setSearchActive: (active: boolean) => void;
  setSearchResults: (results: unknown[]) => void;
  setTheme: (theme: UIState['theme']) => void;
}

// Combined Actions
export interface AppActions extends AuthActions, MovieActions, WatchHistoryActions, WatchlistActions, UIActions {}

// Store Type
export interface AppStore extends AppState, AppActions {}