'use client'

import { useState } from 'react'
import {
  getDiscussions, getFeaturedDiscussion, CATEGORIES, TOPICS, formatCount, type CategoryId,
} from '@/lib/forumsData'
import { CategoryNavigation } from './CategoryNavigation'
import { FeaturedDiscussion } from './FeaturedDiscussion'
import { DiscussionFeed } from './DiscussionFeed'
import { DiscussionSidebar } from './DiscussionSidebar'
import { TopicCard } from './TopicCard'
import { SectionHeading } from './SectionHeading'

/**
 * Client shell that owns the selected category and lays out the 12-column grid:
 * feed (8) + sticky sidebar (4). Filtering is dummy/local only.
 */
export function ForumsExperience() {
  const [active, setActive] = useState<CategoryId>('all')
  const featured = getFeaturedDiscussion()
  const discussions = getDiscussions(active)
  const activeMeta = CATEGORIES.find((c) => c.id === active)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Featured Section (Warm Cream) */}
      <section className="bg-accent/20 dark:bg-surface py-4 sm:py-6">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <FeaturedDiscussion d={featured} />
        </div>
      </section>

      {/* Category Nav (Sticky) */}
      <CategoryNavigation active={active} onChange={setActive} />

      {/* Popular Topics (Warm Cream) */}
      <section className="bg-accent/30 dark:bg-card py-6 sm:py-8 border-b border-border">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <SectionHeading title="Popular Topics" meta="Browse by what buyers ask about most" />
          {/* Mobile carousel, Desktop grid */}
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {TOPICS.map((t) => (
              <div key={t.id} className="w-[260px] shrink-0 sm:w-auto">
                <TopicCard topic={t} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Feed & Sidebar (White) */}
      <section className="bg-background py-8 flex-1">
        <div id="discussions" className="mx-auto max-w-6xl scroll-mt-28 px-5 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Feed */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div key={active} className="animate-in fade-in duration-300">
                <section>
                  <SectionHeading
                    title={active === 'all' ? 'Latest Discussions' : activeMeta?.title ?? 'Discussions'}
                    meta={`${formatCount(discussions.length)} ${discussions.length === 1 ? 'discussion' : 'discussions'}`}
                  />
                  <div className="mt-5">
                    <DiscussionFeed discussions={discussions} />
                  </div>
                </section>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <DiscussionSidebar />
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
