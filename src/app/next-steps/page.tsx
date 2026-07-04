'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/home/Navbar'
import { getStep1, getStep2, getStep3, getStep4, setMyResults, type Step1Data, type Step3Data } from '@/lib/localStorage'
import { calculateBorrowingCapacity } from '@/lib/calculations'
import { evaluateEligibility } from '@/lib/grantEligibility'
import { DUMMY_USER } from '@/lib/dummyData'
import {
  Phone, MessageSquare, CalendarDays, Home,
  Bookmark, Share2, FileDown, ArrowRight,
  CheckCircle2, Check, Loader2, Mail
} from 'lucide-react'

type ContactMode = null | 'callback' | 'message' | 'book'
type ContactTime = 'morning' | 'afternoon' | 'evening'
type SaveState = 'idle' | 'saving' | 'saved'

// ── Design tokens ─────────────────────────────────────────────────────────────

// Card: layered shadow creates Apple-like elevation
const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07)',
}

const microLabel: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.6875rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
  marginBottom: 4,
}

const sectionTag: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  fontSize: '0.75rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#555555',
  marginBottom: 8,
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NextStepsPage() {
  const [mounted, setMounted] = useState(false)
  const [contactMode, setContactMode] = useState<ContactMode>(null)
  const [submitted, setSubmitted] = useState(false)
  const [phone, setPhone] = useState('')
  const [preferredTime, setPreferredTime] = useState<ContactTime>('morning')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [linkCopied, setLinkCopied] = useState(false)

  const [{ borrowing, grantsTotal, step1, step3, state, depositGap }, setPageData] = useState<{
    borrowing: { min: number; max: number }
    grantsTotal: number
    step1: Step1Data
    step3: Step3Data
    state: string
    depositGap: number
  }>({
    borrowing: { min: 0, max: 0 },
    grantsTotal: 0,
    step1: { firstName: DUMMY_USER.firstName, state: DUMMY_USER.state, buyingWith: 'solo' },
    step3: { depositAmount: DUMMY_USER.depositAmount, targetPropertyPrice: DUMMY_USER.targetPropertyPrice, propertyType: 'house', firstHomeBuyer: true },
    state: DUMMY_USER.state,
    depositGap: 0,
  })

  // Compute all derived data client-side only — localStorage is not available on the server
  useEffect(() => {
    const s1 = getStep1() ?? { firstName: DUMMY_USER.firstName, state: DUMMY_USER.state, buyingWith: 'solo' as const }
    const s2 = getStep2() ?? { annualIncome: DUMMY_USER.annualIncome, partnerIncome: 0, monthlyExpenses: DUMMY_USER.monthlyExpenses }
    const s3 = getStep3() ?? { depositAmount: DUMMY_USER.depositAmount, targetPropertyPrice: DUMMY_USER.targetPropertyPrice, propertyType: 'house' as const, firstHomeBuyer: true }
    const s4 = getStep4() ?? { employmentType: 'fulltime' as const, creditCardLimit: DUMMY_USER.creditCardLimit, hecsDebt: DUMMY_USER.hecsDebt, otherLoanRepayments: 0 }

    const borrowing = calculateBorrowingCapacity({
      annualIncome: s2.annualIncome,
      partnerIncome: s1.buyingWith === 'partner' ? s2.partnerIncome : 0,
      monthlyExpenses: s2.monthlyExpenses,
      creditCardLimit: s4.creditCardLimit,
      otherLoanRepayments: s4.otherLoanRepayments,
      hecsDebt: s4.hecsDebt,
      depositAmount: s3.depositAmount,
      employmentType: s4.employmentType,
    })

    const report = evaluateEligibility(s1, s2, s3, s4)
    const depositGap = Math.max((s3.targetPropertyPrice * 0.2) - s3.depositAmount, 0)
    setPageData({ borrowing, grantsTotal: report.grantsTotal, step1: s1, step3: s3, state: s1.state || 'VIC', depositGap })
    setMounted(true)
  }, [])

  const firstName = step1.firstName || 'there'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const minPrice = borrowing.min + step3.depositAmount
  const maxPrice = borrowing.max + step3.depositAmount
  const stateAbbr = state.toUpperCase()

  // Save: idle → saving (500ms) → saved (2.5s) → idle
  const handleSave = () => {
    if (saveState !== 'idle') return
    setSaveState('saving')
    setTimeout(() => {
      setMyResults({ borrowing, grantsTotal, eligibleGrants: [], state, firstName })
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    }, 500)
  }
  const handleCopyLink = () => {
    const hash = Math.random().toString(36).slice(2, 9)
    navigator.clipboard.writeText(`firstnest.com.au/r/${hash}`).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }
  const handlePrint = () => window.print()
  const handleBrokerSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true) }

  const reaUrl = `https://www.realestate.com.au/buy/price-${minPrice}-${maxPrice}/in-${stateAbbr}/list-1`

  const hasBorrowingPower = borrowing.max > 0

  // ── 1. HERO ──────────────────────────────────────────────────────────────────
  const HeroHeading = () => (
    <div>
      {/* Compact badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9999, padding: '4px 10px', marginBottom: 10 }}>
        <CheckCircle2 size={11} color="var(--success-foreground)" />
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.04em', color: 'var(--success-foreground)' }}>
          Your results are ready
        </span>
      </div>

      <h1 style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(1.625rem, 4vw, 2rem)',
        color: 'var(--foreground)',
        lineHeight: 1.1,
        letterSpacing: '-0.015em',
        marginBottom: 8,
      }}>
        {hasBorrowingPower ? `Good news, ${displayName}.` : `Let's get you home ready, ${displayName}.`}
      </h1>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: '0.9375rem',
        color: 'var(--muted-foreground)',
        lineHeight: 1.6,
        maxWidth: 460,
        margin: 0,
      }}>
        {hasBorrowingPower 
          ? "You're in a strong position to buy your first home — here's your full picture." 
          : "Everyone starts somewhere. Here is a clear picture of what you need to achieve your goal."}
      </p>
    </div>
  )

  // ── 2. POSITION CARDS ────────────────────────────────────────────────────────
  // Mobile single card stack
  const MobilePositionCard = () => (
    <div className="lg:hidden" style={{ ...card, overflow: 'hidden' }}>
      {/* 1. Homes You Could Afford */}
      <div className="p-5 border-b border-border bg-card">
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 4 }}>
          🏡 Homes You Could Afford
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: hasBorrowingPower ? 'clamp(1.5rem, 5vw, 1.875rem)' : '1.25rem', color: 'var(--foreground)', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          {hasBorrowingPower ? `$${(minPrice / 1000).toFixed(0)}k – $${(maxPrice / 1000).toFixed(0)}k` : 'Building capacity...'}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Based on your borrowing power and savings
        </p>
      </div>
      {/* 2. Government Support */}
      <div className="p-5 border-b border-border" style={{ background: 'var(--surface)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 4 }}>
          💰 Government Support
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--success-foreground)', lineHeight: 1.1, marginBottom: 4 }}>
          ${grantsTotal.toLocaleString('en-AU')}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Grants and concessions available
        </p>
      </div>
      {/* 3. Deposit Status */}
      <div className="p-5" style={{ background: 'var(--surface)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 4 }}>
          {depositGap > 0 ? '⚠️ Deposit Status' : '✅ Deposit Status'}
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: depositGap > 0 ? '#F59E0B' : 'var(--foreground)', lineHeight: 1.1, marginBottom: 4 }}>
          {depositGap > 0 ? `$${(depositGap/1000).toFixed(0)}k short` : "You're covered"}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          {depositGap > 0 ? 'How much more you need to reach 20%' : 'No additional deposit required'}
        </p>
      </div>
    </div>
  )

  // Desktop 3-column independent cards
  const DesktopPositionCards = () => (
    <div className="hidden lg:grid grid-cols-3 gap-6">
      {/* 1. Homes You Could Afford */}
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 8 }}>
          🏡 Homes You Could Afford
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: hasBorrowingPower ? '1.875rem' : '1.25rem', color: 'var(--foreground)', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          {hasBorrowingPower ? `$${(minPrice / 1000).toFixed(0)}k – $${(maxPrice / 1000).toFixed(0)}k` : 'Building capacity...'}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Based on your borrowing power and savings
        </p>
      </div>
      {/* 2. Government Support */}
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 8 }}>
          💰 Government Support
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.875rem', color: 'var(--success-foreground)', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          ${grantsTotal.toLocaleString('en-AU')}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          Grants and concessions available
        </p>
      </div>
      {/* 3. Deposit Status */}
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 8 }}>
          {depositGap > 0 ? '⚠️ Deposit Status' : '✅ Deposit Status'}
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.875rem', color: depositGap > 0 ? '#F59E0B' : 'var(--foreground)', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          {depositGap > 0 ? `$${(depositGap/1000).toFixed(0)}k short` : "You're covered"}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          {depositGap > 0 ? 'How much more you need to reach 20%' : 'No additional deposit required'}
        </p>
      </div>
    </div>
  )

  // ── 3. SHORTFALL EXPLANATION ────────────────────────────────────────────────
  const ShortfallExplanationCard = () => {
    if (depositGap <= 0) return null

    return (
      <div style={{ ...card, padding: 24, background: 'var(--amber-bg, rgba(245, 158, 11, 0.1))', border: '1px solid var(--amber-border, rgba(245, 158, 11, 0.3))' }}>
        <h3 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--warning-foreground)', marginBottom: 12, marginTop: 0 }}>
          🚧 Bridging your deposit gap
        </h3>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.6, marginBottom: 16, marginTop: 0 }}>
          You're currently <strong>${(depositGap / 1000).toFixed(0)}k short</strong> of the ideal 20% deposit. This is completely normal—the vast majority of first home buyers purchase with less than a 20% deposit. 
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.6, marginBottom: 16, marginTop: 0 }}>
          A 20% deposit is simply the threshold to avoid Lenders Mortgage Insurance (LMI). It is not a hard limit on buying a home. 
        </p>
        <ul style={{ listStyleType: 'disc', paddingLeft: 20, margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}><strong>Explore LMI waivers:</strong> Certain professions and government guarantee schemes can waive the 20% requirement entirely.</li>
          <li style={{ marginBottom: 8 }}><strong>Adjust your budget:</strong> Looking at properties slightly below your maximum capacity can completely close this gap.</li>
          <li><strong>Speak to an expert:</strong> A broker can crunch the exact numbers for your specific situation and find lenders who are friendly to smaller deposits.</li>
        </ul>
      </div>
    )
  }

  // ── 4. BROKER CARD ───────────────────────────────────────────────────────────
  const BrokerCard = () => (
    <div style={{ ...card, padding: 24 }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', marginBottom: 6 }}>
        Talk to a home loan expert
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '0.9375rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: 24 }}>
        Sarah can help explain your options and connect you with lenders that match your situation.
      </p>

      {/* Broker profile */}
      <div className="flex items-center gap-4 mb-6">
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--foreground)' }}>
          SC
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)', marginBottom: 2 }}>Sarah Chen</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>MFAA Accredited · 9 years experience</p>
        </div>
        <span style={{ borderRadius: 9999, padding: '4px 10px', border: '1px solid var(--border)', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.625rem', letterSpacing: '0.04em', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
          No obligation
        </span>
      </div>

      {!submitted ? (
        <>
          {/* Single primary CTA */}
          {!contactMode && (
            <button
              type="button"
              onClick={() => setContactMode('book')}
              className="hover:opacity-90 active:scale-[0.98] transition-all duration-150"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--primary)', color: 'var(--foreground)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem', border: 'none', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', marginBottom: 11 }}
            >
              <CalendarDays size={18} style={{ flexShrink: 0 }} />
              <span className="sm:hidden">Talk to Sarah</span>
              <span className="hidden sm:inline">Talk to Sarah About Your Options</span>
            </button>
          )}
          {contactMode && (
            <div className="flex justify-between items-center mb-3">
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>
                {contactMode === 'book' ? 'Book a time' : contactMode === 'callback' ? 'Request a callback' : 'Send a message'}
              </span>
              <button type="button" onClick={() => setContactMode(null)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
            </div>
          )}

          {/* Booking form */}
          {contactMode === 'book' && (
            <form onSubmit={handleBrokerSubmit} className="flex flex-col gap-3 mb-4">
              <input
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                style={{ height: 46, border: '1.5px solid #DDDDDD', borderRadius: 8, padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 15, outline: 'none', width: '100%', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
              <div className="flex gap-2">
                {(['morning', 'afternoon', 'evening'] as ContactTime[]).map(t => (
                  <button key={t} type="button" onClick={() => setPreferredTime(t)}
                    style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', padding: '8px 4px', borderRadius: 8, border: '1.5px solid', borderColor: preferredTime === t ? 'var(--foreground)' : 'var(--border)', background: preferredTime === t ? 'var(--foreground)' : 'var(--card)', color: preferredTime === t ? 'var(--background)' : 'var(--muted-foreground)', cursor: 'pointer', fontWeight: preferredTime === t ? 600 : 400 }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <button type="submit"
                style={{
                  background: 'linear-gradient(180deg, #FEF06F 0%, #F5E642 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                  border: 'none', borderRadius: 8, padding: 13, cursor: 'pointer', width: '100%',
                  textShadow: '0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Confirm booking
              </button>
            </form>
          )}

          {/* Secondary text links */}
          {contactMode && (
            <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-[#F0F0F0]">
              {[
                { mode: 'book' as ContactMode, icon: <CalendarDays size={12} />, label: 'Book a time' },
                { mode: 'callback' as ContactMode, icon: <Phone size={12} />, label: 'Request callback' },
                { mode: 'message' as ContactMode, icon: <MessageSquare size={12} />, label: 'Send message' },
              ].map(({ mode, icon, label }) => {
                if (mode === contactMode) return null;
                return (
                  <button key={label} type="button"
                    onClick={() => setContactMode(mode)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors duration-150"
                    style={{ background: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0 }}
                  >
                    {icon}{label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Callback / message inline form */}
          {(contactMode === 'callback' || contactMode === 'message') && (
            <form onSubmit={handleBrokerSubmit} className="mt-4 flex flex-col gap-3">
              <input type="tel" placeholder="Your phone number" value={phone} onChange={e => setPhone(e.target.value)} required
                style={{ height: 46, border: '1.5px solid #DDDDDD', borderRadius: 8, padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 15, outline: 'none', width: '100%', color: 'var(--foreground)', boxSizing: 'border-box' }}
              />
              {contactMode === 'callback' && (
                <div className="flex gap-2">
                  {(['morning', 'afternoon', 'evening'] as ContactTime[]).map(t => (
                    <button key={t} type="button" onClick={() => setPreferredTime(t)}
                      style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', padding: '8px 4px', borderRadius: 8, border: '1.5px solid', borderColor: preferredTime === t ? 'var(--foreground)' : 'var(--border)', background: preferredTime === t ? 'var(--foreground)' : 'var(--card)', color: preferredTime === t ? 'var(--background)' : 'var(--muted-foreground)', cursor: 'pointer', fontWeight: preferredTime === t ? 600 : 400 }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              <button type="submit"
                style={{
                  background: 'linear-gradient(180deg, #FEF06F 0%, #F5E642 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  color: 'var(--foreground)',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                  border: 'none', borderRadius: 8, padding: 13, cursor: 'pointer', width: '100%',
                  textShadow: '0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Submit request
              </button>
            </form>
          )}

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: 12, textAlign: 'center' }}>
            Your data is only shared with Sarah when you submit a request.
          </p>
        </>
      ) : (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={17} color="var(--success-foreground)" style={{ flexShrink: 0 }} />
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--success-foreground)', margin: 0 }}>
            Request sent! Sarah will be in touch within 1 business day.
          </p>
        </div>
      )}
    </div>
  )

  // ── ACTION CENTER CARD (MODIFIED) ────────────────────────────────────────────
  const ActionCenterCard = () => {
    const saveIcon = saveState === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveState === 'saved' ? <Check size={16} /> : <Bookmark size={16} />
    const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save Results'

    const Divider = () => <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

    return (
      <div style={{ ...card, padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.6875rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted-foreground)', margin: 0 }}>
            Your Actions
          </p>
        </div>

        {/* Section 1: Property Card */}
        <div style={{ padding: '0 24px 24px' }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>🏡</span>
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', margin: 0, lineHeight: 1.2 }}>
                  Browse Homes
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: 0, marginTop: 4 }}>
                  In {stateAbbr} up to ${(maxPrice / 1000).toFixed(0)}k
                </p>
              </div>
            </div>

            <a
              href={reaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-2 hover:opacity-90 active:scale-[0.98] transition-all duration-150"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: 'var(--background)', background: 'var(--foreground)', borderRadius: 10, padding: '12px 16px', textDecoration: 'none' }}
            >
              View Listings
              <ArrowRight size={15} />
            </a>
          </div>
        </div>

        <Divider />

        {/* Section 2: Actions Row */}
        <div style={{ padding: 24 }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bookmark size={20} color="var(--foreground)" />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)', margin: 0, lineHeight: 1.2 }}>
                Save & Share
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', margin: 0, marginTop: 4 }}>
                Keep a record of your results
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: saveIcon,               label: saveLabel,                    action: handleSave,    active: saveState === 'saved', disabled: saveState === 'saving', primary: true },
              { icon: <Share2 size={16} />,   label: linkCopied ? 'Copied!' : 'Share Link', action: handleCopyLink, active: linkCopied,         disabled: false, primary: false },
              { icon: <FileDown size={16} />, label: 'Download PDF',                action: handlePrint,   active: false,                disabled: false, primary: false },
            ].map(({ icon, label, action, active, disabled, primary }) => (
              <button key={label} type="button" onClick={action} disabled={disabled}
                  className="transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px',
                    borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
                    background: primary ? (active ? 'rgba(34,197,94,0.1)' : 'var(--foreground)') : 'var(--card)',
                    color: primary ? (active ? 'var(--success-foreground)' : 'var(--background)') : 'var(--foreground)',
                    border: primary ? (active ? '1px solid rgba(34,197,94,0.3)' : 'none') : '1px solid var(--border)',
                    boxShadow: primary && !active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    opacity: disabled ? 0.6 : 1,
                  }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── 7. FULL WIDTH EMAIL BANNER ───────────────────────────────────────────────
  const FullWidthEmailBanner = () => {
    const [email, setEmail] = useState((step1 as any)?.email || '')
    const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent'>('idle')

    const handleSendEmail = (e: React.FormEvent) => {
      e.preventDefault()
      if (!email || emailState === 'sending') return
      setEmailState('sending')
      setTimeout(() => {
        setEmailState('sent')
      }, 1200)
    }

    return (
      <div 
        className="w-full mt-12 rounded-[24px] overflow-hidden border border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-gradient-to-br from-yellow-50 via-yellow-50/50 to-white dark:from-yellow-900/20 dark:via-card dark:to-card"
      >
        <div className="flex flex-col lg:flex-row p-6 lg:p-8 lg:px-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="flex-1 w-full text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-card border border-border shadow-sm px-3 py-1 rounded-full mb-4">
              <Mail size={12} className="text-muted-foreground" />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', color: 'var(--foreground)' }}>
                KEEP A COPY
              </span>
            </div>

            <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 'clamp(1.875rem, 4vw, 2.5rem)', color: 'var(--foreground)', lineHeight: 1.1, marginBottom: 12 }}>
              Get your personalised report in your inbox
            </h2>

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: 20, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Receive your personalised borrowing summary, grants and next steps in your inbox.
            </p>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-left max-w-lg mx-auto lg:mx-0">
              {[
                'Borrowing estimate',
                'Government grants',
                'Personalised next steps',
                'Share with partner'
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#16A34A]/10 flex items-center justify-center shrink-0">
                    <Check size={8} color="var(--success-foreground)" strokeWidth={3} />
                  </div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[400px] shrink-0 bg-card rounded-2xl p-5 lg:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-border">
            {emailState === 'sent' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-200 dark:border-green-800/50">
                  <Check size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--foreground)', marginBottom: 4 }}>
                  Report sent successfully
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: 16 }}>
                  Check your inbox.
                </p>
                <button 
                  onClick={() => setEmailState('idle')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground underline decoration-[#DDDDDD] underline-offset-4"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Resend Report
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-xl text-foreground text-[0.9375rem] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all pl-10 pr-4"
                      style={{ fontFamily: 'Inter, sans-serif', height: 52, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={emailState === 'sending'}
                  className="w-full flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--primary)', color: 'var(--foreground)', borderRadius: 12, height: 52, fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif', border: 'none', cursor: emailState === 'sending' ? 'default' : 'pointer', boxShadow: '0 2px 8px rgba(245, 230, 66, 0.25)' }}
                >
                  {emailState === 'sending' ? <Loader2 size={18} className="animate-spin" /> : null}
                  {emailState === 'sending' ? 'Sending...' : 'Send My Report'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  if (!mounted) return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <Navbar />
    </div>
  )

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      <Navbar />


      {/* ── Mobile: story order ── */}
      <main className="lg:hidden w-full max-w-120 mx-auto px-4 pb-24 flex flex-col gap-6" style={{ paddingTop: 68 }}>
        <HeroHeading />
        <MobilePositionCard />
        <ShortfallExplanationCard />
        <BrokerCard />
        <ActionCenterCard />
        <FullWidthEmailBanner />
      </main>

      {/* ── Desktop: 12-column adaptive layout ── */}
      <div className="hidden lg:block w-full max-w-[1200px] mx-auto px-12 pb-32" style={{ paddingTop: 80 }}>
        <HeroHeading />

        {/* Top Row: 3 independent cards */}
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <DesktopPositionCards />
        </div>

        {/* Second Row: 65/35 split */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '8fr 4fr', alignItems: 'start' }}>
          {/* Left Column (8 columns): Broker */}
          <div className="flex flex-col gap-6">
            <ShortfallExplanationCard />
            <BrokerCard />
          </div>

          {/* Right Column (4 columns): Property + Actions (Sticky) */}
          <div className="flex flex-col gap-6" style={{ position: 'sticky', top: 32 }}>
            <ActionCenterCard />
          </div>
        </div>
        <FullWidthEmailBanner />
      </div>


    </div>
  )
}
