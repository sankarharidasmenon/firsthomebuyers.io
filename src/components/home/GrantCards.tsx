'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { RotateCcw, ArrowUpRight, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

/** Pseudo-tab shown first; selects every scheme rather than one jurisdiction. */
export const ALL_TAB = 'ALL'

/* ── Category (grant vs scheme) ─────────────────────────────────────────── */

export type CategoryFilterValue = 'all' | 'grant' | 'scheme'

/**
 * Single source of truth for the grant/scheme split. The sheet's `Type` column
 * holds mixed values ("Grant", "Guarantee", "Concession", "Loan"), so anything
 * naming a grant is a grant and everything else is treated as a scheme.
 * Drives the card accent, the category badge and the filter alike.
 */
export function schemeCategory(s: Scheme): Exclude<CategoryFilterValue, 'all'> {
  return /grant/i.test(s.typeLabel) ? 'grant' : 'scheme'
}

const FILTER_OPTIONS: { id: CategoryFilterValue; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'grant', label: 'Grants' },
  { id: 'scheme', label: 'Schemes' },
]

/** Type filter — right-aligned Select. */
export function CategoryFilter({
  value,
  onChange,
}: {
  value: CategoryFilterValue
  onChange: (v: CategoryFilterValue) => void
}) {
  return (
    <div className="flex justify-end">
      <Select value={value} onValueChange={v => onChange(v as CategoryFilterValue)}>
        <SelectTrigger
          aria-label="Filter by type"
          className="h-10 min-h-[40px] rounded-full border-border bg-background px-4 text-[13px] font-medium data-[size=default]:h-10"
        >
          <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        {/* popper + offset opens below the trigger; the default item-aligned
            mode overlays the panel on top of it and hides the label. */}
        <SelectContent position="popper" align="end" sideOffset={8}>
          {FILTER_OPTIONS.map(opt => (
            <SelectItem key={opt.id} value={opt.id} className="text-[13px]">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

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

/* Category accents — grants read warm yellow, everything else (schemes,
   guarantees, concessions) reads soft green. Both tints sit on the cream
   section background and use existing palette tokens.
   Dark theme uses low-alpha tints instead: --color-fn-yellow-light and
   --color-green-bg are light fills that are not redefined in .dark, so using
   them there would put a pale chip on a near-black surface. */
const ACCENTS = {
  grant: {
    label: 'Grant',
    surface:
      'bg-[var(--color-fn-yellow-light)] border-[var(--color-fn-yellow-deep)]/35 dark:bg-[var(--color-brand-gold)]/10 dark:border-[var(--color-brand-gold)]/25',
    /* White chip with dark text — #C4A000 on white is ~2.9:1 and fails AA at
       this size, so the category colour lives in the border, not the text. */
    badge:
      'bg-card text-foreground border-[var(--color-fn-yellow-deep)]/45 dark:bg-[var(--color-brand-gold)]/15 dark:text-[var(--color-brand-gold)] dark:border-[var(--color-brand-gold)]/30',
    /* Solid category chip. Mid-tone fill + dark text reads in both themes. */
    chip: 'bg-[var(--color-fn-yellow-deep)] text-[var(--color-fn-navy)] border-transparent',
  },
  scheme: {
    label: 'Scheme',
    surface:
      'bg-[var(--color-green-bg)] border-[var(--color-green)]/35 dark:bg-[var(--color-green)]/10 dark:border-[var(--color-green)]/25',
    badge:
      'bg-card text-foreground border-[var(--color-green)]/50 dark:bg-[var(--color-green)]/15 dark:text-[var(--color-green)] dark:border-[var(--color-green)]/30',
    chip: 'bg-[var(--color-green)] text-[var(--color-fn-navy)] border-transparent',
  },
} as const

/* Shared chip shape for the category / coverage / program-type badges. */
const BADGE_BASE =
  'inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase border'

/* The jurisdiction chip is tertiary: below the GRANT/SCHEME category chip and
   below the coverage/type chips. It has to stay findable without ever becoming
   the loudest thing on the card, so the recession is carried by the border and
   shadow rather than the fill — a low-alpha gold rule and a near-flat shadow
   let the chip sit ON the card instead of floating above it.
   Its box is deliberately identical to BADGE_BASE's: 15px line box + 4px padding
   + 1px border = 25px, so every chip in the row shares one height and baseline.
   leading-[15px] is load-bearing — the 11px type would otherwise inherit a 1.5
   line-height (16.5px) and stand 1.5px proud of its neighbours. Only the fill
   distinguishes it from them.
   Shares the LogoBadge ("BETA") vocabulary so the two read as one system: same
   #3A2A00 ink, same 135deg gold ramp, same rgba(184,134,11) border family, same
   220ms lift + brightness(1.02) hover.
   #3A2A00 measures 12.9:1 / 10.3:1 / 8.5:1 across the three stops — past AAA
   over the whole ramp, on the cream, green and near-black card surfaces alike,
   hence no dark-theme override (matching how accent.chip is handled). */
const STATE_BADGE =
  'inline-flex items-center px-3 py-1 rounded-full border ' +
  'text-[11px] font-bold tracking-[0.4px] uppercase leading-[15px] ' +
  'bg-[linear-gradient(135deg,#FFF6D9_0%,#F4DD86_55%,#E9C85B_100%)] ' +
  'text-[#3A2A00] border-[rgba(184,134,11,0.22)] ' +
  'shadow-[0_1px_2px_rgba(0,0,0,0.06)] ' +
  'transition-[transform,filter] duration-[220ms] ease-out ' +
  'hover:-translate-y-px hover:brightness-[1.02] motion-reduce:transition-none motion-reduce:hover:translate-y-0'

export function SchemeRow({ s }: { s: Scheme }): ReactNode {
  const accent = ACCENTS[schemeCategory(s)]

  /* Category → coverage → program type → jurisdiction, in priority order.
     Empty values are dropped and repeated text is shown once — the sheet's Type
     is often the same word as the derived category (e.g. both "Grant").
     The jurisdiction chip reuses the flagCode already derived for the region
     tabs, so it is blank for federal ('AU') schemes, which apply nationwide. */
  const badges = [
    { text: accent.label, className: `${BADGE_BASE} ${accent.chip}` },
    { text: s.coverageLabel, className: `${BADGE_BASE} ${accent.badge}` },
    {
      text: s.typeLabel,
      className: `${BADGE_BASE} bg-transparent text-muted-foreground border-foreground/20`,
    },
    {
      text: s.flagCode === 'AU' ? '' : s.flagCode,
      className: STATE_BADGE,
      title: s.flagLabel,
    },
  ].filter(
    (badge, i, all) =>
      Boolean(badge.text) &&
      all.findIndex(b => b.text.toLowerCase() === badge.text.toLowerCase()) === i,
  )

  const inner = (
    <>
      <div className="min-w-0 flex-1 pr-4 md:pr-6">
        <p className="text-[16px] sm:text-[17px] font-semibold text-foreground tracking-[-0.01em] leading-snug mb-1.5">
          {s.heroTitle}
        </p>
        {s.description && (
          <p className="text-[13.5px] sm:text-sm font-light text-muted-foreground leading-relaxed mb-3 max-w-[70ch]">
            {s.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          {badges.map(({ text, className, title }) => (
            <span key={text} title={title} className={className}>
              {text}
            </span>
          ))}
        </div>
      </div>
      {s.officialUrl && (
        <span className="text-muted-foreground/40 group-hover:text-foreground transition-all duration-250 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 flex-shrink-0" aria-hidden="true">
          <ArrowUpRight size={18} strokeWidth={2} />
        </span>
      )}
    </>
  )

  const rowClasses = `group flex h-full items-start justify-between p-5 md:p-6 rounded-2xl border ${accent.surface} hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)] transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`

  if (s.officialUrl) {
    return (
      <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className={rowClasses}>
        {inner}
      </a>
    )
  }
  return <div className={rowClasses}>{inner}</div>
}

/* ── Skeleton row ───────────────────────────────────────────────────────── */
export function SkeletonRow(): ReactNode {
  return (
    <div className="flex items-start justify-between p-5 md:p-6 rounded-2xl border border-[var(--color-fn-yellow-deep)]/20 dark:border-[var(--color-brand-gold)]/20 bg-card/50" style={{ pointerEvents: 'none' }}>
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
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB)
  const [showAll, setShowAll] = useState(false)
  const [typeFilter, setTypeFilter] = useState<CategoryFilterValue>('all')

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

  /* Apply the type filter before grouping so the region tabs, their counts and
     the cards all reflect the current selection. */
  const filtered = typeFilter === 'all'
    ? schemes
    : schemes.filter(s => schemeCategory(s) === typeFilter)

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
      // Drop tiles that share an identical description
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
     what the individual tabs show. Grouping stays strictly by jurisdiction, so
     each scheme appears here exactly once. */
  const allTiles = regionGroups.flatMap(code => grouped[code])
  const groups = regionGroups.length > 0 ? [ALL_TAB, ...regionGroups] : []

  /* A state tab lists that state's own schemes AND the federal ones, because
     both are available to a buyer there — a NSW buyer can claim the NSW grant
     and the federal 5% Deposit Scheme. State schemes lead; the "Federal" badge
     already on every card distinguishes them. The AU tab stays federal-only,
     and "All" keeps one card per scheme. */
  const tilesFor = (code: string): Scheme[] => {
    if (code === ALL_TAB) return allTiles
    if (code === 'AU') return grouped.AU ?? []
    return [...(grouped[code] ?? []), ...(grouped.AU ?? [])]
  }

  useEffect(() => {
    if (groups.length > 0 && !groups.includes(activeTab)) setActiveTab(groups[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.join(',')])

  const activeTiles = tilesFor(activeTab)
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
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
              className="flex flex-nowrap md:flex-wrap gap-2 md:gap-3 mb-1 md:mb-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
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
                  {code !== ALL_TAB && <RegionFlag code={code} />}
                  {code === ALL_TAB ? 'All' : REGION_LABELS[code] ?? code}
                  <span className={`text-[11px] font-normal ml-0.5 ${code === activeTab ? 'opacity-80' : 'opacity-60'}`}>
                    {tilesFor(code).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Type filter — sits under the region tabs, right-aligned */}
            <div className="mb-6 md:mb-8">
              <CategoryFilter
                value={typeFilter}
                onChange={v => { setTypeFilter(v); setShowAll(false) }}
              />
            </div>

            {groups.length === 0 ? (
              <div className="py-16 px-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                <p className="text-foreground font-medium mb-1">No matching schemes.</p>
                <p className="text-muted-foreground text-sm">Try a different filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {visibleTiles.map((s, i) => (
                  <SchemeRow key={`${activeTab}-${i}`} s={s} />
                ))}
              </div>
            )}

            {hiddenCount > 0 && !showAll && (
              <div className="text-center mt-8 md:mt-12">
                <button
                  type="button"
                  className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 rounded-full text-[13.5px] font-medium bg-transparent border border-border/60 text-foreground hover:bg-muted/50 hover:border-border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => setShowAll(true)}
                >
                  Show all {activeTiles.length}{' '}
                  {activeTab === ALL_TAB ? '' : activeTab === 'AU' ? 'Federal ' : `${REGION_LABELS[activeTab] ?? activeTab} `}
                  schemes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
