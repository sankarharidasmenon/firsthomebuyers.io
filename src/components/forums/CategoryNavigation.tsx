'use client'

import { CATEGORIES, formatCount, type CategoryId } from '@/lib/forumsData'
import { ForumIcon } from './forumIcons'
import { cn } from '@/lib/utils'

interface Props {
  active: CategoryId
  onChange: (id: CategoryId) => void
}

/**
 * Sticky category navigation. Desktop: horizontal row. Mobile: horizontally
 * scrollable chips. Active chip carries an animated indicator (via layout).
 */
export function CategoryNavigation({ active, onChange }: Props) {
  return (
    <nav
      className="sticky top-14 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:top-18"
      aria-label="Discussion categories"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const isActive = active === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={isActive}
                className={cn(
                  'group inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'border-transparent bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-muted-foreground shadow-sm hover:-translate-y-1 hover:border-foreground/20 hover:text-foreground hover:shadow-md',
                )}
              >
                <ForumIcon icon={c.icon} className="size-4" />
                <span className="whitespace-nowrap">{c.title}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums',
                    isActive ? 'bg-background/20 text-primary-foreground' : 'bg-accent text-muted-foreground group-hover:bg-accent-foreground/10',
                  )}
                >
                  {formatCount(c.count)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
