'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  SCHEMES,
  PRICE_CAPS,
  INCOME_CAPS,
  ELIGIBILITY,
  DATA_SOURCES,
  GAPS_TO_VERIFY,
  type LibraryScheme,
} from '@/lib/schemesLibrary/data'

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Active: { bg: '#F0FDF4', fg: '#16A34A' },
  Expiring_Soon: { bg: '#FFFBEB', fg: '#B45309' },
  Changing: { bg: '#FFFBEB', fg: '#B45309' },
  Closed: { bg: '#FEF2F2', fg: '#B42318' },
  Inactive: { bg: '#FEF2F2', fg: '#B42318' },
}

function money(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n === 0) return '$0'
  return '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

function label(s: string | null | undefined): string {
  return (s || '').replace(/_/g, ' ')
}

function byScheme<T extends { scheme_id: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const r of rows) {
    const list = m.get(r.scheme_id) ?? []
    list.push(r)
    m.set(r.scheme_id, list)
  }
  return m
}

const priceCapsBy = byScheme(PRICE_CAPS)
const incomeCapsBy = byScheme(INCOME_CAPS)
const eligibilityBy = byScheme(ELIGIBILITY)

const JURISDICTIONS = ['All', ...Array.from(new Set(SCHEMES.map((s) => s.jurisdiction))).sort()]
const TYPES = ['All', ...Array.from(new Set(SCHEMES.map((s) => s.scheme_type))).sort()]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        padding: '6px 11px',
        borderRadius: 999,
        border: '1px solid ' + (active ? '#111111' : '#E8E8E8'),
        background: active ? '#111111' : '#FFFFFF',
        color: active ? '#F5E642' : '#555555',
        cursor: 'pointer',
      }}
    >
      {label(children as string)}
    </button>
  )
}

function DetailField({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8A8A', marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 13, color: '#111111' }}>{v === null || v === undefined || v === '' ? <i style={{ color: '#8A8A8A' }}>not recorded</i> : v}</div>
    </div>
  )
}

