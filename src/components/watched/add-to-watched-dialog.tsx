"use client";

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
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
import { CalendarIcon, Search, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const addToWatchedSchema = z.object({
  movieId: z.number().min(1, 'Please select a movie'),
  watchedAt: z.date(),
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

type AddToWatchedFormData = z.infer<typeof addToWatchedSchema>;

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
}

interface AddToWatchedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddToWatchedFormData) => Promise<void>;
  isLoading?: boolean;
  movies?: Movie[];
}

export function AddToWatchedDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  movies = [],
}: AddToWatchedDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<AddToWatchedFormData>({
    resolver: zodResolver(addToWatchedSchema),
    defaultValues: {
      watchedAt: new Date(),
      rating: undefined,
      notes: '',
    },
  });

  // Filter movies based on search query
  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    form.setValue('movieId', movie.id);
    setSearchQuery(movie.title);
  };

  const handleSubmit = async (data: AddToWatchedFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      setSelectedMovie(null);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error adding to watched:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedMovie(null);
    setSearchQuery('');
    onClose();
  };

  const _watchedAt = form.watch('watchedAt');
  const _rating = form.watch('rating');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Watched</DialogTitle>
          <DialogDescription>
            Add a movie or TV show to your watched history.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Movie Selection */}
            <FormField
              control={form.control}
              name="movieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movie/TV Show</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search for a movie or TV show..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedMovie && e.target.value !== selectedMovie.title) {
                              setSelectedMovie(null);
                              field.onChange(0);
                            }
                          }}
                          className="pl-10"
                        />
                      </div>

                      {/* Movie Selection Dropdown */}
                      {searchQuery && !selectedMovie && (
                        <div className="border rounded-md max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Searching...
                            </div>
                          ) : filteredMovies.length > 0 ? (
                            <div className="divide-y">
                              {filteredMovies.slice(0, 10).map((movie) => (
                                <button
                                  key={movie.id}
                                  type="button"
                                  onClick={() => handleMovieSelect(movie)}
                                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {movie.poster_path && (
                                      <Image
                                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                        alt={movie.title}
                                        width={48}
                                        height={64}
                                        className="w-12 h-16 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{movie.title}</p>
                                      {movie.release_date && (
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(movie.release_date).getFullYear()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No movies found. Try a different search term.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selected Movie Display */}
                      {selectedMovie && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                          {selectedMovie.poster_path && (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                              alt={selectedMovie.title}
                              width={48}
                              height={64}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{selectedMovie.title}</p>
                            {selectedMovie.release_date && (
                              <p className="text-sm text-muted-foreground">
                                {new Date(selectedMovie.release_date).getFullYear()}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMovie(null);
                              setSearchQuery('');
                              field.onChange(0);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Rating (Optional)</FormLabel>
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
                  <FormLabel>Notes (Optional)</FormLabel>
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
                {isLoading ? 'Adding...' : 'Add to Watched'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}