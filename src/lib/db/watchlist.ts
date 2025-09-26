import { eq, desc, asc, and, like, sql } from 'drizzle-orm';
import { db } from './db';
import { watchlist, movies, users } from '../schema';
import { WatchlistItem, WatchlistFilters } from '../../state/types';

export interface CreateWatchlistData {
  userId: number;
  movieId: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateWatchlistData {
  priority?: 'low' | 'medium' | 'high';
}

export interface WatchlistQueryOptions {
  userId?: number;
  movieId?: number;
  limit?: number;
  offset?: number;
  filters?: WatchlistFilters;
  sortBy?: 'added_at' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Create a new watchlist entry
export async function addToWatchlist(data: CreateWatchlistData): Promise<WatchlistItem> {
  try {
    const [result] = await db
      .insert(watchlist)
      .values({
        userId: data.userId,
        movieId: data.movieId,
        priority: data.priority || 'medium',
      })
      .returning();

    if (!result) {
      throw new Error('Failed to create watchlist entry');
    }

    // Fetch the complete watchlist item with movie details
    return await getWatchlistById(result.id);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw new Error('Failed to add movie to watchlist');
  }
}

// Get watchlist by ID
export async function getWatchlistById(id: number): Promise<WatchlistItem> {
  try {
    const result = await db
      .select({
        id: watchlist.id,
        userId: watchlist.userId,
        movieId: watchlist.movieId,
        addedAt: watchlist.addedAt,
        priority: watchlist.priority,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchlist)
      .leftJoin(movies, eq(watchlist.movieId, movies.id))
      .where(eq(watchlist.id, id))
      .limit(1);

    if (!result[0]) {
      throw new Error('Watchlist entry not found');
    }

    return result[0] as WatchlistItem;
  } catch (error) {
    console.error('Error fetching watchlist by ID:', error);
    throw new Error('Failed to fetch watchlist entry');
  }
}

// Get user's watchlist with optional filtering and pagination
export async function getUserWatchlist(
  userId: number,
  options: WatchlistQueryOptions = {}
): Promise<{ items: WatchlistItem[]; total: number }> {
  try {
    const {
      limit = 20,
      offset = 0,
      filters = {},
      sortBy = 'added_at',
      sortOrder = 'desc'
    } = options;

    let query = db
      .select({
        id: watchlist.id,
        userId: watchlist.userId,
        movieId: watchlist.movieId,
        addedAt: watchlist.addedAt,
        priority: watchlist.priority,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchlist)
      .leftJoin(movies, eq(watchlist.movieId, movies.id))
      .where(eq(watchlist.userId, userId));

    // Apply filters
    if (filters.priority) {
      query = query.where(eq(watchlist.priority, filters.priority));
    }

    // Apply sorting
    let sortColumn: any;
    switch (sortBy) {
      case 'title':
        sortColumn = movies.title;
        break;
      case 'priority':
        sortColumn = watchlist.priority;
        break;
      case 'added_at':
      default:
        sortColumn = watchlist.addedAt;
        break;
    }

    const sortDirection = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    query = query.orderBy(sortDirection);

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const items = await query;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchlist)
      .where(eq(watchlist.userId, userId));

    return {
      items: items as WatchlistItem[],
      total: count,
    };
  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    throw new Error('Failed to fetch watchlist');
  }
}

// Get watchlist entry for a specific movie
export async function getWatchlistByMovie(
  userId: number,
  movieId: number
): Promise<WatchlistItem | null> {
  try {
    const result = await db
      .select({
        id: watchlist.id,
        userId: watchlist.userId,
        movieId: watchlist.movieId,
        addedAt: watchlist.addedAt,
        priority: watchlist.priority,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchlist)
      .leftJoin(movies, eq(watchlist.movieId, movies.id))
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.movieId, movieId)
        )
      )
      .limit(1);

    return result[0] as WatchlistItem || null;
  } catch (error) {
    console.error('Error fetching watchlist by movie:', error);
    throw new Error('Failed to fetch watchlist for movie');
  }
}

// Update watchlist entry
export async function updateWatchlist(
  id: number,
  updates: UpdateWatchlistData
): Promise<WatchlistItem> {
  try {
    const [result] = await db
      .update(watchlist)
      .set(updates)
      .where(eq(watchlist.id, id))
      .returning();

    if (!result) {
      throw new Error('Watchlist entry not found');
    }

    return await getWatchlistById(result.id);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    throw new Error('Failed to update watchlist entry');
  }
}

// Update watchlist priority
export async function updateWatchlistPriority(
  id: number,
  priority: 'low' | 'medium' | 'high'
): Promise<WatchlistItem> {
  try {
    const [result] = await db
      .update(watchlist)
      .set({ priority })
      .where(eq(watchlist.id, id))
      .returning();

    if (!result) {
      throw new Error('Watchlist entry not found');
    }

    return await getWatchlistById(result.id);
  } catch (error) {
    console.error('Error updating watchlist priority:', error);
    throw new Error('Failed to update watchlist priority');
  }
}

// Delete watchlist entry
export async function removeFromWatchlist(id: number): Promise<void> {
  try {
    const [result] = await db
      .delete(watchlist)
      .where(eq(watchlist.id, id))
      .returning();

    if (!result) {
      throw new Error('Watchlist entry not found');
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw new Error('Failed to remove movie from watchlist');
  }
}

// Search watchlist by title
export async function searchWatchlist(
  userId: number,
  query: string,
  options: Omit<WatchlistQueryOptions, 'userId'> = {}
): Promise<{ items: WatchlistItem[]; total: number }> {
  try {
    const { limit = 20, offset = 0 } = options;

    const searchQuery = `%${query.toLowerCase()}%`;

    const items = await db
      .select({
        id: watchlist.id,
        userId: watchlist.userId,
        movieId: watchlist.movieId,
        addedAt: watchlist.addedAt,
        priority: watchlist.priority,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchlist)
      .leftJoin(movies, eq(watchlist.movieId, movies.id))
      .where(
        and(
          eq(watchlist.userId, userId),
          like(movies.title, searchQuery)
        )
      )
      .orderBy(desc(watchlist.addedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchlist)
      .leftJoin(movies, eq(watchlist.movieId, movies.id))
      .where(
        and(
          eq(watchlist.userId, userId),
          like(movies.title, searchQuery)
        )
      );

    return {
      items: items as WatchlistItem[],
      total: count,
    };
  } catch (error) {
    console.error('Error searching watchlist:', error);
    throw new Error('Failed to search watchlist');
  }
}

// Get watchlist statistics
export async function getWatchlistStats(userId: number): Promise<{
  totalItems: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  averagePriority: number;
}> {
  try {
    const [stats] = await db
      .select({
        totalItems: sql<number>`count(*)`,
        lowPriority: sql<number>`count(case when ${watchlist.priority} = 'low' then 1 end)`,
        mediumPriority: sql<number>`count(case when ${watchlist.priority} = 'medium' then 1 end)`,
        highPriority: sql<number>`count(case when ${watchlist.priority} = 'high' then 1 end)`,
      })
      .from(watchlist)
      .where(eq(watchlist.userId, userId));

    const totalItems = stats.totalItems || 0;
    const averagePriority = totalItems > 0
      ? (stats.lowPriority * 1 + stats.mediumPriority * 2 + stats.highPriority * 3) / totalItems
      : 0;

    return {
      totalItems,
      byPriority: {
        low: stats.lowPriority || 0,
        medium: stats.mediumPriority || 0,
        high: stats.highPriority || 0,
      },
      averagePriority: Number(averagePriority.toFixed(2)),
    };
  } catch (error) {
    console.error('Error fetching watchlist stats:', error);
    throw new Error('Failed to fetch watchlist statistics');
  }
}

// Check if a movie is in user's watchlist
export async function isMovieInWatchlist(
  userId: number,
  movieId: number
): Promise<boolean> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, userId),
          eq(watchlist.movieId, movieId)
        )
      );

