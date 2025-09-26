"use client"

import Link from "next/link"
import { Film } from "lucide-react"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/auth/user-menu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 theme-transition">
      <div className="container-responsive flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 theme-transition hover:opacity-80 focus-ring rounded-md px-2 py-1"
            aria-label="Go to homepage"
          >
            <Film className="h-6 w-6" aria-hidden="true" />
            <span className="hidden font-bold sm:inline-block">
              MovieTracker
            </span>
          </Link>
          <MainNav />
        </div>

        {/* Mobile Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link
              href="/"
              className="flex items-center space-x-2 theme-transition hover:opacity-80 focus-ring rounded-md px-2 py-1 md:hidden"
              aria-label="Go to homepage"
            >
              <Film className="h-6 w-6" aria-hidden="true" />
              <span className="font-bold">MovieTracker</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}