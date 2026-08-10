'use client'

/**
 * Live eligibility — "results as you answer".
 *
 * `useLiveEligibility` re-evaluates the applicant against every scheme (via
 * the same POST /api/eligibility the final Results screen uses — no second
 * engine, no client-side rules) each time an answer changes, debounced.
 *
 * Two consumers:
 *  - `LiveEligibilityPanel` — the desktop sidebar (inherits `.fhbq-side`).
 *  - `ProvisionalBoard`    — the inline board on the fast-path teaser screen,
 *    which is what mobile users see (the sidebar is desktop-only).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import type { Answers } from '@/lib/questionnaire/types'
import { toEligibilityAnswers } from '@/lib/questionnaire/logic'
import { fetchEligibility, type EligibilityResult } from '@/lib/schemes/eligibilityClient'

const DEBOUNCE_MS = 450

type Bucket = 'yes' | 'check' | 'no'

export interface LiveRow {
  id: string
  name: string
  value: string
  bucket: Bucket
  /** Unanswered questions still holding this scheme at "To confirm". */
  unknowns: number
  /** Compact near-miss tag ("$150k over cap") when one change would rescue it. */
  nearMiss?: string
}

const BUCKET_ORDER: Record<Bucket, number> = { yes: 0, check: 1, no: 2 }
const BUCKET_LABEL: Record<Bucket, string> = { yes: 'Eligible', check: 'To confirm', no: 'Not eligible' }

function valueLabel(v: number | string): string {
  if (typeof v === 'number') return v > 0 ? `$${v.toLocaleString('en-AU')}` : ''
  return v || ''
}

function toRows(result: EligibilityResult): LiveRow[] {
  return result.items
    .map((it) => {
      // Dollar figures always fit; long benefit sentences ("Withdraw up to
      // $50,000 of voluntary super contributions") would crush the row, so
      // only short string values are kept in this compact panel.
      const raw = valueLabel(it.eg.value)
      return {
        id: it.eg.grant.id,
        name: it.eg.grant.name,
        value: typeof it.eg.value === 'number' || raw.length <= 16 ? raw : '',
        bucket: it.bucket,
        unknowns: it.ruleResults.filter((r) => !r.met && r.isCheck && /not provided/i.test(r.text)).length,
        nearMiss: it.nearMiss?.shortLabel,
      }
    })
    .sort((x, y) => BUCKET_ORDER[x.bucket] - BUCKET_ORDER[y.bucket])
}

export function useLiveEligibility(a: Answers) {
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState(false)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())

  const prevBuckets = useRef<Record<string, Bucket>>({})
  const seqRef = useRef(0)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Only re-evaluate when an answer the engine actually reads changes — typing
  // a name must not spam the API. The payload minus `name` is the identity.
  const payloadKey = useMemo(() => {
    if (!a.state) return ''
    const p = toEligibilityAnswers(a)
    return JSON.stringify({ ...p, rawAnswers: { ...(p.rawAnswers ?? {}), name: '' } })
  }, [a])

  useEffect(() => {
    if (!payloadKey) return
    const seq = ++seqRef.current
    const t = setTimeout(() => {
      setPending(true)
      fetchEligibility(toEligibilityAnswers(a))
        .then((res) => {
          if (seqRef.current !== seq) return // a newer answer superseded this call
          const changed = new Set<string>()
          for (const it of res.items) {
            const id = it.eg.grant.id
            const prev = prevBuckets.current[id]
            if (prev && prev !== it.bucket) changed.add(id)
            prevBuckets.current[id] = it.bucket
          }
          setResult(res)
          setFailed(false)
          if (changed.size) {
            setFlashIds(changed)
            if (flashTimer.current) clearTimeout(flashTimer.current)
            flashTimer.current = setTimeout(() => setFlashIds(new Set()), 950)
          }
        })
        .catch(() => { if (seqRef.current === seq) setFailed(true) })
        .finally(() => { if (seqRef.current === seq) setPending(false) })
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey])

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current) }, [])

  const rows = useMemo(() => (result ? toRows(result) : []), [result])
  const eligibleCount = rows.filter((r) => r.bucket === 'yes').length
  const confirmCount = rows.filter((r) => r.bucket === 'check').length
  const unlocked = result ? result.cashGrantsTotal + result.taxSavingsTotal : 0

  return { result, rows, pending, failed, flashIds, eligibleCount, confirmCount, unlocked }
}

