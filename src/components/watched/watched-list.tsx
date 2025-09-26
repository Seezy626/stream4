"use client";

import { useState, useEffect } from 'react';
import { WatchHistoryItem } from '@/state/types';
import { WatchedCard } from './watched-card';
import { WatchedFilters } from './watched-filters';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

interface WatchedListProps {
  items: WatchHistoryItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onAddNew: () => void;
  onEdit: (item: WatchHistoryItem) => void;
  onDelete: (id: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function WatchedList({
  items,
  isLoading,
  error,
  onRefresh,
  onAddNew,
  onEdit,
  onDelete,
  onLoadMore,
  hasMore = false,
}: WatchedListProps) {
  const [filteredItems, setFilteredItems] = useState<WatchHistoryItem[]>(items);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'watched_at' | 'rating' | 'title'>('watched_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort items when dependencies change
  useEffect(() => {
    let filtered = [...items];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply rating filter
    if (ratingFilter) {
      filtered = filtered.filter(item => item.rating === ratingFilter);
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(item => {
        const watchedYear = new Date(item.watchedAt).getFullYear();
        return watchedYear === yearFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case 'title':
          aValue = a.movie.title.toLowerCase();
          bValue = b.movie.title.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'watched_at':
        default:
          aValue = new Date(a.watchedAt).getTime();
          bValue = new Date(b.watchedAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  }, [items, searchQuery, ratingFilter, yearFilter, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setRatingFilter(null);
    setYearFilter(null);
    setSortBy('watched_at');
    setSortOrder('desc');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (ratingFilter) count++;
    if (yearFilter) count++;
    if (sortBy !== 'watched_at' || sortOrder !== 'desc') count++;
    return count;
  };

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} />
        <div className="flex justify-center">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={onAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add to Watched
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {getActiveFiltersCount() > 0 && (
          <Button onClick={handleClearFilters} variant="ghost" size="sm">
            Clear Filters ({getActiveFiltersCount()})
          </Button>
        )}
      </div>

      {/* Filters */}
      <WatchedFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        ratingFilter={ratingFilter}
        onRatingChange={setRatingFilter}
        yearFilter={yearFilter}
        onYearChange={setYearFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Loading state */}
      {isLoading && items.length === 0 && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredItems.length === 0 && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t watched any movies yet.
          </p>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Movie
          </Button>
        </div>
      )}

      {/* No results state */}
      {!isLoading && filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No movies match your current filters.
          </p>
          <Button onClick={handleClearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      )}

      {/* Items grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <WatchedCard
              key={item.id}
              item={item}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button onClick={onLoadMore} variant="outline" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}