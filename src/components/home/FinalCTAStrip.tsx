'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function FinalCTAStrip() {
  const router = useRouter()

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #FDFCF7 0%, #FFFBE6 50%, #FEF0B2 100%)',
        padding: '64px 20px',
      }}
      className="lg:py-24"
    >
      <div
        className="max-w-[640px] mx-auto"
        style={{ textAlign: 'center' }}
      >
        <h2
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(1.375rem, 4vw, 1.75rem)',
            color: '#111111',
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          Ready to see what you qualify for?
        </h2>

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.9375rem',
            color: '#444444',
            maxWidth: 480,
            margin: '0 auto 32px',
            lineHeight: 1.7,
          }}
        >
          Join thousands of Australians who discovered their grant eligibility
          in under 3 minutes.
        </p>

        <button
          type="button"
          onClick={() => router.push('/onboarding?flow=grants')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#111111',
            color: '#F5E642',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 9999,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            marginBottom: 20,
          }}
          className="text-[0.875rem] lg:text-[0.9375rem] px-6 py-4 lg:px-10 lg:py-5 whitespace-nowrap hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(0,0,0,0.28)] transition-all duration-150 w-full sm:w-auto"
        >
          CHECK MY GRANT ELIGIBILITY →
        </button>

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            display: 'block',
          }}
        >
          {/* ✓ No sign-up &nbsp;·&nbsp; */}
           ✓ No credit check &nbsp;·&nbsp; ✓ 100% Free
        </p>
      </div>
    </section>
  )
}
