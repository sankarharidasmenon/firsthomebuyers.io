'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/home/Navbar'
import { Button } from '@/components/ui/button'
import { Trash2, TrendingUp, ArrowRight, Pencil, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

// View models mapped from localStorage keys
interface SavedResults {
  id: string
  savedAt: string
  borrowing: { min: number; max: number }
  grantsTotal: number
  eligibleGrants: string[]
  state: string
  firstName: string
}
interface SavedScenario {
  id: string
  name: string | null
  savedAt: string
  sliders: { extraSavings: number; incomeIncrease: number; hasPartner: boolean; partnerIncome: number }
  result: { min: number; max: number }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${(m % 1 === 0 ? m.toFixed(0) : m.toFixed(1))}M`
  }
  return `$${Math.round(n / 1000)}k`
}

function getPlanMeta(s: SavedScenario): { name: string; icon: string } {
  const { extraSavings, incomeIncrease, hasPartner } = s.sliders
  const n = [extraSavings > 0, incomeIncrease > 0, hasPartner].filter(Boolean).length
  if (n === 0) return { name: 'Current Position', icon: '🏡' }
  if (hasPartner && n >= 2) return { name: 'Best Improvement Plan', icon: '🚀' }
  if (hasPartner) return { name: 'Buying Together', icon: '👥' }
  if (extraSavings > 0 && incomeIncrease > 0) return { name: 'With Extra Savings & Income', icon: '📈' }
  if (extraSavings > 0) return { name: 'With Extra Savings', icon: '💰' }
  if (incomeIncrease > 0) return { name: 'With Higher Income', icon: '📈' }
  return { name: 'Explored Plan', icon: '🎯' }
}

function getInsight(s: SavedScenario, isBest: boolean, diff: number): { emoji: string; text: string } {
  const { extraSavings, incomeIncrease, hasPartner } = s.sliders
  if (isBest && diff > 0) {
    return {
      emoji: '🎉',
      text: `This plan gives you access to ${fmtMoney(diff)} more worth of homes than your starting position — your strongest option right now.`,
    }
  }
  if (hasPartner && incomeIncrease > 0 && extraSavings > 0) {
    return { emoji: '🚀', text: 'Combining two incomes, extra savings, and higher pay gives you the biggest jump in what you could afford.' }
  }
  if (hasPartner) {
    return { emoji: '👥', text: 'Two incomes mean banks will lend you significantly more — this plan shows how much your options grow by buying together.' }
  }
  if (extraSavings > 0 && incomeIncrease > 0) {
    return { emoji: '📈', text: 'Saving more and earning more at the same time gives you a bigger lift than either change on its own.' }
  }
  if (extraSavings > 0) {
    return { emoji: '💰', text: `Adding ${fmtMoney(extraSavings)} to your savings strengthens your deposit and expands the homes you can consider.` }
  }
  if (incomeIncrease > 0) {
    return { emoji: '📈', text: `Earning ${fmtMoney(incomeIncrease)} more per year directly increases how much a lender will offer you.` }
  }
  return { emoji: '🏡', text: 'This is your baseline. Use it to see how any change — more savings, higher income, or a partner — shifts what you can afford.' }
}

// ── Design tokens ──────────────────────────────────────────────────────────────

const cardClass = "bg-[#FFFFFF] dark:bg-card border border-[rgba(0,0,0,0.07)] dark:border-border rounded-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_10px_32px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-none overflow-hidden"
const bestCardClass = "bg-[#FFFFFF] dark:bg-card border border-[rgba(0,0,0,0.07)] dark:border-border border-l-[3px] border-l-[#22C55E] rounded-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_10px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-none overflow-hidden"

const microLabel: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.625rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#BBBBBB',
  marginBottom: 6,
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyResultsPage() {
  const router = useRouter()
  const [savedResults, setSavedResults] = useState<SavedResults | null>(null)
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'improvement'>('newest')

  const refresh = useCallback(() => {
    try {
      const resultsRaw = localStorage.getItem('firstnest_my_results')
      if (resultsRaw) {
        const r = JSON.parse(resultsRaw)
        setSavedResults({
          id: 'local-result',
          savedAt: r.savedAt ?? new Date().toISOString(),
          borrowing: r.borrowing ?? { min: 0, max: 0 },
          grantsTotal: Number(r.grantsTotal ?? 0),
          eligibleGrants: r.eligibleGrants ?? [],
          state: String(r.state ?? ''),
          firstName: String(r.firstName ?? ''),
        })
      } else {
        setSavedResults(null)
      }
      const scenariosRaw = localStorage.getItem('firstnest_saved_scenarios')
      if (scenariosRaw) {
        const arr = JSON.parse(scenariosRaw) as Array<{
          id: string; savedAt: string;
          sliders: SavedScenario['sliders']; result: SavedScenario['result']
        }>
        setScenarios(arr.map(s => ({ ...s, name: null })))
      } else {
        setScenarios([])
      }
    } catch {
      // Silently ignore parse errors
    }
    setLoaded(true)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDeleteResults = () => {
    if (!savedResults) return
    if (confirm('Delete your home buying snapshot?')) {
      localStorage.removeItem('firstnest_my_results')
      setSavedResults(null)
      toast.success('Snapshot deleted.')
    }
  }

  const handleDeleteScenario = (id: string) => {
    const updated = scenarios.filter((s) => s.id !== id)
    setScenarios(updated)
    localStorage.setItem('firstnest_saved_scenarios', JSON.stringify(updated))
    toast.success('Plan deleted.')
  }

  const handleRenameScenario = (id: string, currentName: string | null) => {
    const name = prompt('Rename this plan', currentName ?? '')
    if (name === null) return
    const updated = scenarios.map((s) => s.id === id ? { ...s, name: name.trim() } : s)
    setScenarios(updated)
    localStorage.setItem('firstnest_saved_scenarios', JSON.stringify(updated))
    toast.success('Plan renamed.')
  }

  const isEmpty = !savedResults && scenarios.length === 0
  const displayName = savedResults?.firstName
    ? savedResults.firstName.charAt(0).toUpperCase() + savedResults.firstName.slice(1)
    : null

  const baselineMax = savedResults?.borrowing.max ?? 0
  const byImprovement = [...scenarios].sort((a, b) => b.result.max - a.result.max)
  const sortedScenarios =
    sortBy === 'improvement'
      ? byImprovement
      : [...scenarios].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  const bestScenario = byImprovement[0] ?? null
  const bestScenarioId =
    bestScenario && bestScenario.result.max > baselineMax ? bestScenario.id : null
  const bestImprovement =
    bestScenario && bestScenario.result.max > baselineMax
      ? bestScenario.result.max - baselineMax
      : 0

  const totalPlans = (savedResults ? 1 : 0) + scenarios.length
  const showSummaryStrip = !!(savedResults && sortedScenarios.length > 0 && bestImprovement > 0)

  return (
    <div
      className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#FFFDF7_0%,#FAFAF8_55%,#FFFFFF_100%)] dark:[background:var(--background)]"
    >
      <Navbar />

      <main className="flex-1 w-full max-w-190 mx-auto pt-24 pb-28 px-4 lg:px-0">

        {/* ── Loading state ── */}
        {!loaded && (
          <div className="flex items-center justify-center pt-28">
            <div className="w-6 h-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
          </div>
        )}

        {/* ── Empty state ── */}
        {loaded && isEmpty && (
          <div className="flex flex-col items-center justify-center pt-20 text-center px-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-[#FDFCF0] dark:bg-surface"
              style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <span style={{ fontSize: '2rem' }}>🏡</span>
            </div>
            <h1 className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: 10, letterSpacing: '-0.01em' }}>
              Your home buying plans will live here
            </h1>
            <p className="text-[#666666] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', maxWidth: 360, marginBottom: 32, lineHeight: 1.65 }}>
              Answer a few questions to see what you could afford — then save different plans to compare your options side by side.
            </p>
            <Button onClick={() => router.push('/onboarding?flow=grants')} variant="primary" className="px-8" fullWidth={false}>
              Get Started <ArrowRight size={16} className="ml-2 inline" />
            </Button>
            <p className="text-[#AAAAAA] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', marginTop: 12 }}>
              Takes about a few minutes
            </p>
          </div>
        )}

        {/* ── Main content ── */}
        {loaded && !isEmpty && (
          <div className="flex flex-col gap-7">

            <div style={{ marginBottom: 2 }}>
              <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                Your home buying journey
              </p>
              <h1 className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 'clamp(1.625rem, 4vw, 2rem)', letterSpacing: '-0.015em', lineHeight: 1.1, marginBottom: 10 }}>
                {displayName ? `Welcome back, ${displayName} 👋` : 'Your saved plans 🏡'}
              </h1>
              <div className="text-[#555555] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', lineHeight: 1.65, maxWidth: 500 }}>
                {totalPlans === 1 ? (
                  <p>You&apos;ve saved your starting point. Use the sliders on your results page to explore what different changes could unlock — then save each plan to compare here.</p>
                ) : (
                  <p>
                    You&apos;ve explored <strong className="text-[#111111] dark:text-foreground" style={{ fontWeight: 700 }}>{totalPlans} different ways</strong> to get into your first home.
                    {bestImprovement > 0 && (
                      <> One of your plans could unlock <strong style={{ color: '#16A34A' }}>{fmtMoney(bestImprovement)} more</strong> in homes you can afford.</>
                    )}
                  </p>
                )}
              </div>
            </div>

            {showSummaryStrip && (
              <div className="bg-[rgba(255,255,255,0.75)] dark:bg-card border border-[rgba(0,0,0,0.07)] dark:border-border rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
                <div className="grid grid-cols-3">
                  {[
                    { label: 'Plans saved', value: String(totalPlans), color: '#111111' },
                    { label: 'Best improvement', value: `+${fmtMoney(bestImprovement)}`, color: '#16A34A' },
                    {
                      label: 'Best home range',
                      value: `${fmtMoney(sortedScenarios[0].result.min)} – ${fmtMoney(sortedScenarios[0].result.max)}`,
                      color: '#111111',
                    },
                  ].map(({ label, value, color }, i) => (
                    <div
                      key={label}
                      className={`px-4 py-4 text-center ${i > 0 ? 'border-l border-[rgba(0,0,0,0.06)] dark:border-border' : ''}`}
                    >
                      <p style={microLabel}>{label}</p>
                      <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: i === 2 ? '0.875rem' : '1.25rem', color, lineHeight: 1.1 }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Baseline card ── */}
            {savedResults && (
              <div>
                <p style={microLabel}>Your starting point</p>
                <div className={cardClass}>
                  <div className="flex items-start justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.05)] dark:border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F8F8F5] dark:bg-surface border border-[rgba(0,0,0,0.06)] dark:border-border">
                        <span style={{ fontSize: '1.125rem' }}>🏡</span>
                      </div>
                      <div>
                        <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Current Position</p>
                        <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginTop: 2 }}>
                          Saved {formatDate(savedResults.savedAt)} · {savedResults.state}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={handleDeleteResults} className="text-[#DDDDDD] hover:text-[#E53E3E] transition-colors p-1 mt-1" title="Delete snapshot">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="px-6 py-5">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p style={microLabel}>Homes you could afford</p>
                        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: '1.375rem', color: '#111111', letterSpacing: '-0.02em', lineHeight: 1 }} className="dark:text-foreground">
                          {fmtMoney(savedResults.borrowing.min)}
                          <span className="text-[#DDDDDD] dark:text-border" style={{ fontWeight: 300 }}> – </span>
                          {fmtMoney(savedResults.borrowing.max)}
                        </p>
                        <p className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', marginTop: 4 }}>estimated purchase range</p>
                      </div>
                      <div>
                        <p style={microLabel}>Government support</p>
                        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: '1.375rem', color: '#16A34A', letterSpacing: '-0.02em', lineHeight: 1 }}>
                          ${savedResults.grantsTotal.toLocaleString('en-AU')}
                        </p>
                        <p className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', marginTop: 4 }}>
                          grants & concessions in {savedResults.state}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-[#FAFAF8] dark:bg-surface border-t border-[rgba(0,0,0,0.05)] dark:border-border">
                    <button
                      type="button"
                      onClick={() => router.push('/results/grants')}
                      className="flex items-center gap-1.5 hover:gap-2.5 transition-all duration-150 text-[#444444] dark:text-muted-foreground hover:text-foreground"
                      style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8125rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      See the full picture
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Saved plans ── */}
            {sortedScenarios.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ ...microLabel, marginBottom: 0 }}>
                    {sortedScenarios.length === 1 ? 'Plan explored' : `${sortedScenarios.length} plans explored`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSortBy((s) => (s === 'newest' ? 'improvement' : 'newest'))}
                    className="inline-flex items-center gap-1.5 text-[#666666] dark:text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <ArrowUpDown size={13} />
                    {sortBy === 'newest' ? 'Newest first' : 'Best improvement'}
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {sortedScenarios.map((scenario) => {
                    const diff = scenario.result.max - baselineMax
                    const isPositive = diff > 0
                    const isBest = scenario.id === bestScenarioId
                    const { name: planName, icon: planIcon } = getPlanMeta(scenario)
                    const insight = getInsight(scenario, isBest, diff)

                    return (
                      <div key={scenario.id} className={`${isBest ? bestCardClass : cardClass} transition-transform duration-200 hover:-translate-y-px`}>
                        <div className="flex items-start justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.04)] dark:border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F8F8F5] dark:bg-surface border border-[rgba(0,0,0,0.06)] dark:border-border">
                              <span style={{ fontSize: '1.125rem' }}>{planIcon}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                                  {scenario.name || planName}
                                </p>
                                {isBest && (
                                  <span
                                    className="inline-flex items-center gap-1"
                                    style={{
                                      background: '#F0FDF4',
                                      border: '1px solid rgba(34,197,94,0.25)',
                                      borderRadius: 9999,
                                      padding: '2px 8px',
                                      fontFamily: 'Inter, sans-serif',
                                      fontWeight: 700,
                                      fontSize: '0.5625rem',
                                      letterSpacing: '0.06em',
                                      textTransform: 'uppercase',
                                      color: '#16A34A',
                                    }}
                                  >
                                    🚀 Best option
                                  </span>
                                )}
                              </div>
                              <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', marginTop: 2 }}>
                                Saved {formatDate(scenario.savedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <button type="button" onClick={() => handleRenameScenario(scenario.id, scenario.name)} className="text-[#DDDDDD] hover:text-foreground transition-colors p-1" aria-label="Rename plan">
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => handleDeleteScenario(scenario.id)} className="text-[#DDDDDD] hover:text-[#E53E3E] transition-colors p-1" aria-label="Delete plan">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              {isBest && diff > 0 ? (
                                <>
                                  <p style={microLabel}>Improvement</p>
                                  <p style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: '1.625rem', color: '#16A34A', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 2 }}>
                                    +{fmtMoney(diff)}
                                  </p>
                                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', color: '#16A34A', opacity: 0.75, marginBottom: 10 }}>
                                    more homes you can afford
                                  </p>
                                  <p style={{ ...microLabel, marginBottom: 4 }}>Home range</p>
                                  <p className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', lineHeight: 1 }}>
                                    {fmtMoney(scenario.result.min)}
                                    <span className="text-[#DDDDDD] dark:text-border" style={{ fontWeight: 300 }}> – </span>
                                    {fmtMoney(scenario.result.max)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p style={microLabel}>Homes you could afford</p>
                                  <p className="text-[#111111] dark:text-foreground" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: '1.375rem', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 10 }}>
                                    {fmtMoney(scenario.result.min)}
                                    <span className="text-[#DDDDDD] dark:text-border" style={{ fontWeight: 300 }}> – </span>
                                    {fmtMoney(scenario.result.max)}
                                  </p>
                                </>
                              )}

                              {!isBest && baselineMax > 0 && diff !== 0 && (
                                <div
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                  style={{ background: isPositive ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${isPositive ? '#DCFCE7' : '#FEE2E2'}` }}
                                >
                                  <TrendingUp size={12} style={{ color: isPositive ? '#16A34A' : '#DC2626' }} />
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.75rem', color: isPositive ? '#16A34A' : '#DC2626' }}>
                                    {isPositive ? '+' : ''}{fmtMoney(Math.abs(diff))} more in homes you can afford
                                  </span>
                                </div>
                              )}
                              {baselineMax === 0 && diff === 0 && (
                                <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  Your baseline — nothing changed yet
                                </p>
                              )}
                            </div>

                            <div className="rounded-xl p-4 bg-[#FAFAF8] dark:bg-surface border border-[rgba(0,0,0,0.05)] dark:border-border">
                              <p style={{ ...microLabel, marginBottom: 8 }}>What you changed</p>
                              <ul className="flex flex-col gap-2">
                                {scenario.sliders.extraSavings > 0 && (
                                  <li className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.875rem' }}>💰</span>
                                    <span className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem' }}>
                                      Added <strong>${scenario.sliders.extraSavings.toLocaleString('en-AU')}</strong> in savings
                                    </span>
                                  </li>
                                )}
                                {scenario.sliders.incomeIncrease > 0 && (
                                  <li className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.875rem' }}>📈</span>
                                    <span className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem' }}>
                                      <strong>+${scenario.sliders.incomeIncrease.toLocaleString('en-AU')}/yr</strong> in income
                                    </span>
                                  </li>
                                )}
                                {scenario.sliders.hasPartner && (
                                  <li className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.875rem' }}>👥</span>
                                    <span className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem' }}>
                                      Partner income of <strong>${scenario.sliders.partnerIncome.toLocaleString('en-AU')}/yr</strong>
                                    </span>
                                  </li>
                                )}
                                {scenario.sliders.extraSavings === 0 && scenario.sliders.incomeIncrease === 0 && !scenario.sliders.hasPartner && (
                                  <li className="flex items-center gap-2">
                                    <span style={{ fontSize: '0.875rem' }}>🏡</span>
                                    <span className="text-[#999999] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                                      Your current numbers, no changes
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-4 bg-[#FAFAF8] dark:bg-surface border-t border-[rgba(0,0,0,0.04)] dark:border-border">
                          <p className="text-[#444444] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                            <span style={{ marginRight: 6 }}>{insight.emoji}</span>
                            {insight.text}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Explore CTA ── */}
            <div
              className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              style={{ background: '#111111' }}
            >
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#FFFFFF', marginBottom: 4 }}>
                  Want to explore more options?
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Try different sliders on your results page and save each new plan here to compare.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/results/borrowing')}
                className="shrink-0 flex items-center justify-center w-full md:w-auto gap-2 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(245,230,66,0.4)] transition-all duration-150"
                style={{ background: '#F5E642', color: '#111111', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Explore plans
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        )}
      </main>

    </div>
  )
}
