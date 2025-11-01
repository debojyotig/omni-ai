/**
 * Message Skeleton Component
 *
 * Loading state placeholder for chat messages.
 * Shows animated skeleton while agent is processing.
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 rounded-lg justify-start">
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary/10">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Content skeleton */}
      <div className="flex-1 space-y-2 max-w-[80%] rounded-lg px-4 py-2 bg-muted">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
