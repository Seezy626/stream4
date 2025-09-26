"use client";

import { useState, lazy, Suspense } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { SearchResultsSkeleton } from "@/components/ui/skeleton";
import { LazyWrapper, SearchResultsLoading } from "@/components/lazy-wrapper";

// Lazy load components that aren't immediately needed
const MovieCard = lazy(() => import("@/components/ui/movie-card").then(module => ({ default: module.MovieCard })));

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background theme-transition">
      <Header />
      <Sidebar>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="heading-responsive font-bold tracking-tight theme-transition">
              Welcome to MovieTracker
            </h1>
            <p className="text-responsive text-muted-foreground mt-2 theme-transition">
              Search and track your favorite movies
            </p>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <SearchBar onSearch={handleSearch} />
          </div>

          {loading && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold theme-transition">Search Results</h2>
              <SearchResultsLoading count={8} />
            </div>
          )}

          {movies.length > 0 && !loading && (
            <LazyWrapper fallback={<SearchResultsLoading count={movies.length} />}>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold theme-transition">Search Results</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-responsive">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={{
                        id: movie.id,
                        title: movie.title,
                        overview: movie.overview,
                        poster_path: movie.poster_path,
                        release_date: movie.release_date,
                        vote_average: movie.vote_average,
                      }}
                    />
                  ))}
                </div>
              </div>
            </LazyWrapper>
          )}
        </div>
      </Sidebar>
    </div>
  );
}