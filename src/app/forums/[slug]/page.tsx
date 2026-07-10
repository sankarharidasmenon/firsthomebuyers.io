import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronRight, Clock, Link2 } from 'lucide-react'
import { getDiscussionBySlug, getTrending, getThread, getReplyCount, CATEGORY_META } from '@/lib/forumsData'
import { Avatar } from '@/components/forums/Avatar'
import { DiscussionStats } from '@/components/forums/DiscussionStats'
import { CategoryBadge, StatusBadges } from '@/components/forums/ForumBadge'
import { ReplyCard } from '@/components/forums/ReplyCard'
import { ReplyComposer } from '@/components/forums/ReplyComposer'
import { DiscussionCard } from '@/components/forums/DiscussionCard'
import { SectionHeading } from '@/components/forums/SectionHeading'
import { SingleDiscussionSidebar } from '@/components/forums/SingleDiscussionSidebar'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const d = getDiscussionBySlug(slug)
  if (!d) return { title: 'Discussion — FirstNest Community' }
  return { title: `${d.title} — FirstNest Community`, description: d.preview }
}

export default async function DiscussionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const d = getDiscussionBySlug(slug)
  if (!d) notFound()

  const meta = CATEGORY_META[d.category]
  const related = getTrending(4).filter((x) => x.slug !== d.slug).slice(0, 3)
  const thread = getThread(d)
  const replyCount = getReplyCount(d)

  return (
    <main className="bg-background pt-14 lg:pt-18">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] lg:gap-12 xl:gap-16">
          
          {/* Main Discussion Area (70%) */}
          <div className="min-w-0">
            {/* Back + breadcrumb */}
            <Link href="/forums" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" aria-hidden />
              Back to community
            </Link>

            <nav className="mt-4 flex items-center gap-1.5 overflow-x-auto text-xs text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Breadcrumb">
              <Link href="/forums" className="shrink-0 transition-colors hover:text-foreground">Community</Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <Link href="/forums" className="shrink-0 transition-colors hover:text-foreground">{meta.label}</Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate text-foreground">{d.title}</span>
            </nav>

            {/* Discussion Content */}
            <article className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={d.category} />
                <StatusBadges d={d} />
              </div>

              <h1 className="mt-5 text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {d.title}
              </h1>

              <div className="mt-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar initials={d.author.initials} size="lg" />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {d.author.name}
                      {d.author.role && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 align-middle text-[0.6875rem] font-medium text-secondary-foreground">
                          {d.author.role}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden />
                      {d.author.location} · {d.createdAgo}
                    </p>
                  </div>
                </div>
                <DiscussionStats replies={replyCount} views={d.views} likes={d.likes} />
              </div>

              {/* Body */}
              <div className="mt-8 max-w-[70ch] space-y-6 text-[1.125rem] leading-[1.8] text-foreground/90">
                {d.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {d.bullets && (
                  <ul className="list-disc space-y-2.5 pl-6 marker:text-muted-foreground">
                    {d.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Helpful links */}
              {d.links && d.links.length > 0 && (
                <div className="mt-10 max-w-[70ch] rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground">Helpful links</h2>
                  <ul className="mt-4 flex flex-col gap-3">
                    {d.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
                        >
                          <Link2 className="size-4 text-muted-foreground" aria-hidden />
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              <div className="mt-8 flex flex-wrap gap-2">
                {d.tags.map((t) => (
                  <span key={t} className="rounded-full border border-border bg-accent/50 px-3 py-1 text-[0.8125rem] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            </article>

            {/* Replies */}
            <section className="mt-16">
              <SectionHeading title={`${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}`} meta="Helpful answers first" />
              <div className="mt-8 flex flex-col gap-6">
                {thread.map((r) => (
                  <ReplyCard key={r.id} reply={r} originalPoster={d.author.name} />
                ))}
              </div>
            </section>

            {/* Composer */}
            <section className="mt-12">
              <ReplyComposer />
            </section>

            {/* Continue reading */}
            <section className="mt-20">
              <SectionHeading title="Continue reading" meta="More from the community" />
              <div className="mt-8 flex flex-col gap-5 sm:grid sm:grid-cols-2">
                {related.map((r) => (
                  <DiscussionCard key={r.id} d={r} />
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Right Sidebar (30%) */}
          <aside className="lg:sticky lg:top-28">
            <SingleDiscussionSidebar currentCategory={meta} relatedDiscussions={related} />
          </aside>
          
        </div>
      </div>
    </main>
  )
}
