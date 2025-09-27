"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Film, Heart, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string
  release_date: string
  vote_average: number
  genre_ids?: number[]
}

interface MovieCardProps {
  movie: Movie
  onAddToWatchlist?: (movieId: number) => void
  onMarkAsWatched?: (movieId: number) => void
  onRemoveFromWatchlist?: (movieId: number) => void
  isInWatchlist?: boolean
  isWatched?: boolean
  className?: string
}

export function MovieCard({
  movie,
  onAddToWatchlist,
  onMarkAsWatched,
  onRemoveFromWatchlist,
  isInWatchlist = false,
  isWatched = false,
  className,
}: MovieCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleAddToWatchlist = () => {
    if (onAddToWatchlist && !isInWatchlist) {
      onAddToWatchlist(movie.id)
    }
  }

  const handleMarkAsWatched = () => {
    if (onMarkAsWatched && !isWatched) {
      onMarkAsWatched(movie.id)
    }
  }

  const handleRemoveFromWatchlist = () => {
    if (onRemoveFromWatchlist && isInWatchlist) {
      onRemoveFromWatchlist(movie.id)
    }
  }

  return (
    <Card className={cn("overflow-hidden card-hover theme-transition focus-ring", className)}>
      <div className="aspect-movie bg-muted relative group">
        {movie.poster_path && !imageError ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`${movie.title} movie poster`}
            fill
            className="object-cover image-optimized"
            onError={() => setImageError(true)}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center theme-transition">
            <Film className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge
            variant="secondary"
            className="bg-black/70 text-white touch-target theme-transition font-medium"
            aria-label={`Rating: ${movie.vote_average.toFixed(1)} out of 10`}
          >
            {movie.vote_average.toFixed(1)} ⭐
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isWatched ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white touch-target btn-hover"
              onClick={handleRemoveFromWatchlist}
              aria-label={`Remove "${movie.title}" from watched (desktop)`}
            >
              <Check className="h-4 w-4" />
            </Button>
          ) : isInWatchlist ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white touch-target btn-hover"
              onClick={handleMarkAsWatched}
              aria-label={`Mark "${movie.title}" as watched (desktop)`}
            >
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-black/70 hover:bg-black/90 text-white touch-target btn-hover"
              onClick={handleAddToWatchlist}
              aria-label={`Add "${movie.title}" to watchlist (desktop)`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile action button - always visible on touch devices */}
        <div className="absolute bottom-2 right-2 z-10 sm:hidden">
          {isWatched ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 bg-green-600 hover:bg-green-700 text-white touch-target btn-hover"
              onClick={handleRemoveFromWatchlist}
              aria-label={`Remove "${movie.title}" from watched (mobile)`}
            >
              <Check className="h-5 w-5" />
            </Button>
          ) : isInWatchlist ? (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white touch-target btn-hover"
              onClick={handleMarkAsWatched}
              aria-label={`Mark "${movie.title}" as watched (mobile)`}
            >
              <Check className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 bg-black/70 hover:bg-black/90 text-white touch-target btn-hover"
              onClick={handleAddToWatchlist}
              aria-label={`Add "${movie.title}" to watchlist (mobile)`}
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <CardHeader className="card-responsive pb-2">
        <CardTitle className="line-clamp-2 text-base theme-transition">
          {movie.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-sm theme-transition">
          {movie.overview}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-muted-foreground theme-transition">
            {movie.release_date?.split('-')[0] || 'N/A'}
          </span>
          {isInWatchlist && (
            <Badge variant="outline" className="text-xs touch-target theme-transition">
              <Heart className="h-3 w-3 mr-1" aria-hidden="true" />
              Watchlist
            </Badge>
          )}
          {isWatched && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 touch-target theme-transition dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
              Watched
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}