'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    num: '01',
    icon: '📋',
    title: 'Tell us about you',
    desc: "Your income, savings, and which state you're buying in. Takes 3 minutes.",
  },
  {
    num: '02',
    icon: '🏛️',
    title: 'See your grants instantly',
    desc: 'We match you to every federal and state scheme you qualify for — automatically.',
  },
  {
    num: '03',
    icon: '💰',
    title: 'Know your borrowing power',
    desc: 'Get your estimated borrowing range and repayment figures — no credit check.',
  },
]

export function HowItWorks() {
  const router = useRouter()

  return (
    <section style={{ background: 'white', padding: '40px 20px' }} className="lg:py-16">
      <style>{`
        @media (min-width: 1024px) {
          .fn-steps { grid-template-columns: 1fr auto 1fr auto 1fr !important; }
        }
      `}</style>
      <div className="max-w-[1100px] mx-auto lg:px-12">

        <h2
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            color: '#111111',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Your results in 3 simple steps
        </h2>

        {/* Steps — single-col mobile, 3-col with arrows on desktop */}
        <div
          className="fn-steps grid gap-4"
          style={{ gridTemplateColumns: '1fr' }}
        >
          {STEPS.map((step, i) => (
            <React.Fragment key={step.num}>
              {/* Step card */}
              <div
                className="card-lift"
                style={{
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.04)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      color: '#D4C400',
                      lineHeight: 1,
                    }}
                  >
                    {step.num}
                  </p>
                  <div style={{ fontSize: '1.5rem' }}>{step.icon}</div>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: '#111111',
                      marginBottom: 4,
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '0.875rem',
                      color: '#666666',
                      lineHeight: 1.5,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Arrow connector — desktop only */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden lg:flex items-center justify-center"
                  style={{ color: '#DDDDDD', fontSize: '1.75rem', padding: '0 4px' }}
                  aria-hidden="true"
                >
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Section CTA */}
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <button
            type="button"
            onClick={() => router.push('/onboarding?flow=grants')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #F5E642 0%, #EDD900 100%)',
              color: '#111111',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 9999,
              padding: '16px 28px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,230,66,0.40)',
            }}
            className="hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(245,230,66,0.55)] transition-all duration-150"
          >
            Get my personalised results →
          </button>
        </div>
      </div>
    </section>
  )
}
