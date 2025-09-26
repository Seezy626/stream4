"use client";

import { useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { MovieCard } from "@/components/ui/movie-card";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { PageContainer, PageSection } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptySearchState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AddToWatchedDialog } from "@/components/watched/add-to-watched-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

type TMDBResult = TMDBMovie | TMDBTVShow;

export default function SearchPage() {
  const [movies, setMovies] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBResult | null>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&type=multi`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search movies');
      }

      setMovies(data.results || []);
    } catch (error) {
      console.error('Error searching movies:', error);
      toast.error('Failed to search movies');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsWatched = (movie: TMDBResult) => {
    setSelectedMovie(movie);
    setShowAddDialog(true);
  };

  const handleAddToWatched = async (data: {
    movieId: number;
    watchedAt: Date;
    rating?: number;
    notes?: string;
  }) => {
    try {
      // First sync the movie with our database
      const syncResponse = await fetch('/api/movies/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: selectedMovie?.id,
          mediaType: selectedMovie?.media_type,
        }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync movie data');
      }

      const syncData = await syncResponse.json();

      // Add to watch history
      const watchHistoryResponse = await fetch('/api/watch-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          movieId: syncData.movieId,
        }),
      });

      if (!watchHistoryResponse.ok) {
        const errorData = await watchHistoryResponse.json();
        throw new Error(errorData.error || 'Failed to add to watch history');
      }

      toast.success('Movie added to watch history!');
      setShowAddDialog(false);
      setSelectedMovie(null);
    } catch (error) {
      console.error('Error adding to watch history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add to watch history');
      throw error;
    }
  };

  const handleAddToWatchlist = (movieId: number) => {
    console.log('Add to watchlist:', movieId);
    toast.info('Watchlist feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar>
        <PageContainer>
          <PageSection>
            <PageHeader
              title="Search Movies & TV Shows"
              description="Find your favorite movies and TV shows by title, actor, or director"
            />

            <div className="max-w-2xl mx-auto w-full mb-8">
              <SearchInput
                onSearch={handleSearch}
                placeholder="Search for movies, TV shows, actors, directors..."
                isLoading={loading}
              />
            </div>

            {loading && (
              <div className="flex justify-center">
                <LoadingSpinner size="lg" text="Searching movies..." />
              </div>
            )}

            {!loading && hasSearched && movies.length === 0 && (
              <EmptySearchState />
            )}

            {!loading && movies.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Found {movies.length} result{movies.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Movie
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={{
                        ...movie,
                        title: 'title' in movie ? movie.title : movie.name,
                        release_date: 'release_date' in movie ? movie.release_date : movie.first_air_date,
                      }}
                      onAddToWatchlist={handleAddToWatchlist}
                      onMarkAsWatched={() => handleMarkAsWatched(movie)}
                    />
                  ))}
                </div>
              </div>
            )}
          </PageSection>
        </PageContainer>
      </Sidebar>

      {/* Add to Watched Dialog */}
      <AddToWatchedDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSelectedMovie(null);
        }}
        onSubmit={handleAddToWatched}
        isLoading={loading}
        movies={selectedMovie ? [{
          id: selectedMovie.id,
          title: 'title' in selectedMovie ? selectedMovie.title : selectedMovie.name,
          poster_path: selectedMovie.poster_path,
          release_date: 'release_date' in selectedMovie ? selectedMovie.release_date : selectedMovie.first_air_date,
        }] : []}
      />
    </div>
  );
}