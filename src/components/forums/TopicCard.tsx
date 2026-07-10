import { ArrowRight } from 'lucide-react'
import type { Topic } from '@/lib/forumsData'
import { ForumIcon } from './forumIcons'

/** Premium popular-topic card. */
export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <a
      href="#discussions"
      className="group flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-md"
    >
      <div className="flex size-12 items-center justify-center rounded-xl border border-amber-200/40 bg-amber-50/80 shadow-[0_2px_8px_-2px_rgba(251,191,36,0.15)] text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-500">
        <ForumIcon icon={topic.icon} className="size-6" />
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">{topic.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{topic.description}</p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground truncate mr-2">
          {topic.count} discussions · {topic.lastActivity}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground transition-all">
          Browse
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </a>
  )
}
