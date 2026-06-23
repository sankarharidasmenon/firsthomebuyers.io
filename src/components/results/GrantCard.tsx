'use client'

import React, { useState } from 'react'
import { ChevronDown, Check, X, ExternalLink } from 'lucide-react'
import type { EvaluatedGrant } from '@/lib/grantEligibility'

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
}

export function GrantCard({ evaluatedGrant, hidden = false }: GrantCardProps) {
  const [open, setOpen] = useState(false)
  const { grant, status, value, criteria, reason, alternative } = evaluatedGrant

  const valueDisplay =
    typeof value === 'number'
      ? value > 0 ? `$${value.toLocaleString('en-AU')}` : '$0'
      : value

  return (
    <div
      className={`relative rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-white transition-opacity duration-200 ${hidden ? 'hidden' : ''}`}
      style={{
        borderLeft: `4px solid ${STATUS_COLOURS[status]}`,
      }}
    >
      {/* Status badge at top left corner */}
      <span
        className="absolute -top-3.5 left-4 sm:left-6 rounded-full px-3.5 py-1 text-[0.7rem] sm:text-[0.75rem] font-semibold whitespace-nowrap z-10"
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
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 pt-6 sm:p-5 text-left cursor-pointer bg-none border-none"
      >
        {/* Name */}
        <span
          className="flex-1 text-[1rem] sm:text-[0.9375rem] font-semibold text-[#111111] leading-snug pr-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {grant.name}
        </span>

        <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-4">
          {/* Value */}
          <span
            className="shrink-0 text-[1.125rem] sm:text-[0.9375rem] font-bold"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: status === 'eligible' ? '#16A34A' : '#9CA3AF',
            }}
          >
            {valueDisplay}
          </span>

          {/* Chevron */}
          <ChevronDown
            size={20}
            className="shrink-0 text-[#888888] transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 border-t border-[#F0F0F0]">
          <p
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#444444', marginTop: 12, marginBottom: 12 }}
          >
            {grant.description}
          </p>

          {/* Criteria list */}
          <ul className="flex flex-col gap-2 mb-3">
            {criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                {c.met
                  ? <Check size={14} className="text-[#22C55E] mt-0.5 shrink-0" />
                  : <X size={14} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                }
                <span
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#444444' }}
                >
                  {c.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Ineligible reason */}
          {reason && (
            <div
              className="rounded-[8px] p-3 mb-3"
              style={{ background: '#FFFBEB' }}
            >
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#92400E' }}>
                <strong>Why:</strong> {reason}
              </p>
            </div>
          )}

          {/* Alternative suggestion */}
          {alternative && (
            <div
              className="rounded-[8px] p-3 mb-3"
              style={{ background: '#FBF6A8' }}
            >
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
            className="inline-flex items-center gap-1 text-[0.8125rem] text-[#444444] underline hover:text-[#111111]"
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
