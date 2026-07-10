import Link from 'next/link'
import { PenLine, Layers, Activity } from 'lucide-react'
import {
  getTrending, getMostHelpful, CATEGORIES, RECENT_ACTIVITY, formatCount,
} from '@/lib/forumsData'
import { ForumIcon } from './forumIcons'
import { SidebarSection } from './SidebarSection'
import { TrendingList } from './TrendingList'
import { CommunityGuidelines } from './CommunityGuidelines'

export function DiscussionSidebar() {
  const trending = getTrending(4)
  const helpful = getMostHelpful(3)
  const popularCategories = CATEGORIES.filter((c) => c.id !== 'all')

  return (
    <div className="flex flex-col gap-8 lg:sticky lg:top-28">
      {/* Start a discussion */}
      <section id="start" className="rounded-[20px] border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/40 p-6 shadow-md backdrop-blur-md dark:border-border dark:from-surface dark:to-surface/50 scroll-mt-28">
        <h3 className="text-sm font-semibold text-foreground">Have a question or a story?</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Share your experience or ask the community — thousands of Australian first home buyers are here to help.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PenLine className="size-4" aria-hidden />
          Start a Discussion
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Sign in to post — it&apos;s free.</p>
      </section>

      <TrendingList title="Trending Discussions" discussions={trending} emphasis="medium" />
      <TrendingList title="Most Helpful This Week" discussions={helpful} />
      <CommunityGuidelines />

      {/* Popular categories */}
      <SidebarSection title="Popular Categories" icon={Layers}>
        <ul className="flex flex-col">
          {popularCategories.map((c) => (
            <li key={c.id}>
              <a href="#discussions" className="group flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-accent">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ForumIcon icon={c.icon} className="size-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{c.title}</span>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{formatCount(c.count)}</span>
              </a>
            </li>
          ))}
        </ul>
      </SidebarSection>

      {/* Recent activity */}
      <SidebarSection title="Recent Activity" icon={Activity}>
        <ul className="flex flex-col gap-3">
          {RECENT_ACTIVITY.map((a) => (
            <li key={a.id} className="text-sm leading-relaxed">
              <Link href={`/forums/${a.slug}`} className="group block rounded-lg px-1 py-1 transition-colors hover:bg-accent">
                <span className="font-medium text-foreground">{a.who}</span>{' '}
                <span className="text-muted-foreground">{a.action}</span>{' '}
                <span className="text-foreground group-hover:underline">{a.target}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{a.timeAgo}</span>
              </Link>
            </li>
          ))}
        </ul>
      </SidebarSection>

    </div>
  )
}
