'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Clock, ArrowRight, Search, Sparkles, X } from 'lucide-react'
import { MOCK_ARTICLES, ALL_CATEGORIES, type ArticleCategory } from '@/lib/mockArticles'

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  Grants:              'bg-fn-yellow-light text-fn-yellow-deep border border-fn-yellow-deep/30',
  'Buying Strategy':   'bg-fn-info-light text-fn-info border border-fn-info/20',
  'Property Risk':     'bg-fn-error-light text-fn-error border border-fn-error/20',
  Suburbs:             'bg-[#F0EDFF] text-[#7C3AED] border border-[#7C3AED]/20',
  'Mortgage Readiness':'bg-fn-success-light text-fn-success border border-fn-success/20',
}

// Soft Australian editorial card backgrounds — cycles by article id
const CARD_BG = [
  'bg-[#FDFAF4] border-[#E8E0CC]',  // warm ivory
  'bg-[#F3F7F2] border-[#DAE6D6]',  // muted sage
  'bg-[#F2F5F8] border-[#D6E1EC]',  // coastal blue-grey
  'bg-[#FBF8F0] border-[#EDE4CE]',  // warm cream
  'bg-[#F0F5F2] border-[#D2E6DA]',  // pale eucalyptus
  'bg-[#FAF6EE] border-[#E4DAC4]',  // soft sandstone
]

