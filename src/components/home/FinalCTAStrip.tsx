'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function FinalCTAStrip() {
  const router = useRouter()

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #FDFCF7 0%, #FFFBE6 50%, #FEF0B2 100%)',
      }}
      className="py-8 lg:py-10 xl:py-12 px-5 flex flex-col items-center text-center"
    >
      <div className="w-full max-w-[760px] mx-auto flex flex-col items-center">
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '1.875rem',
            lineHeight: '2.25rem',
            letterSpacing: 'normal',
            color: 'var(--foreground)',
          }}
          className="mb-2 w-full"
        >
          Ready to see what you qualify for?
        </h2>

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.875rem',
            color: '#444444',
            lineHeight: 1.6,
          }}
          className="max-w-[580px] mb-4 w-full"
        >
          Join thousands of Australians who discovered their grant eligibility
          in under few minutes.
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
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          }}
          className="text-[0.8125rem] lg:text-[0.875rem] px-6 py-3.5 lg:px-8 lg:py-4 mb-2 whitespace-nowrap hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all duration-150 w-full sm:w-auto"
        >
          CHECK MY GRANT ELIGIBILITY →
        </button>

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'var(--muted-foreground)',
            display: 'block',
          }}
          className="mb-4"
        >
          {/* ✓ No sign-up &nbsp;·&nbsp; */}
          ✓ No credit check &nbsp;·&nbsp; ✓ 100% Free
        </p>

        <div className="flex items-center justify-center gap-4 mb-3 w-full max-w-[240px]">
          <div className="h-px bg-black/10 flex-1" />
          <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">OR</span>
          <div className="h-px bg-black/10 flex-1" />
        </div>

        {/* <p className="text-[0.875rem] text-[#444444] font-medium mb-2.5 w-fit">
          Download the FirstNest app
        </p> */}

        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-2.5">
          <button className="bg-[#111111] text-white flex items-center gap-2.5 px-4 py-2 rounded-[14px] hover:bg-black transition-colors border border-transparent">
            <svg viewBox="0 0 384 512" className="w-5 h-5 fill-white">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <div className="text-left">
              <div className="text-[9px] font-medium text-white/70 leading-none mb-0.5">Download on the</div>
              <div className="text-[13px] font-semibold leading-none tracking-tight">App Store</div>
            </div>
          </button>

          <button className="bg-[#111111] text-white flex items-center gap-2.5 px-4 py-2 rounded-[14px] hover:bg-black transition-colors border border-transparent">
            <svg viewBox="0 0 512 512" className="w-5 h-5">
              <path fill="#4CAF50" d="M35.6 34.1l235.1 235L35.6 477.9c-8.9-8.8-13.6-21.2-13.6-34.1V68.2c0-12.9 4.7-25.3 13.6-34.1z" />
              <path fill="#FFC107" d="M35.6 34.1l321.4 185.6L270.7 269l-235.1-235z" />
              <path fill="#F44336" d="M35.6 477.9l235.1-235 86.3 49.3L35.6 477.9z" />
              <path fill="#2196F3" d="M357 219.7l115.1 66.5c17.5 10.1 17.5 35.5 0 45.6L357 398.2l-86.3-49.3L357 219.7z" />
            </svg>
            <div className="text-left">
              <div className="text-[9px] font-medium text-white/70 leading-none mb-0.5">Get it on</div>
              <div className="text-[13px] font-semibold leading-none tracking-tight">Google Play</div>
            </div>
          </button>
        </div>

        <p className="text-[0.6875rem] text-[#444444]/70 font-medium">
          Free to download &nbsp;&middot;&nbsp; No credit card required &nbsp;&middot;&nbsp; iOS 15+ &amp; Android 10+
        </p>
      </div>
    </section>
  )
}
