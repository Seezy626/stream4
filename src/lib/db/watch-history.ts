import { eq, desc, asc, and, gte, lte, like, sql } from 'drizzle-orm';
import { db } from './db';
import { watchHistory, movies, users } from '../schema';
import { WatchHistoryItem, WatchHistoryFilters } from '../../state/types';

export interface CreateWatchHistoryData {
  userId: number;
  movieId: number;
  watchedAt: Date;
  rating?: number;
  notes?: string;
}

export interface UpdateWatchHistoryData {
  watchedAt?: Date;
  rating?: number;
  notes?: string;
}

export interface WatchHistoryQueryOptions {
  userId?: number;
  movieId?: number;
  limit?: number;
  offset?: number;
  filters?: WatchHistoryFilters;
  sortBy?: 'watched_at' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Create a new watch history entry
export async function addToWatchHistory(data: CreateWatchHistoryData): Promise<WatchHistoryItem> {
  try {
    const [result] = await db
      .insert(watchHistory)
      .values({
        userId: data.userId,
        movieId: data.movieId,
        watchedAt: data.watchedAt,
        rating: data.rating,
        notes: data.notes,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to create watch history entry');
    }

    // Fetch the complete watch history item with movie details
    return await getWatchHistoryById(result.id);
  } catch (error) {
    console.error('Error adding to watch history:', error);
    throw new Error('Failed to add movie to watch history');
  }
}

// Get watch history by ID
export async function getWatchHistoryById(id: number): Promise<WatchHistoryItem> {
  try {
    const result = await db
      .select({
        id: watchHistory.id,
        userId: watchHistory.userId,
        movieId: watchHistory.movieId,
        watchedAt: watchHistory.watchedAt,
        rating: watchHistory.rating,
        notes: watchHistory.notes,
        createdAt: watchHistory.createdAt,
        updatedAt: watchHistory.updatedAt,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchHistory)
      .leftJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(eq(watchHistory.id, id))
      .limit(1);

    if (!result[0]) {
      throw new Error('Watch history entry not found');
    }

    return result[0] as WatchHistoryItem;
  } catch (error) {
    console.error('Error fetching watch history by ID:', error);
    throw new Error('Failed to fetch watch history entry');
  }
}

// Get user's watch history with optional filtering and pagination
export async function getUserWatchHistory(
  userId: number,
  options: WatchHistoryQueryOptions = {}
): Promise<{ items: WatchHistoryItem[]; total: number }> {
  try {
    const {
      limit = 20,
      offset = 0,
      filters = {},
      sortBy = 'watched_at',
      sortOrder = 'desc'
    } = options;

    let query = db
      .select({
        id: watchHistory.id,
        userId: watchHistory.userId,
        movieId: watchHistory.movieId,
        watchedAt: watchHistory.watchedAt,
        rating: watchHistory.rating,
        notes: watchHistory.notes,
        createdAt: watchHistory.createdAt,
        updatedAt: watchHistory.updatedAt,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchHistory)
      .leftJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(eq(watchHistory.userId, userId));

    // Apply filters
    if (filters.rating) {
      query = query.where(eq(watchHistory.rating, filters.rating));
    }

    if (filters.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
      query = query.where(
        and(
          gte(watchHistory.watchedAt, startOfYear),
          lte(watchHistory.watchedAt, endOfYear)
        )
      );
    }

    // Apply sorting
    const sortColumn = sortBy === 'title' ? movies.title : watchHistory.watchedAt;
    const sortDirection = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    query = query.orderBy(sortDirection);

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const items = await query;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    return {
      items: items as WatchHistoryItem[],
      total: count,
    };
  } catch (error) {
    console.error('Error fetching user watch history:', error);
    throw new Error('Failed to fetch watch history');
  }
}

// Get watch history for a specific movie
export async function getWatchHistoryByMovie(
  userId: number,
  movieId: number
): Promise<WatchHistoryItem | null> {
  try {
    const result = await db
      .select({
        id: watchHistory.id,
        userId: watchHistory.userId,
        movieId: watchHistory.movieId,
        watchedAt: watchHistory.watchedAt,
        rating: watchHistory.rating,
        notes: watchHistory.notes,
        createdAt: watchHistory.createdAt,
        updatedAt: watchHistory.updatedAt,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchHistory)
      .leftJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(
        and(
          eq(watchHistory.userId, userId),
          eq(watchHistory.movieId, movieId)
        )
      )
      .limit(1);

    return result[0] as WatchHistoryItem || null;
  } catch (error) {
    console.error('Error fetching watch history by movie:', error);
    throw new Error('Failed to fetch watch history for movie');
  }
}

// Update watch history entry
export async function updateWatchHistory(
  id: number,
  updates: UpdateWatchHistoryData
): Promise<WatchHistoryItem> {
  try {
    const [result] = await db
      .update(watchHistory)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(watchHistory.id, id))
      .returning();

    if (!result) {
      throw new Error('Watch history entry not found');
    }

    return await getWatchHistoryById(result.id);
  } catch (error) {
    console.error('Error updating watch history:', error);
    throw new Error('Failed to update watch history entry');
  }
}

// Delete watch history entry
export async function deleteWatchHistory(id: number): Promise<void> {
  try {
    const [result] = await db
      .delete(watchHistory)
      .where(eq(watchHistory.id, id))
      .returning();

    if (!result) {
      throw new Error('Watch history entry not found');
    }
  } catch (error) {
    console.error('Error deleting watch history:', error);
    throw new Error('Failed to delete watch history entry');
  }
}

// Search watch history by title
export async function searchWatchHistory(
  userId: number,
  query: string,
  options: Omit<WatchHistoryQueryOptions, 'userId'> = {}
): Promise<{ items: WatchHistoryItem[]; total: number }> {
  try {
    const { limit = 20, offset = 0 } = options;

    const searchQuery = `%${query.toLowerCase()}%`;

    const items = await db
      .select({
        id: watchHistory.id,
        userId: watchHistory.userId,
        movieId: watchHistory.movieId,
        watchedAt: watchHistory.watchedAt,
        rating: watchHistory.rating,
        notes: watchHistory.notes,
        createdAt: watchHistory.createdAt,
        updatedAt: watchHistory.updatedAt,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchHistory)
      .leftJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(
        and(
          eq(watchHistory.userId, userId),
          like(movies.title, searchQuery)
        )
      )
      .orderBy(desc(watchHistory.watchedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchHistory)
      .leftJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(
        and(
          eq(watchHistory.userId, userId),
          like(movies.title, searchQuery)
        )
      );

    return {
      items: items as WatchHistoryItem[],
      total: count,
    };
  } catch (error) {
    console.error('Error searching watch history:', error);
    throw new Error('Failed to search watch history');
  }
}

// Get watch history statistics
export async function getWatchHistoryStats(userId: number): Promise<{
  totalWatched: number;
  averageRating: number;
  thisYear: number;
  thisMonth: number;
}> {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [stats] = await db
      .select({
        totalWatched: sql<number>`count(*)`,
        averageRating: sql<number>`coalesce(avg(${watchHistory.rating}), 0)`,
        thisYear: sql<number>`count(case when ${watchHistory.watchedAt} >= ${startOfYear} then 1 end)`,
        thisMonth: sql<number>`count(case when ${watchHistory.watchedAt} >= ${startOfMonth} then 1 end)`,
      })
      .from(watchHistory)
      .where(eq(watchHistory.userId, userId));

    return {
      totalWatched: stats.totalWatched || 0,
      averageRating: Number(stats.averageRating) || 0,
      thisYear: stats.thisYear || 0,
      thisMonth: stats.thisMonth || 0,
    };
  } catch (error) {
    console.error('Error fetching watch history stats:', error);
    throw new Error('Failed to fetch watch history statistics');
  }
}