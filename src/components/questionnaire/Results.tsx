'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react'
import type { Answers } from '@/lib/questionnaire/types'
import { toEligibilityAnswers, softStops, combinedIncome } from '@/lib/questionnaire/logic'
import { fetchEligibility, type EligibilityItem, type RuleResult } from '@/lib/schemes/eligibilityClient'

type Bucket = 'yes' | 'check' | 'no'
interface Row { id: string; name: string; value: string; url: string; bucket: Bucket; rules: RuleResult[] }

function valueLabel(v: number | string): string {
  if (typeof v === 'number') return v > 0 ? `$${v.toLocaleString('en-AU')}` : ''
  return v || ''
}

function classify(item: EligibilityItem): Row {
  const base = { 
    id: item.eg.grant.id, 
    name: item.eg.grant.name, 
    value: valueLabel(item.eg.value), 
    url: item.eg.grant.officialUrl,
    bucket: item.bucket,
    rules: item.ruleResults
  }
  return base
}

const GROUPS: { bucket: Bucket; title: string; icon: React.ReactNode }[] = [
  { bucket: 'yes', title: 'Eligible', icon: <CheckCircle2 size={15} /> },
  { bucket: 'check', title: 'Check required', icon: <AlertTriangle size={15} /> },
  { bucket: 'no', title: 'Not eligible', icon: <XCircle size={15} /> },
]

export function Results({ a }: { a: Answers }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let alive = true
    fetchEligibility(toEligibilityAnswers(a))
      .then((res) => { if (!alive) return; setRows(res.items.map((it) => classify(it))) })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not load results.'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [a])

  if (loading) return <div className="fhbq-loading"><span className="fhbq-spin" /> Matching schemes to your answers…</div>
  if (error) return <div className="fhbq-resitem no"><div className="nm">We couldn’t load your results</div><p className="rs">{error}</p></div>

  const eligible = rows.filter((r) => r.bucket === 'yes')
  const cash = eligible.filter((r) => r.value.startsWith('$')).reduce((s, r) => s + Number(r.value.replace(/[^0-9]/g, '')), 0)

  return (
    <div>
      <div className="fhbq-hero">
        <span className="glow" />
        <div className="lab">Your results · {a.state}</div>
        <div className="big"><b>{eligible.length}</b><span>scheme{eligible.length === 1 ? '' : 's'} you may be eligible for</span></div>
        {cash > 0 && <div className="meta">Up to <b style={{ color: '#fff', fontWeight: 600 }}>${cash.toLocaleString('en-AU')}</b> in cash grants, before duty savings.</div>}
        {combinedIncome(a) > 0 && <div className="meta">Assessed on ${combinedIncome(a).toLocaleString('en-AU')} household income · {a.propertyType} · ${(a.price ?? 0).toLocaleString('en-AU')}</div>}
      </div>

      {GROUPS.map((g) => {
        const items = rows.filter((r) => r.bucket === g.bucket)
        if (!items.length) return null
        return (
          <div key={g.bucket} className={`fhbq-resgroup ${g.bucket}`}>
            <h4>{g.icon} {g.title} <span className="ct">{items.length}</span></h4>
            {items.map((r) => (
              <div key={r.id} className={`fhbq-resitem ${g.bucket}`}>
                <div className="top">
                  <div>
                    <div className="nm">{r.name}</div>
                    <div className="rs" style={{ marginTop: 12 }}>
                      {r.rules.map((rule, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4, color: rule.met ? 'inherit' : (rule.isCheck ? '#d97706' : '#dc2626') }}>
                          <span>{rule.met ? '✓' : (rule.isCheck ? '?' : '✗')}</span>
                          <span>{rule.text}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 8, fontWeight: 500, color: g.bucket === 'yes' ? '#16a34a' : (g.bucket === 'check' ? '#d97706' : '#dc2626') }}>
                        Status: {g.title}
                      </div>
                    </div>
                  </div>
                  {r.value && <span className="vl" style={g.bucket === 'yes' ? undefined : { color: 'var(--q-grey)' }}>{r.value}</span>}
                </div>
                {r.url && r.url !== '#' && (
                  <a className="lnk" href={r.url} target="_blank" rel="noopener noreferrer">Official details <ExternalLink size={11} /></a>
                )}
              </div>
            ))}
          </div>
        )
      })}

      <p className="fhbq-disc">
        A guide based on your answers — not a formal assessment or financial advice. Eligibility, caps and thresholds are confirmed by the relevant State Revenue Office, Housing Australia or your lender. Assessed as at {new Date().toLocaleDateString('en-AU')}.
      </p>
    </div>
  )
}
