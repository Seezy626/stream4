import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  )
}

// Movie card skeleton
function MovieCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-hover", className)}>
      <div className="aspect-movie bg-muted relative">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="card-responsive p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  )
}

// Search results skeleton
function SearchResultsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-responsive">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Text skeleton
function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3",
            i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// Button skeleton
function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-24", className)} />
}

// Avatar skeleton
function AvatarSkeleton({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  }

  return <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
}

// Loading spinner with shimmer effect
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("loading-shimmer rounded-full", className)}>
      <div className="w-full h-full rounded-full bg-muted/50" />
    </div>
  )
}

export {
  Skeleton,
  MovieCardSkeleton,
  SearchResultsSkeleton,
  TextSkeleton,
  ButtonSkeleton,
  AvatarSkeleton,
  LoadingSpinner
}