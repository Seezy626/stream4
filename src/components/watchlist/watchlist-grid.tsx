"use client";

import { useState } from 'react';
import { WatchlistItem } from '@/state/types';
import { WatchlistCard } from './watchlist-card';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatchlistGridProps {
  items: WatchlistItem[];
  onEdit: (item: WatchlistItem) => void;
  onDelete: (id: number) => void;
  onMarkAsWatched: (id: number) => void;
  isLoading?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export function WatchlistGrid({
  items,
  onEdit,
  onDelete,
  onMarkAsWatched,
  isLoading = false,
  className,
}: WatchlistGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Watchlist</h2>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid'
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            : "grid-cols-1"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted aspect-[2/3] rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="bg-muted h-4 rounded w-3/4"></div>
                <div className="bg-muted h-3 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Watchlist</h2>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg mb-2">Your watchlist is empty</p>
            <p className="text-sm">Start adding movies to keep track of what you want to watch!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Watchlist</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {items.length} movie{items.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className={cn(
        "grid gap-6",
        viewMode === 'grid'
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          : "grid-cols-1"
      )}>
        {items.map((item) => (
          <WatchlistCard
            key={item.id}
            item={item}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
            onMarkAsWatched={() => onMarkAsWatched(item.id)}
          />
        ))}
      </div>
    </div>
  );
}