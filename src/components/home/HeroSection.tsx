'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SampleResultsCard } from './SampleResultsCard'

const MOBILE_STATS = [
  { value: 'Up to $41,800', label: 'in grants' },
  { value: 'Borrow $535k', label: 'estimated capacity' },
  { value: '~3 min', label: 'to check' },
]

export function HeroSection() {
  const router = useRouter()
  const [firstName, setFirstName] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [flow, setFlow] = useState<'grants' | 'borrowing'>('grants')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const step1Raw = localStorage.getItem('firstnest_step_1')
      const progressRaw = localStorage.getItem('firstnest_progress')
      if (step1Raw) {
        const s1 = JSON.parse(step1Raw)
        if (s1.firstName) setFirstName(s1.firstName)
      }
      if (progressRaw) {
        const pg = JSON.parse(progressRaw)
        if (pg.currentStep) setCurrentStep(pg.currentStep)
        if (pg.flow) setFlow(pg.flow)
        // Check TTL
        if (pg.expiresAt && new Date(pg.expiresAt) < new Date()) {
          setFirstName(null)
          setCurrentStep(null)
        }
      }
    } catch {}
    setIsLoaded(true)
  }, [])

  const isReturning = isLoaded && !!firstName && !!currentStep
  const remainingSteps = currentStep ? 4 - currentStep : 0
  const remainingMins = Math.max(1, remainingSteps)

  return (
    <section
      className="w-full bg-white"
      style={{ paddingBottom: '32px' }}
    >
      <div
        className="max-w-[1100px] mx-auto px-5 lg:px-12 pt-6 lg:pt-10"
      >
        {/* ── Desktop: two-column 60/40 ── */}
        <div className="lg:grid lg:gap-16 lg:items-center" style={{ gridTemplateColumns: '1fr 420px' }}>

          {/* LEFT COLUMN */}
          <div>
            {isReturning ? (
              /* ── RETURNING USER ── */
              <div>
                <h1
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    color: '#111111',
                    lineHeight: 1.15,
                    marginBottom: 16,
                  }}
                >
                  Welcome back, {firstName} 👋
                </h1>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '1rem',
                    color: '#555555',
                    marginBottom: 20,
                  }}
                >
                  Let&apos;s pick up where you left off.
                </p>

                {/* Progress chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                  {[
                    `Step ${currentStep} of 4 complete`,
                    `⏱ ~${remainingMins} min left`,
                    flow === 'grants' ? '🏛️ Checking grants' : '💰 Checking borrowing',
                  ].map(chip => (
                    <span
                      key={chip}
                      style={{
                        background: 'white',
                        border: '1px solid #EEEEEE',
                        borderRadius: 9999,
                        padding: '7px 16px',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        color: '#444444',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                {/* Returning CTA pair — side by side */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/onboarding?flow=${flow}&step=${currentStep}`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#111111',
                      color: '#F5E642',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      letterSpacing: '0.02em',
                      border: 'none',
                      borderRadius: 9999,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Continue →
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push('/onboarding?flow=grants')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#FFFFFF',
                      color: '#444444',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      border: '1.5px solid #DDDDDD',
                      borderRadius: 9999,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    className="hover:border-[#111111] transition-colors duration-150"
                  >
                    Start fresh
                  </button>
                </div>
              </div>
            ) : (
              /* ── FIRST-TIME VISITOR ── */
              <div>
                {/* Two-line headline */}
                <h1
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 800,
                    lineHeight: 1.06,
                    marginBottom: 28,
                    letterSpacing: '-0.035em',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)',
                      color: '#111111',
                    }}
                  >
                    Your home buying
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)',
                      color: '#111111',
                    }}
                  >
                    journey starts
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'clamp(2.25rem, 5.5vw, 3.5rem)',
                      color: '#C8AA00',
                    }}
                  >
                    here.
                  </span>
                </h1>

                {/* Sub-paragraph */}
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '1.0625rem',
                    color: '#555555',
                    maxWidth: 460,
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  FirstNest shows Australian first home buyers exactly what government
                  grants they qualify for, how much they can borrow, and what to do next.
                  {/* — in about 3 minutes. */}
                </p>

                {/* Reorder wrapper: CTAs first on mobile, stats first on desktop */}
                <div className="flex flex-col">

                {/* Stat chips — order-2 on mobile, order-1 on desktop */}
                <div
                  className="order-2 lg:order-1 grid grid-cols-2 lg:flex lg:flex-nowrap gap-2.5 lg:gap-3 w-full mb-0 lg:mb-7"
                >
                  {MOBILE_STATS.map((s, i) => (
                    <div
                      key={s.label}
                      className={`flex flex-col lg:flex-row items-center justify-center bg-[#FAFAFA] border border-[#EEEEEE] rounded-[16px] lg:rounded-full py-2.5 px-1 lg:px-3 lg:py-1.5 ${
                        i === 2 ? 'col-span-2 justify-self-center px-8 lg:px-3' : 'w-full lg:w-auto'
                      }`}
                    >
                      <span
                        className="font-mono font-bold text-[0.8125rem] text-[#111111] whitespace-nowrap text-center"
                      >
                        {s.value}
                      </span>
                      <span
                        className="font-sans text-[0.6875rem] text-[#666666] mt-0.5 lg:mt-0 lg:ml-1.5 text-center lg:text-left lg:whitespace-nowrap leading-tight"
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA pair — order-1 on mobile, order-2 on desktop */}
                <div className="order-1 lg:order-2 flex flex-col lg:flex-row lg:items-start gap-3 mb-7 lg:mb-0">
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding?flow=grants')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #F5E642 0%, #EDD900 100%)',
                      color: '#111111',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      letterSpacing: '0.01em',
                      border: 'none',
                      borderRadius: 9999,
                      padding: '16px 24px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(245,230,66,0.3)',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    className="hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(245,230,66,0.50)]"
                  >
                    {/* Show My Eligible Schemes */}
                    Grants & Schemes 
                  </button>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <button
                      type="button"
                      onClick={() => router.push('/onboarding?flow=borrowing')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: 'transparent',
                        color: '#111111',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        border: '1px solid #DDDDDD',
                        borderRadius: 9999,
                        padding: '16px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                      className="hover:border-[#111111] hover:bg-[#FAFAFA]"
                    >
                     Borrowing Capacity
                    </button>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.75rem',
                        color: '#888888',
                        textAlign: 'center',
                        marginTop: 10,
                      }}
                    >
                      No credit check · 100% free
                    </p>
                  </div>
                </div>
                </div>{/* end reorder wrapper */}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — desktop only */}
          <div className="hidden lg:block" style={{ paddingTop: 24 }}>
            <SampleResultsCard />
          </div>
        </div>
      </div>
    </section>
  )
}
