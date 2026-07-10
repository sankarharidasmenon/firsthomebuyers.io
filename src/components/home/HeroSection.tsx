'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function HeroSection() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    if (!next) {
      // ensure playback continues after unmuting
      v.play().catch(() => { })
    }
    setMuted(next)
  }
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
        if (pg.expiresAt && new Date(pg.expiresAt) < new Date()) {
          setFirstName(null)
          setCurrentStep(null)
        }
      }
    } catch { }
    setIsLoaded(true)
  }, [])

  const isReturning = isLoaded && !!firstName && !!currentStep
  const remainingSteps = currentStep ? 4 - currentStep : 0
  const remainingMins = Math.max(1, remainingSteps)

  return (
    <>
      <style>{`
        /* ── Unified hero background ── */
        .fn-hero {
          background:
            radial-gradient(ellipse at 12% 65%, rgba(245,230,66,0.10) 0%, transparent 52%),
            radial-gradient(ellipse at 78% 22%, rgba(245,230,66,0.08) 0%, transparent 48%),
            linear-gradient(165deg, #FDF8F0 0%, #FAF5EB 45%, #F7F2E6 100%);
        }
        .dark .fn-hero {
          background: var(--background);
        }

        /* Floating animation on the video frame */
        @keyframes fn-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          40%       { transform: translateY(-7px) rotate(-0.2deg); }
          70%       { transform: translateY(-3px) rotate(0.15deg); }
        }
        .fn-float-animate {
          animation: fn-float 7s ease-in-out infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .fn-float-animate { animation: none; }
        }

        /* ─── Mobile-only heading size ───
           Inline styles can't be overridden by classes, so font-size and
           line-height are moved here where a media-query can override them.
           Desktop (≥768px) restores the original clamp + line-height. */
        .fn-hero-span { font-size: 2.125rem; }
        @media (min-width: 768px) {
          .fn-hero-span { font-size: clamp(2.25rem, 4vw, 4.25rem); }
        }

        .fn-hero-h1 { line-height: 0.98; }
        @media (min-width: 768px) {
          .fn-hero-h1 { line-height: 1.04; }
        }

        /* ─── Mobile-only paragraph ─── */
        .fn-hero-para {
          font-size: 0.9375rem;
          line-height: 1.6;
          max-width: 34ch;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 768px) {
          .fn-hero-para {
            font-size: 1.0625rem;
            line-height: 1.65;
            max-width: 560px;
            margin-left: 0;
            margin-right: 0;
          }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════
          UNIFIED HERO — one responsive implementation
          Mobile  : flex-col → [text] [video] [CTAs] stacked
          Desktop : 2-col CSS grid → text+CTAs left, video right
      ════════════════════════════════════════════════════════════════ */}
      <section
        className="fn-hero flex flex-col justify-center sm:min-h-[70vh] lg:flex-row lg:items-center lg:min-h-[75vh]"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* ── Decorative: radial glow — top right ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '-18%', right: '-6%',
            width: 580, height: 580,
            background: 'radial-gradient(circle, rgba(245,230,66,0.14) 0%, transparent 68%)',
            borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
          }}
        />

        {/* ── Content ── */}
        <div className="relative w-full max-w-[1150px] mx-auto px-4 pt-4 pb-2 sm:pt-5 sm:pb-5 lg:px-4 lg:py-7" style={{ zIndex: 1 }}>
          {/*
            Layout engine:
              Mobile  → flex-col with order-1/2/3 controlling position
              Desktop → CSS grid with explicit col/row placement

            DOM order:      A (text-top)  B (video)  C (cta-bottom)
            Mobile stack:   1st           2nd        3rd
            Desktop grid:   col-1 row-1   col-2 r1-2 col-1 row-2
          */}
          <div
            className="flex flex-col lg:grid lg:gap-y-6 lg:gap-x-16"
            style={{
              gridTemplateColumns: '58fr 42fr',
              gridTemplateRows: 'auto auto',
            }}
          >

            {/* ── A: Heading + paragraph ── */}
            {/* Mobile: first  |  Desktop: col-1 row-1 */}
            <div className="order-1 mb-4 sm:mb-5 lg:mb-0 text-center lg:text-left lg:col-start-1 lg:row-start-1">
              {isReturning ? (
                <div>
                  <h1
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 800,
                      fontSize: 'clamp(2.25rem, 4vw, 3.75rem)',
                      lineHeight: 1.08,
                      letterSpacing: '-0.035em',
                      color: 'var(--foreground)',
                      marginBottom: 16,
                    }}
                  >
                    Welcome back,<br />{firstName} 👋
                  </h1>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '1.0625rem',
                      color: 'var(--muted-foreground)',
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    Let&apos;s pick up where you left off.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    {[
                      `Step ${currentStep} of 4 complete`,
                      `⏱ ~${remainingMins} min left`,
                      flow === 'grants' ? '🏛️ Checking grants' : '💰 Checking borrowing',
                    ].map(chip => (
                      <span
                        key={chip}
                        style={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 9999,
                          padding: '7px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '0.8125rem',
                          color: 'var(--secondary-foreground)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h1
                    className="fn-hero-h1"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      marginBottom: 16,
                    }}
                  >
                    <span className="fn-hero-span" style={{ display: 'block', color: 'var(--foreground)' }}>
                      Unlock every grants & schemes
                    </span>
                    {/* <span className="fn-hero-span" style={{ display: 'block', color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}>
                      Enter the market
                    </span>
                    <span className="fn-hero-span" style={{ display: 'block', color: 'var(--foreground)' }}>
                      sooner.
                    </span> */}
                  </h1>
                  <p
                    className="fn-hero-para"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      color: 'var(--muted-foreground)',
                      marginBottom: 0,
                    }}
                  >
                    {/* FirstNest identifies every Australian government grant and scheme you
                    qualify for — federal and state — then builds your personalised roadmap
                    to homeownership. */}
                    FirstNest matches you with all Australian government schemes and grants , <span className="font-bold">building a customised roadmap to buying your first home </span>.
                  </p>
                </div>
              )}
            </div>

            {/* ── B: Browser-frame video ── */}
            {/* Mobile: hidden (video is below-fold on mobile — keeps hero compact)  |  Desktop: col-2 rows 1–2 */}
            <div className="hidden fn-float-animate lg:block lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
              <div
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow:
                    '0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
                }}
              >
                {/* Chrome bar */}
                {/* <div
                  style={{
                    background: '#1C1C1E',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {[
                      { bg: '#FF5F57', glow: 'rgba(255,95,87,0.5)' },
                      { bg: '#FEBC2E', glow: 'rgba(254,188,46,0.5)' },
                      { bg: '#28C840', glow: 'rgba(40,200,64,0.5)' },
                    ].map(({ bg, glow }) => (
                      <div key={bg} style={{ width: 11, height: 11, borderRadius: '50%', background: bg, boxShadow: `0 0 4px ${glow}` }} />
                    ))}
                  </div>
                  <div
                    style={{
                      flex: 1, background: '#2C2C2E', borderRadius: 7,
                      padding: '3px 12px', display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5" stroke="#6B7280" strokeWidth="1" />
                      <path d="M6 1C4.3 3.2 4 4.5 4 6s.3 2.8 2 5M6 1c1.7 2.2 2 3.5 2 5s-.3 2.8-2 5M1.5 6h9" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem',
                        color: '#9CA3AF', letterSpacing: '0.01em', flex: 1, userSelect: 'none',
                      }}
                    >
                      firstnest.com.au
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="2.5" y="5.5" width="7" height="5" rx="1.2" stroke="#22C55E" strokeWidth="1" />
                      <path d="M4.2 5.5V4.2a1.8 1.8 0 013.6 0V5.5" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </div>
                </div> */}

                {/* Hero video — viewport clips the composited video to the rounded frame */}
                <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#000', display: 'block', overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-label="FirstNest intro video"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', border: 'none', display: 'block' }}
                  >
                    <source src="/videos/final_complete.mp4" type="video/mp4" />
                  </video>

                  {/* Unmute / mute toggle */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? 'Unmute video' : 'Mute video'}
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 9999,
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(0,0,0,0.55)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {muted ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 5 6 9H2v6h4l5 4V5z" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── C: CTAs + trust ── */}
            {/* Mobile: third (below video)  |  Desktop: col-1 row-2 */}
            <div className="order-2 mb-0 lg:col-start-1 lg:row-start-2 lg:self-start">
              {isReturning ? (
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/onboarding?flow=${flow}&step=${currentStep}`)}
                    className="w-full lg:flex-1 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,0,0,0.22)] transition-all duration-200"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#111111', color: '#F5E642',
                      fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9375rem',
                      border: 'none', borderRadius: 9999, padding: '16px 24px',
                      cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Continue →
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding?flow=grants')}
                    className="w-full lg:flex-1 hover:border-foreground transition-all duration-200"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--card)', color: 'var(--foreground)',
                      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem',
                      border: '1.5px solid var(--border)', borderRadius: 9999, padding: '16px 24px',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Start fresh
                  </button>
                </div>
              ) : (
                <div>
                  {/* Two CTA buttons — stacked on mobile, side-by-side on desktop */}
                  <div
                    className="flex flex-col lg:flex-row gap-3 lg:gap-5 mb-2 sm:mb-3 items-end"
                  >
                    {/* Primary CTA + Trust Text Column */}
                    <div className="flex flex-col w-full lg:flex-1 min-w-0 relative">
                      <div className="w-full flex justify-center mb-2.5">
                        <p
                          className="text-center mx-auto"
                          style={{
                            width: 'fit-content',
                            maxWidth: 'none',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '12.5px',
                            color: 'var(--muted-foreground)',
                            fontWeight: 400,
                            lineHeight: 1.3,
                            letterSpacing: '0',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          No credit check<span className="mx-1">&middot;</span>100% free<span className="mx-1">&middot;</span>Takes a few minutes
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/onboarding?flow=grants')}
                        className="w-full bg-[#F5E642] border-2 border-[#F5E642] hover:bg-white hover:border-white active:scale-[0.98] shadow-sm hover:shadow-md transition-colors duration-300 ease-out text-[#111111] flex items-center justify-center gap-2 rounded-full px-[14px] py-[14px] z-10"
                        style={{
                          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9375rem',
                          letterSpacing: '0.01em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Grants & Schemes
                      </button>
                    </div>

                    {/* Secondary CTA Column */}
                    <div className="flex flex-col w-full lg:flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => router.push('/onboarding?flow=borrowing')}
                        className="w-full bg-white border-2 border-[#F5E642] hover:bg-[#F5E642] active:scale-[0.98] shadow-sm hover:shadow-md transition-colors duration-300 ease-out text-[#111111] flex items-center justify-center gap-2 rounded-full px-6 py-[14px]"
                        style={{
                          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Borrowing Capacity
                      </button>
                    </div>
                  </div>

                  {/* Trust line */}
                  {/* <p
                    className="text-center lg:text-left"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.8125rem',
                      color: 'var(--muted-foreground)',
                      fontWeight: 400,
                      marginBottom: 18,
                    }}
                  >
                    No credit check · 100% free · Takes around few minutes
                  </p> */}

                  {/* ── Download badges ── */}




                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
