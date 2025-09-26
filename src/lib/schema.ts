import { pgTable, serial, text, integer, timestamp, varchar, decimal, json } from 'drizzle-orm/pg-core';

// Users table (for authentication)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: varchar('image', { length: 500 }),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Accounts table (for OAuth providers)
export const accounts = pgTable('accounts', {
  userId: integer('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
});

// Sessions table (for session management)
export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  expires: timestamp('expires').notNull(),
});

// Verification tokens table (for email verification)
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// Movies table (TMDB data)
export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
  tmdbId: integer('tmdb_id').notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  overview: text('overview'),
  releaseDate: varchar('release_date', { length: 20 }),
  posterPath: varchar('poster_path', { length: 500 }),
  backdropPath: varchar('backdrop_path', { length: 500 }),
  voteAverage: decimal('vote_average', { precision: 3, scale: 1 }),
  voteCount: integer('vote_count'),
  genreIds: json('genre_ids').$type<number[]>(),
  mediaType: varchar('media_type', { length: 20 }).notNull(), // 'movie' or 'tv'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Watch History table
export const watchHistory = pgTable('watch_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  movieId: integer('movie_id').references(() => movies.id).notNull(),
  watchedAt: timestamp('watched_at').notNull(),
  rating: integer('rating'), // 1-10 scale
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Watchlist table
export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  movieId: integer('movie_id').references(() => movies.id).notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high
});

// Relations
export const usersRelations = {
  watchHistory: watchHistory,
  watchlist: watchlist,
};

export const moviesRelations = {
  watchHistory: watchHistory,
  watchlist: watchlist,
};