"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { WatchlistFilters as WatchlistFiltersType } from '@/state/types';

interface WatchlistFiltersProps {
  filters: WatchlistFiltersType;
  onFiltersChange: (filters: Partial<WatchlistFiltersType>) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  totalResults: number;
  isLoading?: boolean;
}

export function WatchlistFilters({
  filters,
  onFiltersChange,
  onSearch,
  searchQuery,
  totalResults,
  isLoading = false,
}: WatchlistFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    if (value === '') {
      onSearch('');
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      priority: undefined,
      sortBy: 'added_at',
      sortOrder: 'desc',
    });
    setLocalSearchQuery('');
    onSearch('');
  };

  const hasActiveFilters = filters.priority || searchQuery;

  const getSortIcon = () => {
    if (filters.sortOrder === 'asc') {
      return <SortAsc className="h-4 w-4" />;
    }
    return <SortDesc className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <Label htmlFor="search">Search Movies</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search your watchlist..."
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              Search
            </Button>
          </div>
        </form>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority Filter */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  priority: value === 'all' ? undefined : (value as 'low' | 'medium' | 'high'),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">🔥 High Priority</SelectItem>
                <SelectItem value="medium">⚡ Medium Priority</SelectItem>
                <SelectItem value="low">🐌 Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy || 'added_at'}
              onValueChange={(value) =>
                onFiltersChange({
                  sortBy: value as 'added_at' | 'priority' | 'title',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="added_at">Date Added</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2">
          <Label>Sort Order:</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onFiltersChange({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
            className="gap-1"
          >
            {getSortIcon()}
            {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>

        {/* Active Filters & Results Count */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.priority && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {filters.priority}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFiltersChange({ priority: undefined })}
                    />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setLocalSearchQuery('');
                        onSearch('');
                      }}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {totalResults} movie{totalResults !== 1 ? 's' : ''} in watchlist
          </div>
        </div>
      </CardContent>
    </Card>
  );
}