# TMDB API Integration

This directory contains a comprehensive TMDB (The Movie Database) API integration for the movie tracking application. The integration provides robust error handling, caching, rate limiting, and comprehensive TypeScript types.

## Features

- ✅ **Complete API Client**: Full TMDB API v3 integration with rate limiting
- ✅ **Comprehensive Types**: TypeScript types for all TMDB API responses
- ✅ **Advanced Search**: Multi-search, movie/TV search with filters and pagination
- ✅ **Movie Data**: Complete movie details, credits, images, videos, reviews
- ✅ **TV Show Data**: Complete TV show details, seasons, episodes, credits
- ✅ **Caching System**: Upstash Redis caching with configurable TTL
- ✅ **Error Handling**: Comprehensive error handling with retry logic
- ✅ **Utility Functions**: Image URL builders, date formatting, data transformation

## Architecture

```
src/lib/tmdb/
├── index.ts              # Main exports and convenience functions
├── client.ts             # Base TMDB API client with rate limiting
├── enhanced-client.ts    # Enhanced client with caching and retry logic
├── search.ts             # Search functionality (movies, TV, people)
├── movies.ts             # Movie-specific API functions
├── tv.ts                 # TV show-specific API functions
├── utils.ts              # Utility functions for data transformation
├── cache.ts              # Redis caching system
├── errors.ts             # Error handling and validation
└── README.md             # This documentation
```

## Quick Start

### Basic Usage

```typescript
import {
  tmdbEnhancedClient,
  tmdbSearch,
  tmdbMovies,
  tmdbTVShows,
  tmdbUtils
} from '@/lib/tmdb';

// Search for movies
const movies = await tmdbEnhancedClient.searchMovies('Inception');

// Get movie details
const movieDetails = await tmdbEnhancedClient.getMovieDetails(27205);

// Get popular movies
const popularMovies = await tmdbEnhancedClient.getPopularMovies();

// Build image URL
const posterUrl = tmdbUtils.buildPosterUrl('/path/to/poster.jpg', 'w500');
```

### Advanced Usage

```typescript
// Search with caching and custom options
const results = await tmdbEnhancedClient.searchMovies('Batman', {
  page: 1,
  language: 'en-US',
  year: 2022,
  cacheOptions: { ttl: 3600 } // Cache for 1 hour
});

// Get movie with related data
const movieWithExtras = await tmdbEnhancedClient.getMovieDetails(27205, {
  append_to_response: ['credits', 'images', 'videos', 'reviews']
});

// Multi-search across movies, TV shows, and people
const multiResults = await tmdbEnhancedClient.multiSearch('Christopher Nolan');
```

## API Reference

### Search Functions

#### `tmdbSearch.multiSearch(filters)`
Perform a multi-search across movies, TV shows, and people.

```typescript
const results = await tmdbSearch.multiSearch({
  query: 'Inception',
  page: 1,
  language: 'en-US'
});
```

#### `tmdbSearch.searchMovies(filters)`
Search for movies with advanced filtering.

```typescript
const results = await tmdbSearch.searchMovies({
  query: 'Batman',
  year: 2022,
  sort_by: 'popularity.desc'
});
```

#### `tmdbSearch.discoverMovies(filters)`
Discover movies by genre, year, rating, etc.

```typescript
const results = await tmdbSearch.discoverMovies({
  with_genres: [28, 12], // Action, Adventure
  primary_release_year: 2023,
  vote_average_gte: 7.0
});
```

### Movie Functions

#### `tmdbMovies.getMovieDetails(movieId, options)`
Get detailed information about a movie.

```typescript
const movie = await tmdbMovies.getMovieDetails(27205, {
  language: 'en-US',
  append_to_response: ['credits', 'images']
});
```

#### `tmdbMovies.getMovieCredits(movieId)`
Get cast and crew information.

```typescript
const credits = await tmdbMovies.getMovieCredits(27205);
```

