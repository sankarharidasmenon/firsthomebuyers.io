'use client'

import React, { useState } from 'react'
import { SessionResumeBanner } from '@/components/home/SessionResumeBanner'
import { HeroSection } from '@/components/home/HeroSection'
import { GrantCardsPreview } from '@/components/home/GrantCardsPreview'
import { useFormSession } from '@/hooks/useFormSession'

export default function HomePage() {
  const { hasSession, isExpired, progress, isLoaded } = useFormSession()
  const [sessionDismissed, setSessionDismissed] = useState(false)

  const showBanner = isLoaded && hasSession && !isExpired && !sessionDismissed

  /* Navbar height: 56px mobile / 72px desktop.
     Banner height: ~44px mobile / ~44px desktop. */
  const heroOffset = showBanner
    ? 'pt-[100px] lg:pt-[116px]'
    : 'pt-14 lg:pt-[72px]'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
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
        {/* Cream hero */}
        <HeroSection />

        {/* Grants & Schemes Preview */}
        <GrantCardsPreview />
      </main>
    </div>
  )
}
