"use client";

import { useState } from 'react';
import Image from 'next/image';
import { WatchlistItem } from '@/state/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/dialog';
import {
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Clock,
  Flag,
  Check,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';

interface WatchlistCardProps {
  item: WatchlistItem;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsWatched: () => void;
  onUpdatePriority: (priority: 'low' | 'medium' | 'high') => void;
}

export function WatchlistCard({
  item,
  onEdit,
  onDelete,
  onMarkAsWatched,
  onUpdatePriority
}: WatchlistCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      onDelete();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'h:mm a');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '🐌';
      default:
        return '📋';
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-0">
          {/* Movie Poster */}
          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
            {item.movie.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${item.movie.posterPath}`}
                alt={item.movie.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-4xl font-bold text-muted-foreground">
                  {item.movie.title.charAt(0)}
                </div>
              </div>
            )}

            {/* Priority Badge */}
            <Badge
              className={`absolute top-2 right-2 ${getPriorityColor(item.priority)} text-white border-0`}
            >
              <Flag className="h-3 w-3 mr-1 fill-current" />
              {item.priority.toUpperCase()}
            </Badge>

            {/* Media Type Badge */}
            <Badge
              variant="secondary"
              className="absolute top-2 left-2"
            >
              {item.movie.mediaType.toUpperCase()}
            </Badge>

            {/* Watchlist Badge */}
            <Badge
              variant="outline"
              className="absolute bottom-2 left-2 bg-black/70 text-white border-0"
            >
              <Heart className="h-3 w-3 mr-1" />
              Watchlist
            </Badge>
          </div>

          {/* Movie Info */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {item.movie.title}
              </h3>
              {item.movie.releaseDate && (
                <p className="text-sm text-muted-foreground">
                  {new Date(item.movie.releaseDate).getFullYear()}
                </p>
              )}
            </div>

            {/* Added Date and Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Added {formatDate(item.addedAt)}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{formatTime(item.addedAt)}</span>
            </div>

            {/* Priority Display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant="outline" className="gap-1">
                <span>{getPriorityIcon(item.priority)}</span>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              ID: {item.id}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMarkAsWatched}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Watched
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from Watchlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{item.movie.title}" from your watchlist?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}