#### `tmdbMovies.getSimilarMovies(movieId, options)`
Get movies similar to the specified movie.

```typescript
const similar = await tmdbMovies.getSimilarMovies(27205, { page: 1 });
```

### TV Show Functions

#### `tmdbTVShows.getTVShowDetails(tvId, options)`
Get detailed information about a TV show.

```typescript
const tvShow = await tmdbTVShows.getTVShowDetails(1399, {
  language: 'en-US',
  append_to_response: ['credits', 'images']
});
```

#### `tmdbTVShows.getSeasonDetails(tvId, seasonNumber, options)`
Get detailed information about a season.

```typescript
const season = await tmdbTVShows.getSeasonDetails(1399, 1);
```

#### `tmdbTVShows.getEpisodeDetails(tvId, seasonNumber, episodeNumber, options)`
Get detailed information about an episode.

```typescript
const episode = await tmdbTVShows.getEpisodeDetails(1399, 1, 1);
```

### Utility Functions

#### Image URL Builders

```typescript
import { buildPosterUrl, buildBackdropUrl, buildProfileUrl } from '@/lib/tmdb';

const posterUrl = buildPosterUrl('/path/to/poster.jpg', 'w500');
const backdropUrl = buildBackdropUrl('/path/to/backdrop.jpg', 'w780');
const profileUrl = buildProfileUrl('/path/to/profile.jpg', 'w185');
```

#### Date Formatting

```typescript
import { formatReleaseDate, formatRuntime } from '@/lib/tmdb';

const releaseDate = formatReleaseDate('2023-07-21'); // "Jul 21, 2023"
const runtime = formatRuntime(148); // "2h 28m"
```

#### Data Transformation

```typescript
import { getGenreNames, truncateText, formatVoteAverage } from '@/lib/tmdb';

const genreNames = getGenreNames([28, 12], genres); // ["Action", "Adventure"]
const shortDescription = truncateText(longText, 100);
const percentage = formatVoteAverage(8.5); // "85%"
```

## Caching

The integration includes a comprehensive caching system using Upstash Redis:

### Cache Configuration

```typescript
// Cache for 1 hour (default)
const data = await tmdbEnhancedClient.getMovieDetails(27205, {
  cacheOptions: { ttl: 3600 }
});

// Force refresh cache
const data = await tmdbEnhancedClient.getMovieDetails(27205, {
  cacheOptions: { ttl: 3600, force: true }
});
```

### Cache Management

```typescript
// Invalidate cache for specific movie
await tmdbEnhancedClient.invalidateMovieCache(27205);

// Invalidate cache for specific TV show
await tmdbEnhancedClient.invalidateTVShowCache(1399);

// Clear all cache
await tmdbEnhancedClient.clearCache();

// Get cache statistics
const stats = await tmdbEnhancedClient.getCacheStats();
```

## Error Handling

The integration provides comprehensive error handling with user-friendly messages:

### Error Types

- `TMDBApiError`: General API errors
- `TMDBRateLimitError`: Rate limiting errors
- `TMDBNetworkError`: Network connectivity issues
- `TMDBTimeoutError`: Request timeout errors
- `TMDBValidationError`: Invalid request parameters
- `TMDBAuthenticationError`: Authentication failures

### Error Handling Example

```typescript
try {
  const movie = await tmdbEnhancedClient.getMovieDetails(27205);
} catch (error) {
  console.error('TMDB Error:', error);

  // Get user-friendly error message
  const userMessage = TMDBErrorHandler.getUserFriendlyMessage(error);

  // Check if error is retryable
  const canRetry = TMDBErrorHandler.isRetryableError(error);
}
```

## Rate Limiting

The client includes built-in rate limiting to respect TMDB's API limits:

- **40 requests per 10 seconds** (TMDB limit)
- **Automatic retry** with exponential backoff
- **Rate limit headers** parsing and respect
- **Request queuing** to prevent exceeding limits

