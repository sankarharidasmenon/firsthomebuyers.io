'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { TotalSavingsHero } from '@/components/results/TotalSavingsHero'
import { ResultsTabSwitcher } from '@/components/results/ResultsTabSwitcher'
import { GrantCard } from '@/components/results/GrantCard'
import { HideIneligibleToggle } from '@/components/results/HideIneligibleToggle'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/home/Navbar'
import { getStep1, getStep2, getStep3 } from '@/lib/localStorage'
import { useAuth } from '@/lib/auth/AuthProvider'
import { saveResult } from '@/lib/scenarios/actions'
import { toast } from 'sonner'
import { DUMMY_USER } from '@/lib/dummyData'
import { fetchEligibility, type EligibilityResult, type EligibilityItem, type DisplayCategory } from '@/lib/schemes/eligibilityClient'

// Section header — airy, not heavy
function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span style={{ fontSize: '0.9375rem', opacity: 0.75 }}>{icon}</span>
      <div>
        <span className="text-[#444444] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem' }}>
          {title}
        </span>
        <span className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', marginLeft: 8 }}>
          {description}
        </span>
      </div>
    </div>
  )
}

const STATUS_PRI: Record<string, number> = { eligible: 1, check: 2, ineligible: 3 }

const CATEGORY_META = {
  cash: { icon: '💰', title: 'Cash Grants', description: 'One-time payments that do not need to be repaid' },
  schemes: { icon: '🏠', title: 'Government Schemes', description: 'Programs that help you buy without providing direct cash' },
  tax: { icon: '🧾', title: 'Tax & Duty Savings', description: 'Reductions in government taxes on your purchase' },
} as const

