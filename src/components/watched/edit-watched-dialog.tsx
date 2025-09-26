"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { WatchHistoryItem } from '@/state/types';

const editWatchedSchema = z.object({
  watchedAt: z.date(),
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

type EditWatchedFormData = z.infer<typeof editWatchedSchema>;

interface EditWatchedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditWatchedFormData) => Promise<void>;
  isLoading?: boolean;
  item: WatchHistoryItem | null;
}

export function EditWatchedDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  item,
}: EditWatchedDialogProps) {
  const form = useForm<EditWatchedFormData>({
    resolver: zodResolver(editWatchedSchema),
    defaultValues: {
      watchedAt: new Date(),
      rating: undefined,
      notes: '',
    },
  });

  // Update form when item changes
  useEffect(() => {
    if (item && isOpen) {
      form.reset({
        watchedAt: new Date(item.watchedAt),
        rating: item.rating,
        notes: item.notes || '',
      });
    }
  }, [item, isOpen, form]);

  const handleSubmit = async (data: EditWatchedFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error updating watched item:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const _watchedAt = form.watch('watchedAt');
  const _rating = form.watch('rating');

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Watched Entry</DialogTitle>
          <DialogDescription>
            Update your watch history for &quot;{item.movie.title}&quot;.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Movie Info (Read-only) */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              {item.movie.posterPath && (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${item.movie.posterPath}`}
                  alt={item.movie.title}
                  width={48}
                  height={64}
                  className="w-12 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.movie.title}</p>
                {item.movie.releaseDate && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.movie.releaseDate).getFullYear()}
                  </p>
                )}
              </div>
            </div>

            {/* Watched Date */}
            <FormField
              control={form.control}
              name="watchedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Watched</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <Select
                    value={field.value?.toString() || ''}
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate this movie (1-10)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No rating</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {Array.from({ length: rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                              {Array.from({ length: 10 - rating }).map((_, i) => (
                                <Star key={i + rating} className="h-4 w-4 text-muted-foreground" />
                              ))}
                            </div>
                            <span>{rating}/10</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any thoughts or notes about this movie..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}