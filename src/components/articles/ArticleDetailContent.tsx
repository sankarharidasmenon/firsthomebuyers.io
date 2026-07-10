'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  ArrowRight,
  Info,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import type { Article, ContentBlock, ArticleCategory } from '@/lib/mockArticles'

// ── helpers ────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getTocHeadings(content: ContentBlock[]) {
  return content.filter(
    (b): b is Extract<ContentBlock, { type: 'heading'; level: 2 }> =>
      b.type === 'heading' && b.level === 2,
  )
}

// ── category pill styles ──────────────────────────────────────────────────

const CATEGORY_PILL: Record<ArticleCategory, string> = {
  Grants: 'bg-fn-yellow-light text-fn-yellow-deep border border-fn-yellow-deep/30',
  'Buying Strategy': 'bg-fn-info-light text-fn-info border border-fn-info/20',
  'Property Risk': 'bg-fn-error-light text-fn-error border border-fn-error/20',
  Suburbs: 'bg-[#F0EDFF] text-[#7C3AED] border border-[#7C3AED]/20',
  'Mortgage Readiness': 'bg-fn-yellow-light text-fn-yellow-deep border border-fn-yellow-deep/30',
}

// ── content block renderer ────────────────────────────────────────────────

function BlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={index} className="text-fn-grey-700 dark:text-foreground/90 leading-[1.85] text-[17px]">
          {block.text}
        </p>
      )

    case 'heading':
      if (block.level === 2) {
        const id = slugify(block.text)
        return (
          <h2
            key={index}
            id={id}
            data-heading
            className="text-2xl font-bold text-fn-navy dark:text-foreground mt-2 mb-0 scroll-mt-24"
          >
            {block.text}
          </h2>
        )
      }
      return (
        <h3
          key={index}
          className="text-lg font-semibold text-fn-navy-mid dark:text-foreground mt-1 mb-0"
        >
          {block.text}
        </h3>
      )

    case 'list':
      if (block.ordered) {
        return (
          <ol key={index} className="list-decimal list-outside pl-5 flex flex-col gap-2">
            {block.items.map((item, i) => (
              <li key={i} className="text-fn-grey-700 dark:text-foreground/90 leading-relaxed text-[17px] pl-1">
                {item}
              </li>
            ))}
          </ol>
        )
      }
      return (
        <ul key={index} className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-fn-grey-700 dark:text-foreground/90 leading-relaxed text-[17px]">
              <CheckCircle2 className="w-4 h-4 text-fn-yellow-deep shrink-0 mt-[3px]" strokeWidth={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-fn-yellow pl-6 py-1 flex flex-col gap-2"
        >
          <p className="text-fn-navy-mid dark:text-foreground text-lg font-medium leading-relaxed italic">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.attribution && (
            <cite className="text-sm text-fn-grey-500 dark:text-muted-foreground not-italic font-medium">
              — {block.attribution}
            </cite>
          )}
        </blockquote>
      )

    case 'callout': {
      const calloutConfig = {
        info: {
          icon: Info,
          container: 'bg-fn-info-light border-fn-info/30',
          iconColor: 'text-fn-info',
          titleColor: 'text-fn-info',
        },
        warning: {
          icon: AlertTriangle,
          container: 'bg-fn-warning-light border-fn-warning/30',
          iconColor: 'text-fn-warning',
          titleColor: 'text-fn-warning',
        },
        tip: {
          icon: Lightbulb,
          container: 'bg-fn-yellow-light border-fn-yellow-deep/30',
          iconColor: 'text-fn-yellow-deep',
          titleColor: 'text-fn-yellow-deep',
        },
      }
      const cfg = calloutConfig[block.variant]
      const Icon = cfg.icon
      return (
        <div
          key={index}
          className={`rounded-2xl border p-5 flex gap-4 ${cfg.container}`}
        >
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} strokeWidth={2} />
          <div>
            <p className={`font-bold text-sm mb-1 ${cfg.titleColor}`}>{block.title}</p>
            <p className="text-fn-grey-700 dark:text-fn-grey-900 text-sm leading-relaxed">{block.body}</p>
          </div>
        </div>
      )
    }

    case 'ai-insight':
      return (
        <div
          key={index}
          className="rounded-2xl bg-fn-navy dark:bg-card border border-fn-navy-mid dark:border-border p-6 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fn-yellow shrink-0" strokeWidth={2} />
            <p className="text-xs font-bold uppercase tracking-widest text-fn-yellow">
              AI Insight — {block.heading}
            </p>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{block.body}</p>
        </div>
      )

    case 'grant':
      return (
        <div
          key={index}
          className="rounded-2xl bg-fn-yellow-light border-l-4 border-fn-yellow p-6 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-fn-yellow-deep">
              {block.status === 'eligible' ? 'Eligible Scheme' : 'Conditional Eligibility'}
            </p>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${block.status === 'eligible'
                  ? 'bg-fn-success-light text-fn-success'
                  : 'bg-fn-warning-light text-fn-warning'
                }`}
            >
              {block.status === 'eligible' ? 'Eligible' : 'Conditional'}
            </span>
          </div>
          <p className="text-fn-navy font-bold text-lg leading-snug">{block.name}</p>
          <p className="text-4xl font-extrabold text-fn-navy leading-none">{block.value}</p>
          <p className="text-fn-grey-500 text-sm leading-relaxed mt-1">{block.note}</p>
        </div>
      )

    default:
      return null
  }
}

// ── table of contents sidebar ─────────────────────────────────────────────

function TableOfContents({
  headings,
  activeId,
}: {
  headings: Array<{ text: string }>
  activeId: string
}) {
  const handleClick = (text: string) => {
    const id = slugify(text)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold uppercase tracking-widest text-fn-grey-500 dark:text-muted-foreground mb-3 px-2">
        Contents
      </p>
      {headings.map(({ text }) => {
        const id = slugify(text)
        const active = activeId === id
        return (
          <button
            key={id}
            onClick={() => handleClick(text)}
            className={`text-left text-sm px-3 py-2 rounded-lg transition-all duration-200 leading-snug ${active
                ? 'bg-fn-yellow-light text-fn-navy font-semibold border-l-2 border-fn-yellow'
                : 'text-fn-grey-500 dark:text-muted-foreground hover:text-fn-navy dark:hover:text-foreground hover:bg-fn-grey-50 dark:hover:bg-surface'
              }`}
          >
            {text}
          </button>
        )
      })}
    </div>
  )
}

// ── related article card ──────────────────────────────────────────────────

function RelatedCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group bg-fn-yellow-light border border-fn-yellow/30 hover:border-fn-yellow/60 hover:shadow-lg rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 flex flex-col"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden shrink-0">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
          <span className="bg-fn-yellow text-fn-navy text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-fn-navy font-bold text-sm sm:text-base leading-snug mb-1.5 sm:mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3 sm:mb-4">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-fn-yellow/30 mt-auto">
          <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 text-xs">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            {article.readTime} min read
          </div>
          <span className="text-fn-navy font-semibold text-xs flex items-center gap-1 group-hover:text-fn-yellow-deep transition-colors shrink-0">
            Read <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── main component ────────────────────────────────────────────────────────

export default function ArticleDetailContent({
  article,
  relatedArticles,
}: {
  article: Article
  relatedArticles: Article[]
}) {
  const [activeId, setActiveId] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const tocHeadings = getTocHeadings(article.content)

  // Scroll-based active heading tracker.
  // IntersectionObserver misses "scrolled past" events; a scroll listener
  // reading getBoundingClientRect is simpler and fully reliable for ToC.
  useEffect(() => {
    const headingEls = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('[data-heading]') ?? []
    )
    if (headingEls.length === 0) return

    // A heading is "active" once its top has crossed this line below the viewport top.
    // 100px = navbar (64px) + comfortable dead zone so the highlight leads the read.
    const THRESHOLD = 100

    const update = () => {
      let current = headingEls[0].id
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top <= THRESHOLD) {
          current = el.id
        } else {
          break // headings are in DOM order, safe to stop early
        }
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        update()
      })
    }

    update() // set initial active state without waiting for first scroll
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [article.slug])

  return (
    <div className="min-h-screen bg-[#FFFEF0] dark:bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Full-bleed photo */}
        <div className="relative h-64 lg:h-80 w-full overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient scrim so text below reads cleanly */}
          <div className="absolute inset-0 bg-gradient-to-b from-fn-navy/20 via-fn-navy/10 to-[#FFFEF0] dark:to-background" />
        </div>

        {/* Text block sitting below the image, on the page background */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-5 pb-3 lg:pb-4">
          {/* Breadcrumb */}
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm font-medium text-fn-grey-500 dark:text-muted-foreground hover:text-fn-navy dark:hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Articles
          </Link>

          {/* Mirror the body grid so title/excerpt align with the article content column */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 xl:gap-16">
            {/* Spacer — desktop only, holds the ToC column width */}
            <div className="hidden lg:block" />

            {/* Title + meta — occupies the same column as the article body */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center flex-wrap gap-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_PILL[article.category]}`}>
                  {article.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-fn-grey-500 dark:text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime} min read
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-fn-navy dark:text-foreground leading-[1.15] tracking-tight">
                {article.title}
              </h1>
              <p className="text-fn-grey-500 dark:text-muted-foreground text-base lg:text-lg leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body: sidebar + content ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-4 lg:pt-5 pb-10 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 xl:gap-16 items-start">

          {/* Sidebar ToC — desktop only */}
          {tocHeadings.length > 0 && (
            <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-96px)] overflow-y-auto">
              <TableOfContents headings={tocHeadings} activeId={activeId} />
            </aside>
          )}

          {/* Main content */}
          <article ref={contentRef} className="min-w-0">
            <div className="flex flex-col gap-7">
              {article.content.map((block, i) => (
                <BlockRenderer key={i} block={block} index={i} />
              ))}
            </div>

            {/* ── Ask AI CTA ── */}
            <div className="mt-14 rounded-3xl bg-fn-navy p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-fn-yellow" strokeWidth={2} />
                  <p className="text-xs font-bold uppercase tracking-widest text-fn-yellow">
                    AI-Powered Guidance
                  </p>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug mb-2">
                  Ask FirstNest AI about {article.category.toLowerCase()}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed max-w-md">
                  Get personalised answers based on your income, savings, state, and property goals — not generic information.
                </p>
              </div>
              <Link
                href="/ai-assistant"
                className="shrink-0 inline-flex items-center gap-2 bg-fn-yellow text-fn-navy font-bold rounded-full px-7 py-3.5 text-sm hover:bg-fn-yellow-dark transition-all duration-200 shadow-lg whitespace-nowrap"
              >
                Ask FirstNest AI
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </div>

      {/* ── Related Articles ── */}
      {relatedArticles.length > 0 && (
        <section className="bg-fn-yellow-pale/50 dark:bg-surface/10 border-t border-fn-yellow/20 dark:border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
              <div>
                <p className="text-fn-yellow text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest uppercase mb-1">Keep Reading</p>
                <h2 className="text-lg sm:text-2xl font-extrabold text-fn-navy dark:text-foreground">Related Articles</h2>
              </div>
              <Link
                href="/articles"
                className="text-fn-navy dark:text-foreground font-semibold text-xs sm:text-sm flex items-center gap-1 border-b-2 border-fn-yellow pb-0.5 hover:text-fn-yellow transition-colors self-start sm:self-auto shrink-0"
              >
                View all articles <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((a) => (
                <RelatedCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compliance disclaimer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <p className="text-xs text-gray-300 dark:text-muted-foreground/60 text-center">
          FirstNest AI provides general information only. This is not financial, legal, or taxation advice.
          Always consult a licensed financial adviser, mortgage broker, and conveyancer before making purchasing decisions.
        </p>
      </div>
    </div>
  )
}