export default function ArticlesPageContent() {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const featuredArticle = MOCK_ARTICLES.find((a) => a.featured)!
  const gridArticles    = MOCK_ARTICLES.filter((a) => !a.featured)

  const filteredGrid = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return gridArticles.filter((a) => {
      const matchesCategory = activeCategory === 'All' || a.category === activeCategory
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [gridArticles, activeCategory, searchQuery])

  const hasActiveFilter = activeCategory !== 'All' || searchQuery.trim() !== ''

  return (
    <div className="min-h-screen bg-[#FFFEF0]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFFEF0] via-[#FFF9D6] to-[#FFFEF0] border-b border-fn-yellow-deep/10">
        {/* Background depth — three layered glows */}
        <div className="absolute -right-32 -top-32 w-[420px] h-[420px] rounded-full bg-fn-yellow opacity-[0.07] blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-0 w-56 h-56 rounded-full bg-fn-yellow opacity-[0.05] blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-64 h-40 rounded-full bg-fn-yellow-deep opacity-[0.04] blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* ── Left: text ── */}
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white border border-fn-yellow-deep/30 text-fn-navy-mid shadow-sm mb-3 sm:mb-5 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-fn-yellow-deep shrink-0" />
                AI-assisted education · Australia-focused · Plain English
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-fn-navy leading-[1.05] sm:leading-[1.1] tracking-tight mb-2 sm:mb-3">
                First-home buyer insights,{' '}
                <span className="text-fn-yellow-deep">simplified.</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-500 leading-relaxed">
                Practical guides on grants, borrowing power, property risks, and smarter buying
                decisions — written for Australians making the biggest financial decision of their lives.
              </p>
            </div>

            {/* ── Right: editorial card stack — desktop only ── */}
            <div className="hidden lg:flex flex-col gap-3">

              {/* Main featured article preview card */}
              <Link
                href={`/articles/${featuredArticle.slug}`}
                className="group block rounded-3xl bg-white shadow-md border border-gray-100 overflow-hidden hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-fn-navy/10 group-hover:bg-transparent transition-colors duration-300" />
                  <div className="absolute top-3 left-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm ${CATEGORY_COLORS[featuredArticle.category]}`}>
                      {featuredArticle.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-fn-navy font-bold text-sm leading-snug line-clamp-2 group-hover:text-fn-yellow-deep transition-colors duration-200">
                      {featuredArticle.title}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <Clock className="w-3 h-3" />
                      {featuredArticle.readTime} min read · Featured guide
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-fn-yellow-deep shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              </Link>

              {/* Bottom row: mini article card + stats card */}
              <div className="grid grid-cols-2 gap-3">

                {/* Mini article preview — second non-featured article */}
                <Link
                  href={`/articles/${gridArticles[1].slug}`}
                  className="group relative rounded-2xl overflow-hidden flex flex-col justify-between gap-0 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[160px]"
                >
                  {/* Background image */}
                  <img
                    src={gridArticles[1].image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Dark scrim for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-fn-navy/80 via-fn-navy/40 to-fn-navy/10" />

                  {/* Content over image */}
                  <div className="relative p-4 flex flex-col justify-between h-full gap-0">
                    <span className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${CATEGORY_COLORS[gridArticles[1].category]}`}>
                      {gridArticles[1].category}
                    </span>
                    <div className="mt-auto flex flex-col gap-1">
                      <p className="text-white text-xs font-semibold leading-snug line-clamp-2 group-hover:text-fn-yellow transition-colors duration-200">
                        {gridArticles[1].title}
                      </p>
                      <span className="flex items-center gap-1 text-[11px] text-white/60 font-medium">
                        <Clock className="w-3 h-3" />
                        {gridArticles[1].readTime} min read
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Stats card */}
                <div className="rounded-2xl bg-fn-navy p-4 flex flex-col justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-fn-yellow">
                    Content Hub
                  </p>
                  <div className="flex flex-col gap-3 mt-3">
                    <div>
                      <p className="text-3xl font-extrabold text-white leading-none">9</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">guides published</p>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-xl font-bold text-white leading-none">5</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">topics covered</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-12 flex flex-col gap-10">

        {/* ── Featured Article ── */}
        <section>
          <Link
            href={`/articles/${featuredArticle.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-fn-navy text-white block hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            {/* Featured Guide label */}
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-fn-yellow text-fn-navy text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                Featured Guide
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left — image, full height */}
              <div className="relative h-64 md:h-auto min-h-[280px]">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-fn-navy/40" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                    {featuredArticle.category}
                  </span>
                </div>
              </div>

              {/* Right — content on navy */}
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <p className="text-fn-yellow text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fn-yellow inline-block" />
                    In-Depth Guide
                  </p>
                  <h3 className="text-2xl font-extrabold text-white leading-tight mb-4">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredArticle.readTime} min read
                  </div>
                  <span className="flex items-center gap-2 bg-fn-yellow text-fn-navy font-bold text-sm px-5 py-2.5 rounded-full group-hover:bg-fn-yellow-dark transition-all duration-200">
                    Read article
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Search + Filter + Grid ── */}
        <section className="flex flex-col gap-5">

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grants, suburbs, deposits, or property risks…"
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-fn-grey-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fn-yellow/40 focus:border-fn-yellow-deep transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-fn-navy hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 ${
                activeCategory === 'All'
                  ? 'bg-fn-navy text-white border-fn-navy shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-fn-navy hover:text-fn-navy'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? 'All' : cat)}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-fn-navy text-white border-fn-navy shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-fn-navy hover:text-fn-navy'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count / empty state */}
          {filteredGrid.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-fn-grey-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-fn-grey-700 font-medium text-sm">No articles found</p>
              <p className="text-gray-400 text-xs max-w-xs">
                Try a different keyword or{' '}
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                  className="text-fn-navy-light underline underline-offset-2 font-medium"
                >
                  clear all filters
                </button>
              </p>
            </div>
          ) : (
            <>
              {hasActiveFilter && (
                <p className="text-xs text-gray-400 font-medium -mb-1">
                  {filteredGrid.length} article{filteredGrid.length !== 1 ? 's' : ''} found
                </p>
              )}
              {/* Article Grid — 3 cols desktop, 2 tablet, 1 mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGrid.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className={`group flex flex-col rounded-3xl overflow-hidden border shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${CARD_BG[(Number(article.id) - 2) % CARD_BG.length]}`}
                  >
                    {/* Real photo */}
                    <div className="relative h-48 overflow-hidden shrink-0">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-fn-navy/5 group-hover:bg-transparent transition-colors duration-300" />
                      {/* Category pill over image */}
                      <div className="absolute top-3 left-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm ${CATEGORY_COLORS[article.category]}`}>
                          {article.category}
                        </span>
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="flex flex-col flex-1 p-5 justify-between gap-0">
                      <div className="flex flex-col gap-2 mb-4">
                        <h3 className="font-bold text-fn-navy text-[15px] leading-snug group-hover:text-fn-yellow-deep transition-colors duration-200">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                          <Clock className="w-3 h-3" />
                          {article.readTime} min read
                        </span>
                        <span className="text-xs font-bold text-fn-navy-light group-hover:text-fn-yellow-deep transition-colors duration-200 flex items-center gap-1">
                          Read more
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── CTA Strip ── */}
        <section>
          <div className="rounded-3xl bg-gradient-to-br from-fn-yellow-light to-fn-yellow-pale border border-fn-yellow-deep/20 p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-fn-yellow-deep mb-2">
                AI-Powered Guidance
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold text-fn-navy leading-snug">
                Want personalised buying guidance?
              </h2>
              <p className="text-gray-500 text-sm mt-2 max-w-md">
                Skip the generic articles. Ask FirstNest AI a specific question about your income,
                savings, or target suburb — and get an answer built around your situation.
              </p>
            </div>
            <Link
              href="/ai-assistant"
              className="shrink-0 inline-flex items-center gap-2 bg-fn-navy text-fn-yellow font-bold rounded-full px-8 py-4 text-sm hover:bg-fn-navy-mid transition-all duration-200 shadow-md whitespace-nowrap"
            >
              Ask FirstNest AI
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>

      {/* Compliance disclaimer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-10">
        <p className="text-xs text-gray-300 text-center">
          FirstNest AI provides general information only. This is not financial, legal, or taxation advice.
          Always consult a licensed financial adviser, mortgage broker, and conveyancer before making purchasing decisions.
        </p>
      </div>

    </div>
  )
}
