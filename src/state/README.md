# Zustand State Management

This directory contains a comprehensive Zustand state management system for the movie application.

## Architecture

The state is organized into slices, each managing a specific domain:

- **Auth Slice**: User authentication, session management, and preferences
- **Movie Slice**: Movie search results, filters, and selected movie
- **Watch History Slice**: User's watched movies with CRUD operations
- **Watchlist Slice**: User's watchlist with priority management
- **UI Slice**: Loading states, modals, notifications, and search

## Usage

### Basic Store Usage

```typescript
import { useAppStore } from '@/state';

function MyComponent() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Use the store
}
```

### Using Custom Hooks

```typescript
import { useAuth, useMovies, useWatchHistory, useWatchlist, useUI } from '@/state';

// Authentication
const { user, isAuthenticated, logout } = useAuth();

// Movies
const { searchResults, setFilters, clearSearch } = useMovies();

// Watch History
const { items, addItem, removeItem } = useWatchHistory();

// Watchlist
const { items, addToWatchlist } = useWatchlist();

// UI
const { isLoading, openModal, addNotification } = useUI();
```

### Specific Hook Examples

#### Authentication
```typescript
import { useAuth } from '@/state';

function AuthComponent() {
  const { user, isAuthenticated, preferences, updatePreferences, logout } = useAuth();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

#### Movie Search
```typescript
import { useMovies, useMovieSearch } from '@/state';

function SearchComponent() {
  const { searchResults, isLoading, setFilters } = useMovies();
  const { filters, updateFilters } = useMovieSearch();

  const handleSearch = (query: string) => {
    updateFilters({ query });
    // Trigger API call here
  };

  return (
    <div>
      <input
        value={filters.query || ''}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search movies..."
      />
      {isLoading && <p>Loading...</p>}
      {searchResults.map((movie) => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
}
```

#### Watch History
```typescript
import { useWatchHistory, useWatchHistoryActions } from '@/state';

function WatchHistoryComponent() {
  const { items } = useWatchHistory();
  const { addToHistory, updateHistoryItem, removeFromHistory } = useWatchHistoryActions();

  const handleMarkAsWatched = (movie: TMDBMovie) => {
    addToHistory(movie, 8, 'Great movie!');
  };

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <h3>{item.movie.title}</h3>
          <p>Rating: {item.rating}/10</p>
          <button onClick={() => removeFromHistory(item.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### Watchlist
```typescript
import { useWatchlist, useWatchlistActions } from '@/state';

function WatchlistComponent() {
  const { items } = useWatchlist();
  const { addToWatchlist, updateWatchlistItem, removeFromWatchlist } = useWatchlistActions();

  const handleAddToWatchlist = (movie: TMDBMovie) => {
    addToWatchlist(movie, 'high');
  };

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <h3>{item.movie.title}</h3>
          <p>Priority: {item.priority}</p>
          <button onClick={() => removeFromWatchlist(item.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### UI Management
```typescript
import { useUI, useModal, useNotifications } from '@/state';

function UIComponent() {
  const { isLoading, setLoading } = useUI();
  const { isOpen, open, close } = useModal('movie-details');
  const { showSuccess, showError } = useNotifications();

  const handleAction = async () => {
    setLoading(true, 'Processing...');
    try {
      // Some async operation
      showSuccess('Success!', 'Operation completed successfully');
    } catch (error) {
      showError('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      <button onClick={() => open()}>Open Modal</button>
      {isLoading && <p>{loadingMessage}</p>}
    </div>
  );
}
```

## State Persistence

The store uses Zustand's persist middleware to automatically save and restore:

- User authentication state
- User preferences (theme, language, etc.)
- UI theme settings

Other state (loading states, temporary data) is not persisted and resets on page refresh.

## TypeScript Support

All state and actions are fully typed. The store provides:

- `AppState`: Complete state interface
- `AppActions`: Complete actions interface
- `AppStore`: Combined state and actions interface

## Performance

- Uses memoized selectors for optimal re-renders
- Implements optimistic updates for better UX
- Proper state normalization to avoid unnecessary re-renders

## Best Practices

1. **Use specific hooks**: Import only the hooks you need to avoid unnecessary re-renders
2. **Memoize selectors**: Use the provided selector hooks for computed values
3. **Handle loading states**: Always show loading indicators during async operations
4. **Error handling**: Use the notification system for user feedback
5. **Optimistic updates**: Update UI immediately and handle errors gracefully