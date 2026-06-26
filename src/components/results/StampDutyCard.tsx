'use client'

import React, { useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import type { StampDutyResult } from '@/lib/stampDuty'

const STATE_REVENUE_URLS: Record<string, string> = {
  NSW: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer',
  VIC: 'https://www.sro.vic.gov.au/first-home-buyer',
  QLD: 'https://www.qld.gov.au/housing/buying-owning-home/first-home-owner',
  SA: 'https://www.revenuesa.sa.gov.au/grants-and-concessions/first-home-owners',
  WA: 'https://www.finance.wa.gov.au/cms/first_home_owner_grant.aspx',
  TAS: 'https://www.sro.tas.gov.au/first-home-buyers-dutyrelief',
  ACT: 'https://www.revenue.act.gov.au/home-buyer-concessions-and-grants',
  NT: 'https://nt.gov.au/property/buying-property/financial-assistance-for-home-buyers',
}

interface StampDutyCardProps {
  result: StampDutyResult
  state: string
  hidden?: boolean
}

export function StampDutyCard({ result, state, hidden = false }: StampDutyCardProps) {
  const [open, setOpen] = useState(false)
  const status = result.isEligible ? 'eligible' : 'ineligible'

  const borderColour = result.isEligible
    ? result.isPartialConcession ? '#F59E0B' : '#22C55E'
    : '#D1D5DB'

  const statusBadge = result.isEligible
    ? result.isPartialConcession ? '~ Check required' : '✓ Eligible'
    : '✗ Not eligible'

  const badgeStyle = result.isEligible
    ? result.isPartialConcession
      ? { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }
      : { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }
    : { background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }

  const valueDisplay = result.isEligible
    ? result.saving > 0 ? `$${result.saving.toLocaleString('en-AU')} saved` : 'Concession'
    : 'N/A'

  return (
    <div
      className={`relative bg-white dark:bg-card dark:border dark:border-border transition-all duration-200 ${hidden ? 'hidden' : ''}`}
      style={{
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderLeftWidth: 3,
        borderLeftColor: borderColour,
      }}
    >
      {/* Status badge at top left corner */}
      <span
        className="absolute -top-3.5 left-4 sm:left-6 rounded-full px-3.5 py-1 text-[0.7rem] sm:text-[0.75rem] font-semibold whitespace-nowrap z-10"
        style={{
          fontFamily: 'Inter, sans-serif',
          background: badgeStyle.background,
          color: badgeStyle.color,
          border: badgeStyle.border,
        }}
      >
        {statusBadge}
      </span>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 pt-6 sm:p-5 text-left cursor-pointer bg-none border-none"
      >
        <span
          className="flex-1 text-[1rem] sm:text-[0.9375rem] font-semibold text-[#111111] dark:text-foreground leading-snug pr-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Stamp Duty — First Home Buyer Concession
        </span>

        <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-4">
          <span
            className="shrink-0 text-[1.125rem] sm:text-[0.9375rem] font-bold"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: status === 'eligible' ? '#16A34A' : '#9CA3AF',
            }}
          >
            {valueDisplay}
          </span>

          <ChevronDown
            size={20}
            className="shrink-0 text-grey-mid transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-grey-light" style={{ borderTopColor: 'rgba(0,0,0,0.05)' }}>
          <div className="pt-3 space-y-3">
            {/* Two-column comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-[#888888] dark:text-muted-foreground/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>Standard Stamp Duty</p>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.0625rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                  ${result.standardDuty.toLocaleString('en-AU')}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[#888888] dark:text-muted-foreground/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem' }}>With FHB Concession</p>
                <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.0625rem' }}>
                  ${result.concessionDuty.toLocaleString('en-AU')}
                </p>
              </div>
            </div>

            {/* Saving row */}
            {result.saving > 0 && (
              <div
                className="rounded-sm p-3"
                style={{ background: '#F0FDF4' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>You save:</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.25rem', color: '#16A34A' }}>
                    ${result.saving.toLocaleString('en-AU')}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            {result.message && (
              <div
                className="rounded-sm p-3"
                style={{ background: result.isEligible ? '#F0FDF4' : '#FFFBEB' }}
              >
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: result.isEligible ? '#166534' : '#92400E' }}>
                  {result.message}
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <a
              href={STATE_REVENUE_URLS[state] ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[0.8125rem] text-grey-dark dark:text-muted-foreground underline hover:text-[#111111] dark:hover:text-foreground"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              Verify at {state} Revenue Office
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
