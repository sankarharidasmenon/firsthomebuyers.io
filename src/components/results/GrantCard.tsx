'use client'

import React, { useState } from 'react'
import { ChevronDown, Check, X, ExternalLink } from 'lucide-react'
import type { EvaluatedGrant } from '@/lib/schemes/types'
import { formatDuty, type DutyOutcome } from '@/lib/schemes/stampDuty'

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
  /**
   * Calculated duty for a duty scheme the applicant is eligible for. Supplied by
   * the page from the same calculator the summary card uses, so the card and the
   * header can never show different savings.
   */
  duty?: DutyOutcome | null
  /**
   * 1-based position of this card in the visible list, counted across every
   * section rather than restarting per section. Presentation only — the page
   * derives it from the render order, nothing derives it from eligibility.
   * Omitted (undefined) renders no numeral, so existing callers are unchanged.
   */
  index?: number
}

export function GrantCard({ evaluatedGrant, hidden = false, variant = 'grant', duty = null, index }: GrantCardProps) {
  const [open, setOpen] = useState(false)
  const { grant, status, value, criteria, reason, alternative } = evaluatedGrant

  const isScheme = variant === 'scheme'
  const schemeBenefit = grant.benefitLine

  const valueDisplay =
    typeof value === 'number'
      ? value > 0 ? `$${value.toLocaleString('en-AU')}` : '$0'
      : value

  return (
    <div
      className={`relative bg-white dark:bg-card dark:border dark:border-border transition-all duration-200 ${hidden ? 'hidden' : ''}`}
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
        {/* Sequential position in the visible list. Decorative — the accessible
            name of the card is the scheme name, so this is hidden from screen
            readers rather than read out as part of it. */}
        {index !== undefined && (
          <span
            aria-hidden="true"
            className="shrink-0 tabular-nums select-none text-[#9CA3AF] dark:text-muted-foreground/60"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.8125rem',
              lineHeight: '1.375rem',
              minWidth: 16,
            }}
          >
            {index}
          </span>
        )}

        {/* Name + optional benefit line for schemes */}
        <div className="flex-1 pr-4">
          <span
            className="block text-[1rem] sm:text-[0.9375rem] font-semibold text-[#111111] dark:text-foreground leading-snug"
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
            // In dark mode: eligible stays green, ineligible gets lighter
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
                fontFamily: 'Inter, sans-serif',
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
          {duty && (
            <div
              className="bg-[#F9FAFB] dark:bg-muted/20 rounded-xl px-4 py-3"
              style={{ marginTop: 12, fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem' }}
            >
              {duty.calculable && duty.payable !== null && duty.saving !== null ? (
                <>
                  <div className="flex justify-between" style={{ marginBottom: 6 }}>
                    <span className="text-[#666666] dark:text-muted-foreground">Normal duty</span>
                    <span className="text-[#111111] dark:text-foreground" style={{ fontWeight: 600 }}>
                      ${formatDuty(duty.standard)}
                    </span>
                  </div>
                  <div className="flex justify-between" style={{ marginBottom: 6 }}>
                    <span className="text-[#666666] dark:text-muted-foreground">Duty payable</span>
                    <span className="text-[#111111] dark:text-foreground" style={{ fontWeight: 600 }}>
                      ${formatDuty(duty.payable)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between pt-2"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <span className="text-[#111111] dark:text-foreground" style={{ fontWeight: 600 }}>You save</span>
                    <span className="text-[#16A34A]" style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                      ${formatDuty(duty.saving)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-[#666666] dark:text-muted-foreground">Duty saving</span>
                  <span className="text-[#B45309]" style={{ fontWeight: 600 }}>Check required</span>
                </div>
              )}
              <p className="text-[#999999] dark:text-muted-foreground/60" style={{ fontSize: '0.75rem', marginTop: 8 }}>
                {duty.note}
              </p>
            </div>
          )}
          <p className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', marginTop: 12, marginBottom: 12 }}>
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
                <span className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
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
            className="inline-flex items-center gap-1 text-[0.8125rem] text-grey-dark dark:text-muted-foreground underline hover:text-[#111111] dark:hover:text-foreground"
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
