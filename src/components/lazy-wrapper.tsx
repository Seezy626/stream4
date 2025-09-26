'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}

// Loading component for lazy-loaded sections
export function SectionLoading({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center`}>
      <LoadingSpinner />
    </div>
  );
}

// Loading component for cards
export function CardLoading() {
  return (
    <div className="animate-pulse">
      <div className="bg-muted aspect-movie rounded-lg mb-3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
      </div>
    </div>
  );
}

// Loading component for search results
export function SearchResultsLoading({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardLoading key={i} />
      ))}
    </div>
  );
}