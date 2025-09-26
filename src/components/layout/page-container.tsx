import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

export function PageContainer({
  children,
  className,
  size = "lg",
}: PageContainerProps) {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-none",
  }

  return (
    <div className={cn(
      "mx-auto w-full px-4 sm:px-6 lg:px-8",
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}

interface PageSectionProps {
  children: React.ReactNode
  className?: string
  spacing?: "sm" | "md" | "lg"
}

export function PageSection({
  children,
  className,
  spacing = "lg",
}: PageSectionProps) {
  const spacingClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
  }

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  )
}

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

export function PageContent({
  children,
  className,
}: PageContentProps) {
  return (
    <main className={cn("flex-1", className)}>
      {children}
    </main>
  )
}