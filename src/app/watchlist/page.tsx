"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { PageContainer, PageSection } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Search, Plus, Download, Upload } from "lucide-react"
import { DraggableWatchlistGrid } from "@/components/watchlist/draggable-watchlist-grid"
import { WatchlistFilters } from "@/components/watchlist/watchlist-filters"
import { AddToWatchlistDialog } from "@/components/watchlist/add-to-watchlist-dialog"
import { PrioritySelector } from "@/components/watchlist/priority-selector"
import { WatchlistItem, WatchlistFilters as WatchlistFiltersType } from "@/state/types"
import { useAppStore } from "@/state/store"
import { toast } from "sonner"

export default function WatchlistPage() {
  const { data: session } = useSession()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<WatchlistFiltersType>({
    sortBy: 'added_at',
    sortOrder: 'desc',
  })

  const {
    watchlistItems: items,
    watchlistIsLoading: isLoading,
    watchlistTotalResults: totalResults,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistPriority,
  } = useAppStore()

  // Fetch watchlist on component mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchWatchlist(1, searchQuery, filters)
    }
  }, [session?.user?.id, fetchWatchlist, searchQuery, filters])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Handle filters change
  const handleFiltersChange = (newFilters: Partial<WatchlistFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Handle add to watchlist
  const handleAddToWatchlist = async (data: { movieId: number; priority: 'low' | 'medium' | 'high' }) => {
    try {
      await addToWatchlist(data)
      toast.success("Movie added to watchlist!")
    } catch {
      toast.error("Failed to add movie to watchlist")
    }
  }

  // Handle remove from watchlist
  const handleRemoveFromWatchlist = async (id: number) => {
    try {
      await removeFromWatchlist(id)
      toast.success("Movie removed from watchlist")
    } catch {
      toast.error("Failed to remove movie from watchlist")
    }
  }

  // Handle mark as watched
  const handleMarkAsWatched = async () => {
    try {
      // TODO: Implement mark as watched functionality
      toast.success("Movie marked as watched!")
    } catch {
      toast.error("Failed to mark movie as watched")
    }
  }

  // Handle priority update
  const handleUpdatePriority = async (id: number, priority: 'low' | 'medium' | 'high') => {
    try {
      await updateWatchlistPriority(id, priority)
      toast.success("Priority updated!")
    } catch {
      toast.error("Failed to update priority")
    }
  }

  // Handle edit priority
  const handleEditPriority = (item: WatchlistItem) => {
    setEditingItem(item)
  }

  // Handle browse movies
  const handleBrowseMovies = () => {
    window.location.href = '/search'
  }

  // Handle export watchlist
  const handleExportWatchlist = () => {
    const dataStr = JSON.stringify(items, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `watchlist-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast.success("Watchlist exported successfully!")
  }

  // Handle import watchlist
  const handleImportWatchlist = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            JSON.parse(e.target?.result as string)
            // TODO: Implement import functionality
            toast.success("Watchlist imported successfully!")
          } catch {
            toast.error("Failed to import watchlist")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar>
          <PageContainer>
            <PageSection>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Please sign in to view your watchlist.</p>
              </div>
            </PageSection>
          </PageContainer>
        </Sidebar>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar>
        <PageContainer>
          <PageSection>
            <PageHeader
              title="My Watchlist"
              description="Movies you want to watch"
            >
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleImportWatchlist}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" onClick={handleExportWatchlist}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleBrowseMovies}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Movies
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Movie
                </Button>
              </div>
            </PageHeader>

            <div className="space-y-6">
              {/* Filters */}
              <WatchlistFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                searchQuery={searchQuery}
                totalResults={totalResults}
                isLoading={isLoading}
              />

              {/* Watchlist Grid */}
              <DraggableWatchlistGrid
                items={items}
                onEdit={handleEditPriority}
                onDelete={handleRemoveFromWatchlist}
                onMarkAsWatched={handleMarkAsWatched}
                onReorder={async (orderedIds) => {
                  try {
                    const response = await fetch('/api/watchlist/reorder', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ orderedIds }),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to reorder watchlist');
                    }

                    toast.success("Watchlist reordered successfully!");
                  } catch (error) {
                    toast.error("Failed to reorder watchlist");
                    throw error;
                  }
                }}
                isLoading={isLoading}
              />
            </div>
          </PageSection>
        </PageContainer>
      </Sidebar>

      {/* Add to Watchlist Dialog */}
      <AddToWatchlistDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddToWatchlist}
        isLoading={isLoading}
        existingWatchlistItems={items}
      />

      {/* Edit Priority Dialog */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Priority</h3>
            <p className="text-muted-foreground mb-4">
              Update priority for &quot;{editingItem.movie.title}&quot;
            </p>
            <PrioritySelector
              priority={editingItem.priority}
              onPriorityChange={(priority) => {
                handleUpdatePriority(editingItem.id, priority)
                setEditingItem(null)
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}