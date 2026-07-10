'use client'

import React, { useState } from 'react'
import { SessionResumeBanner } from '@/components/home/SessionResumeBanner'
import { HeroSection } from '@/components/home/HeroSection'
import { GrantCalculatorSection } from '@/components/home/GrantCalculatorSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { SocialProof } from '@/components/home/SocialProof'
import AskAISection from '@/components/home/AskAISection'
import { FinalCTAStrip } from '@/components/home/FinalCTAStrip'
import { useFormSession } from '@/hooks/useFormSession'
import { GrantCards } from '@/components/home/GrantCards'
import { useAuth } from '@/lib/auth/AuthProvider'

export default function HomePage() {
  const { hasSession, isExpired, progress, isLoaded } = useFormSession()
  const { user, loading: authLoading } = useAuth()
  const [sessionDismissed, setSessionDismissed] = useState(false)

  const showBanner = isLoaded && hasSession && !isExpired && !sessionDismissed && !authLoading && !user

  /* Navbar height: 56px mobile / 72px desktop.
     Banner height: ~44px mobile / ~44px desktop. */
  const heroOffset = showBanner
    ? 'pt-[100px] lg:pt-[116px]'
    : 'pt-14 lg:pt-[72px]'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip to main */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#F5E642] focus:text-[#111111] focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* ── Session resume banner — fixed below navbar ── */}
      {showBanner && progress && (
        <div className="fixed top-14 lg:top-[72px] left-0 right-0 z-40">
          <SessionResumeBanner
            progress={progress}
            onDismiss={() => setSessionDismissed(true)}
          />
        </div>
      )}

      {/* ── Page body — offset from fixed elements ── */}
      <main id="main" className={`flex flex-col flex-1 ${heroOffset}`}>

        {/* SECTION 1 — Hero (white) */}
        <HeroSection />

        {/* SECTION 2 — Video (off-white) */}
        {/* <section style={{ background: '#FAFAFA', padding: '32px 20px' }} className="lg:py-12">
          <div className="max-w-[1100px] mx-auto lg:px-12">
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#888888',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              SEE HOW IT WORKS
            </p>
            <HeroVideo />
          </div>
        </section> */}


            <GrantCards />

        <AskAISection />

        {/* <GrantCards /> */}

        {/* SECTION 3 — How It Works (white) */}
        {/* <HowItWorks /> */}

        {/* SECTION 4 — Social Proof (off-white)
        <SocialProof /> */}

        {/* SECTION 5 — AI Assistant (white) */}
        {/* <AskAISection /> */}

        {/* SECTION 5.5 — Features grid */}
        <FeaturesSection />

        {/* SECTION 6 — Grant Calculator */}
        <GrantCalculatorSection />

        {/* SECTION 7 — Final CTA Strip (black) */}
        <FinalCTAStrip />


      </main>
    </div>
  )
}
