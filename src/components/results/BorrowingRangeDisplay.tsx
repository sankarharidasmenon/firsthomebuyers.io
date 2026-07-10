'use client'

import React, { useEffect, useRef, useState } from 'react'

interface BorrowingRangeDisplayProps {
  min: number
  max: number
  firstName: string
  depositAmount: number
  targetPropertyPrice: number
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

export function BorrowingRangeDisplay({
  min,
  max,
  firstName,
  depositAmount,
  targetPropertyPrice,
}: BorrowingRangeDisplayProps) {
  const animatedMin = useCountUp(min)
  const animatedMax = useCountUp(max)

  const recommendedMin = min + depositAmount
  const recommendedMax = max + depositAmount

  const monthlyRate = 0.065 / 12
  const termMonths = 360
  const avgLoan = (min + max) / 2
  const monthly = avgLoan > 0
    ? Math.round((avgLoan * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1))
    : 0
  const fortnightly = Math.round((monthly * 12) / 26)

  const name = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : 'you'

  return (
    <div className="px-5 pt-6 pb-5 fade-up border-b border-[#F0F0F0] dark:border-border">
      {/* Label */}
      <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '0.6875rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 4,
        textAlign: 'center',
      }}>
        Your Borrowing Capacity
      </p>

      {/* Personalised heading */}
      <p suppressHydrationWarning className="text-[#111111] dark:text-foreground" style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '0.9375rem',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        Here&apos;s what you could borrow, {name} 🏡
      </p>

      {/* Hero range */}
      <p className="text-[#111111] dark:text-foreground" style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(1.5rem, 6vw, 2.125rem)',
        textAlign: 'center',
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        ${animatedMin.toLocaleString('en-AU')}
        <span className="text-[#CCCCCC] dark:text-border" style={{ fontWeight: 300 }}> — </span>
        ${animatedMax.toLocaleString('en-AU')}
      </p>

      <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.8125rem',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
      }}>
        estimated range at current rates
      </p>

      {/* Recommended property range — subtle accent treatment */}
      <div
        className="rounded-[10px] px-4 py-3 mb-4 bg-[#FEFCE8] dark:bg-surface border border-[#F0E030] dark:border-[rgba(245,230,66,0.25)]"
        style={{ borderLeftWidth: 3 }}
      >
        <p className="text-[#999999] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          Recommended property search range
        </p>
        <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
          ${recommendedMin.toLocaleString('en-AU')} – ${recommendedMax.toLocaleString('en-AU')}
        </p>
        <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginTop: 2 }}>
          borrowing + your ${depositAmount.toLocaleString('en-AU')} deposit
        </p>
      </div>

      {/* Estimated repayments — two stat tiles */}
      <div>
        <p className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 8 }}>
          Estimated repayments
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-[10px] px-4 py-3 bg-[#FAFAFA] dark:bg-surface border border-[#EEEEEE] dark:border-border"
          >
            <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
              ${monthly.toLocaleString('en-AU')}
            </p>
            <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginTop: 2 }}>
              Monthly
            </p>
          </div>
          <div
            className="rounded-[10px] px-4 py-3 bg-[#FAFAFA] dark:bg-surface border border-[#EEEEEE] dark:border-border"
          >
            <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
              ${fortnightly.toLocaleString('en-AU')}
            </p>
            <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginTop: 2 }}>
              Fortnightly
            </p>
          </div>
        </div>
        <p className="text-[#BBBBBB] dark:text-muted-foreground/40 border-t border-[#F5F5F5] dark:border-border" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', marginTop: 8, paddingTop: 8, textAlign: 'center' }}>
          at 6.5% p.a. (current avg variable rate)
        </p>
      </div>

      <p className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.6875rem',
        marginTop: 6,
        textAlign: 'center',
      }}>
        Includes 3% serviceability buffer as required by APRA. This is an estimate only.
      </p>
    </div>
  )
}