export default function GrantsResultsPage() {
  const router = useRouter()
  const { requireAuth } = useAuth()
  const [showIneligible, setShowIneligible] = useState(true)
  const [saved, setSaved] = useState(false)

  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading')
  const [display, setDisplay] = useState<{ state: string; firstName: string; targetPropertyPrice: number }>({
    state: DUMMY_USER.state, firstName: DUMMY_USER.firstName, targetPropertyPrice: DUMMY_USER.targetPropertyPrice,
  })

  const load = useCallback(async () => {
    setLoadState('loading')
    try {
      const s1 = getStep1() ?? { firstName: DUMMY_USER.firstName, state: DUMMY_USER.state, buyingWith: 'solo' as const }
      const s2 = getStep2() ?? { annualIncome: DUMMY_USER.annualIncome, partnerIncome: DUMMY_USER.partnerIncome, monthlyExpenses: DUMMY_USER.monthlyExpenses }
      const s3 = getStep3() ?? { depositAmount: DUMMY_USER.depositAmount, targetPropertyPrice: DUMMY_USER.targetPropertyPrice, propertyType: DUMMY_USER.propertyType, firstHomeBuyer: DUMMY_USER.firstHomeBuyer }

      setDisplay({ state: s1.state, firstName: s1.firstName, targetPropertyPrice: s3.targetPropertyPrice })

      const res = await fetchEligibility({
        state: s1.state,
        firstHomeBuyer: s3.firstHomeBuyer,
        income: s2.annualIncome + (s2.partnerIncome || 0),
        hasPartner: s1.buyingWith === 'partner',
        propertyPrice: s3.targetPropertyPrice,
        deposit: s3.depositAmount,
        propertyType: s3.propertyType,
        // Single-parent status isn't captured by onboarding: for couples it's
        // definitely not; for solo we leave it unknown so the DB doesn't exclude.
        singleParent: s1.buyingWith === 'partner' ? false : undefined,
      })

      setResult(res)
      setLoadState(res.items.length ? 'ready' : 'empty')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = () => {
    if (!result) return
    const payload = {
      firstName: display.firstName,
      state: display.state,
      grantsTotal: result.cashGrantsTotal + result.taxSavingsTotal,
      eligibleGrants: result.items.filter((i) => i.eg.status === 'eligible').map((i) => i.eg.grant.id),
      borrowing: { min: 0, max: 0 },
    }
    requireAuth(
      async () => {
        const res = await saveResult(payload)
        if (res.ok) {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
          toast.success('Saved to My Results.')
        } else {
          toast.error(res.error)
        }
      },
      { reason: 'Sign in to save your results and revisit them anytime.' }
    )
  }

  const CardList = () => {
    if (!result) return null
    type Item = EligibilityItem & { status: string }
    const flatItems: Item[] = result.items
      .map((i) => ({ ...i, status: i.eg.status }))
      .sort((a, b) => (STATUS_PRI[a.status] ?? 3) - (STATUS_PRI[b.status] ?? 3))

    // Group consecutive items with the same (status, category) into blocks
    type Block = { status: string; category: DisplayCategory; items: Item[] }
    const blocks: Block[] = []
    for (const item of flatItems) {
      const last = blocks[blocks.length - 1]
      if (last && last.status === item.status && last.category === item.category) last.items.push(item)
      else blocks.push({ status: item.status, category: item.category, items: [item] })
    }
    const visibleBlocks = showIneligible ? blocks : blocks.filter((b) => b.status !== 'ineligible')

    return (
      <div className="px-5 flex flex-col pt-5 pb-6" style={{ gap: 28 }}>
        {visibleBlocks.map((block, index) => {
          const meta = CATEGORY_META[block.category]
          return (
            <div key={`${block.status}-${block.category}-${index}`} className="flex flex-col" style={{ gap: 20 }}>
              <SectionHeader icon={meta.icon} title={meta.title} description={meta.description} />
              {block.items.map((item) => (
                <GrantCard
                  key={item.eg.grant.id}
                  evaluatedGrant={item.eg}
                  hidden={!showIneligible && item.eg.status === 'ineligible'}
                  variant={item.variant}
                />
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Non-ready states (kept inside the same page shell) ──
  const StatusPanel = () => {
    if (loadState === 'loading') {
      return (
        <div className="px-5 py-10 flex flex-col" style={{ gap: 16 }}>
          <div className="h-24 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      )
    }
    if (loadState === 'error') {
      return (
        <div className="px-5 py-16 text-center">
          <p className="text-[#666666] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
            We couldn&apos;t load your eligible grants &amp; schemes right now.
          </p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/15 dark:border-white/20 px-5 py-2 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <RotateCcw size={16} /> Try again
          </button>
        </div>
      )
    }
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-[#666666] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
          No government schemes are available yet. Please check back soon.
        </p>
      </div>
    )
  }

  const ActionButtons = () => (
    <div className="px-5 pb-7 pt-1 flex flex-col lg:px-6 lg:pb-6" style={{ gap: 10 }}>
      <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>NEXT STEPS →</Button>
      <button
        type="button"
        onClick={handleSave}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.875rem', color: saved ? '#16A34A' : '#AAAAAA', textAlign: 'center', padding: '6px 0', transition: 'color 150ms' }}
      >
        {saved ? '✓ Saved to My Results' : '💾 Save to My Results'}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-background">
      <Navbar />

      <main className="w-full pt-14 lg:pt-14.5 pb-16">
        {/* ── Mobile layout ── */}
        <div className="lg:hidden">
          <div className="bg-white dark:bg-card">
            {loadState === 'ready' && result ? (
              <>
                <TotalSavingsHero
                  cashGrantsTotal={result.cashGrantsTotal}
                  taxSavingsTotal={result.taxSavingsTotal}
                  eligibleSchemesCount={result.eligibleSchemesCount}
                  totalEligibleCount={result.totalEligibleCount}
                  state={display.state || 'your state'}
                />
                <ResultsTabSwitcher />
                <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
                <CardList />
                <ActionButtons />
              </>
            ) : (
              <StatusPanel />
            )}
          </div>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden lg:block max-w-275 mx-auto px-12">
          {loadState === 'ready' && result ? (
            <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>
              {/* Left column */}
              <div className="bg-white dark:bg-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)' }}>
                <TotalSavingsHero
                  cashGrantsTotal={result.cashGrantsTotal}
                  taxSavingsTotal={result.taxSavingsTotal}
                  eligibleSchemesCount={result.eligibleSchemesCount}
                  totalEligibleCount={result.totalEligibleCount}
                  state={display.state || 'your state'}
                />
                <ResultsTabSwitcher />
                <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
                <CardList />
              </div>

              {/* Right column — ONE unified card */}
              <div style={{ position: 'sticky', top: 80 }}>
                <div className="bg-white dark:bg-card rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <div className="px-6 pt-6 pb-5">
                    <p className="text-[#BBBBBB] dark:text-muted-foreground/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
                      Your summary
                    </p>
                    <div className="flex flex-col" style={{ gap: 18 }}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#666666] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>💰 Cash Grants</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: result.cashGrantsTotal > 0 ? '#16A34A' : '#CCCCCC' }}>
                          {result.cashGrantsTotal > 0 ? `$${result.cashGrantsTotal.toLocaleString('en-AU')}` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#666666] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>🧾 Tax & Duty Savings</span>
                        <span className={result.taxSavingsTotal > 0 ? 'text-[#111111] dark:text-foreground' : 'text-[#CCCCCC] dark:text-muted-foreground/30'} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem' }}>
                          {result.taxSavingsTotal > 0 ? `$${result.taxSavingsTotal.toLocaleString('en-AU')}` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[#666666] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>🏠 Eligible Schemes</span>
                        <span className={result.eligibleSchemesCount > 0 ? 'text-[#16A34A]' : 'text-[#CCCCCC] dark:text-muted-foreground/30'} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem' }}>
                          {result.eligibleSchemesCount > 0 ? result.eligibleSchemesCount : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <span className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem' }}>Property target</span>
                        <span className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem' }}>
                          ${display.targetPropertyPrice.toLocaleString('en-AU')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ActionButtons />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)' }}>
              <StatusPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
