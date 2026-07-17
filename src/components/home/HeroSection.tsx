'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { clearAllData } from '@/lib/localStorage'

export function HeroSection() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [flow, setFlow] = useState<'grants' | 'borrowing'>('grants')
  const [isLoaded, setIsLoaded] = useState(false)

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    if (!next) v.play().catch(() => {})
    setMuted(next)
  }

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
    } catch {}
    setIsLoaded(true)
  }, [])

  const isReturning = isLoaded && !!firstName && !!currentStep
  const remainingSteps = currentStep ? 4 - currentStep : 0
  const remainingMins = Math.max(1, remainingSteps)

  return (
    <>
      <style>{`
        .fn-hero {
          background: #FAF7F2;
          border-bottom: 1px solid rgba(17,17,17,0.08);
        }
        .dark .fn-hero { background: var(--background); border-bottom-color: var(--border); }

        /* Container mirrors the grants section + footer: max-w-[1150px] with
           px-4 / sm:px-6 / lg:px-8 so every section shares one content edge. */
        .fn-hero-inner {
          width: 100%;
          max-width: 1150px;
          margin: 0 auto;
          padding: 48px 16px;
        }
        @media (min-width: 640px) {
          .fn-hero-inner { padding-left: 24px; padding-right: 24px; }
        }
        @media (min-width: 1024px) {
          .fn-hero-inner { padding: 80px 32px 72px; }
        }

        .fn-hero-grid {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }
        @media (min-width: 1024px) {
          .fn-hero-grid {
            display: grid;
            grid-template-columns: 55fr 45fr;
            gap: 72px;
            align-items: center;
          }
        }

        /* ── Eyebrow ── */
        .fn-hero-eyebrow {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.45;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C4A000;
          margin-bottom: 24px;
        }

        /* Trailing trust note — same treatment, no bottom margin so it
           doesn't add a phantom gap above the section divider. */
        .fn-hero-note { margin-bottom: 0; }

        /* ── Title ── */
        .fn-hero-title {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-weight: 500;
          font-size: clamp(34px, 4.8vw, 58px);
          line-height: 1.1;
          letter-spacing: -1.2px;
          color: #111111;
          margin-bottom: 18px;
        }
        .dark .fn-hero-title { color: var(--foreground); }
        /* The default-flow h1 currently renders no copy; drop its trailing
           margin so it doesn't leave dead space. Self-cancels once it has text. */
        .fn-hero-title:empty { margin-bottom: 0; }
        // .fn-hero-title em {
        //   font-style: italic;
        //   color: #C4A000;
        // }

        /* ── Sub ── */
        .fn-hero-sub {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.7;
          color: #444444;
          max-width: 460px;
          margin-bottom: 36px;
        }
        .dark .fn-hero-sub { color: var(--muted-foreground); }

        /* ── Product pillar cards ── */
        .fn-hero-paths {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (min-width: 560px) {
          .fn-hero-paths { grid-template-columns: 1fr 1fr; }
        }

        .fn-path {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
          padding: 24px 22px;
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
          font-family: var(--font-body, 'Inter'), sans-serif;
        }
        .fn-path:active { transform: scale(0.99); }

        .fn-path-primary {
          background: #111111;
          border: 1px solid #111111;
        }
        .fn-path-primary:hover { background: #262626; border-color: #262626; }

        .fn-path-secondary {
          background: transparent;
          border: 1px solid rgba(17,17,17,0.18);
        }
        .fn-path-secondary:hover { border-color: #111111; background: #FEFCE8; }
        .dark .fn-path-secondary { border-color: var(--border); }
        .dark .fn-path-secondary:hover { border-color: var(--foreground); background: transparent; }

        .fn-path-kicker {
          font-size: 11px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .fn-path-primary .fn-path-kicker { color: #F5E642; }
        .fn-path-secondary .fn-path-kicker { color: #C4A000; }

        .fn-path-title {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-weight: 500;
          font-size: 19px;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .fn-path-primary .fn-path-title { color: #FFFFFF; }
        .fn-path-secondary .fn-path-title { color: #111111; }
        .dark .fn-path-secondary .fn-path-title { color: var(--foreground); }

        .fn-path-desc {
          font-size: 13px;
          font-weight: 300;
          line-height: 1.55;
        }
        .fn-path-primary .fn-path-desc { color: rgba(255,255,255,0.6); }
        .fn-path-secondary .fn-path-desc { color: #444444; }
        .dark .fn-path-secondary .fn-path-desc { color: var(--muted-foreground); }

        /* Carries the card title text alongside the arrow glyph. */
        .fn-path-arrow {
          margin-top: 2px;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.4;
          letter-spacing: -0.01em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        @media (min-width: 1024px) {
          .fn-path-arrow { font-size: 18px; }
        }
        .fn-path-arrow svg { flex-shrink: 0; }
        .fn-path-primary .fn-path-arrow { color: #FFFFFF; }
        .fn-path-secondary .fn-path-arrow { color: #C4A000; }
        .fn-path-arrow svg { transition: transform 0.2s; }
        .fn-path:hover .fn-path-arrow svg { transform: translateX(4px); }

        /* ── Trust line ── */
        .fn-hero-trust {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 12.5px;
          color: #888888;
        }

        /* ── Returning user ── */
        .fn-hero-chip {
          display: inline-block;
          border: 1px solid rgba(17,17,17,0.15);
          border-radius: 9999px;
          padding: 7px 16px;
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-weight: 400;
          font-size: 0.8125rem;
          color: #444444;
        }
        .dark .fn-hero-chip { border-color: var(--border); color: var(--muted-foreground); }

        .fn-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #111111; color: #FFFFFF;
          padding: 15px 28px; border-radius: 50px;
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 15px; font-weight: 500;
          border: none; cursor: pointer;
          transition: background 0.25s, transform 0.15s;
          white-space: nowrap; text-decoration: none;
        }
        .fn-btn-primary:hover { background: #262626; }
        .fn-btn-primary:active { transform: scale(0.98); }

        .fn-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #111111;
          padding: 15px 24px; border-radius: 50px;
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 15px; font-weight: 500;
          border: 1px solid rgba(17,17,17,0.22); cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .fn-btn-secondary:hover { border-color: #111111; background: #FEFCE8; }
        .fn-btn-secondary:active { transform: scale(0.98); }
        .dark .fn-btn-secondary { color: var(--foreground); border-color: var(--border); }
        .dark .fn-btn-secondary:hover { background: transparent; }

        /* ── Video panel ── */
        .fn-hero-video-panel { display: none; }
        @media (min-width: 1024px) {
          .fn-hero-video-panel { display: block; }
        }
      `}</style>

      <section className="fn-hero">
        <div className="fn-hero-inner">
          <div className="fn-hero-grid">

            {/* ── LEFT: Content ── */}
            <div>
              {isReturning ? (
                <div>
                  <div className="fn-hero-eyebrow">Welcome back, {firstName}</div>
                  <h1 className="fn-hero-title">
                    Pick up where<br />you left off
                  </h1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                    {[
                      `Step ${currentStep} of 4 complete`,
                      `~${remainingMins} min left`,
                      flow === 'grants' ? 'Checking grants' : 'Checking borrowing',
                    ].map(chip => (
                      <span key={chip} className="fn-hero-chip">{chip}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                    <button type="button" className="fn-btn-primary"
                      onClick={() => router.push(`/onboarding?flow=${flow}&step=${currentStep}`)}>
                      Continue →
                    </button>
                    <button type="button" className="fn-btn-secondary"
                      onClick={() => { clearAllData(); window.location.href = '/' }}>
                      Start fresh
                    </button>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body, "Inter"), sans-serif', fontSize: 12.5, color: '#AAAAAA' }}>
                    or{' '}
                    <button type="button"
                      onClick={() => { clearAllData(); window.location.href = '/' }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#888888', textDecoration: 'underline', fontSize: 12.5, fontFamily: 'inherit' }}>
                      go back to Discover
                    </button>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="fn-hero-eyebrow">For Australian first home buyers</div>
                  <h1 className="fn-hero-title"></h1>
                  {/* The two things the product does — as the primary CTAs */}
                  <div className="fn-hero-paths">
                    <button type="button" className="fn-path fn-path-primary"
                      onClick={() => router.push('/onboarding?flow=grants')}>
                      <span className="fn-path-kicker">Eligibility</span>
                      <span className="fn-path-arrow">
                        Check your eligibility & next steps
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </button>

                    <button type="button" className="fn-path fn-path-primary"
                      onClick={() => router.push('/grant-calculator')}>
                      <span className="fn-path-kicker">Government support</span>
                      <span className="fn-path-arrow">
                        Research about Grants/Schemes
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </button>
                  </div>

                  <p className="fn-hero-eyebrow fn-hero-note">Free · No credit check</p>
                </div>
              )}
            </div>

            {/* ── RIGHT: Video ── */}
            <div className="fn-hero-video-panel">
              <div style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(17,17,17,0.12)',
              }}>
                <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#111111', overflow: 'hidden' }}>
                  <video
                    ref={videoRef}
                    autoPlay muted loop playsInline preload="auto"
                    aria-label="FirstNest intro video"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', border: 'none', display: 'block' }}
                  >
                    <source src="/videos/final_complete.mp4" type="video/mp4" />
                  </video>
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? 'Unmute video' : 'Mute video'}
                    style={{
                      position: 'absolute', bottom: 12, right: 12,
                      width: 40, height: 40,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 9999, border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(0,0,0,0.55)', color: '#FFFFFF',
                      cursor: 'pointer', backdropFilter: 'blur(4px)',
                    }}
                  >
                    {muted ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
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

          </div>
        </div>
      </section>
    </>
  )
}
