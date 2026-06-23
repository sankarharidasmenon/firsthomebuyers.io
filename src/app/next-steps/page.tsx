'use client'

import React, { useState, useMemo } from 'react'
import { Navbar } from '@/components/home/Navbar'
import { getStep1, getStep2, getStep3, getStep4, setMyResults } from '@/lib/localStorage'
import { calculateBorrowingCapacity } from '@/lib/calculations'
import { evaluateEligibility } from '@/lib/grantEligibility'
import { DUMMY_USER } from '@/lib/dummyData'
import {
  Phone, MessageSquare, CalendarDays, Home,
  Bookmark, Share2, FileDown, ArrowRight,
  CheckCircle2, Check, Loader2,
} from 'lucide-react'

type ContactMode = null | 'callback' | 'message' | 'book'
type ContactTime = 'morning' | 'afternoon' | 'evening'
type SaveState = 'idle' | 'saving' | 'saved'

// ── Design tokens ─────────────────────────────────────────────────────────────

// Card: layered shadow + inset highlight creates Apple-like elevation
const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
}

const microLabel: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.6875rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#666666',
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
  const [contactMode, setContactMode] = useState<ContactMode>(null)
  const [submitted, setSubmitted] = useState(false)
  const [phone, setPhone] = useState('')
  const [preferredTime, setPreferredTime] = useState<ContactTime>('morning')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [linkCopied, setLinkCopied] = useState(false)

  const { borrowing, grantsTotal, step1, step3, state, depositGap } = useMemo(() => {
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
    return { borrowing, grantsTotal: report.grantsTotal, step1: s1, step3: s3, state: s1.state || 'VIC', depositGap }
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
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9999, padding: '4px 10px', marginBottom: 10 }}>
        <CheckCircle2 size={11} color="#16A34A" />
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.04em', color: '#16A34A' }}>
          Your results are ready
        </span>
      </div>

      <h1 suppressHydrationWarning style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 800,
        fontSize: 'clamp(1.625rem, 4vw, 2rem)',
        color: '#111111',
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
        color: '#666666',
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
      <div className="p-5 border-b border-black/5 bg-white">
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 4 }}>
          🏡 Homes You Could Afford
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: hasBorrowingPower ? 'clamp(1.5rem, 5vw, 1.875rem)' : '1.25rem', color: '#111111', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          {hasBorrowingPower ? `$${(minPrice / 1000).toFixed(0)}k – $${(maxPrice / 1000).toFixed(0)}k` : 'Building capacity...'}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>
          Based on your borrowing power and savings
        </p>
      </div>
      {/* 2. Government Support */}
      <div className="p-5 border-b border-black/5" style={{ background: '#FAFAF8' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 4 }}>
          💰 Government Support
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: '#16A34A', lineHeight: 1.1, marginBottom: 4 }}>
          ${grantsTotal.toLocaleString('en-AU')}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>
          Grants and concessions available
        </p>
      </div>
      {/* 3. Deposit Status */}
      <div className="p-5" style={{ background: '#FAFAF8' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 4 }}>
          {depositGap > 0 ? '⚠️ Deposit Status' : '✅ Deposit Status'}
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: depositGap > 0 ? '#F59E0B' : '#111111', lineHeight: 1.1, marginBottom: 4 }}>
          {depositGap > 0 ? `$${(depositGap/1000).toFixed(0)}k short` : "You're covered"}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>
          {depositGap > 0 ? 'How much more you need to reach 20%' : 'No additional deposit required'}
        </p>
      </div>
    </div>
  )

  // Desktop 3-column independent cards
  const DesktopPositionCards = () => (
    <div className="hidden lg:grid grid-cols-3 gap-6">
      {/* 1. Homes You Could Afford */}
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', background: 'white' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 8 }}>
          🏡 Homes You Could Afford
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: hasBorrowingPower ? '1.875rem' : '1.25rem', color: '#111111', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          {hasBorrowingPower ? `$${(minPrice / 1000).toFixed(0)}k – $${(maxPrice / 1000).toFixed(0)}k` : 'Building capacity...'}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>
          Based on your borrowing power and savings
        </p>
      </div>
      {/* 2. Government Support */}
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', background: 'white' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 8 }}>
          💰 Government Support
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.875rem', color: '#16A34A', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          ${grantsTotal.toLocaleString('en-AU')}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>
          Grants and concessions available
        </p>
      </div>
      {/* 3. Deposit Status */}
      <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', background: 'white' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 8 }}>
          {depositGap > 0 ? '⚠️ Deposit Status' : '✅ Deposit Status'}
        </p>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.875rem', color: depositGap > 0 ? '#F59E0B' : '#111111', lineHeight: 1.1, whiteSpace: 'nowrap', marginBottom: 4 }}>
          {depositGap > 0 ? `$${(depositGap/1000).toFixed(0)}k short` : "You're covered"}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>
          {depositGap > 0 ? 'How much more you need to reach 20%' : 'No additional deposit required'}
        </p>
      </div>
    </div>
  )

  // ── 3. SHORTFALL EXPLANATION ────────────────────────────────────────────────
  const ShortfallExplanationCard = () => {
    if (depositGap <= 0) return null

    return (
      <div style={{ ...card, padding: 24, background: '#FFFBF0', border: '1px solid #FDE68A' }}>
        <h3 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.125rem', color: '#92400E', marginBottom: 12, marginTop: 0 }}>
          🚧 Bridging your deposit gap
        </h3>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#451A03', lineHeight: 1.6, marginBottom: 16, marginTop: 0 }}>
          You're currently <strong>${(depositGap / 1000).toFixed(0)}k short</strong> of the ideal 20% deposit. This is completely normal—the vast majority of first home buyers purchase with less than a 20% deposit. 
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#451A03', lineHeight: 1.6, marginBottom: 16, marginTop: 0 }}>
          A 20% deposit is simply the threshold to avoid Lenders Mortgage Insurance (LMI). It is not a hard limit on buying a home. 
        </p>
        <ul style={{ listStyleType: 'disc', paddingLeft: 20, margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#78350F', lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}><strong>Explore LMI waivers:</strong> Certain professions and government guarantee schemes can waive the 20% requirement entirely.</li>
          <li style={{ marginBottom: 8 }}><strong>Adjust your budget:</strong> Looking at properties slightly below your maximum capacity can completely close this gap.</li>
          <li><strong>Speak to an expert:</strong> A broker can crunch the exact numbers for your specific situation and find lenders who are friendly to smaller deposits.</li>
        </ul>
      </div>
    )
  }

  // ── 3. PROPERTY CARD ─────────────────────────────────────────────────────────
  const PropertyCard = () => (
    <div style={{ ...card, padding: '24px 20px' }}>
      <div className="flex flex-col items-center text-center gap-3">
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24 }}>🏡</span>
        </div>
        
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111111', marginBottom: 6 }}>
            Browse Homes In Your Budget
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#777777', lineHeight: 1.4 }}>
            Homes in {stateAbbr} between<br/>
            <strong style={{ color: '#111111', fontFamily: '"JetBrains Mono", monospace' }}>${(minPrice / 1000).toFixed(0)}k – ${(maxPrice / 1000).toFixed(0)}k</strong>
          </p>
        </div>

        <a
          href={reaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mt-2 hover:opacity-90 active:scale-[0.98] transition-all duration-150"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#FFFFFF', background: '#111111', borderRadius: 12, padding: '14px 20px', textDecoration: 'none' }}
        >
          Browse Available Homes
          <ArrowRight size={15} />
        </a>
      </div>
    </div>
  )

  // ── 4. BROKER CARD ───────────────────────────────────────────────────────────
  const BrokerCard = () => (
    <div style={{ ...card, padding: 24 }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 6 }}>
        Talk to a home loan expert
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '0.9375rem', color: '#666666', lineHeight: 1.6, marginBottom: 24 }}>
        Sarah can help explain your options and connect you with lenders that match your situation.
      </p>

      {/* Broker profile */}
      <div className="flex items-center gap-4 mb-6">
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F5E642', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#111111' }}>
          SC
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#111111', marginBottom: 2 }}>Sarah Chen</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#888888', lineHeight: 1.4 }}>MFAA Accredited · 9 years experience</p>
        </div>
        <span style={{ borderRadius: 9999, padding: '4px 10px', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.625rem', letterSpacing: '0.04em', color: '#888888', whiteSpace: 'nowrap' }}>
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
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#F5E642', color: '#111111', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem', border: 'none', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', marginBottom: 11 }}
            >
              <CalendarDays size={18} style={{ flexShrink: 0 }} />
              <span className="sm:hidden">Talk to Sarah</span>
              <span className="hidden sm:inline">Talk to Sarah About Your Options</span>
            </button>
          )}
          {contactMode && (
            <div className="flex justify-between items-center mb-3">
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#111111' }}>
                {contactMode === 'book' ? 'Book a time' : contactMode === 'callback' ? 'Request a callback' : 'Send a message'}
              </span>
              <button type="button" onClick={() => setContactMode(null)} style={{ background: 'none', border: 'none', color: '#888888', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
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
                style={{ height: 46, border: '1.5px solid #DDDDDD', borderRadius: 8, padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 15, outline: 'none', width: '100%', color: '#111111', boxSizing: 'border-box' }}
              />
              <div className="flex gap-2">
                {(['morning', 'afternoon', 'evening'] as ContactTime[]).map(t => (
                  <button key={t} type="button" onClick={() => setPreferredTime(t)}
                    style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', padding: '8px 4px', borderRadius: 8, border: '1.5px solid', borderColor: preferredTime === t ? '#111111' : '#EEEEEE', background: preferredTime === t ? '#111111' : 'white', color: preferredTime === t ? 'white' : '#666666', cursor: 'pointer', fontWeight: preferredTime === t ? 600 : 400 }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <button type="submit"
                style={{
                  background: 'linear-gradient(180deg, #FEF06F 0%, #F5E642 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0,0,0,0.05)',
                  color: '#111111',
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
                    className="flex items-center gap-1 hover:text-black transition-colors duration-150"
                    style={{ background: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#888888', cursor: 'pointer', padding: 0 }}
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
                style={{ height: 46, border: '1.5px solid #DDDDDD', borderRadius: 8, padding: '0 14px', fontFamily: 'Inter, sans-serif', fontSize: 15, outline: 'none', width: '100%', color: '#111111', boxSizing: 'border-box' }}
              />
              {contactMode === 'callback' && (
                <div className="flex gap-2">
                  {(['morning', 'afternoon', 'evening'] as ContactTime[]).map(t => (
                    <button key={t} type="button" onClick={() => setPreferredTime(t)}
                      style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', padding: '8px 4px', borderRadius: 8, border: '1.5px solid', borderColor: preferredTime === t ? '#111111' : '#EEEEEE', background: preferredTime === t ? '#111111' : 'white', color: preferredTime === t ? 'white' : '#666666', cursor: 'pointer', fontWeight: preferredTime === t ? 600 : 400 }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              <button type="submit"
                style={{
                  background: 'linear-gradient(180deg, #FEF06F 0%, #F5E642 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 4px rgba(0,0,0,0.05)',
                  color: '#111111',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem',
                  border: 'none', borderRadius: 8, padding: 13, cursor: 'pointer', width: '100%',
                  textShadow: '0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Submit request
              </button>
            </form>
          )}

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', color: '#CCCCCC', marginTop: 12, textAlign: 'center' }}>
            Your data is only shared with Sarah when you submit a request.
          </p>
        </>
      ) : (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={17} color="#16A34A" style={{ flexShrink: 0 }} />
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#16A34A', margin: 0 }}>
            Request sent! Sarah will be in touch within 1 business day.
          </p>
        </div>
      )}
    </div>
  )

  // ── 5. ACTIONS ROW ───────────────────────────────────────────────────────────
  const saveIcon = saveState === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saveState === 'saved' ? <Check size={16} /> : <Bookmark size={16} />
  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save Results'

  const ActionsCard = () => (
    <div style={{ ...card, padding: 24 }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#111111', marginBottom: 16 }}>
        Save & Share
      </p>
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
              padding: '14px 16px',
              background: primary ? (active ? '#F0FDF4' : '#111111') : 'white',
              border: primary ? (active ? '1px solid #BBF7D0' : 'none') : '1px solid #E5E5E5',
              borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
              color: primary ? (active ? '#16A34A' : 'white') : '#111111',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
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
  )

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #FDFCF7 0%, #F5F3EC 45%, #ECEAE4 100%)' }}
    >
      <Navbar />

      {/* ── Mobile: story order ── */}
      <main className="lg:hidden w-full max-w-120 mx-auto px-4 pb-24 flex flex-col gap-6" style={{ paddingTop: 68 }}>
        <HeroHeading />
        <MobilePositionCard />
        <ShortfallExplanationCard />
        <BrokerCard />
        <PropertyCard />
        <ActionsCard />
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
            <PropertyCard />
            <ActionsCard />
          </div>
        </div>
      </div>


    </div>
  )
}
