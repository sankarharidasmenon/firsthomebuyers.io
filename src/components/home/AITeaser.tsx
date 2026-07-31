'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

const CHIPS = [
  { icon: '🏛️', label: 'What grants can I get?' },
  { icon: '💰', label: 'How much can I borrow?' },
  { icon: '🏠', label: 'Can I buy with 5% deposit?' },
  { icon: '📋', label: 'What is the FHSS scheme?' },
  { icon: '💡', label: 'Do I need LMI?' },
]

export function AITeaser() {
  const router = useRouter()
  const handleChip = () => router.push('/onboarding?flow=grants')

  return (
    <section style={{ background: 'var(--background)', padding: '56px 20px' }} className="lg:py-20">
      <div className="max-w-[1100px] mx-auto lg:px-12">

        {/* Section label */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          AI-POWERED GUIDANCE
        </p>

        {/* Heading */}
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            color: 'var(--foreground)',
            textAlign: 'center',
            maxWidth: 480,
            margin: '0 auto 16px',
          }}
        >
          Got questions? Ask FirstHomeBuyers AI.
        </h2>

        {/* Sub-copy */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.9375rem',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            maxWidth: 520,
            margin: '0 auto 32px',
            lineHeight: 1.7,
          }}
        >
          Our AI knows every Australian grant, scheme, and eligibility rule.
          Ask it anything about your home buying journey.
        </p>

        {/* Chips */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          {CHIPS.map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={handleChip}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                border: '1px solid var(--border)',
                borderRadius: 9999,
                padding: '10px 18px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'var(--secondary-foreground)',
                background: 'var(--card)',
                cursor: 'pointer',
                transition: 'border-color 150ms, background 150ms, transform 150ms',
              }}
              className="hover:border-foreground hover:bg-accent hover:-translate-y-[1px]"
            >
              <span>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => router.push('/onboarding?flow=grants')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#111111',
              color: '#F5E642',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: 'none',
              borderRadius: 9999,
              padding: '16px 28px',
              cursor: 'pointer',
            }}
            className="hover:bg-[#222222] transition-colors"
          >
            Explore with AI guidance →
          </button>
        </div>

        {/* Note */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
          }}
        >
          Powered by Claude AI · Not financial advice
        </p>
      </div>
    </section>
  )
}
