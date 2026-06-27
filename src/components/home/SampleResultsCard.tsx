'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

const GRANTS = [
  { name: 'First Home Owner Grant', value: '$10,000' },
  { name: 'First Home Guarantee', value: 'No LMI' },
  { name: 'Stamp Duty Concession', value: '$12,500' },
  { name: 'FHSS Scheme', value: 'Up to $50k' },
]

export function SampleResultsCard() {
  const router = useRouter()

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating badge — overlaps top edge */}
      <div
        style={{
          position: 'absolute',
          top: -14,
          left: 24,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 9999,
          padding: '5px 12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '0.75rem',
          color: 'var(--secondary-foreground)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        🏛️ Based on VIC eligibility rules 2025
      </div>

      {/* Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          padding: 32,
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            SAMPLE RESULTS — FIRST HOME BUYER · VIC
          </p>
          <span
            style={{
              background: 'var(--color-green-50)',
              color: 'var(--color-green-600)',
              border: '1px solid var(--color-green-200)',
              borderRadius: 9999,
              padding: '3px 10px',
              fontSize: '0.6875rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            ✓ Eligible
          </span>
        </div>

        {/* Borrowing capacity */}
        <div style={{ marginBottom: 12 }}>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
              marginBottom: 4,
            }}
          >
            BORROWING CAPACITY
          </p>
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '1.875rem',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            $480k – $535k
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              marginTop: 4,
            }}
          >
            at current avg rates · 6.5% p.a.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

        {/* Estimated savings */}
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
              marginBottom: 4,
            }}
          >
            ESTIMATED SAVINGS
          </p>
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '2.25rem',
              color: 'var(--foreground)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            $32,500
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              marginTop: 4,
            }}
          >
            from grants &amp; stamp duty concessions
          </p>
        </div>

        {/* Grant list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {GRANTS.map(g => (
            <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--color-green-500)', fontSize: '0.8125rem', fontWeight: 700 }}>✓</span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.8125rem',
                    color: 'var(--secondary-foreground)',
                  }}
                >
                  {g.name}
                </span>
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8125rem',
                  color: 'var(--color-green-600)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginLeft: 8,
                }}
              >
                {g.value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 24px' }} />

        {/* Card CTA */}
        <button
          type="button"
          onClick={() => router.push('/onboarding?flow=grants')}
          className="w-full btn-shine"
          style={{
            display: 'block',
            width: '100%',
            background: 'var(--brand-dark-surface)',
            color: 'var(--brand-yellow)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            borderRadius: 9999,
            padding: '14px 24px',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          See your actual results →
        </button>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            marginTop: 10,
          }}
        >
          Takes about few minutes · 100% free
        </p>
      </div>
    </div>
  )
}
