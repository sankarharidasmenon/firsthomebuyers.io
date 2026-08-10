'use client'

/**
 * Conversational fill — "just describe your situation".
 *
 * Free text goes to POST /api/ai/extract, which returns validated
 * questionnaire fields; applying them updates the shared Answers object, so
 * the form controls fill themselves and the live eligibility panel reacts —
 * the AI extracts, the deterministic engine decides. Applied fields are
 * echoed back as chips so the user can see (and correct) exactly what was
 * understood. If the AI endpoint isn't configured the card hides itself after
 * the first attempt; the form always remains the source of truth.
 */
import React, { useState } from 'react'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { FIELD_LABELS, formatFieldValue, type ExtractedFields } from '@/lib/ai/extractSanitize'

const PLACEHOLDER =
  'e.g. My partner and I are looking at a new $700k townhouse in Richmond — first home for both of us, we earn about $150k combined.'

export function ConversationalFill({ onApply }: { onApply: (fields: ExtractedFields) => void }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<ExtractedFields | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  async function submit() {
    if (pending || text.trim().length < 3) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const body = await res.json().catch(() => null)
      if (res.status === 503) { setUnavailable(true); return }
      if (!res.ok) { setError(body?.error ?? 'Something went wrong — use the questions below.'); return }

      const fields = (body?.fields ?? {}) as ExtractedFields
      if (Object.keys(fields).length === 0) {
        setError('Couldn’t pick out any details from that — try mentioning the state, price, or whether you’ve owned before.')
        return
      }
      onApply(fields)
      setApplied(fields)
    } catch {
      setError('Something went wrong — use the questions below.')
    } finally {
      setPending(false)
    }
  }

  if (unavailable) return null

  return (
    <div className="fhbq-convo">
      <div className="fhbq-convo-head">
        <Sparkles size={14} aria-hidden="true" />
        <span>Skip the typing — describe your situation and we’ll fill in the answers</span>
      </div>

      <div className="fhbq-convo-row">
        <textarea
          className="fhbq-convo-input"
          rows={2}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          disabled={pending}
        />
        <button
          type="button"
          className="fhbq-convo-go"
          onClick={submit}
          disabled={pending || text.trim().length < 3}
          aria-label="Fill my answers from this description"
        >
          {pending ? <Loader2 size={15} className="fhbq-spin-icon" /> : <ArrowRight size={15} />}
        </button>
      </div>

      {error && <p className="fhbq-convo-error" role="alert">{error}</p>}

      {applied && (
        <div className="fhbq-convo-applied" aria-live="polite">
          <span className="lbl">Filled in:</span>
          {(Object.keys(applied) as (keyof ExtractedFields)[]).map((f) => (
            <span key={f} className="chip">
              {FIELD_LABELS[f]}: <b>{formatFieldValue(f, applied[f])}</b>
            </span>
          ))}
          <span className="note">Wrong? Just change the answers below.</span>
        </div>
      )}
    </div>
  )
}
