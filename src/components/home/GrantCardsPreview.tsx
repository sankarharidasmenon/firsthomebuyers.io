'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { 
  SchemeRow, 
  SkeletonRow, 
  toCard, 
  type Scheme,
  RegionFlag,
  GROUP_ORDER,
  REGION_LABELS,
  ALL_TAB,
  CategoryFilter,
  schemeCategory,
  type CategoryFilterValue
} from './GrantCards'

export const GrantCardsPreview = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading')
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB)
  const [typeFilter, setTypeFilter] = useState<CategoryFilterValue>('all')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/schemes/featured?limit=60', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      
      const list: Scheme[] = (data.schemes ?? []).map(toCard)
      if (list.length === 0) { 
        setSchemes([])
        setStatus('empty')
        return 
      }
      
      setSchemes(list)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => { 
    load() 
  }, [load])

  /* Apply the type filter before grouping so the region tabs, their counts and
     the cards all reflect the current selection. */
  const filtered = typeFilter === 'all'
    ? schemes
    : schemes.filter(s => schemeCategory(s) === typeFilter)

  // Group and filter duplicates using exact same logic as /schemes
  const grouped: Record<string, Scheme[]> = {}
  for (const s of filtered) {
    if (!grouped[s.flagCode]) grouped[s.flagCode] = []
    grouped[s.flagCode].push(s)
  }
  
  for (const code of Object.keys(grouped)) {
    const seenTitles = new Set<string>()
    const seenDescriptions = new Set<string>()
    grouped[code] = grouped[code].filter(s => {
      const titleKey = s.heroTitle.toLowerCase().trim()
      if (seenTitles.has(titleKey)) return false
      seenTitles.add(titleKey)
      
      if (s.description) {
        const descKey = s.description.toLowerCase().trim()
        if (seenDescriptions.has(descKey)) return false
        seenDescriptions.add(descKey)
      }
      return true
    })
  }

  const regionGroups = GROUP_ORDER.filter(code => (grouped[code]?.length ?? 0) > 0)
  /* Concatenate the already-deduped per-region lists so "All" matches exactly
     what the individual tabs show. */
  const allTiles = regionGroups.flatMap(code => grouped[code])
  const groups = regionGroups.length > 0 ? [ALL_TAB, ...regionGroups] : []

  useEffect(() => {
    if (groups.length > 0 && !groups.includes(activeTab)) {
      setActiveTab(groups[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.join(',')])

  const activeTiles = activeTab === ALL_TAB ? allTiles : (grouped[activeTab] ?? [])

  return (
    <section className="pt-10 md:pt-12 lg:pt-14 pb-16 md:pb-20 lg:pb-24 w-full bg-[var(--color-fn-yellow-pale)] dark:bg-background border-t border-border/20">
      <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 md:mb-12 gap-6 md:gap-10">
          <div className="max-w-2xl">
            <h2 className="text-foreground tracking-[-0.02em] leading-[1.1] mb-3 md:mb-4" style={{ fontSize: 'clamp(24px, 3.2vw, 40px)', fontWeight: 500 }}>
             Australian Grants &amp; Schemes 2026
            </h2>
            <p className="text-[15px] md:text-base font-light text-muted-foreground leading-relaxed">
              {/* Explore the federal and state government grants, schemes, and concessions available to help you buy your first home sooner. */}
              FirstNest scans all available federal and state grants in real-time and shows you exactly which ones apply to your situation no jargon, no guesswork.
            </p>
          </div>
          {/* <Link
            href="/schemes"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            View All Grants &amp; Schemes <ArrowRight className="w-4 h-4" />
          </Link> */}
        </div>

        {status === 'loading' && (
          <div className="animate-in fade-in duration-500">
            <div 
              className="flex flex-nowrap md:flex-wrap gap-2.5 md:gap-x-3 md:gap-y-3 mb-8 md:mb-10 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {[100, 120, 90, 95, 80].map((w, i) => (
                <div key={i} className="shrink-0 h-[44px] rounded-full bg-muted animate-pulse" style={{ width: w }} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-12 px-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <p className="text-muted-foreground text-sm mb-4">We couldn&apos;t load the grants preview right now.</p>
            <button 
              onClick={load} 
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {status === 'empty' && (
          <div className="py-12 px-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <p className="text-foreground font-medium mb-1">No government schemes are available yet.</p>
            <p className="text-muted-foreground text-sm">Please check back soon.</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="animate-in fade-in duration-500">
            {/* Filter Chips */}
            <div
              className="flex flex-nowrap md:flex-wrap gap-2.5 md:gap-x-3 md:gap-y-3 mb-1 md:mb-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {groups.map(code => (
                <button
                  key={code}
                  type="button"
                  className={`
                    shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[44px]
                    ${code === activeTab
                      ? 'bg-foreground text-background shadow-md border border-transparent'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40'}
                  `}
                  onClick={() => setActiveTab(code)}
                >
                  {code !== ALL_TAB && <RegionFlag code={code} />}
                  {code === ALL_TAB ? 'All' : REGION_LABELS[code] ?? code}
                  <span className={`text-[11px] font-normal ml-0.5 ${code === activeTab ? 'opacity-80' : 'opacity-60'}`}>
                    {code === ALL_TAB ? allTiles.length : grouped[code].length}
                  </span>
                </button>
              ))}
            </div>

            {/* Type filter — sits under the region tabs, right-aligned */}
            <div className="mb-6 md:mb-8">
              <CategoryFilter value={typeFilter} onChange={setTypeFilter} />
            </div>

            {/* Scheme Cards */}
            {groups.length === 0 ? (
              <div className="py-12 px-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                <p className="text-foreground font-medium mb-1">No matching schemes.</p>
                <p className="text-muted-foreground text-sm">Try a different filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeTiles.map((s, i) => (
                  <SchemeRow key={`${activeTab}-${i}`} s={s} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
