"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ViewTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Check if View Transition API is supported
    if (!document.startViewTransition) return

    // Handle view transitions for navigation
    const handleViewTransition = () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          // The navigation will happen automatically
        })
      }
    }

    // Add transition styles for common elements
    const style = document.createElement("style")
    style.textContent = `
      ::view-transition-old(root) {
        animation: fade-out 0.3s ease-in-out;
      }

      ::view-transition-new(root) {
        animation: fade-in 0.3s ease-in-out;
      }

      @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Smooth transition for images */
      ::view-transition-old(image),
      ::view-transition-new(image) {
        animation-duration: 0.4s;
        animation-timing-function: ease-in-out;
      }

      /* Smooth transition for cards */
      ::view-transition-old(card),
      ::view-transition-new(card) {
        animation-duration: 0.3s;
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [pathname])

  return <>{children}</>
}