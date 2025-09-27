import { faker } from '@faker-js/faker';

// Movie factory
export const createMockMovie = (overrides = {}) => ({
  id: faker.number.int(),
  tmdbId: faker.number.int({ min: 1, max: 999999 }),
  title: faker.lorem.words(3),
  overview: faker.lorem.paragraph(),
  poster_path: faker.image.url(),
  backdrop_path: faker.image.url(),
  release_date: faker.date.past().toISOString().split('T')[0],
  vote_average: faker.number.float({ min: 0, max: 10, multipleOf: 0.1 }),
  vote_count: faker.number.int({ min: 0, max: 10000 }),
  genres: faker.helpers.arrayElements(['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'], 2),
  runtime: faker.number.int({ min: 60, max: 180 }),
  status: faker.helpers.arrayElement(['Released', 'In Production', 'Post Production']),
  ...overrides,
});

// User factory
export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  image: faker.image.avatar(),
  emailVerified: faker.date.past(),
  ...overrides,
});

// Watchlist item factory
export const createMockWatchlistItem = (overrides = {}) => ({
  id: faker.number.int(),
  userId: faker.string.uuid(),
  movieId: faker.number.int(),
  addedAt: faker.date.past(),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high']) as 'low' | 'medium' | 'high',
  movie: {
    id: faker.number.int(),
    tmdbId: faker.number.int({ min: 1, max: 999999 }),
    title: faker.lorem.words(3),
    posterPath: faker.image.url(),
    releaseDate: faker.date.past().toISOString().split('T')[0],
    mediaType: 'movie',
  },
  ...overrides,
});

// Watched item factory
export const createMockWatchedItem = (overrides = {}) => ({
  id: faker.number.int(),
  userId: faker.string.uuid(),
  movieId: faker.number.int(),
  tmdbId: faker.number.int({ min: 1, max: 999999 }),
  title: faker.lorem.words(3),
  posterPath: faker.image.url(),
  rating: faker.number.int({ min: 1, max: 10 }),
  review: faker.lorem.paragraph(),
  watchedAt: faker.date.past(),
  rewatchCount: faker.number.int({ min: 0, max: 5 }),
  ...overrides,
});

// TMDB API response factories
export const createMockTMDBSearchResponse = (totalResults = 5) => ({
  page: 1,
  results: Array.from({ length: totalResults }, () => createMockMovie()),
  total_pages: Math.ceil(totalResults / 20),
  total_results: totalResults,
});

export const createMockTMDBMovieDetails = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 999999 }),
  title: faker.lorem.words(3),
  overview: faker.lorem.paragraph(),
  poster_path: faker.image.url(),
  backdrop_path: faker.image.url(),
  release_date: faker.date.past().toISOString().split('T')[0],
  vote_average: faker.number.float({ min: 0, max: 10, multipleOf: 0.1 }),
  vote_count: faker.number.int({ min: 0, max: 10000 }),
  genres: Array.from({ length: 3 }, () => ({
    id: faker.number.int(),
    name: faker.lorem.word(),
  })),
  runtime: faker.number.int({ min: 60, max: 180 }),
  status: 'Released',
  ...overrides,
});

// Form data factories
export const createMockSignInForm = (overrides = {}) => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  ...overrides,
});

export const createMockSignUpForm = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
  confirmPassword: faker.internet.password({ length: 12 }),
  ...overrides,
});

export const createMockMovieSearchForm = (overrides = {}) => ({
  query: faker.lorem.words(2),
  ...overrides,
});

// Bulk data generators
export const createMockMovies = (count: number) =>
  Array.from({ length: count }, () => createMockMovie());

export const createMockWatchlistItems = (count: number, userId: string) =>
  Array.from({ length: count }, () => createMockWatchlistItem({ userId }));

export const createMockWatchedItems = (count: number, userId: string) =>
  Array.from({ length: count }, () => createMockWatchedItem({ userId }));