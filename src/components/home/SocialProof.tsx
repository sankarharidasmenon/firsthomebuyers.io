'use client'

import React from 'react'

const STATS = [
  { value: '$41,800', label: 'Average grant savings for eligible VIC buyers' },
  { value: '5%', label: 'Minimum deposit with First Home Guarantee' },
  { value: '~3 min', label: 'Average time to complete your assessment' },
]

export function SocialProof() {
  return (
    <section style={{ background: 'var(--secondary)', padding: '56px 20px' }} className="lg:py-20">
      <div className="max-w-[1150px] mx-auto px-4 lg:px-4">

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">

          {/* LEFT — stat block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {STATS.map(s => (
              <div key={s.value}>
                <p
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                    color: 'var(--brand-gold)',
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '0.875rem',
                    color: 'var(--muted-foreground)',
                    lineHeight: 1.5,
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT — testimonial card */}
          <div
            style={{
              background: 'var(--secondary)',
              borderRadius: 16,
              padding: '24px 28px',
              border: '1px solid var(--border)',
            }}
          >
            {/* Stars */}
            <p style={{ fontSize: '1rem', marginBottom: 14, letterSpacing: '0.05em' }}>⭐⭐⭐⭐⭐</p>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '1rem',
                color: 'var(--foreground)',
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginBottom: 16,
              }}
            >
              &ldquo;I had no idea I qualified for $22,000 in grants. FirstNest found
              them all in minutes — genuinely life-changing for us.&rdquo;
            </p>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '0.8125rem',
                color: 'var(--muted-foreground)',
              }}
            >
              — Priya M., first home buyer, Melbourne 2024
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
