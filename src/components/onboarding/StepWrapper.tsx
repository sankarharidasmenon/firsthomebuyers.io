'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { AutoSaveIndicator } from '@/components/ui/AutoSaveIndicator'
import { Navbar } from '@/components/home/Navbar'

interface StepWrapperProps {
  currentStep: number
  totalSteps?: number
  onBack?: () => void
  children: React.ReactNode
  showSave?: boolean
  autoSaveVisible?: boolean
}

export function StepWrapper({
  currentStep,
  totalSteps = 4,
  onBack,
  children,
  showSave = true,
  autoSaveVisible = false,
}: StepWrapperProps) {
  const router = useRouter()
  const percent = Math.round((currentStep / totalSteps) * 100)

  const handleBack = onBack ?? (() => router.back())
  const handleSaveExit = () => router.push('/')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar rendered by root layout */}

      {/* ════════════════════════════════════════
          MOBILE  (< lg)
          Fixed sub-bar sits directly below navbar
      ════════════════════════════════════════ */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-background border-b border-border">
        {/* Controls row */}
        <div className="flex items-center justify-between px-4 h-12">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>

          {/* Pill dots */}
          <div className="flex items-center gap-1.5" aria-label={`Step ${currentStep} of ${totalSteps}`}>
            {Array.from({ length: totalSteps }, (_, i) => {
              const n = i + 1
              const done = n < currentStep
              const active = n === currentStep
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: active ? 20 : 7,
                    height: 7,
                    background: done ? 'var(--color-green-500, #22C55E)' : active ? 'var(--primary)' : 'var(--border)',
                  }}
                />
              )
            })}
          </div>

          {showSave ? (
            <button
              type="button"
              onClick={handleSaveExit}
              className="hover:text-foreground transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Save &amp; Exit
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>

        {/* Progress strip */}
        <div className="h-0.75 bg-secondary" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-[width] duration-300 ease-in-out" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Mobile content — offset: navbar 56 + controls 48 + bar 3 = 107px */}
      <main className="lg:hidden flex-1 w-full max-w-120 mx-auto px-5 pb-10" style={{ paddingTop: 107 }}>
        {children}
      </main>

      {/* Mobile footer */}
      {/* <footer className="lg:hidden w-full pt-6 pb-16 text-center" style={{ background: '#111111' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
          © 2025 FirstNest · Not financial advice · Free to use
        </p>
      </footer> */}

      {/* ════════════════════════════════════════
          DESKTOP  (≥ lg)
          Sub-header: full-width progress strip + controls row
      ════════════════════════════════════════ */}
      <div className="hidden lg:block fixed top-16 left-0 right-0 z-40 bg-background">
        {/* Full-width lemon progress strip */}
        <div
          className="h-0.75 bg-secondary"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`Step ${currentStep} of ${totalSteps}`}
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-in-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Controls row */}
        <div
          className="flex items-center justify-between max-w-300 mx-auto px-12 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 transition-colors cursor-pointer border-none bg-transparent hover:text-foreground"
            aria-label="Go back"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.875rem', color: 'var(--muted-foreground)', padding: 0 }}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            Back
          </button>

          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            Step {currentStep} of {totalSteps}
          </span>

          {showSave ? (
            <button
              type="button"
              onClick={handleSaveExit}
              className="hover:text-foreground transition-colors"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Save &amp; Exit
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>

      {/* Desktop content
          Offset: navbar 64 + progress 3 + controls row ~45 = 112px */}
      <div className="hidden lg:flex flex-col flex-1" style={{ paddingTop: 112 }}>
        <main className="flex-1 w-full max-w-145 mx-auto px-6 pt-4 pb-10">
          {children}
        </main>

        {/* Footer */}
        {/* <footer className="w-full pt-6 pb-8 text-center" style={{ background: '#111111' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
            © 2025 FirstNest · Not financial advice · Free to use
          </p>
        </footer> */}
      </div>

      <AutoSaveIndicator show={autoSaveVisible} />
    </div>
  )
}
