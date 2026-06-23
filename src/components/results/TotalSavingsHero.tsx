'use client'

import React, { useEffect, useRef, useState } from 'react'

interface TotalSavingsHeroProps {
  total: number
  eligibleCount: number
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

export function TotalSavingsHero({ total, eligibleCount, state }: TotalSavingsHeroProps) {
  const animated = useCountUp(total)

  return (
    <div
      className="px-5 pt-6 pb-6 text-center fade-up"
      style={{
        background: 'linear-gradient(180deg, #FFFEF0 0%, #FFFFFF 100%)',
        borderBottom: '1px solid #F5F5F5',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '0.6875rem',
          letterSpacing: '0.12em',
          color: '#888888',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        YOUR ESTIMATED SAVINGS
      </p>

      <p
        className="gradient-text"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700,
          fontSize: 'clamp(2.25rem, 8vw, 3rem)',
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        ${animated.toLocaleString('en-AU')}
      </p>

      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '0.875rem',
          color: '#555555',
          marginBottom: 12,
        }}
      >
        from grants &amp; stamp duty concessions
      </p>

      {eligibleCount > 0 && (
        <div
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
            border: '1px solid #BBF7D0',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#16A34A',
            boxShadow: '0 2px 8px rgba(34,197,94,0.15)',
          }}
        >
          ✓ {eligibleCount} scheme{eligibleCount !== 1 ? 's' : ''} found for you in {state}
        </div>
      )}
    </div>
  )
}
