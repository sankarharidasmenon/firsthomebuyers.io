'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { HeroVideo } from './HeroVideo'

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
    <section style={{ background: 'var(--background)', padding: '40px 20px' }} className="lg:py-16">
      <style>{`
        /*
         * Three-child grid layout.
         *
         * Mobile (flex-col):  heading → video → cards → CTA
         * Desktop (grid):     col-1 = video (spans both rows)
         *                     col-2 row-1 = heading
         *                     col-2 row-2 = cards + CTA
         */
        .fn-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .fn-layout-heading { order: 1; }
        .fn-layout-video   { order: 2; }
        .fn-layout-cards   { order: 3; }

        @media (min-width: 1024px) {
          .fn-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
            column-gap: 48px;
            row-gap: 0;
          }
          /* Video: left column, spans both rows, stretches full height */
          .fn-layout-video {
            grid-column: 1;
            grid-row: 1 / 3;
            order: unset;
            display: flex;
            flex-direction: column;
          }
          /* The grow wrapper fills remaining height.
             display:block lets HeroVideo's height:100% resolve against it. */
          .fn-video-grow {
            flex: 1;
            display: block;
          }
          /* Heading: right col, row 1 */
          .fn-layout-heading {
            grid-column: 2;
            grid-row: 1;
            order: unset;
            text-align: left !important;
            padding-bottom: 20px;
          }
          /* Cards + CTA: right col, row 2 */
          .fn-layout-cards {
            grid-column: 2;
            grid-row: 2;
            order: unset;
          }
          .fn-cta-wrapper { text-align: left !important; }
        }
      `}</style>

      <div className="max-w-275 mx-auto lg:px-12">
        <div className="fn-layout">

          {/* ── HEADING  mobile:1st  /  desktop: col-2 row-1 ── */}
          <h2
            className="fn-layout-heading"
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              color: 'var(--foreground)',
              textAlign: 'center',
              margin: 0,
            }}
          >
            Your results in 3 simple steps
          </h2>

          {/* ── VIDEO  mobile:2nd  /  desktop: col-1 rows 1+2 ── */}
          <div className="fn-layout-video">
            {/* Eyebrow label — visible on both mobile and desktop */}
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted-foreground)',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              SEE HOW IT WORKS
            </p>
            {/* On desktop this div flexes to fill remaining column height,
                centering the 16:9 embed so it doesn't leave a large gap below */}
            <div className="fn-video-grow">
              <HeroVideo />
            </div>
          </div>

          {/* ── CARDS + CTA  mobile:3rd  /  desktop: col-2 row-2 ── */}
          <div className="fn-layout-cards">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STEPS.map(step => (
                <div
                  key={step.num}
                  className="card-lift"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
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
                        color: 'var(--brand-gold)',
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
                        color: 'var(--foreground)',
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
                        color: 'var(--muted-foreground)',
                        lineHeight: 1.5,
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="fn-cta-wrapper" style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => router.push('/onboarding?flow=grants')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, var(--brand-gradient-start) 0%, var(--brand-gradient-end) 100%)',
                  color: 'var(--brand-dark-surface)',
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
                className="hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(245,230,66,0.55)] transition-all duration-150"
              >
                Get my personalised results →
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
