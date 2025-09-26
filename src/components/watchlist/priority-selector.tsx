"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Flag, ChevronDown } from 'lucide-react';

interface PrioritySelectorProps {
  priority: 'low' | 'medium' | 'high';
  onPriorityChange: (priority: 'low' | 'medium' | 'high') => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export function PrioritySelector({
  priority,
  onPriorityChange,
  disabled = false,
  variant = 'default'
}: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '🐌';
      default:
        return '📋';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="gap-1"
          >
            <span>{getPriorityIcon(priority)}</span>
            <span className="hidden sm:inline">{getPriorityLabel(priority)}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              onPriorityChange('high');
              setIsOpen(false);
            }}
            className="gap-2"
          >
            <span>🔥</span>
            High Priority
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onPriorityChange('medium');
              setIsOpen(false);
            }}
            className="gap-2"
          >
            <span>⚡</span>
            Medium Priority
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onPriorityChange('low');
              setIsOpen(false);
            }}
            className="gap-2"
          >
            <span>🐌</span>
            Low Priority
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="gap-2"
        >
          <Flag className="h-4 w-4" />
          <span>{getPriorityIcon(priority)}</span>
          {getPriorityLabel(priority)} Priority
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            onPriorityChange('high');
            setIsOpen(false);
          }}
          className="gap-2"
        >
          <Badge className={`${getPriorityColor('high')} text-white border-0 w-4 h-4 p-0 flex items-center justify-center`}>
            🔥
          </Badge>
          <div className="flex flex-col">
            <span className="font-medium">High Priority</span>
            <span className="text-xs text-muted-foreground">Watch soon</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onPriorityChange('medium');
            setIsOpen(false);
          }}
          className="gap-2"
        >
          <Badge className={`${getPriorityColor('medium')} text-white border-0 w-4 h-4 p-0 flex items-center justify-center`}>
            ⚡
          </Badge>
          <div className="flex flex-col">
            <span className="font-medium">Medium Priority</span>
            <span className="text-xs text-muted-foreground">Watch eventually</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onPriorityChange('low');
            setIsOpen(false);
          }}
          className="gap-2"
        >
          <Badge className={`${getPriorityColor('low')} text-white border-0 w-4 h-4 p-0 flex items-center justify-center`}>
            🐌
          </Badge>
          <div className="flex flex-col">
            <span className="font-medium">Low Priority</span>
            <span className="text-xs text-muted-foreground">Watch later</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}