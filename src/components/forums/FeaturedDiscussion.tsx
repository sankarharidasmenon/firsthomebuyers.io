import Link from 'next/link'
import { ArrowRight, Clock, Pin, TrendingUp } from 'lucide-react'
import type { Discussion } from '@/lib/forumsData'
import { Avatar } from './Avatar'
import { DiscussionStats } from './DiscussionStats'
import { CategoryBadge } from './ForumBadge'

/** Large premium featured/pinned card at the top of the feed. */
export function FeaturedDiscussion({ d }: { d: Discussion }) {
  return (
    <Link
      href={`/forums/${d.slug}`}
      className="group relative block w-full rounded-[32px] border border-amber-200/50 dark:border-border bg-gradient-to-br from-amber-50/90 to-white/90 dark:from-surface/90 dark:to-background/90 p-8 shadow-lg shadow-amber-500/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 sm:p-10"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[0.6875rem] font-semibold text-background">
              <Pin className="size-3" aria-hidden />
              Featured
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold text-foreground">
              <TrendingUp className="size-3" aria-hidden />
              Trending
            </span>
            <CategoryBadge category={d.category} />
          </div>

          <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {d.title}
          </h2>

          <p className="mt-2 line-clamp-2 max-w-3xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            {d.preview}
          </p>
        </div>

        {/* Desktop CTA alignment */}
        <div className="hidden shrink-0 sm:block">
          <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-[0.9375rem] font-semibold text-background shadow-sm transition-all group-hover:bg-foreground/90 group-hover:shadow">
            Read Discussion
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-5">
        <div className="flex items-center gap-3">
          <Avatar initials={d.author.initials} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{d.author.name}</p>
            <p className="inline-flex items-center gap-1.5 truncate text-[0.6875rem] text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {d.author.location} · {d.createdAgo}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-6">
          <DiscussionStats replies={d.replies} views={d.views} likes={d.likes} />
          
          {/* Mobile CTA */}
          <span className="inline-flex items-center gap-1 font-semibold text-sm text-foreground sm:hidden group-hover:underline">
            Read <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
