'use client'

/*
 * Home page Government Scheme cards.
 *
 * Phase 2B-2: the card DATA now comes from the live database via
 * GET /api/schemes/featured (Phase 2A) instead of a hardcoded array — so the
 * homepage automatically reflects newly uploaded Excel data with no code change
 * or redeploy. The visual design, layout and marquee are UNCHANGED: the six
 * original card style presets are reused and assigned to schemes by index.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

/* ── Presentational view-model (unchanged card shape) ── */
interface Scheme {
  heroTitle: string
  abbr: string
  benefitPrimary: string
  benefitSecondary: string
  desc: string
  catchy: string
  status: string
  url: string
  pill: string
  pillStyle: string
  cardBg: string
  dark: boolean
  /* Layout-only additions: which marquee row the card belongs to, and the
     jurisdiction label shown next to the Australian flag in the top metadata
     row ("Australia" for federal schemes, or the state code e.g. "VIC"). */
  kind: 'grant' | 'scheme'
  flagLabel: string
  flagSrc: string
}

/* The six original card style presets — kept byte-for-byte so the look, colours
   and dark/light rhythm are identical. Schemes are assigned a preset by index. */
const STYLE_PRESETS = [
  { pillStyle: 'bg-fn-success-light text-fn-success', cardBg: 'bg-gradient-to-br from-[#FBF5E6] to-[#F4ECD6]', dark: false },
  { pillStyle: 'bg-white/15 text-white/90 border border-white/20', cardBg: 'bg-gradient-to-br from-[#1C3829] to-[#122318]', dark: true },
  { pillStyle: 'bg-fn-info-light text-fn-info', cardBg: 'bg-gradient-to-br from-[#EEF0F5] to-[#E4E7F0]', dark: false },
  { pillStyle: 'bg-white/15 text-white/90 border border-white/20', cardBg: 'bg-gradient-to-br from-[#1B2B3A] to-[#0F1E2C]', dark: true },
  { pillStyle: 'bg-fn-warning-light text-fn-warning', cardBg: 'bg-gradient-to-br from-[#EAEDE8] to-[#DDE3DA]', dark: false },
  { pillStyle: 'bg-white/15 text-white/90 border border-white/20', cardBg: 'bg-gradient-to-br from-[#1E3530] to-[#132420]', dark: true },
] as const

/* Shape of a scheme row from GET /api/schemes/featured. */
interface ApiScheme {
  scheme_name?: string | null
  acronym?: string | null
  benefit_value?: string | null
  value_unit?: string | null
  short_description?: string | null
  catchy_line?: string | null
  status?: string | null
  official_url?: string | null
  type?: string | null
  level?: string | null
  applicable_states?: string | null
  benefit_type?: string | null
  minimum_deposit?: string | null
}

/* Australian jurisdiction codes, longest-first so tokens never collide. */
const STATE_CODES = ['NSW', 'VIC', 'QLD', 'TAS', 'ACT', 'WA', 'SA', 'NT'] as const

/* Jurisdiction → badge label + local flag SVG (public/flags). Federal schemes
   use the national flag; state schemes use that state/territory's own flag. */
const FLAGS: Record<string, { label: string; src: string }> = {
  AU: { label: 'Australia', src: '/flags/au.svg' },
  ACT: { label: 'ACT', src: '/flags/act.svg' },
  NSW: { label: 'NSW', src: '/flags/nsw.svg' },
  NT: { label: 'NT', src: '/flags/nt.svg' },
  QLD: { label: 'QLD', src: '/flags/qld.svg' },
  SA: { label: 'SA', src: '/flags/sa.svg' },
  TAS: { label: 'TAS', src: '/flags/tas.svg' },
  VIC: { label: 'VIC', src: '/flags/vic.svg' },
  WA: { label: 'WA', src: '/flags/wa.svg' },
}

/* Which marquee row a card belongs to. A "Grant" (by type, or by name when the
   type is blank) goes in the Grants row; everything else is a Scheme. */
function deriveKind(s: ApiScheme): 'grant' | 'scheme' {
  const t = (s.type || '').trim()
  const basis = t || (s.scheme_name || '')
  return /grant/i.test(basis) ? 'grant' : 'scheme'
}

/* Jurisdiction of a scheme → a key into FLAGS. Federal schemes → 'AU'; state
   schemes → the state code. Federal detection mirrors the repository rule: match
   an explicit "all states/territories"/nation-wide phrase, never a bare
   "AUSTRALIA" (which also appears inside "Western/South Australia"). */
function deriveFlagCode(s: ApiScheme): string {
  const states = (s.applicable_states || '').toUpperCase()
  const level = (s.level || '').toUpperCase()
  const federal =
    level.includes('FEDERAL') ||
    level.includes('NATIONAL') ||
    /ALL STATES|ALL TERRITORIES|NATION|AUSTRALIA[- ]WIDE/.test(states)
  if (federal) return 'AU'
  for (const code of STATE_CODES) {
    if (new RegExp(`\\b${code}\\b`).test(states)) return code
  }
  return 'AU'
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 4).toUpperCase()
}

