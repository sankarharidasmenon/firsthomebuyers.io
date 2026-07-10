'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Home, TrendingUp, Gift, Tag, Shield,
  Lock, Calculator, Building2, FileText, Star,
} from 'lucide-react'
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

      {/* Desktop content — two-column layout
          Offset: navbar 64 + progress 3 + controls row ~45 = 112px */}
      <div
        className="hidden lg:flex flex-col flex-1 bg-background"
        style={{ paddingTop: 112, minHeight: '100vh' }}
      >
        <div className="w-full max-w-360 mx-auto px-10 xl:px-16 pt-8 pb-14">
          <div
            className="grid items-start"
            style={{ gridTemplateColumns: '3fr 2fr', gap: '3.5rem' }}
          >

            {/* ── LEFT: form wrapped in premium card ── */}
            <div
              className="bg-card rounded-[28px] border border-border"
              style={{
                padding: '36px 40px',
                boxShadow: '0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)',
              }}
            >
              {children}
            </div>

            {/* ── RIGHT: sticky info panel ── */}
            <div className="flex flex-col gap-3" style={{ position: 'sticky', top: 124 }}>

              {/* 1 — Header + checklist */}
              <div
                className="bg-card rounded-2xl border border-border"
                style={{ padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0"
                    style={{ width: 40, height: 40, background: 'var(--color-lemon)' }}
                  >
                    {/* Icon always sits on lemon — must stay dark in both themes */}
                    <Home size={18} color="#111111" />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.25 }}>
                    Buying your first home
                  </p>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginBottom: 10, lineHeight: 1.5 }}>
                  We only ask a few questions so we can calculate:
                </p>
                <div className="flex flex-col gap-1.5">
                  {([
                    [TrendingUp, 'Your borrowing capacity'],
                    [Gift,       'Grants you qualify for'],
                    [Tag,        'Stamp duty savings'],
                    [Shield,     'Government schemes'],
                  ] as const).map(([Icon, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon size={13} color="var(--color-green)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--foreground)', fontWeight: 500 }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 — Privacy */}
              <div
                className="flex items-start gap-3 bg-card rounded-2xl border border-border"
                style={{ padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              >
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 32, height: 32, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', marginTop: 1 }}
                >
                  <Lock size={14} color="var(--color-green)" />
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                  Your information stays{' '}
                  <strong style={{ color: 'var(--foreground)', fontWeight: 600 }}>private</strong>
                  {' '}and is only used to personalise your results. No credit check.
                </p>
              </div>

              {/* 3 — What happens next (timeline) */}
              <div
                className="bg-card rounded-2xl border border-border"
                style={{ padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              >
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--foreground)', marginBottom: 14 }}>
                  What happens next
                </p>
                <div className="flex flex-col">
                  {([
                    [Calculator, 'Calculate borrowing power'],
                    [Building2,  'Check grant eligibility'],
                    [FileText,   'Build your action plan'],
                    [Star,       'View your results'],
                  ] as const).map(([Icon, label], i) => {
                    const done = i < currentStep
                    return (
                      <div key={label}>
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{
                              width: 28, height: 28,
                              background: done ? 'var(--color-lemon)' : 'var(--secondary)',
                              border: done ? 'none' : '1.5px solid var(--border)',
                              transition: 'background 400ms',
                            }}
                          >
                            {/* Lemon bg is brand-fixed — icon stays dark; inactive uses theme token */}
                            <Icon size={13} color={done ? '#111111' : 'var(--muted-foreground)'} strokeWidth={2} />
                          </div>
                          <span style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.8125rem',
                            fontWeight: done ? 600 : 400,
                            color: done ? 'var(--foreground)' : 'var(--muted-foreground)',
                            transition: 'color 400ms',
                          }}>
                            {label}
                          </span>
                        </div>
                        {i < 3 && (
                          <div style={{ width: 28, display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
                            <div style={{ width: 1.5, height: 12, background: 'var(--border)', borderRadius: 1 }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>{/* end right panel */}
          </div>{/* end grid */}
        </div>
      </div>

      <AutoSaveIndicator show={autoSaveVisible} />
    </div>
  )
}