## Configuration

### Environment Variables

```env
TMDB_API_KEY=your_tmdb_api_key_here
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Client Configuration

```typescript
import { tmdbClient } from '@/lib/tmdb';

// Update configuration
tmdbClient.updateConfig({
  timeout: 15000, // 15 seconds
  retries: 5,     // 5 retry attempts
  retryDelay: 2000 // 2 second base delay
});
```

## API Routes

### Enhanced Search API

The existing search API route has been enhanced to support multiple search types:

```bash
# Search movies
GET /api/tmdb/search?q=Inception&type=movie

# Search TV shows
GET /api/tmdb/search?q=Breaking%20Bad&type=tv

# Multi-search
GET /api/tmdb/search?q=Christopher%20Nolan&type=multi

# With pagination
GET /api/tmdb/search?q=Inception&type=movie&page=2
```

## Best Practices

### 1. Use Enhanced Client
Always use `tmdbEnhancedClient` instead of the base client for production code:

```typescript
// ✅ Good
const movie = await tmdbEnhancedClient.getMovieDetails(27205);

// ❌ Avoid (no caching, error handling)
const movie = await tmdbClient.get(`/movie/${27205}`);
```

### 2. Handle Errors Gracefully
Always wrap TMDB calls in try-catch blocks:

```typescript
try {
  const data = await tmdbEnhancedClient.searchMovies(query);
  // Handle success
} catch (error) {
  const userMessage = TMDBErrorHandler.getUserFriendlyMessage(error);
  // Show user-friendly error message
}
```

### 3. Use Appropriate Cache TTL
Set appropriate cache TTL based on data volatility:

```typescript
// Movie details (cache for longer)
const movie = await tmdbEnhancedClient.getMovieDetails(27205, {
  cacheOptions: { ttl: 86400 } // 24 hours
});

// Search results (cache for shorter)
const results = await tmdbEnhancedClient.searchMovies(query, {
  cacheOptions: { ttl: 1800 } // 30 minutes
});
```

### 4. Validate Input
Use the built-in validation utilities:

```typescript
if (!TMDBValidator.validateSearchQuery(query)) {
  throw new Error('Invalid search query');
}

if (!TMDBValidator.validateMediaId(movieId)) {
  throw new Error('Invalid movie ID');
}
```

## Testing

The integration includes comprehensive error handling and validation that makes it easy to test:

```typescript
// Test with invalid API key
process.env.TMDB_API_KEY = 'invalid_key';
try {
  await tmdbEnhancedClient.getMovieDetails(27205);
} catch (error) {
  // Should get TMDBAuthenticationError
}

// Test with network issues
// The retry logic will handle temporary network issues
```

## Performance Considerations

### Caching Strategy
- **Movie/TV details**: Cache for 24 hours (infrequently changing)
- **Search results**: Cache for 30 minutes (user-specific)
- **Popular/Trending**: Cache for 1 hour (moderate change frequency)
- **Images/Videos**: Cache for 24 hours (static content)

### Request Optimization
- Use `append_to_response` to reduce API calls
- Batch related requests when possible
- Use appropriate image sizes for different contexts

### Rate Limiting
- The client automatically handles rate limiting
- Requests are queued to prevent exceeding limits
- Exponential backoff is used for retries

## Contributing

When adding new TMDB API endpoints:

1. Add TypeScript types to `src/types/tmdb.ts`
2. Add functions to appropriate module files
3. Include proper error handling and validation
4. Add caching support where appropriate
5. Update this documentation
6. Add tests for new functionality

## Support

For issues or questions about the TMDB integration:

1. Check the TMDB API documentation: https://developers.themoviedb.org/3
2. Review error messages and logs
3. Check cache status and configuration
4. Verify API key and permissions

The integration is designed to be robust and handle most edge cases automatically, but some issues may require manual intervention or configuration changes.