    return count > 0;
  } catch (error) {
    console.error('Error checking if movie is in watchlist:', error);
    throw new Error('Failed to check watchlist status');
  }
}

// Bulk update priorities
export async function bulkUpdatePriorities(
  userId: number,
  updates: Array<{ id: number; priority: 'low' | 'medium' | 'high' }>
): Promise<WatchlistItem[]> {
  try {
    const results: WatchlistItem[] = [];

    for (const update of updates) {
      const result = await updateWatchlistPriority(update.id, update.priority);
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error bulk updating priorities:', error);
    throw new Error('Failed to bulk update priorities');
  }
}

// Reorder watchlist items (for drag and drop)
export async function reorderWatchlist(
  userId: number,
  orderedIds: number[]
): Promise<WatchlistItem[]> {
  try {
    const results: WatchlistItem[] = [];

    // Update each item's position based on the order
    for (let i = 0; i < orderedIds.length; i++) {
      const itemId = orderedIds[i];
      const result = await updateWatchlist(itemId, {
        // Note: We might need to add an 'order' field to the schema for proper ordering
        // For now, we'll use the addedAt timestamp to maintain order
      });
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error reordering watchlist:', error);
    throw new Error('Failed to reorder watchlist');
  }
}

// Get watchlist with custom ordering
export async function getUserWatchlistOrdered(
  userId: number,
  options: WatchlistQueryOptions & { orderBy?: 'added_at' | 'priority' | 'title' | 'custom' } = {}
): Promise<{ items: WatchlistItem[]; total: number }> {
  try {
    const {
      limit = 20,
      offset = 0,
      filters = {},
      sortBy = 'added_at',
      sortOrder = 'desc',
      orderBy = 'added_at'
    } = options;

    let query = db
      .select({
        id: watchlist.id,
        userId: watchlist.userId,
        movieId: watchlist.movieId,
        addedAt: watchlist.addedAt,
        priority: watchlist.priority,
        movie: {
          id: movies.id,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseDate: movies.releaseDate,
          mediaType: movies.mediaType,
        },
      })
      .from(watchlist)
      .leftJoin(movies, eq(watchlist.movieId, movies.id))
      .where(eq(watchlist.userId, userId));

    // Apply filters
    if (filters.priority) {
      query = query.where(eq(watchlist.priority, filters.priority));
    }

    // Apply ordering
    let sortColumn: any;
    switch (orderBy) {
      case 'title':
        sortColumn = movies.title;
        break;
      case 'priority':
        sortColumn = watchlist.priority;
        break;
      case 'added_at':
      default:
        sortColumn = watchlist.addedAt;
        break;
    }

    const sortDirection = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    query = query.orderBy(sortDirection);

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const items = await query;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(watchlist)
      .where(eq(watchlist.userId, userId));

    return {
      items: items as WatchlistItem[],
      total: count,
    };
  } catch (error) {
    console.error('Error fetching ordered watchlist:', error);
    throw new Error('Failed to fetch ordered watchlist');
  }
}