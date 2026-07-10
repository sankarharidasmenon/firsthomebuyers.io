import Link from 'next/link'
import { ArrowRight, Clock, MessageSquare, Eye, ThumbsUp } from 'lucide-react'
import type { Discussion } from '@/lib/forumsData'
import { Avatar } from './Avatar'
import { CategoryBadge } from './ForumBadge'

/** A single discussion card redesigned as a premium editorial preview. */
export function DiscussionCard({ d }: { d: Discussion }) {
  return (
    <Link
      href={`/forums/${d.slug}`}
      className="group block rounded-2xl border border-border bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/50 hover:shadow-md dark:from-card dark:to-card/80 dark:hover:border-border"
    >
      <div className="flex flex-col gap-4">
        {/* Top: Category & Status */}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={d.category} />
          {d.solved && (
            <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[0.6875rem] font-semibold text-success-foreground">
              Resolved
            </span>
          )}
        </div>

        {/* Content: Title & Preview */}
        <div>
          <h3 className="text-pretty text-[1.125rem] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground/80 line-clamp-2">
            {d.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{d.preview}</p>
        </div>

        {/* Author & Time */}
        <div className="mt-1 flex items-center gap-3">
          <Avatar initials={d.author.initials} size="sm" />
          <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-foreground">{d.author.name}</span>
            <span className="text-muted-foreground" aria-hidden>·</span>
            <span className="text-muted-foreground">{d.author.location}</span>
            <span className="text-muted-foreground" aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {d.createdAgo}
            </span>
          </div>
        </div>

        {/* Bottom: Stats & CTA */}
        <div className="flex flex-row items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5" title="Replies">
              <MessageSquare className="size-3.5" aria-hidden />
              {d.replies}
            </span>
            <span className="flex items-center gap-1.5" title="Views">
              <Eye className="size-3.5" aria-hidden />
              {d.views}
            </span>
            <span className="flex items-center gap-1.5" title="Likes">
              <ThumbsUp className="size-3.5" aria-hidden />
              {d.likes}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-all">
            Read Discussion
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
