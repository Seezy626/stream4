"use client";

import { useState, useRef } from 'react';
import { WatchlistItem } from '@/state/types';
import { WatchlistCard } from './watchlist-card';
import { Button } from '@/components/ui/button';
import { Grid, List, LayoutGrid, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableWatchlistGridProps {
  items: WatchlistItem[];
  onEdit: (item: WatchlistItem) => void;
  onDelete: (id: number) => void;
  onMarkAsWatched: (id: number) => void;
  onUpdatePriority: (id: number, priority: 'low' | 'medium' | 'high') => void;
  onReorder: (orderedIds: number[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export function DraggableWatchlistGrid({
  items,
  onEdit,
  onDelete,
  onMarkAsWatched,
  onUpdatePriority,
  onReorder,
  isLoading = false,
  className,
}: DraggableWatchlistGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [draggedItem, setDraggedItem] = useState<WatchlistItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragEnabled, setIsDragEnabled] = useState(false);

  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent, item: WatchlistItem) => {
    if (!isDragEnabled) return;

    setDraggedItem(item);
    dragCounter.current = 0;

    // Set drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    dragImage.style.transform = 'rotate(-5deg)';
    e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedItem || !isDragEnabled) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem.id);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    // Create new order
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, removed);

    const orderedIds = newItems.map(item => item.id);

    try {
      await onReorder(orderedIds);
    } catch (error) {
      console.error('Failed to reorder items:', error);
    } finally {
      setDraggedItem(null);
      setDragOverIndex(null);
      dragCounter.current = 0;
    }
  };

  const toggleDragMode = () => {
    setIsDragEnabled(!isDragEnabled);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

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
            <Button
              variant={isDragEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={toggleDragMode}
            >
              <GripVertical className="h-4 w-4" />
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
            <Button
              variant={isDragEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={toggleDragMode}
            >
              <GripVertical className="h-4 w-4" />
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
            <Button
              variant={isDragEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={toggleDragMode}
              className={cn(
                "transition-colors",
                isDragEnabled && "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <GripVertical className="h-4 w-4" />
              {isDragEnabled ? 'Dragging' : 'Drag'}
            </Button>
          </div>
        </div>
      </div>

      {/* Drag Mode Instructions */}
      {isDragEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Drag Mode Active:</strong> Drag and drop items to reorder your watchlist.
            Drop items between cards to change their position.
          </p>
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        viewMode === 'grid'
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          : "grid-cols-1"
      )}>
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={isDragEnabled}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "relative transition-all duration-200",
              isDragEnabled && "cursor-move hover:scale-105",
              draggedItem?.id === item.id && "opacity-50 rotate-2 scale-105",
              dragOverIndex === index && draggedItem?.id !== item.id && "ring-2 ring-blue-400 ring-opacity-50"
            )}
          >
            {/* Drag Handle */}
            {isDragEnabled && (
              <div className="absolute top-2 left-2 z-10 bg-white/90 rounded p-1 shadow-sm">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            {/* Drop Zone Indicator */}
            {dragOverIndex === index && draggedItem?.id !== item.id && (
              <div className="absolute inset-0 bg-blue-400/20 rounded-lg border-2 border-dashed border-blue-400 z-10 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                  Drop here
                </div>
              </div>
            )}

            <WatchlistCard
              item={item}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
              onMarkAsWatched={() => onMarkAsWatched(item.id)}
              onUpdatePriority={(priority) => onUpdatePriority(item.id, priority)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}