'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Landmark, Receipt, Wallet } from 'lucide-react'
import { categoryDisplay, taxDisplay, totalBenefitDisplay, type EligibilitySummary } from '@/lib/schemes/summary'

interface TotalSavingsHeroProps {
  /** Derived from the same items that render the scheme cards below. */
  summary: EligibilitySummary
  state: string
  /** The applicant's target purchase price — shown as brief context under the
      headline, the one figure on this page not derivable from anything else here. */
  targetPrice: number
}

function useCountUp(target: number, duration = 700) {
  const [current, setCurrent] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return current
}

export function TotalSavingsHero({ summary, state, targetPrice }: TotalSavingsHeroProps) {
  const cash = categoryDisplay(summary.cash, {
    costed: 'direct payment', uncosted: 'amount varies', none: 'none eligible yet',
  })
  const tax = taxDisplay(summary)
  const total = totalBenefitDisplay(summary)
  const eligibleSchemesCount = summary.schemes.eligibleCount
  const totalEligibleCount = summary.totalEligible

  // Count up only where there is a figure to count to; "Available" and "—" are
  // rendered as-is.
  const animatedTotal = useCountUp(summary.totalBenefit)
  const animatedCash = useCountUp(summary.cash.total)
  const animatedTax = useCountUp(summary.duty?.calculable ? summary.duty.saving ?? 0 : summary.tax.total)
  const totalValue = summary.totalBenefit > 0
    ? `$${animatedTotal.toLocaleString('en-AU')}${summary.totalUncosted > 0 ? '+' : ''}`
    : total.value
  const cashValue = summary.cash.total > 0
    ? `$${animatedCash.toLocaleString('en-AU')}${summary.cash.uncostedCount > 0 ? ` + ${summary.cash.uncostedCount} more` : ''}`
    : cash.value
  const taxValue = summary.tax.total > 0 ? `$${animatedTax.toLocaleString('en-AU')}` : tax.value

  return (
    <div className="px-6 pt-7 pb-5 border-b border-[rgba(0,0,0,0.06)] dark:border-border">
      {/* Eyebrow */}
      <p
        className="text-[#999999] dark:text-muted-foreground/60 text-center"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}
      >
        Government assistance · {state}
      </p>

      {/* Headline — the one number this whole page adds up to, and the ONE
          place the teal→violet gradient is spent (Opal Fintech: everywhere
          else money is solid teal, GrantCard included — the gradient never
          repeats, or it stops being a signature and becomes a decoration). */}
      <div className="text-center" style={{ marginBottom: 18 }}>
        <p
          className={summary.totalBenefit > 0 ? '' : 'text-[#CCCCCC] dark:text-muted-foreground/40'}
          style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
            fontSize: 'clamp(2rem, 7vw, 2.75rem)',
            ...(summary.totalBenefit > 0
              ? {
                  backgroundImage: 'linear-gradient(90deg, #00967F 0%, #9B5FD9 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }
              : {}),
          }}
        >
          {totalValue}
        </p>
        <p className="text-[#888888] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', marginTop: 4 }}>
          total benefit{targetPrice > 0 ? ` on a $${targetPrice.toLocaleString('en-AU')} property` : ''}
        </p>
        {total.note && (
          <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginTop: 2 }}>
            {total.note}
          </p>
        )}
      </div>

      {/* Breakdown — supporting detail under the headline, not a second peer total */}
      <div className="grid grid-cols-3" style={{ marginBottom: 16 }}>
        <div className="flex flex-col items-center text-center px-2 py-1">
          <Wallet size={13} className="text-[#AAAAAA] dark:text-muted-foreground/50" style={{ marginBottom: 5 }} strokeWidth={2} />
          <p
            className={cash.muted ? 'text-[#CCCCCC] dark:text-muted-foreground/40' : 'text-[#111111] dark:text-foreground'}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2, marginBottom: 3 }}
          >
            {cashValue}
          </p>
          <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Grants
          </p>
        </div>

        <div className="flex flex-col items-center text-center px-2 py-1 border-l border-[rgba(0,0,0,0.06)] dark:border-border">
          <Receipt size={13} className="text-[#AAAAAA] dark:text-muted-foreground/50" style={{ marginBottom: 5 }} strokeWidth={2} />
          <p
            className={tax.muted ? 'text-[#CCCCCC] dark:text-muted-foreground/40' : 'text-[#111111] dark:text-foreground'}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2, marginBottom: 3 }}
          >
            {taxValue}
          </p>
          <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Tax &amp; Duty
          </p>
        </div>

        <div className="flex flex-col items-center text-center px-2 py-1 border-l border-[rgba(0,0,0,0.06)] dark:border-border">
          <Landmark size={13} className="text-[#AAAAAA] dark:text-muted-foreground/50" style={{ marginBottom: 5 }} strokeWidth={2} />
          <p
            className={eligibleSchemesCount > 0 ? 'text-[#111111] dark:text-foreground' : 'text-[#CCCCCC] dark:text-muted-foreground/40'}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2, marginBottom: 3 }}
          >
            {eligibleSchemesCount > 0 ? String(eligibleSchemesCount) : '—'}
          </p>
          <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Schemes
          </p>
        </div>
      </div>

      {/* Eligible count badge */}
      {totalEligibleCount > 0 && (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 bg-[#E6F7F3] dark:bg-[rgba(61,219,191,0.1)] border border-[#B8E8DD] dark:border-[rgba(61,219,191,0.25)] rounded-full px-3 py-1"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: '#00786B' }}
          >
            <CheckCircle2 size={13} strokeWidth={2.5} />
            {totalEligibleCount} benefit{totalEligibleCount !== 1 ? 's' : ''} found for you in {state}
          </span>
        </div>
      )}
    </div>
  )
}
