'use client'

import React from 'react'

interface DepositGapIndicatorProps {
  depositAmount: number
  targetPropertyPrice: number
}

export function DepositGapIndicator({ depositAmount, targetPropertyPrice }: DepositGapIndicatorProps) {
  const twentyPct = targetPropertyPrice * 0.2
  const gap = Math.max(twentyPct - depositAmount, 0)
  const needsLMI = depositAmount < twentyPct
  const depositPct = targetPropertyPrice > 0
    ? Math.round((depositAmount / targetPropertyPrice) * 100)
    : 0

  if (!needsLMI) {
    return (
      <div
        className="mx-5 mt-3 rounded-[8px] p-4 bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.06)] border-l-4 border-[#22C55E] dark:border-[rgba(34,197,94,0.4)]"
      >
        <p className="text-[#16A34A]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4 }}>
          ✓ No LMI required
        </p>
        <p className="text-[#166534] dark:text-[#86EFAC]" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
          Your deposit covers {depositPct}% of the property price — above the 20% threshold.
        </p>
      </div>
    )
  }

  return (
    <div
      className="mx-5 mt-3 rounded-[8px] p-4 bg-[#FFFBEB] dark:bg-[rgba(245,158,11,0.06)] border-l-4 border-[#F59E0B] dark:border-[rgba(245,158,11,0.4)]"
    >
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 6 }}>
        💡 Deposit Gap
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: 8 }}>
        To avoid Lenders Mortgage Insurance (LMI), you&apos;d need an extra:
      </p>
      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.25rem', color: '#F59E0B', marginBottom: 8 }}>
        ${gap.toLocaleString('en-AU')}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--secondary-foreground)', marginBottom: 8 }}>
        LMI is a one-off fee charged when your deposit is below 20% of the property price — it protects the lender, not you.
      </p>
      <a
        href="https://www.moneysmart.gov.au/home-loans/mortgage-calculators-and-resources/lenders-mortgage-insurance"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: '#F59E0B', textDecoration: 'underline' }}
      >
        Learn more about LMI →
      </a>
    </div>
  )
}
