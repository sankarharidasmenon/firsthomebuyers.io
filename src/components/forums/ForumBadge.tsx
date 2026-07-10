import type { ReactNode } from 'react'
import { Pin, Flame, CircleCheck } from 'lucide-react'
import { CATEGORY_META, type Discussion } from '@/lib/forumsData'
import { ForumIcon } from './forumIcons'
import { cn } from '@/lib/utils'

type Tone = 'category' | 'solved' | 'pinned' | 'trending'

const TONES: Record<Tone, string> = {
  category: 'border border-border bg-transparent text-muted-foreground',
  solved: 'bg-secondary text-secondary-foreground',
  pinned: 'bg-primary/12 text-foreground border border-primary/25',
  trending: 'bg-accent text-accent-foreground',
}

export function ForumBadge({ tone, icon, children }: { tone: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide',
        TONES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function CategoryBadge({ category }: { category: Discussion['category'] }) {
  const meta = CATEGORY_META[category]
  return (
    <ForumBadge tone="category" icon={<ForumIcon icon={meta.icon} className="size-3" />}>
      {meta.label}
    </ForumBadge>
  )
}

export function StatusBadges({ d }: { d: Pick<Discussion, 'pinned' | 'trending' | 'solved'> }) {
  return (
    <>
      {d.pinned && <ForumBadge tone="pinned" icon={<Pin className="size-3" />}>Pinned</ForumBadge>}
      {d.trending && <ForumBadge tone="trending" icon={<Flame className="size-3" />}>Trending</ForumBadge>}
      {d.solved && <ForumBadge tone="solved" icon={<CircleCheck className="size-3" />}>Solved</ForumBadge>}
    </>
  )
}