function SchemeDetail({ s }: { s: LibraryScheme }) {
  const caps = priceCapsBy.get(s.scheme_id) ?? []
  const incomes = incomeCapsBy.get(s.scheme_id) ?? []
  const elig = eligibilityBy.get(s.scheme_id) ?? []
  const byCat = new Map<string, typeof elig>()
  for (const e of elig) {
    const cat = e.criterion_category || 'Other'
    const list = byCat.get(cat) ?? []
    list.push(e)
    byCat.set(cat, list)
  }

  return (
    <div style={{ padding: '18px 20px 24px', background: '#F7F7F7', borderTop: '1px solid #E8E8E8' }}>
      <p style={{ fontSize: 13.5, color: '#555555', lineHeight: 1.55, margin: '0 0 18px', maxWidth: '74ch' }}>
        {s.description}
        {s.notes ? <><br /><br /><i>{s.notes}</i></> : null}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 24px', marginBottom: 18 }}>
        <DetailField k="Administering body" v={s.administering_body} />
        <DetailField k="Property type eligible" v={s.property_type_eligible} />
        <DetailField k="Min. age" v={s.min_age} />
        <DetailField k="Residency requirement" v={label(s.residency_requirement)} />
        <DetailField k="Owner-occupier required" v={s.owner_occupier_required ? 'Yes' : 'No'} />
        <DetailField k="Min. occupancy (months)" v={s.min_occupancy_months} />
        <DetailField k="Prior property restrictions" v={s.previous_property_restrictions} />
        <DetailField k="Application method" v={label(s.application_method)} />
        <DetailField k="Effective from" v={s.effective_from} />
        <DetailField k="Effective to" v={s.effective_to} />
        <DetailField k="Last verified" v={s.last_verified} />
        <DetailField k="Official URL" v={s.official_url ? <a href={s.official_url} target="_blank" rel="noopener" style={{ color: '#111111' }}>{s.official_url}</a> : null} />
        <DetailField k="Scheme ID" v={<span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{s.scheme_id}</span>} />
      </div>

      {caps.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8A8A', margin: '16px 0 8px' }}>
            Price caps ({caps.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8 }}>
            <thead>
              <tr style={{ background: '#F0F0F0' }}>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>Location type</th>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>Cap</th>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {caps.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E8E8E8' }}>
                  <td style={{ padding: '7px 10px' }}>{label(c.location_type)}</td>
                  <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, whiteSpace: 'nowrap' }}>{money(c.price_cap_dollars)}</td>
                  <td style={{ padding: '7px 10px' }}>{c.price_cap_notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {incomes.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8A8A', margin: '16px 0 8px' }}>
            Income caps ({incomes.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 8 }}>
            <thead>
              <tr style={{ background: '#F0F0F0' }}>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>Applicant type</th>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>Cap</th>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>FY</th>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#8A8A8A', textTransform: 'uppercase' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid #E8E8E8' }}>
                  <td style={{ padding: '7px 10px' }}>{label(c.applicant_type)}</td>
                  <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, whiteSpace: 'nowrap' }}>{money(c.income_cap_dollars)}</td>
                  <td style={{ padding: '7px 10px' }}>{c.financial_year}</td>
                  <td style={{ padding: '7px 10px' }}>{c.income_cap_notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8A8A8A', margin: '16px 0 8px' }}>
        Eligibility rules ({elig.length})
      </div>
      {elig.length === 0 && <p style={{ fontSize: 12, color: '#8A8A8A', fontStyle: 'italic' }}>No eligibility rules recorded for this scheme.</p>}
      {Array.from(byCat.entries()).map(([cat, rows]) => (
        <div key={cat} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#555555', margin: '10px 0 5px' }}>{label(cat)}</div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', fontSize: 12.5, borderTop: i === 0 ? 'none' : '1px solid #E8E8E8' }}>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  marginTop: 1,
                  background: r.is_mandatory ? '#FEF2F2' : '#F0F0F0',
                  color: r.is_mandatory ? '#B42318' : '#8A8A8A',
                }}
              >
                {r.is_mandatory ? 'REQUIRED' : 'OPTIONAL'}
              </span>
              <span>{r.criterion_description}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function SchemeLibraryBrowser() {
  const [jurisdiction, setJurisdiction] = useState('All')
  const [type, setType] = useState('All')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SCHEMES.filter((s) => {
      if (jurisdiction !== 'All' && s.jurisdiction !== jurisdiction) return false
      if (type !== 'All' && s.scheme_type !== type) return false
      if (q) {
        const hay = `${s.scheme_name} ${s.short_name ?? ''} ${s.jurisdiction} ${s.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [jurisdiction, type, query])

  const source = DATA_SOURCES[0]

  return (
    <div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#555555', margin: '0 0 6px' }}>
        <b style={{ color: '#111111' }}>{SCHEMES.length}</b> schemes &middot; <b style={{ color: '#111111' }}>{PRICE_CAPS.length}</b> price caps &middot;{' '}
        <b style={{ color: '#111111' }}>{INCOME_CAPS.length}</b> income caps &middot; <b style={{ color: '#111111' }}>{ELIGIBILITY.length}</b> eligibility rules
      </p>

      <div
        style={{
          margin: '14px 0 20px',
          padding: '12px 14px',
          borderRadius: 8,
          background: '#FFFBEB',
          border: '1px solid rgba(180,83,9,0.25)',
          color: '#B45309',
          fontSize: 12.5,
          lineHeight: 1.5,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <b>Reference data, not live.</b> This is a snapshot of a separately-built research library, not the app&apos;s live eligibility data
        (Supabase, Federal/NSW/VIC only, verified against government source documents). Treat this as a browsing aid, not an eligibility
        determination. Gaps flagged by its own author: {GAPS_TO_VERIFY.join(' · ')}
      </div>

      <input
        type="text"
        placeholder="Search scheme name, jurisdiction, description…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13.5,
          padding: '9px 12px',
          border: '1px solid #E8E8E8',
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {JURISDICTIONS.map((j) => (
          <Chip key={j} active={j === jurisdiction} onClick={() => setJurisdiction(j)}>
            {j}
          </Chip>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 16 }}>
        {TYPES.map((t) => (
          <Chip key={t} active={t === type} onClick={() => setType(t)}>
            {t}
          </Chip>
        ))}
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8A8A8A' }}>
          {filtered.length} of {SCHEMES.length} shown
        </span>
      </div>

      <div style={{ border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F0F0F0' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8A8A' }}>Jur.</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8A8A' }}>Scheme</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8A8A' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8A8A' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A8A8A' }}>Status</th>
              <th style={{ width: 20 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#8A8A8A', fontSize: 13 }}>
                  No schemes match this filter.
                </td>
              </tr>
            )}
            {filtered.map((s) => {
              const open = openId === s.scheme_id
              const statusColor = STATUS_COLORS[s.status ?? ''] ?? { bg: '#F0F0F0', fg: '#8A8A8A' }
              return (
                <Fragment key={s.scheme_id}>
                  <tr
                    onClick={() => setOpenId(open ? null : s.scheme_id)}
                    style={{ cursor: 'pointer', borderTop: '1px solid #E8E8E8', background: open ? '#F7F7F7' : undefined }}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 700, color: '#555555' }}>{s.jurisdiction}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{s.scheme_name}</div>
                      <div style={{ color: '#8A8A8A', fontSize: 12, marginTop: 1 }}>{s.short_name}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{label(s.scheme_type)}</td>
                    <td style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 700, whiteSpace: 'nowrap' }}>{money(s.grant_amount_dollars)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: statusColor.bg, color: statusColor.fg, whiteSpace: 'nowrap' }}>
                        {label(s.status)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#8A8A8A', fontSize: 11 }}>{open ? '▾' : '▸'}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <SchemeDetail s={s} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 24, fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: '#8A8A8A', lineHeight: 1.6 }}>
        Source: {source?.source_name ?? 'fhb_grants_schemes_library.db'} — {source?.description}
      </p>
    </div>
  )
}