function deriveBenefit(s: ApiScheme): { primary: string; secondary: string } {
  const t = (s.type || '').trim()
  const bVal = (s.benefit_value || '').trim()
  const bType = (s.benefit_type || '').trim()
  const vUnit = (s.value_unit || '').trim()
  const minDep = (s.minimum_deposit || '').trim()

  if (t === 'Grant') {
    return {
      primary: bVal || '$10,000',
      secondary: vUnit || 'AUD One-off Grant'
    }
  }
  
  if (t === 'Guarantee') {
    const depositStr = minDep ? (minDep.toLowerCase().includes('deposit') ? minDep : `${minDep} Minimum Deposit`) : '5% Minimum Deposit'
    return {
      primary: depositStr,
      secondary: bVal || 'Government guarantee'
    }
  }

  if (t === 'Concession' || t === 'Stamp Duty Relief') {
    return {
      primary: bVal || bType || 'Stamp Duty Concession',
      secondary: 'Stamp Duty Exemption'
    }
  }

  if (t === 'Shared Equity') {
    return {
      primary: 'Government Equity Contribution',
      secondary: bVal || 'Shared Equity Scheme'
    }
  }

  if (t === 'Tax Benefit') {
    return {
      primary: 'Withdraw Eligible Super Contributions',
      secondary: bVal || 'Tax Benefit'
    }
  }

  // Fallback
  return {
    primary: bVal || 'Government Scheme',
    secondary: vUnit || ''
  }
}

function toCard(s: ApiScheme, i: number): Scheme {
  const preset = STYLE_PRESETS[i % STYLE_PRESETS.length]
  const heroTitle = (s.scheme_name || '').trim() || 'Government Scheme'
  const { primary, secondary } = deriveBenefit(s)
  const flag = FLAGS[deriveFlagCode(s)] ?? FLAGS.AU

  return {
    heroTitle,
    abbr: (s.acronym || '').trim() || initials(heroTitle),
    benefitPrimary: primary,
    benefitSecondary: secondary,
    desc: (s.short_description || '').trim(),
    catchy: (s.catchy_line || '').trim(),
    status: (s.status || '').trim(),
    url: (s.official_url || '').trim(),
    pill: (s.status || '').trim() || 'Scheme',
    kind: deriveKind(s),
    flagLabel: flag.label,
    flagSrc: flag.src,
    ...preset,
  }
}

/* Single scheme card — markup/colours unchanged; catchy line + CTA added to
   surface the fields the API provides, styled to match the card. */
function SchemeCard({ s, outer, clone = false }: { s: Scheme; outer: string; clone?: boolean }): ReactNode {
  const titleClass = s.heroTitle.length > 20 ? 'text-2xl leading-snug' : 'text-[28px] leading-snug'
  return (
    <div
      aria-hidden={clone || undefined}
      className={`${s.cardBg} rounded-3xl border ${s.dark ? 'border-white/10' : 'border-gray-100'} shadow-sm p-5 sm:p-6 flex flex-col gap-3 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 cursor-default ${outer}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.flagSrc}
            alt={`${s.flagLabel} flag`}
            title={s.flagLabel}
            width={48}
            height={24}
            className={`w-12 h-6 shrink-0 object-cover rounded-[5px] shadow-sm ring-1 ${s.dark ? 'ring-white/25' : 'ring-black/10'}`}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-fn-yellow truncate">{s.abbr}</span>
        </div>
        {s.pill && <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${s.pillStyle}`}>{s.pill}</span>}
      </div>
      <div>
        <p className={`${titleClass} font-extrabold ${s.dark ? 'text-white' : 'text-fn-navy'} line-clamp-3`}>{s.heroTitle}</p>
      </div>
      <div className="flex-1 mt-1">
        <h3 className={`font-bold text-base mb-1 ${s.dark ? 'text-white' : 'text-fn-navy'} line-clamp-2`}>{s.benefitPrimary}</h3>
        {s.benefitSecondary && <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${s.dark ? 'text-white/50' : 'text-gray-400'}`}>{s.benefitSecondary}</p>}
        
        <p className={`text-sm leading-relaxed ${s.dark ? 'text-white/60' : 'text-gray-500'} line-clamp-4`}>{s.desc}</p>
        {s.catchy && <p className={`text-xs italic mt-2 ${s.dark ? 'text-fn-yellow/90' : 'text-fn-yellow-deep'} line-clamp-2`}>{s.catchy}</p>}
      </div>
      {s.url && (
        <div className="pt-2">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs font-semibold inline-flex items-center gap-1 ${s.dark ? 'text-white/80 hover:text-white' : 'text-fn-navy hover:opacity-70'}`}
          >
            Official details →
          </a>
        </div>
      )}
    </div>
  )
}

