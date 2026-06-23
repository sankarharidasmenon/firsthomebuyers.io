'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export function GlobalBackButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Don't show on the home page or onboarding flow
  if (pathname === '/' || pathname.startsWith('/onboarding')) return null

  return (
    <>
      <style>{`
        main {
          padding-top: 112px !important;
        }
        @media (min-width: 1024px) {
          main {
            padding-top: 128px !important;
          }
        }
      `}</style>
      <div className="fixed top-14 lg:top-16 left-0 z-40 pointer-events-none px-2 lg:px-3 py-3 lg:py-4">
        <button
          onClick={() => router.back()}
          className="pointer-events-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#EEEEEE] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-[#FAFAFA] hover:scale-[1.02] text-[#555555] hover:text-[#111111] transition-all"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontWeight: 600 }}
          aria-label="Go back"
        >
          <ChevronLeft size={16} className="-ml-1" />
          Back
        </button>
      </div>
    </>
  )
}

