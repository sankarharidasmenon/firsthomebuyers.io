import { PenLine, Landmark, Users } from 'lucide-react'
import type { Discussion } from '@/lib/forumsData'
import { TrendingList } from './TrendingList'
import { CommunityGuidelines } from './CommunityGuidelines'
import { SidebarSection } from './SidebarSection'
import Link from 'next/link'

interface Props {
  currentCategory: { label: string; icon: any }
  relatedDiscussions: Discussion[]
}

export function SingleDiscussionSidebar({ currentCategory, relatedDiscussions }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {/* Start a discussion CTA */}
      <section className="rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/40 p-7 shadow-sm transition-all hover:shadow-md dark:border-border dark:from-surface dark:to-surface/50">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">Join the conversation</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Got a similar question? Or an experience to share? The community is here to help.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:shadow"
        >
          <PenLine className="size-4" aria-hidden />
          Start a Discussion
        </button>
      </section>

      {/* Community stats */}
      <SidebarSection title="Community Stats" icon={Users}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold tracking-tight text-foreground">12k+</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">Members</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold tracking-tight text-foreground">50+</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">Daily posts</p>
          </div>
        </div>
      </SidebarSection>

      <TrendingList title="Similar Discussions" discussions={relatedDiscussions} emphasis="medium" />

      {/* Related Grants Placeholder */}
      <SidebarSection title="Related Grants & Schemes" icon={Landmark}>
        <ul className="flex flex-col gap-2">
          <li>
            <Link href="/articles/first-home-owner-grant-explained" className="group flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">First Home Owner Grant</span>
              <span className="text-xs text-muted-foreground">Article</span>
            </Link>
          </li>
          <li>
            <Link href="/articles/first-home-guarantee-scheme" className="group flex items-center justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">First Home Guarantee</span>
              <span className="text-xs text-muted-foreground">Scheme</span>
            </Link>
          </li>
        </ul>
      </SidebarSection>

      <CommunityGuidelines />
    </div>
  )
}
