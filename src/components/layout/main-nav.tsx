"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Film, Home, List, User, Search } from "lucide-react"

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    ariaLabel: "Go to homepage"
  },
  {
    name: "Search",
    href: "/search",
    icon: Search,
    ariaLabel: "Search for movies"
  },
  {
    name: "Watchlist",
    href: "/watchlist",
    icon: List,
    ariaLabel: "View your watchlist"
  },
  {
    name: "Watched",
    href: "/watched",
    icon: Film,
    ariaLabel: "View watched movies"
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    ariaLabel: "View your profile"
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6" role="navigation" aria-label="Main navigation">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:text-primary focus-ring rounded-md px-2 py-1 touch-target",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-muted/50"
            )}
            aria-label={item.ariaLabel}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline-block">{item.name}</span>
            <span className="sm:hidden">{item.name.charAt(0)}</span>
          </Link>
        )
      })}
    </nav>
  )
}