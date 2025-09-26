"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { WatchlistItem } from '@/state/types';
import { toast } from 'sonner';

interface PriorityManagerProps {
  items: WatchlistItem[];
  onBulkUpdate: (updates: Array<{ id: number; priority: 'low' | 'medium' | 'high' }>) => Promise<void>;
  isLoading?: boolean;
}

export function PriorityManager({ items, onBulkUpdate, isLoading = false }: PriorityManagerProps) {
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isUpdating, setIsUpdating] = useState(false);

  // Group items by priority
  const itemsByPriority = items.reduce((acc, item) => {
    if (!acc[item.priority]) {
      acc[item.priority] = [];
    }
    acc[item.priority].push(item);
    return acc;
  }, {} as Record<string, WatchlistItem[]>);

  const priorityStats = {
    high: itemsByPriority.high?.length || 0,
    medium: itemsByPriority.medium?.length || 0,
    low: itemsByPriority.low?.length || 0,
  };

  const handleBulkPriorityUpdate = async () => {
    if (items.length === 0) {
      toast.error('No items to update');
      return;
    }

    setIsUpdating(true);
    try {
      const updates = items.map(item => ({
        id: item.id,
        priority: selectedPriority,
      }));

      await onBulkUpdate(updates);
      toast.success(`Updated ${items.length} items to ${selectedPriority} priority`);
    } catch {
      toast.error('Failed to update priorities');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Priority Management
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Priority Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span>🔥</span>
              <span className="font-medium">High</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{priorityStats.high}</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span>⚡</span>
              <span className="font-medium">Medium</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{priorityStats.medium}</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span>🐌</span>
              <span className="font-medium">Low</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{priorityStats.low}</div>
          </div>
        </div>

        {/* Bulk Priority Update */}
        <div className="space-y-3">
          <h4 className="font-medium">Bulk Update Priority</h4>
          <div className="flex gap-2">
            <Select
              value={selectedPriority}
              onValueChange={(value: 'low' | 'medium' | 'high') => setSelectedPriority(value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <span>🔥</span>
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <span>⚡</span>
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <span>🐌</span>
                    Low Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleBulkPriorityUpdate}
              disabled={isUpdating || isLoading}
              className="gap-1"
            >
              {isUpdating ? 'Updating...' : 'Update All'}
            </Button>
          </div>
        </div>

        {/* Priority Legend */}
        <div className="space-y-2">
          <h4 className="font-medium">Priority Levels</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor('high')} text-white border-0`}>
                🔥 High
              </Badge>
              <span className="text-sm text-muted-foreground">Watch soon - urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor('medium')} text-white border-0`}>
                ⚡ Medium
              </Badge>
              <span className="text-sm text-muted-foreground">Watch eventually</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor('low')} text-white border-0`}>
                🐌 Low
              </Badge>
              <span className="text-sm text-muted-foreground">Watch later - backlog</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPriority('high')}
              className="gap-1"
            >
              <ArrowUp className="h-3 w-3" />
              Set High
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPriority('medium')}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Set Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPriority('low')}
              className="gap-1"
            >
              <ArrowDown className="h-3 w-3" />
              Set Low
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}