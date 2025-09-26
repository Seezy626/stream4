import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Common test data
export const mockMovie = {
  id: 1,
  tmdbId: 12345,
  title: 'Test Movie',
  overview: 'This is a test movie overview',
  posterPath: '/test-poster.jpg',
  backdropPath: '/test-backdrop.jpg',
  releaseDate: '2023-01-01',
  voteAverage: 8.5,
  voteCount: 1000,
  genres: ['Action', 'Adventure'],
  runtime: 120,
  status: 'Released',
};

export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
};

export const mockWatchlistItem = {
  id: 1,
  userId: '1',
  movieId: 1,
  tmdbId: 12345,
  title: 'Test Movie',
  posterPath: '/test-poster.jpg',
  priority: 'medium' as const,
  addedAt: new Date('2023-01-01'),
  notes: 'Test notes',
};

export const mockWatchedItem = {
  id: 1,
  userId: '1',
  movieId: 1,
  tmdbId: 12345,
  title: 'Test Movie',
  posterPath: '/test-poster.jpg',
  rating: 8,
  review: 'Great movie!',
  watchedAt: new Date('2023-01-01'),
  rewatchCount: 0,
};

// Test helper functions
export const createMockRouter = (overrides = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  ...overrides,
});

export const createMockSearchParams = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value as string);
  });
  return searchParams;
};

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForTimeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));