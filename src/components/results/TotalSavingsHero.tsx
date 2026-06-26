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

  const stats = [
    {
      icon: '💰',
      label: 'Cash Grants',
      value: cashGrantsTotal > 0 ? `$${animatedCash.toLocaleString('en-AU')}` : '—',
      valueColour: cashGrantsTotal > 0 ? '#16A34A' : '#CCCCCC',
      sub: cashGrantsTotal > 0 ? 'direct payment' : 'none eligible yet',
    },
    {
      icon: '🧾',
      label: 'Tax & Duty Savings',
      value: taxSavingsTotal > 0 ? `$${animatedTax.toLocaleString('en-AU')}` : '—',
      valueColour: taxSavingsTotal > 0 ? '#111111' : '#CCCCCC',
      sub: taxSavingsTotal > 0 ? 'stamp duty reduction' : 'not eligible',
    },
    {
      icon: '🏠',
      label: 'Govt Schemes',
      value: eligibleSchemesCount > 0 ? String(eligibleSchemesCount) : '—',
      valueColour: eligibleSchemesCount > 0 ? '#111111' : '#CCCCCC',
      sub: eligibleSchemesCount === 1 ? 'scheme eligible' : eligibleSchemesCount > 1 ? 'schemes eligible' : 'check criteria',
    },
  ]

  return (
    <div
      className="px-6 pt-7 pb-6 fade-up"
      style={{
        background: 'linear-gradient(180deg, #FEFEF5 0%, #FFFFFF 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* Eyebrow */}
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        color: '#BBBBBB',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 20,
      }}>
        Government assistance · {state}
      </p>

      {/* Three stats — open columns, no tile backgrounds */}
      <div className="grid grid-cols-3" style={{ marginBottom: 20 }}>
        {stats.map(({ icon, label, value, valueColour, sub }, i) => (
          <div
            key={label}
            className="flex flex-col items-center text-center px-2 py-1"
            style={{
              borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.07)' : undefined,
            }}
          >
            <span style={{ fontSize: '1rem', marginBottom: 8, opacity: 0.85 }}>{icon}</span>
            <p style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: 'clamp(1rem, 3.5vw, 1.375rem)',
              color: valueColour,
              lineHeight: 1,
              marginBottom: 6,
              letterSpacing: '-0.01em',
            }}>
              {value}
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.625rem',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#AAAAAA',
              marginBottom: 3,
              lineHeight: 1.25,
            }}>
              {label}
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.625rem',
              color: '#CCCCCC',
              lineHeight: 1.3,
            }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Eligible count badge */}
      {totalEligibleCount > 0 && (
        <div className="flex justify-center">
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#F0FDF4',
            border: '1px solid #DCFCE7',
            borderRadius: 9999,
            padding: '5px 14px',
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
