'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { RotateCcw, ArrowUpRight } from 'lucide-react'

/* ── View-model ─────────────────────────────────────────────────────────── */
export interface Scheme {
  heroTitle: string
  coverageLabel: string
  typeLabel: string
  statusLabel: string
  description: string
  startDate: string
  endDate: string
  sourceWebsite: string
  officialUrl: string
  flagLabel: string
  flagCode: string
}

/* ── API types ───────────────────────────────────────────────────────────── */
export interface ApiScheme {
  scheme_name?: string | null
  type?: string | null
  status?: string | null
  short_description?: string | null
  start_date?: string | null
  end_closing_date?: string | null
  source_website?: string | null
  official_url?: string | null
  level?: string | null
  applicable_states?: string | null
}

const STATE_CODES = ['NSW', 'VIC', 'QLD', 'TAS', 'ACT', 'WA', 'SA', 'NT'] as const

export const REGION_LABELS: Record<string, string> = {
  AU: 'Federal',
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  NT: 'Northern Territory',
  QLD: 'Queensland',
  SA: 'South Australia',
  TAS: 'Tasmania',
  VIC: 'Victoria',
  WA: 'Western Australia',
}

// Mini flag SVGs — simplified 2–3 stripe representations of each state/territory flag
const FLAG_SVGS: Record<string, React.ReactNode> = {
  AU: (
    // Australian flag: dark blue with Union Jack canton + stars (simplified as blue/red cross)
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#00008B" />
      <rect width="12" height="8" fill="#003399" />
      {/* Union Jack simplified */}
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <rect x="4.5" y="0" width="3" height="8" fill="white" />
      <rect x="0" y="2.5" width="12" height="3" fill="white" />
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000" />
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000" />
      {/* Commonwealth Star */}
      <circle cx="18" cy="11" r="2" fill="white" />
    </svg>
  ),
  NSW: (
    // NSW: blue with red Cross of St George, Union Jack, and stars
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#002B7F" />
      <rect x="10" y="0" width="4" height="16" fill="white" />
      <rect x="0" y="6" width="24" height="4" fill="white" />
      <rect x="11" y="0" width="2" height="16" fill="#CC0000" />
      <rect x="0" y="7" width="24" height="2" fill="#CC0000" />
    </svg>
  ),
  VIC: (
    // VIC: blue with Union Jack canton and Southern Cross
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003087" />
      <rect width="12" height="8" fill="#00247D" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <rect x="4.5" y="0" width="3" height="8" fill="white" />
      <rect x="0" y="2.5" width="12" height="3" fill="white" />
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000" />
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000" />
      {/* Southern Cross dots */}
      <circle cx="18" cy="5" r="1.5" fill="white" />
      <circle cx="22" cy="9" r="1.5" fill="white" />
      <circle cx="15" cy="11" r="1.5" fill="white" />
      <circle cx="20" cy="13" r="1.2" fill="white" />
    </svg>
  ),
  QLD: (
    // QLD: blue with Union Jack canton + Maltese cross on maroon
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003087" />
      <rect width="12" height="8" fill="#00247D" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <rect x="4.5" y="0" width="3" height="8" fill="white" />
      <rect x="0" y="2.5" width="12" height="3" fill="white" />
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000" />
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000" />
      {/* Maroon badge */}
      <rect x="14" y="8" width="10" height="8" fill="#8B1A35" />
      <rect x="17" y="9" width="4" height="6" fill="#F7D154" />
    </svg>
  ),
  SA: (
    // SA: red/gold bicolour
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#C8102E" />
      <rect x="12" y="0" width="12" height="16" fill="#F7D154" />
      <circle cx="12" cy="8" r="4" fill="#C8102E" />
      <circle cx="12" cy="8" r="2.5" fill="#F7D154" />
    </svg>
  ),
  WA: (
    // WA: blue with black swan on gold
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003087" />
      <rect width="12" height="8" fill="#00247D" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <rect x="4.5" y="0" width="3" height="8" fill="white" />
      <rect x="0" y="2.5" width="12" height="3" fill="white" />
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000" />
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000" />
      {/* Gold badge */}
      <rect x="14" y="8" width="10" height="8" fill="#C4952A" />
      <ellipse cx="19" cy="12" rx="3" ry="2.5" fill="#111111" />
    </svg>
  ),
  TAS: (
    // TAS: blue/white/red tricolour
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003F87" />
      <rect width="12" height="8" fill="#00247D" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5" />
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2" />
      <rect x="4.5" y="0" width="3" height="8" fill="white" />
      <rect x="0" y="2.5" width="12" height="3" fill="white" />
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000" />
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000" />
      {/* Red lion badge */}
      <rect x="14" y="8" width="10" height="8" fill="white" />
      <circle cx="19" cy="12" r="3" fill="#CC0000" />
    </svg>
  ),
  ACT: (
    // ACT: blue/gold halved with symbols
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="8" fill="#003087" />
      <rect y="8" width="24" height="8" fill="#F7D154" />
      <circle cx="12" cy="8" r="3" fill="white" />
    </svg>
  ),
  NT: (
    // NT: black/red/ochre
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="12" height="16" fill="#111111" />
      <rect x="12" y="0" width="12" height="16" fill="#CC3300" />
      {/* Ochre star */}
      <circle cx="12" cy="8" r="3" fill="#E8A020" />
    </svg>
  ),
}

