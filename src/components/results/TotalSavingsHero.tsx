'use client'

import { useEffect, useRef, useState } from 'react'

interface TotalSavingsHeroProps {
  cashGrantsTotal: number
  taxSavingsTotal: number
  eligibleSchemesCount: number
  totalEligibleCount: number
  state: string
}

function useCountUp(target: number, duration = 900) {
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

export function TotalSavingsHero({
  cashGrantsTotal,
  taxSavingsTotal,
  eligibleSchemesCount,
  totalEligibleCount,
  state,
}: TotalSavingsHeroProps) {
  const animatedCash = useCountUp(cashGrantsTotal)
  const animatedTax = useCountUp(taxSavingsTotal)

  return (
    <div
      className="px-6 pt-7 pb-6 fade-up bg-[linear-gradient(180deg,#FEFEF5_0%,#FFFFFF_100%)] dark:[background:var(--card)] border-b border-[rgba(0,0,0,0.05)] dark:border-border"
    >
      {/* Eyebrow */}
      <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 20,
      }}>
        Government assistance · {state}
      </p>

      {/* Three stats */}
      <div className="grid grid-cols-3" style={{ marginBottom: 20 }}>

        {/* Cash Grants */}
        <div className="flex flex-col items-center text-center px-2 py-1">
          <span style={{ fontSize: '1rem', marginBottom: 8, opacity: 0.85 }}>💰</span>
          <p
            className={cashGrantsTotal > 0 ? 'text-[#16A34A]' : 'text-[#CCCCCC] dark:text-muted-foreground/40'}
            style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1rem, 3.5vw, 1.375rem)', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.01em' }}
          >
            {cashGrantsTotal > 0 ? `$${animatedCash.toLocaleString('en-AU')}` : '—'}
          </p>
          <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3, lineHeight: 1.25 }}>
            Cash Grants
          </p>
          <p className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', lineHeight: 1.3 }}>
            {cashGrantsTotal > 0 ? 'direct payment' : 'none eligible yet'}
          </p>
        </div>

        {/* Tax & Duty Savings */}
        <div className="flex flex-col items-center text-center px-2 py-1 border-l border-[rgba(0,0,0,0.07)] dark:border-border">
          <span style={{ fontSize: '1rem', marginBottom: 8, opacity: 0.85 }}>🧾</span>
          <p
            className={taxSavingsTotal > 0 ? 'text-[#111111] dark:text-foreground' : 'text-[#CCCCCC] dark:text-muted-foreground/40'}
            style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1rem, 3.5vw, 1.375rem)', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.01em' }}
          >
            {taxSavingsTotal > 0 ? `$${animatedTax.toLocaleString('en-AU')}` : '—'}
          </p>
          <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3, lineHeight: 1.25 }}>
            Tax &amp; Duty Savings
          </p>
          <p className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', lineHeight: 1.3 }}>
            {taxSavingsTotal > 0 ? 'stamp duty reduction' : 'not eligible'}
          </p>
        </div>

        {/* Govt Schemes */}
        <div className="flex flex-col items-center text-center px-2 py-1 border-l border-[rgba(0,0,0,0.07)] dark:border-border">
          <span style={{ fontSize: '1rem', marginBottom: 8, opacity: 0.85 }}>🏠</span>
          <p
            className={eligibleSchemesCount > 0 ? 'text-[#111111] dark:text-foreground' : 'text-[#CCCCCC] dark:text-muted-foreground/40'}
            style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1rem, 3.5vw, 1.375rem)', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.01em' }}
          >
            {eligibleSchemesCount > 0 ? String(eligibleSchemesCount) : '—'}
          </p>
          <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3, lineHeight: 1.25 }}>
            Govt Schemes
          </p>
          <p className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', lineHeight: 1.3 }}>
            {eligibleSchemesCount === 1 ? 'scheme eligible' : eligibleSchemesCount > 1 ? 'schemes eligible' : 'check criteria'}
          </p>
        </div>

      </div>

      {/* Eligible count badge */}
      {totalEligibleCount > 0 && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 bg-[#F0FDF4] dark:bg-[rgba(34,197,94,0.08)] border border-[#DCFCE7] dark:border-[rgba(34,197,94,0.2)] rounded-full px-3.5 py-1.5" style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#16A34A',
          }}>
            ✓ {totalEligibleCount} benefit{totalEligibleCount !== 1 ? 's' : ''} found for you in {state}
          </span>
        </div>
      )}
    </div>
  )
}
