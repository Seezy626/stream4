import { Button } from "@/components/ui/button"
import { Film, Search, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <div className="mb-4 text-muted-foreground">
        {icon || <Film className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function EmptySearchState({ onClearSearch }: { onClearSearch?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12" />}
      title="No movies found"
      description="Try adjusting your search terms or browse our popular movies"
      action={
        onClearSearch
          ? {
              label: "Clear Search",
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  )
}

export function EmptyWatchlistState({ onBrowseMovies }: { onBrowseMovies: () => void }) {
  return (
    <EmptyState
      icon={<Heart className="h-12 w-12" />}
      title="Your watchlist is empty"
      description="Start building your movie collection by adding movies to your watchlist"
      action={{
        label: "Browse Movies",
        onClick: onBrowseMovies,
      }}
    />
  )
}

export function EmptyWatchedState({ onBrowseMovies }: { onBrowseMovies: () => void }) {
  return (
    <EmptyState
      icon={<Film className="h-12 w-12" />}
      title="No watched movies yet"
      description="Mark movies as watched to keep track of what you've seen"
      action={{
        label: "Browse Movies",
        onClick: onBrowseMovies,
      }}
    />
  )
}

export function EmptyLoadingState() {
  return (
    <EmptyState
      title="Loading movies..."
      description="Please wait while we fetch your movies"
    />
  )
}