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
import { Label } from '@/components/ui/label';
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
import { Search, Heart, Flag } from 'lucide-react';
import { WatchlistItem } from '@/state/types';

const addToWatchlistSchema = z.object({
  movieId: z.number().min(1, 'Please select a movie'),
  priority: z.enum(['low', 'medium', 'high']),
});

type AddToWatchlistFormData = z.infer<typeof addToWatchlistSchema>;

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
}

interface AddToWatchlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddToWatchlistFormData) => Promise<void>;
  isLoading?: boolean;
  movies?: Movie[];
  existingWatchlistItems?: WatchlistItem[];
}

export function AddToWatchlistDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  movies = [],
  existingWatchlistItems = [],
}: AddToWatchlistDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isSearching] = useState(false);

  const form = useForm<AddToWatchlistFormData>({
    resolver: zodResolver(addToWatchlistSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  // Filter movies based on search query and exclude already watched items
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notInWatchlist = !existingWatchlistItems.some(item => item.movieId === movie.id);
    return matchesSearch && notInWatchlist;
  });

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    form.setValue('movieId', movie.id);
    setSearchQuery(movie.title);
  };

  const handleSubmit = async (data: AddToWatchlistFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      setSelectedMovie(null);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedMovie(null);
    setSearchQuery('');
    onClose();
  };

  const priority = form.watch('priority');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Add to Watchlist
          </DialogTitle>
          <DialogDescription>
            Add a movie or TV show to your watchlist with a priority level.
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

            {/* Priority Selection */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Priority Level
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <span>🔥</span>
                          <div className="flex flex-col">
                            <span className="font-medium">High Priority</span>
                            <span className="text-xs text-muted-foreground">Watch soon</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <span>⚡</span>
                          <div className="flex flex-col">
                            <span className="font-medium">Medium Priority</span>
                            <span className="text-xs text-muted-foreground">Watch eventually</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <span>🐌</span>
                          <div className="flex flex-col">
                            <span className="font-medium">Low Priority</span>
                            <span className="text-xs text-muted-foreground">Watch later</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority Preview */}
            <div className="p-3 bg-muted/50 rounded-md">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Will be added with</span>
                <span className="font-medium">
                  {priority === 'high' && '🔥 High Priority'}
                  {priority === 'medium' && '⚡ Medium Priority'}
                  {priority === 'low' && '🐌 Low Priority'}
                </span>
                <span className="text-sm text-muted-foreground">level</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedMovie}>
                {isLoading ? 'Adding...' : 'Add to Watchlist'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}