export function RegionFlag({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center shrink-0 rounded-[2px] overflow-hidden ring-1 ring-border/20 shadow-sm">
      {FLAG_SVGS[code] ?? (
        <svg width="24" height="16" viewBox="0 0 24 16" className="block rounded-[2px]">
          <rect width="24" height="16" fill="currentColor" className="opacity-20" />
        </svg>
      )}
    </span>
  )
}

export const GROUP_ORDER = ['AU', 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

const VISIBLE_LIMIT = 8

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function deriveFlagCode(s: ApiScheme): string {
  const states = (s.applicable_states || '').toUpperCase()
  const level = (s.level || '').toUpperCase()
  const federal =
    level.includes('FEDERAL') || level.includes('NATIONAL') ||
    /ALL STATES|ALL TERRITORIES|NATION|AUSTRALIA[- ]WIDE/.test(states)
  if (federal) return 'AU'
  for (const code of STATE_CODES) {
    if (new RegExp(`\\b${code}\\b`).test(states)) return code
  }
  return 'AU'
}

function extractDomain(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  try {
    const url = s.startsWith('http') ? s : `https://${s}`
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return s
  }
}

export function toCard(s: ApiScheme): Scheme {
  const heroTitle = (s.scheme_name || '').trim() || 'Government Scheme'
  const flagCode = deriveFlagCode(s)
  const raw = (s.source_website || s.official_url || '').trim()

  let rawLevel = (s.level || '').trim()
  let coverageLabel = rawLevel
  const lcLevel = rawLevel.toLowerCase()
  if (lcLevel === 'state' || lcLevel === 'statewide' || lcLevel === 'state-wide') coverageLabel = 'State-wide'
  else if (lcLevel === 'federal' || lcLevel === 'national') coverageLabel = 'Federal'
  else if (lcLevel === 'local' || lcLevel === 'council' || lcLevel === 'local council') coverageLabel = 'Local Council'
  else if (lcLevel === 'regional') coverageLabel = 'Regional'

  return {
    heroTitle,
    coverageLabel,
    typeLabel: (s.type || '').trim(),
    statusLabel: (s.status || '').trim(),
    description: (s.short_description || '').trim(),
    startDate: (s.start_date || '').trim(),
    endDate: (s.end_closing_date || '').trim(),
    sourceWebsite: extractDomain(raw),
    officialUrl: (s.official_url || raw).trim(),
    flagCode,
    flagLabel: REGION_LABELS[flagCode] ?? 'Federal',
  }
}

/* ── Ledger row ─────────────────────────────────────────────────────────── */
export function SchemeRow({ s }: { s: Scheme }): ReactNode {
  const inner = (
    <>
      <div className="min-w-0 flex-1 pr-4 md:pr-6">
        <p className="text-[16px] sm:text-[17px] md:text-[18px] font-semibold text-foreground tracking-[-0.01em] leading-snug mb-2 md:mb-2.5">{s.heroTitle}</p>
        {s.description && (
          <p className="text-[13.5px] sm:text-sm font-light text-muted-foreground leading-relaxed mb-4 md:mb-5 max-w-[70ch]">
            {s.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 md:gap-x-3">
          {/* Coverage — filled, so it reads as the primary classifier */}
          {s.coverageLabel && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase border border-transparent bg-[var(--color-fn-yellow-light)] text-[var(--color-fn-navy)] dark:bg-[var(--color-brand-gold)]/20 dark:text-[var(--color-brand-gold)] dark:border-[var(--color-brand-gold)]/25">
              {s.coverageLabel}
            </span>
          )}
          {/* Program type — outlined, secondary to coverage */}
          {s.typeLabel && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-transparent text-muted-foreground border border-border">
              {s.typeLabel}
            </span>
          )}
          {([s.statusLabel, s.sourceWebsite].filter(Boolean).length > 0) && (
            <span className="text-[11px] sm:text-[11.5px] font-medium text-muted-foreground/80 tracking-wide uppercase">
              {[s.statusLabel, s.sourceWebsite].filter(Boolean).join('  ·  ')}
            </span>
          )}
        </div>
      </div>
      {s.officialUrl && (
        <span className="text-muted-foreground/40 group-hover:text-foreground transition-all duration-250 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 flex-shrink-0 mt-0.5 sm:mt-1" aria-hidden="true">
          <ArrowUpRight size={18} strokeWidth={2} />
        </span>
      )}
    </>
  )

  const rowClasses = "group flex items-start justify-between p-5 sm:p-6 md:p-7 mb-3 sm:mb-4 rounded-2xl border border-[var(--color-fn-yellow-deep)]/40 dark:border-[var(--color-brand-gold)]/30 bg-card hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)] transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

  if (s.officialUrl) {
    return (
      <a
        href={s.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={rowClasses}
      >
        {inner}
      </a>
    )
  }
  return <div className={rowClasses}>{inner}</div>
}

/* ── Skeleton row ───────────────────────────────────────────────────────── */
export function SkeletonRow(): ReactNode {
  return (
    <div className="flex items-start justify-between p-5 sm:p-6 md:p-7 mb-3 sm:mb-4 rounded-2xl border border-[var(--color-fn-yellow-deep)]/20 dark:border-[var(--color-brand-gold)]/20 bg-card/50" style={{ pointerEvents: 'none' }}>
      <div className="min-w-0 flex-1">
        <div className="h-5 w-2/3 md:w-1/3 rounded-md bg-muted animate-pulse mb-3" />
        <div className="h-4 w-full md:w-2/3 rounded-md bg-muted/60 animate-pulse mb-2" />
        <div className="h-3 w-1/3 md:w-1/4 rounded-md bg-muted/40 animate-pulse mt-4" />
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export const GrantCards = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading')
  const [activeTab, setActiveTab] = useState<string>('AU')
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/schemes/featured?limit=60', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: Scheme[] = (data.schemes ?? []).map(toCard)
      if (list.length === 0) { setSchemes([]); setStatus('empty'); return }
      setSchemes(list)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const grouped: Record<string, Scheme[]> = {}
  for (const s of schemes) {
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
      // Drop tiles that share an identical description
      if (s.description) {
        const descKey = s.description.toLowerCase().trim()
        if (seenDescriptions.has(descKey)) return false
        seenDescriptions.add(descKey)
      }
      return true
    })
  }
  const groups = GROUP_ORDER.filter(code => (grouped[code]?.length ?? 0) > 0)
  const totalCount = groups.reduce((n, code) => n + grouped[code].length, 0)

  useEffect(() => {
    if (groups.length > 0 && !groups.includes(activeTab)) setActiveTab(groups[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.join(',')])

  const activeTiles = grouped[activeTab] ?? []
  const visibleTiles = showAll ? activeTiles : activeTiles.slice(0, VISIBLE_LIMIT)
  const hiddenCount = activeTiles.length - VISIBLE_LIMIT

  const selectTab = (code: string) => {
    setActiveTab(code)
    setShowAll(false)
  }

  return (
    <section id="schemes" className="pt-6 md:pt-8 pb-14 md:pb-20 lg:pb-24 scroll-mt-24 w-full">
      <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* ── Page header ── */}
        <div className="mb-6 md:mb-8">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.18em] mb-3 md:mb-4">
            Australia-wide
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground tracking-tight leading-[1.12] mb-4 md:mb-5">
            Grants &amp; Schemes Directory
          </h1>
          <p className="text-[15px] md:text-base lg:text-lg font-light text-muted-foreground leading-relaxed max-w-2xl">
            Every federal and state government grant, scheme and concession available to Australian first home buyers in one place.
          </p>
        </div>

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div className="animate-in fade-in duration-500">
            <div 
              className="flex flex-nowrap md:flex-wrap gap-2 md:gap-3 mb-8 md:mb-10 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {[100, 120, 90, 95, 80].map((w, i) => (
                <div key={i} className="shrink-0 h-[44px] rounded-full bg-muted animate-pulse" style={{ width: w }} />
              ))}
            </div>
            <div className="flex flex-col">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="py-20 px-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <p className="text-muted-foreground text-lg mb-5">We couldn&apos;t load the latest grants &amp; schemes right now.</p>
            <button
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {status === 'empty' && (
          <div className="py-20 px-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <p className="text-foreground font-medium text-lg mb-2">No government schemes are available yet.</p>
            <p className="text-muted-foreground text-sm">Please check back soon.</p>
          </div>
        )}

        {/* ── Ready ── */}
        {status === 'ready' && (
          <div className="animate-in fade-in duration-500">
            <div 
              className="flex flex-nowrap md:flex-wrap gap-2 md:gap-3 mb-8 md:mb-10 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
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
                  onClick={() => selectTab(code)}
                >
                  <RegionFlag code={code} />
                  {REGION_LABELS[code] ?? code}
                  <span className={`text-[11px] font-normal ml-0.5 ${code === activeTab ? 'opacity-80' : 'opacity-60'}`}>
                    {grouped[code].length}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col">
              {visibleTiles.map((s, i) => (
                <SchemeRow key={`${activeTab}-${i}`} s={s} />
              ))}
            </div>

            {hiddenCount > 0 && !showAll && (
              <div className="text-center mt-8 md:mt-12">
                <button
                  type="button"
                  className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full text-[13.5px] font-medium bg-transparent border border-border/60 text-foreground hover:bg-muted/50 hover:border-border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => setShowAll(true)}
                >
                  Show all {activeTiles.length} {activeTab === 'AU' ? 'Federal' : REGION_LABELS[activeTab] ?? activeTab} schemes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
