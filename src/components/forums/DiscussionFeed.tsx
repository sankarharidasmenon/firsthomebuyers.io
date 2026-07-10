'use client'

import { useState } from 'react'
import { MessagesSquare, Plus } from 'lucide-react'
import type { Discussion } from '@/lib/forumsData'
import { DiscussionCard } from './DiscussionCard'

/** The list of discussion cards with load more functionality. */
export function DiscussionFeed({ discussions }: { discussions: Discussion[] }) {
  const [visibleCount, setVisibleCount] = useState(8)

  if (discussions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <MessagesSquare className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-medium text-foreground">No discussions here yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Be the first to start one in this category.</p>
      </div>
    )
  }

  const visibleDiscussions = discussions.slice(0, visibleCount)
  const hasMore = visibleCount < discussions.length

  return (
    <div className="flex flex-col gap-4">
      {visibleDiscussions.map((d) => (
        <DiscussionCard key={d.id} d={d} />
      ))}
      
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 8)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <Plus className="size-4" aria-hidden />
            Load More Discussions
          </button>
        </div>
      )}
    </div>
  )
}
