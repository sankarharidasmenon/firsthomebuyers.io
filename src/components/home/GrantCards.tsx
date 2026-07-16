'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { RotateCcw, ArrowUpRight } from 'lucide-react'

/* ── View-model ─────────────────────────────────────────────────────────── */
interface Scheme {
  heroTitle: string
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
interface ApiScheme {
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

const REGION_LABELS: Record<string, string> = {
  AU:  'Federal',
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  NT:  'Northern Territory',
  QLD: 'Queensland',
  SA:  'South Australia',
  TAS: 'Tasmania',
  VIC: 'Victoria',
  WA:  'Western Australia',
}

// Mini flag SVGs — simplified 2–3 stripe representations of each state/territory flag
const FLAG_SVGS: Record<string, React.ReactNode> = {
  AU: (
    // Australian flag: dark blue with Union Jack canton + stars (simplified as blue/red cross)
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#00008B"/>
      <rect width="12" height="8" fill="#003399"/>
      {/* Union Jack simplified */}
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <rect x="4.5" y="0" width="3" height="8" fill="white"/>
      <rect x="0" y="2.5" width="12" height="3" fill="white"/>
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000"/>
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000"/>
      {/* Commonwealth Star */}
      <circle cx="18" cy="11" r="2" fill="white"/>
    </svg>
  ),
  NSW: (
    // NSW: blue with red Cross of St George, Union Jack, and stars
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#002B7F"/>
      <rect x="10" y="0" width="4" height="16" fill="white"/>
      <rect x="0" y="6" width="24" height="4" fill="white"/>
      <rect x="11" y="0" width="2" height="16" fill="#CC0000"/>
      <rect x="0" y="7" width="24" height="2" fill="#CC0000"/>
    </svg>
  ),
  VIC: (
    // VIC: blue with Union Jack canton and Southern Cross
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003087"/>
      <rect width="12" height="8" fill="#00247D"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <rect x="4.5" y="0" width="3" height="8" fill="white"/>
      <rect x="0" y="2.5" width="12" height="3" fill="white"/>
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000"/>
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000"/>
      {/* Southern Cross dots */}
      <circle cx="18" cy="5" r="1.5" fill="white"/>
      <circle cx="22" cy="9" r="1.5" fill="white"/>
      <circle cx="15" cy="11" r="1.5" fill="white"/>
      <circle cx="20" cy="13" r="1.2" fill="white"/>
    </svg>
  ),
  QLD: (
    // QLD: blue with Union Jack canton + Maltese cross on maroon
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003087"/>
      <rect width="12" height="8" fill="#00247D"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <rect x="4.5" y="0" width="3" height="8" fill="white"/>
      <rect x="0" y="2.5" width="12" height="3" fill="white"/>
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000"/>
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000"/>
      {/* Maroon badge */}
      <rect x="14" y="8" width="10" height="8" fill="#8B1A35"/>
      <rect x="17" y="9" width="4" height="6" fill="#F7D154"/>
    </svg>
  ),
  SA: (
    // SA: red/gold bicolour
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#C8102E"/>
      <rect x="12" y="0" width="12" height="16" fill="#F7D154"/>
      <circle cx="12" cy="8" r="4" fill="#C8102E"/>
      <circle cx="12" cy="8" r="2.5" fill="#F7D154"/>
    </svg>
  ),
  WA: (
    // WA: blue with black swan on gold
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003087"/>
      <rect width="12" height="8" fill="#00247D"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <rect x="4.5" y="0" width="3" height="8" fill="white"/>
      <rect x="0" y="2.5" width="12" height="3" fill="white"/>
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000"/>
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000"/>
      {/* Gold badge */}
      <rect x="14" y="8" width="10" height="8" fill="#C4952A"/>
      <ellipse cx="19" cy="12" rx="3" ry="2.5" fill="#111111"/>
    </svg>
  ),
  TAS: (
    // TAS: blue/white/red tricolour
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="16" fill="#003F87"/>
      <rect width="12" height="8" fill="#00247D"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.5"/>
      <line x1="0" y1="0" x2="12" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <line x1="12" y1="0" x2="0" y2="8" stroke="#CC0000" strokeWidth="1.2"/>
      <rect x="4.5" y="0" width="3" height="8" fill="white"/>
      <rect x="0" y="2.5" width="12" height="3" fill="white"/>
      <rect x="5.5" y="0" width="1" height="8" fill="#CC0000"/>
      <rect x="0" y="3.5" width="12" height="1" fill="#CC0000"/>
      {/* Red lion badge */}
      <rect x="14" y="8" width="10" height="8" fill="white"/>
      <circle cx="19" cy="12" r="3" fill="#CC0000"/>
    </svg>
  ),
  ACT: (
    // ACT: blue/gold halved with symbols
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="8" fill="#003087"/>
      <rect y="8" width="24" height="8" fill="#F7D154"/>
      <circle cx="12" cy="8" r="3" fill="white"/>
    </svg>
  ),
  NT: (
    // NT: black/red/ochre
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2, flexShrink: 0 }}>
      <rect width="12" height="16" fill="#111111"/>
      <rect x="12" y="0" width="12" height="16" fill="#CC3300"/>
      {/* Ochre star */}
      <circle cx="12" cy="8" r="3" fill="#E8A020"/>
    </svg>
  ),
}