/** Summary tiles + scheme list. Shared by the sidebar and the teaser board. */
function BoardBody({ live }: { live: ReturnType<typeof useLiveEligibility> }) {
  const { rows, flashIds, eligibleCount, confirmCount, unlocked } = live
  // Schemes that are simply not for this applicant (wrong state, no near miss)
  // are collapsed behind a count — a wall of struck-through rows is noise.
  const [showUnavailable, setShowUnavailable] = useState(false)
  const unavailable = rows.filter((r) => r.bucket === 'no' && !r.nearMiss)
  const relevant = rows.filter((r) => r.bucket !== 'no' || r.nearMiss)

  const renderRow = (r: LiveRow) => (
    <li
      key={r.id}
      className={`fhbq-live-item ${r.bucket}${r.nearMiss ? ' nearmiss' : ''}${flashIds.has(r.id) ? ' flash' : ''}`}
    >
      <span className={`st ${r.bucket}`} aria-hidden="true" />
      <span className="nm">
        {r.name}
        <span className="sr-only"> — {BUCKET_LABEL[r.bucket]}{r.nearMiss ? ` (near miss: ${r.nearMiss})` : ''}</span>
      </span>
      {r.bucket !== 'no' && r.value && <span className="vl">{r.value}</span>}
      {r.bucket === 'no' && r.nearMiss && <span className="vl miss">{r.nearMiss}</span>}
    </li>
  )

  return (
    <>
      <div className="fhbq-live-summary" aria-live="polite">
        <div className="stat">
          <b>{eligibleCount}</b>
          <span>eligible</span>
        </div>
        <div className="stat">
          <b>{confirmCount}</b>
          <span>to confirm</span>
        </div>
        {unlocked > 0 && (
          <div className="stat money">
            <b>${unlocked.toLocaleString('en-AU')}</b>
            <span>unlocked</span>
          </div>
        )}
      </div>

      <ul className="fhbq-live-list">
        {relevant.map(renderRow)}
        {showUnavailable && unavailable.map(renderRow)}
      </ul>
      {unavailable.length > 0 && (
        <button
          type="button"
          className="fhbq-live-more"
          onClick={() => setShowUnavailable((v) => !v)}
          aria-expanded={showUnavailable}
        >
          {showUnavailable ? 'Hide' : 'Show'} {unavailable.length} scheme{unavailable.length === 1 ? '' : 's'} not available to you
        </button>
      )}
    </>
  )
}

/** Inline provisional-results board for the fast-path teaser (all viewports). */
export function ProvisionalBoard({ a }: { a: Answers }) {
  const live = useLiveEligibility(a)

  if (live.failed && !live.result) {
    return (
      <p className="fhbq-live-muted">
        We couldn&apos;t load your estimate right now — you can keep going and your full results
        will be calculated at the end.
      </p>
    )
  }
  if (!live.result) {
    return <p className="fhbq-live-muted"><span className="fhbq-spin" /> Matching schemes to your answers…</p>
  }
  return (
    <div className="fhbq-teaser-board">
      <BoardBody live={live} />
      {live.confirmCount > 0 && (
        <p className="fhbq-live-hint">
          <Sparkles size={13} aria-hidden="true" />
          {live.confirmCount} scheme{live.confirmCount === 1 ? '' : 's'} still need{live.confirmCount === 1 ? 's' : ''} detail
          only you can confirm — a couple more minutes of questions will firm {live.confirmCount === 1 ? 'it' : 'them'} up.
        </p>
      )}
    </div>
  )
}

/** Desktop sidebar variant. */
export function LiveEligibilityPanel({ a }: { a: Answers }) {
  const live = useLiveEligibility(a)

  return (
    <div className="fhbq-side">
      <div className="fhbq-side-card fhbq-live">
        <h3>
          <span className={`fhbq-live-dot${live.pending ? ' busy' : ''}`} aria-hidden="true" />
          Live results · {a.state}
        </h3>

        {live.failed && !live.result && (
          <p className="fhbq-live-muted">
            Live preview is unavailable right now — your full results will still be calculated at the end.
          </p>
        )}

        {!live.failed && !live.result && (
          <p className="fhbq-live-muted">Matching schemes to your answers…</p>
        )}

        {live.result && (
          <>
            <BoardBody live={live} />
            {live.confirmCount > 0 && (
              <p className="fhbq-live-hint">
                <Sparkles size={13} aria-hidden="true" />
                Keep answering — {live.confirmCount} scheme{live.confirmCount === 1 ? '' : 's'} firm{live.confirmCount === 1 ? 's' : ''} up as you go.
              </p>
            )}
          </>
        )}
      </div>

      <div className="fhbq-side-card flex-row">
        <div className="icon-wrap bg-green"><Lock size={16} /></div>
        <p className="text-sm text-grey" style={{ margin: 0 }}>
          Your information stays <strong>private</strong> and is only used to personalise your results.
        </p>
      </div>
    </div>
  )
}
