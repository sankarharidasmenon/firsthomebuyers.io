'use client'

import React, { useState } from 'react'
import { ChevronDown, Check, X, ExternalLink } from 'lucide-react'
import type { EvaluatedGrant } from '@/lib/grantEligibility'

// Human-readable benefit descriptions for scheme-type grants (not cash payments)
const SCHEME_BENEFITS: Record<string, string> = {
  fhss: 'Save through your super with tax advantages — up to $50k',
  fhbg: 'Buy with as little as a 5% deposit — no LMI required',
  'shared-equity': 'Government co-buys up to 40% of your home',
}

const STATUS_COLOURS: Record<string, string> = {
  eligible: '#22C55E',
  check: '#F59E0B',
  ineligible: '#D1D5DB',
}

const STATUS_BADGE_STYLES: Record<string, React.CSSProperties> = {
  eligible: { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
  check: { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' },
  ineligible: { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' },
}

const STATUS_LABELS: Record<string, string> = {
  eligible: '✓ Eligible',
  check: '~ Check required',
  ineligible: '✗ Not eligible',
}

interface GrantCardProps {
  evaluatedGrant: EvaluatedGrant
  hidden?: boolean
  variant?: 'grant' | 'scheme'
}

export function GrantCard({ evaluatedGrant, hidden = false, variant = 'grant' }: GrantCardProps) {
  const [open, setOpen] = useState(false)
  const { grant, status, value, criteria, reason, alternative } = evaluatedGrant

  const isScheme = variant === 'scheme'
  const schemeBenefit = SCHEME_BENEFITS[grant.id]

  const valueDisplay =
    typeof value === 'number'
      ? value > 0 ? `$${value.toLocaleString('en-AU')}` : '$0'
      : value

  return (
    <div
      className={`relative bg-white transition-all duration-200 ${hidden ? 'hidden' : ''}`}
      style={{
        borderLeft: `3px solid ${STATUS_COLOURS[status]}`,
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
        border: `1px solid rgba(0,0,0,0.06)`,
        borderLeftWidth: 3,
        borderLeftColor: STATUS_COLOURS[status],
      }}
    >
      {/* Status badge */}
      <span
        className="absolute -top-3.5 left-5 rounded-full px-3 py-1 text-[0.6875rem] font-semibold whitespace-nowrap z-10"
        style={{
          fontFamily: 'Inter, sans-serif',
          background: STATUS_BADGE_STYLES[status].background,
          color: STATUS_BADGE_STYLES[status].color,
          border: STATUS_BADGE_STYLES[status].border,
        }}
      >
        {STATUS_LABELS[status]}
      </span>

      {/* Collapsed row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-3 px-5 pt-7 pb-4 text-left cursor-pointer bg-none border-none"
      >
        {/* Name + optional benefit line for schemes */}
        <div className="flex-1 pr-4">
          <span
            className="block text-[1rem] sm:text-[0.9375rem] font-semibold text-[#111111] leading-snug"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {grant.name}
          </span>
          {isScheme && schemeBenefit && (
            <span
              className="block mt-1"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8125rem',
                color: status === 'eligible' ? '#16A34A' : '#888888',
                lineHeight: 1.4,
              }}
            >
              {status === 'eligible' ? '✓ ' : ''}{schemeBenefit}
            </span>
          )}
        </div>

        {/* Value (only for cash grants) + chevron */}
        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          {!isScheme && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                fontSize: '0.9375rem',
                color: status === 'eligible' ? '#16A34A' : '#9CA3AF',
              }}
            >
              {valueDisplay}
            </span>
          )}
          <ChevronDown
            size={20}
            className="shrink-0 text-grey-mid transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 border-t border-grey-light" style={{ borderTopColor: 'rgba(0,0,0,0.05)' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#444444', marginTop: 12, marginBottom: 12 }}>
            {grant.description}
          </p>

          {/* Criteria */}
          <ul className="flex flex-col gap-2 mb-3">
            {criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                {c.met
                  ? <Check size={14} className="text-[#22C55E] mt-0.5 shrink-0" />
                  : <X size={14} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                }
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#444444' }}>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Ineligible reason */}
          {reason && (
            <div className="rounded-sm p-3 mb-3" style={{ background: '#FFFBEB' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#92400E' }}>
                <strong>Why:</strong> {reason}
              </p>
            </div>
          )}

          {/* Alternative suggestion */}
          {alternative && (
            <div className="rounded-sm p-3 mb-3" style={{ background: '#FBF6A8' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#111111' }}>
                💡 {alternative}
              </p>
            </div>
          )}

          {/* Official link */}
          <a
            href={grant.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[0.8125rem] text-grey-dark underline hover:text-[#111111]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Verify on the official government website
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  )
}
