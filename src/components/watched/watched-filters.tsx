"use client";

import { useState } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, X } from 'lucide-react';

interface WatchedFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  ratingFilter: number | null;
  onRatingChange: (rating: number | null) => void;
  yearFilter: number | null;
  onYearChange: (year: number | null) => void;
  sortBy: 'watched_at' | 'rating' | 'title';
  onSortByChange: (sortBy: 'watched_at' | 'rating' | 'title') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export function WatchedFilters({
  searchQuery,
  onSearchChange,
  ratingFilter,
  onRatingChange,
  yearFilter,
  onYearChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: WatchedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const ratingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (ratingFilter) count++;
    if (yearFilter) count++;
    if (sortBy !== 'watched_at' || sortOrder !== 'desc') count++;
    return count;
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onRatingChange(null);
    onYearChange(null);
    onSortByChange('watched_at');
    onSortOrderChange('desc');
  };

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Search by title or notes..."
                />
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <Select
                  value={ratingFilter?.toString() || ''}
                  onValueChange={(value) => onRatingChange(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All ratings</SelectItem>
                    {ratingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        <div className="flex items-center gap-2">
                          <span>⭐</span>
                          <span>{rating}+ stars</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year Watched</label>
                <Select
                  value={yearFilter?.toString() || ''}
                  onValueChange={(value) => onYearChange(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={onSortByChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="watched_at">Date Watched</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Select value={sortOrder} onValueChange={onSortOrderChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Active Filters</label>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        Search: &quot;{searchQuery}&quot;
                        <button
                          onClick={() => onSearchChange('')}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {ratingFilter && (
                      <Badge variant="secondary" className="gap-1">
                        Rating: {ratingFilter}+ ⭐
                        <button
                          onClick={() => onRatingChange(null)}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {yearFilter && (
                      <Badge variant="secondary" className="gap-1">
                        Year: {yearFilter}
                        <button
                          onClick={() => onYearChange(null)}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {(sortBy !== 'watched_at' || sortOrder !== 'desc') && (
                      <Badge variant="secondary" className="gap-1">
                        Sort: {sortBy} ({sortOrder})
                        <button
                          onClick={() => {
                            onSortByChange('watched_at');
                            onSortOrderChange('desc');
                          }}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Clear All Button */}
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}