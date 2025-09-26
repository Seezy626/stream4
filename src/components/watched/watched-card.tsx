"use client";

import { useState } from 'react';
import Image from 'next/image';
import { WatchHistoryItem } from '@/state/types';
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
  Star,
  Calendar,
  FileText,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface WatchedCardProps {
  item: WatchHistoryItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function WatchedCard({ item, onEdit, onDelete }: WatchedCardProps) {
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

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'bg-green-500';
    if (rating >= 6) return 'bg-yellow-500';
    if (rating >= 4) return 'bg-orange-500';
    return 'bg-red-500';
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

            {/* Rating Badge */}
            {item.rating && (
              <Badge
                className={`absolute top-2 right-2 ${getRatingColor(item.rating)} text-white border-0`}
              >
                <Star className="h-3 w-3 mr-1 fill-current" />
                {item.rating}/10
              </Badge>
            )}

            {/* Media Type Badge */}
            <Badge
              variant="secondary"
              className="absolute top-2 left-2"
            >
              {item.movie.mediaType.toUpperCase()}
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

            {/* Watched Date and Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(item.watchedAt)}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{formatTime(item.watchedAt)}</span>
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground line-clamp-2">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              Added {formatDate(item.createdAt)}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
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
            <AlertDialogTitle>Delete from Watched</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{item.movie.title}" from your watched list?
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}