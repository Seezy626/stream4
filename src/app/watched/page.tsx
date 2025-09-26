"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { PageContainer, PageSection } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { WatchedList } from '@/components/watched/watched-list';
import { AddToWatchedDialog } from '@/components/watched/add-to-watched-dialog';
import { EditWatchedDialog } from '@/components/watched/edit-watched-dialog';
import { Button } from '@/components/ui/button';
import { Search, Plus, BarChart3 } from 'lucide-react';
import { WatchHistoryItem } from '@/state/types';
import { toast } from 'sonner';

interface WatchHistoryResponse {
  items: WatchHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function WatchedPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchHistoryItem | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch watch history
  const fetchWatchHistory = useCallback(async (page = 1, search = '', filters = {}) => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);

      const response = await fetch(`/api/watch-history?${params}`);
      const data: WatchHistoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch watch history');
      }

      if (page === 1) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }

      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching watch history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch watch history');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, pagination.limit]);

  // Initial load
  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  // Add new item
  const handleAddItem = async (data: any) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/watch-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add movie to watch history');
      }

      // Refresh the list
      await fetchWatchHistory(1);
      toast.success('Movie added to watch history!');
    } catch (error) {
      console.error('Error adding to watch history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add movie to watch history');
      throw error;
    }
  };

  // Edit item
  const handleEditItem = async (data: any) => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/watch-history/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update watch history entry');
      }

      // Update the item in the list
      setItems(prev =>
        prev.map(item =>
          item.id === editingItem.id ? result : item
        )
      );

      setShowEditDialog(false);
      setEditingItem(null);
      toast.success('Watch history updated!');
    } catch (error) {
      console.error('Error updating watch history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update watch history entry');
      throw error;
    }
  };

  // Delete item
  const handleDeleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/watch-history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete watch history entry');
      }

      // Remove the item from the list
      setItems(prev => prev.filter(item => item.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Movie removed from watch history!');
    } catch (error) {
      console.error('Error deleting watch history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete watch history entry');
      throw error;
    }
  };

  // Handle edit
  const handleEdit = (item: WatchHistoryItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchWatchHistory(1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchWatchHistory(pagination.page + 1);
    }
  };

  // Handle browse movies
  const handleBrowseMovies = () => {
    window.location.href = '/search';
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar>
          <PageContainer>
            <PageSection>
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Please sign in to view your watch history.
                </p>
              </div>
            </PageSection>
          </PageContainer>
        </Sidebar>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar>
        <PageContainer>
          <PageSection>
            <PageHeader
              title="Watched Movies & TV Shows"
              description="Track and manage your viewing history"
              children={
                <div className="flex items-center gap-2">
                  <Button onClick={handleBrowseMovies} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Find More
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Watched
                  </Button>
                </div>
              }
            />

            <WatchedList
              items={items}
              isLoading={isLoading}
              error={error}
              onRefresh={handleRefresh}
              onAddNew={() => setShowAddDialog(true)}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              onLoadMore={handleLoadMore}
              hasMore={pagination.page < pagination.totalPages}
            />

            {/* Statistics */}
            {items.length > 0 && (
              <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5" />
                  <h3 className="font-semibold">Your Statistics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{pagination.total}</div>
                    <div className="text-sm text-muted-foreground">Total Watched</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {items.filter(item => item.rating).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Rated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(items.reduce((acc, item) => acc + (item.rating || 0), 0) / items.filter(item => item.rating).length).toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {new Set(items.map(item => item.movie.mediaType)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Media Types</div>
                  </div>
                </div>
              </div>
            )}
          </PageSection>
        </PageContainer>
      </Sidebar>

      {/* Add Dialog */}
      <AddToWatchedDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddItem}
        isLoading={isLoading}
      />

      {/* Edit Dialog */}
      <EditWatchedDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingItem(null);
        }}
        onSubmit={handleEditItem}
        isLoading={isLoading}
        item={editingItem}
      />
    </div>
  );
}