/* One continuously-scrolling marquee row. The card set is rendered twice and the
   track translates -50%, so the loop is seamless (no jump). Pause-on-hover and
   reduced-motion are handled by the shared CSS below. Used for BOTH mobile and
   desktop — only the card width/gap changes responsively. */
function MarqueeRow({ items, idPrefix }: { items: Scheme[]; idPrefix: string }): ReactNode {
  const cardOuter = 'fn-marquee-card shrink-0 w-[248px] mr-3 sm:w-[280px] sm:mr-4 lg:w-[320px] lg:mr-6'
  return (
    <div className="fn-marquee-viewport relative w-full overflow-hidden">
      <div className="fn-marquee-track flex w-max py-3">
        {items.map((s, i) => (
          <SchemeCard key={`${idPrefix}-a-${i}`} s={s} outer={cardOuter} />
        ))}
        {items.map((s, i) => (
          <SchemeCard key={`${idPrefix}-b-${i}`} s={s} outer={cardOuter} clone />
        ))}
      </div>
    </div>
  )
}

/* Skeleton placeholder card in the same footprint. */
function SkeletonCard({ outer }: { outer: string }): ReactNode {
  return (
    <div className={`rounded-3xl border border-gray-100 bg-gray-50 shadow-sm p-7 flex flex-col gap-4 ${outer}`}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-12 rounded bg-gray-200 animate-pulse" />
        <div className="h-5 w-20 rounded-full bg-gray-200 animate-pulse" />
      </div>
      <div className="h-9 w-28 rounded bg-gray-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  )
}

function Heading() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 lg:px-8 text-center mb-6 mt-2">
      <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        2026 Australian First‑Home Buyer Grants & Schemes
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
        Explore all government pathways to homeownership including <span className="font-bold">eligibility rules, income ceilings, property price restrictions,</span> and more.
      </p>
    </div>
  )
}

export const GrantCards = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch('/api/schemes/featured?limit=60', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: Scheme[] = (data.schemes ?? []).map(toCard)
      if (list.length === 0) {
        setSchemes([])
        setState('empty')
        return
      }
      setSchemes(list)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Row 1 = grants only, Row 2 = schemes only — split automatically by kind.
  let grantsRow = schemes.filter((s) => s.kind === 'grant')
  let schemesRow = schemes.filter((s) => s.kind === 'scheme')

  // Ensure rows are wide enough to cover the screen so the marquee doesn't show blank space when looping
  while (grantsRow.length > 0 && grantsRow.length < 8) {
    grantsRow = [...grantsRow, ...grantsRow]
  }
  while (schemesRow.length > 0 && schemesRow.length < 8) {
    schemesRow = [...schemesRow, ...schemesRow]
  }

  return (
    <section id="schemes" className="bg-background pt-2 pb-12 lg:pt-4 lg:pb-16 scroll-mt-24 overflow-x-hidden">
      <Heading />

      {/* ── Loading ── */}
      {state === 'loading' && (
        <div className="flex gap-4 overflow-x-hidden px-5 py-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} outer="shrink-0 w-[78%] sm:w-[55%] md:w-[42%] lg:w-[320px]" />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {state === 'error' && (
        <div className="max-w-[1200px] mx-auto px-5 py-10 text-center">
          <p className="text-muted-foreground">We couldn&apos;t load the latest grants &amp; schemes right now.</p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {state === 'empty' && (
        <div className="max-w-[1200px] mx-auto px-5 py-10 text-center">
          <p className="text-muted-foreground">No government schemes are available yet. Please check back soon.</p>
        </div>
      )}

      {/* ── Ready ── Two independent marquee rows (mobile + desktop):
          Row 1 = Government Grants, Row 2 = Government Schemes. */}
      {state === 'ready' && (
        <div className="flex flex-col gap-5 lg:gap-8">
          {grantsRow.length > 0 && (
            <MarqueeRow items={grantsRow} idPrefix="grants" />
          )}
          {schemesRow.length > 0 && (
            <MarqueeRow items={schemesRow} idPrefix="schemes" />
          )}
        </div>
      )}

      <style>{`
        .fn-marquee-track {
          animation: fn-marquee-scroll 32s linear infinite;
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        @keyframes fn-marquee-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        @media (hover: hover) {
          .fn-marquee-viewport:hover .fn-marquee-track {
            animation-play-state: paused;
          }
        }
        .fn-marquee-viewport {
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
        }
        @media (prefers-reduced-motion: reduce) {
          .fn-marquee-track { animation: none; }
          .fn-marquee-viewport {
            overflow-x: auto;
            -webkit-mask-image: none;
                    mask-image: none;
          }
        }
      `}</style>
    </section>
  )
}
