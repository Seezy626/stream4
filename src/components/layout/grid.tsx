import { cn } from "@/lib/utils"

interface GridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg"
}

export function Grid({
  children,
  className,
  cols = 3,
  gap = "md",
}: GridProps) {
  const colsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6",
  }

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div
      className={cn(
        "grid",
        colsClasses[cols],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface MovieGridProps {
  children: React.ReactNode
  className?: string
}

export function MovieGrid({
  children,
  className,
}: MovieGridProps) {
  return (
    <Grid cols={4} gap="lg" className={className}>
      {children}
    </Grid>
  )
}

interface ListGridProps {
  children: React.ReactNode
  className?: string
}

export function ListGrid({
  children,
  className,
}: ListGridProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}