function RegionFlag({ code }: { code: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, borderRadius: 2, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }}>
      {FLAG_SVGS[code] ?? (
        <svg width="24" height="16" viewBox="0 0 24 16" style={{ display: 'block', borderRadius: 2 }}>
          <rect width="24" height="16" fill="#888"/>
        </svg>
      )}
    </span>
  )
}

const GROUP_ORDER = ['AU', 'ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

const VISIBLE_LIMIT = 8

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function deriveFlagCode(s: ApiScheme): string {
  const states = (s.applicable_states || '').toUpperCase()
  const level  = (s.level || '').toUpperCase()
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

function toCard(s: ApiScheme): Scheme {
  const heroTitle  = (s.scheme_name || '').trim() || 'Government Scheme'
  const flagCode   = deriveFlagCode(s)
  const raw        = (s.source_website || s.official_url || '').trim()

  return {
    heroTitle,
    typeLabel:     (s.type || '').trim(),
    statusLabel:   (s.status || '').trim(),
    description:   (s.short_description || '').trim(),
    startDate:     (s.start_date || '').trim(),
    endDate:       (s.end_closing_date || '').trim(),
    sourceWebsite: extractDomain(raw),
    officialUrl:   (s.official_url || raw).trim(),
    flagCode,
    flagLabel:     REGION_LABELS[flagCode] ?? 'Federal',
  }
}

/* ── Ledger row ─────────────────────────────────────────────────────────── */
function SchemeRow({ s }: { s: Scheme }): ReactNode {
  const meta = [s.typeLabel, s.statusLabel, s.sourceWebsite].filter(Boolean).join('  ·  ')
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="fn-dir-name">{s.heroTitle}</p>
        {s.description && <p className="fn-dir-desc">{s.description}</p>}
        {meta && <p className="fn-dir-meta">{meta}</p>}
      </div>
      {s.officialUrl && (
        <span className="fn-dir-arrow" aria-hidden="true">
          <ArrowUpRight size={16} strokeWidth={1.8} />
        </span>
      )}
    </>
  )

  if (s.officialUrl) {
    return (
      <a
        href={s.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fn-dir-row"
      >
        {inner}
      </a>
    )
  }
  return <div className="fn-dir-row">{inner}</div>
}

/* ── Skeleton row ───────────────────────────────────────────────────────── */
function SkeletonRow(): ReactNode {
  return (
    <div className="fn-dir-row" style={{ pointerEvents: 'none' }}>
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/3 rounded bg-black/[0.06] animate-pulse mb-2.5" />
        <div className="h-3 w-full rounded bg-black/[0.04] animate-pulse mb-1.5" />
        <div className="h-3 w-1/3 rounded bg-black/[0.04] animate-pulse" />
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export const GrantCards = () => {
  const [schemes, setSchemes]     = useState<Scheme[]>([])
  const [status, setStatus]       = useState<'loading' | 'error' | 'empty' | 'ready'>('loading')
  const [activeTab, setActiveTab] = useState<string>('AU')
  const [showAll, setShowAll]     = useState(false)

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
      // Drop tiles that share an identical description (stale DB duplicates
      // scraped from the same consolidated government page).
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
    <section id="schemes" className="py-14 lg:py-20 scroll-mt-24">
      <style>{`
        .fn-dir-eyebrow {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 11px; font-weight: 600; color: #C4A000;
          text-transform: uppercase; letter-spacing: 0.18em;
          margin-bottom: 14px;
        }
        .fn-dir-heading {
          font-family: var(--font-display, 'Fraunces'), serif;
          font-weight: 500; font-size: clamp(28px, 4vw, 44px);
          line-height: 1.12; letter-spacing: -1px; color: #111111;
          margin-bottom: 12px;
        }
        .dark .fn-dir-heading { color: var(--foreground); }
        .fn-dir-heading em { font-style: italic; color: #C4A000; }
        .fn-dir-sub {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-weight: 300; font-size: 15px; line-height: 1.65;
          color: #444444; max-width: 520px;
        }
        .dark .fn-dir-sub { color: var(--muted-foreground); }

        /* ── Filter chips ── */
        .fn-dir-chip {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 13px; font-weight: 500;
          padding: 8px 16px; border-radius: 9999px;
          border: 1px solid rgba(17,17,17,0.14);
          background: transparent; color: #444444;
          cursor: pointer; white-space: nowrap;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .fn-dir-chip:hover { border-color: #111111; color: #111111; background: rgba(255,255,255,0.7); }
        .fn-dir-chip[data-active='true'] {
          background: #111111; border-color: #111111; color: #FFFFFF;
        }
        .fn-dir-chip[data-active='true']:hover { background: #111111; color: #FFFFFF; }
        .fn-dir-chip small {
          font-size: 11px; opacity: 0.55; margin-left: 5px; font-weight: 400;
        }

        /* ── Ledger rows ── */
        .fn-dir-list { border-top: 1px solid rgba(17,17,17,0.10); }
        .fn-dir-row {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 20px 4px;
          border-bottom: 1px solid rgba(17,17,17,0.10);
          text-decoration: none;
          transition: background 0.15s;
        }
        a.fn-dir-row:hover { background: rgba(255,255,255,0.55); }
        .fn-dir-name {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 15px; font-weight: 500; color: #111111;
          line-height: 1.35; margin-bottom: 4px;
        }
        .dark .fn-dir-name { color: var(--foreground); }
        .fn-dir-desc {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 13.5px; font-weight: 300; color: #444444;
          line-height: 1.6; margin-bottom: 6px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .dark .fn-dir-desc { color: var(--muted-foreground); }
        .fn-dir-meta {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 11.5px; font-weight: 400; color: #888888;
          letter-spacing: 0.02em;
        }
        .fn-dir-arrow {
          color: #888888; flex-shrink: 0; margin-top: 2px;
          transition: color 0.15s, transform 0.15s;
        }
        a.fn-dir-row:hover .fn-dir-arrow {
          color: #C4A000;
          transform: translate(2px, -2px);
        }

        /* ── Show all ── */
        .fn-dir-more {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 13.5px; font-weight: 500; color: #111111;
          background: transparent; border: 1px solid rgba(17,17,17,0.18);
          border-radius: 9999px; padding: 11px 24px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .fn-dir-more:hover { border-color: #111111; background: rgba(255,255,255,0.7); }
        .dark .fn-dir-more { color: var(--foreground); border-color: var(--border); }
      `}</style>

      <div className="max-w-[880px] mx-auto px-5 lg:px-6">

        {/* ── Page header ── */}
        <div style={{ marginBottom: 40 }}>
          <p className="fn-dir-eyebrow">Australia-wide</p>
          <h1 className="fn-dir-heading">
            Grants &amp; Schemes <em>Directory</em>
          </h1>
          <p className="fn-dir-sub">
            Every federal and state government grant, scheme and concession available to Australian first home buyers — in one place.
          </p>
        </div>

        {/* ── Loading ── */}
        {status === 'loading' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-8">
              {[76, 92, 68, 72, 64].map((w, i) => (
                <div key={i} className="h-9 rounded-full bg-black/[0.05] animate-pulse" style={{ width: w }} />
              ))}
            </div>
            <div className="fn-dir-list">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="py-10 text-center">
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
        {status === 'empty' && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No government schemes are available yet. Please check back soon.</p>
          </div>
        )}

        {/* ── Ready ── */}
        {status === 'ready' && (
          <>
            <div className="flex flex-wrap gap-2 mb-8">
              {groups.map(code => (
                <button
                  key={code}
                  type="button"
                  className="fn-dir-chip"
                  data-active={code === activeTab}
                  onClick={() => selectTab(code)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
                >
                  <RegionFlag code={code} />
                  {REGION_LABELS[code] ?? code}
                  <small>{grouped[code].length}</small>
                </button>
              ))}
            </div>

            <div className="fn-dir-list">
              {visibleTiles.map((s, i) => (
                <SchemeRow key={`${activeTab}-${i}`} s={s} />
              ))}
            </div>

            {hiddenCount > 0 && !showAll && (
              <div className="text-center mt-8">
                <button type="button" className="fn-dir-more" onClick={() => setShowAll(true)}>
                  Show all {activeTiles.length} {activeTab === 'AU' ? 'Federal' : REGION_LABELS[activeTab] ?? activeTab} schemes
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
