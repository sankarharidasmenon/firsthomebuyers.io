import { Heart, Reply as ReplyIcon, CircleCheck, Star } from 'lucide-react'
import type { Reply } from '@/lib/forumsData'
import { formatCount } from '@/lib/forumsData'
import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'

interface ReplyCardProps {
  reply: Reply
  nested?: boolean
  originalPoster?: string
}

/** A single reply. Renders one nesting level of child replies. */
export function ReplyCard({ reply, nested = false, originalPoster }: ReplyCardProps) {
  const isOP = originalPoster === reply.author.name
  const isHelpful = reply.isAnswer

  return (
    <div className={cn(nested && 'mt-4 border-l-2 border-border/40 pl-4 sm:pl-6')}>
      <article
        className={cn(
          'rounded-2xl p-5 transition-all',
          isHelpful
            ? 'border border-amber-200 bg-amber-50/40 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/10'
            : isOP
              ? 'border border-primary/20 bg-card shadow-sm'
              : 'border border-border bg-card shadow-sm'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar initials={reply.author.initials} size="md" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {reply.author.name}
                {isOP && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-primary">
                    OP
                  </span>
                )}
                {reply.author.role && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.625rem] font-medium text-secondary-foreground">
                    {reply.author.role}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{reply.author.location} · {reply.timeAgo}</p>
            </div>
          </div>
          {isHelpful && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[0.6875rem] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              <Star className="size-3.5 fill-amber-500 text-amber-500" aria-hidden />
              Helpful
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-foreground/90">
          {reply.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Heart className="size-4" aria-hidden />
            <span className="tabular-nums">{formatCount(reply.likes)}</span>
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ReplyIcon className="size-4" aria-hidden />
            Reply
          </button>
        </div>
      </article>

      {reply.replies?.map((child) => (
        <ReplyCard key={child.id} reply={child} nested originalPoster={originalPoster} />
      ))}
    </div>
  )
}
