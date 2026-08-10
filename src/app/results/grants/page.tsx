'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { RotateCcw, Wallet, Landmark, Receipt } from 'lucide-react'
import { TotalSavingsHero } from '@/components/results/TotalSavingsHero'
import { ResultsTabSwitcher } from '@/components/results/ResultsTabSwitcher'
import { GrantCard } from '@/components/results/GrantCard'
import { HideIneligibleToggle } from '@/components/results/HideIneligibleToggle'
import { AIChatCard } from '@/components/ask-ai'
const AIChatModal = dynamic(() => import('@/components/ask-ai').then(mod => mod.AIChatModal), { ssr: false })
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/home/Navbar'
import { getStep1, getStep2, getStep3 } from '@/lib/localStorage'
import { toast } from 'sonner'
import { DUMMY_USER } from '@/lib/dummyData'
import { fetchEligibility, type EligibilityResult, type EligibilityItem, type DisplayCategory } from '@/lib/schemes/eligibilityClient'
import { summariseEligibility } from '@/lib/schemes/summary'
import { loadAnswers } from '@/lib/questionnaire/storage'
import { toEligibilityAnswers } from '@/lib/questionnaire/logic'

// Section header — airy, not heavy
function SectionHeader({ icon: Icon, title, description }: { icon: typeof Wallet; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon size={14} className="text-[#999999] dark:text-muted-foreground/60" strokeWidth={2} />
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

/**
 * Category order WITHIN a status band. Presentation only — it decides where a
 * card is drawn, never whether it qualifies.
 *
 * Sorting by status and then by category means each (status, category) pair
 * forms one contiguous run, so a section header appears at most once per status
 * band. Previously only the status was sorted, and the grouping loop below —
 * which starts a new block whenever consecutive items differ — reproduced the
 * backend's interleaved category order as repeated headers ("Cash Grants" could
 * appear five times inside the ineligible band).
 */
const CATEGORY_PRI: Record<DisplayCategory, number> = { cash: 1, schemes: 2, tax: 3 }

const CATEGORY_META = {
  cash: { icon: Wallet, title: 'Cash Grants', description: 'One-time payments that do not need to be repaid' },
  schemes: { icon: Landmark, title: 'Government Schemes', description: 'Programs that help you buy without providing direct cash' },
  tax: { icon: Receipt, title: 'Tax & Duty Savings', description: 'Reductions in government taxes on your purchase' },
} as const

/**
 * When "Show Non Eligible Schemes" is on, a Not Eligible card is only worth
 * showing if it could realistically apply to this applicant. Two of the
 * engine's own criteria already say "this scheme is not for you" rather than
 * "you don't currently qualify": rule 1's fast-fail when the scheme belongs to
 * another state/territory, and rule 13's single-parent gate when the
 * applicant is part of a couple. Both are read straight off the criteria text
 * `evaluateScheme` already returns — no re-evaluation, no new business rule.
 */
const IRRELEVANT_REASON_PATTERNS: RegExp[] = [
  /^Scheme is for .+, not .+$/i, // wrong state/territory
  /is not a single parent \(applying with partner\)/i, // couple applying to a single-parent-only scheme
]

function isRelevantNonEligible(item: { status: string; ruleResults: { met: boolean; text: string; isCheck?: boolean }[] }): boolean {
  if (item.status !== 'ineligible') return true
  return !item.ruleResults.some(
    (r) => !r.met && !r.isCheck && IRRELEVANT_REASON_PATTERNS.some((re) => re.test(r.text))
  )
}

export default function GrantsResultsPage() {
  const router = useRouter()
  const [showIneligible, setShowIneligible] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'empty' | 'ready'>('loading')
  const [display, setDisplay] = useState<{ state: string; firstName: string; targetPropertyPrice: number; landPrice?: number | null; propertyCategory?: string }>({
    state: DUMMY_USER.state, firstName: DUMMY_USER.firstName, targetPropertyPrice: DUMMY_USER.targetPropertyPrice,
  })

  const load = useCallback(async () => {
    setLoadState('loading')
    try {
      const answers = loadAnswers()
      
      // No state means no real answers (empty state). Name is NOT the gate —
      // the fast path lets users reach results before they've given a name.
      if (!answers.state) {
        setLoadState('empty')
        return
      }

      // Answers go to the engine exactly as the questionnaire mapped them. Every
      // caller must send the identical payload, or two pages will disagree.
      const eligibilityAnswers = toEligibilityAnswers(answers)
      setDisplay({ 
        state: answers.state || 'VIC', 
        firstName: answers.name, 
        targetPropertyPrice: eligibilityAnswers.propertyPrice,
        landPrice: eligibilityAnswers.landPrice,
        propertyCategory: eligibilityAnswers.propertyCategory
      })

      const res = await fetchEligibility(eligibilityAnswers)

      setResult(res)
      setLoadState(res.items.length ? 'ready' : 'empty')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = () => {
    if (!result) return
    try {
      const data = {
        savedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        borrowing: { min: 0, max: 0 },
        grantsTotal: summariseEligibility(result.items).totalBenefit,
        eligibleGrants: result.items.filter((i) => i.eg.status === 'eligible').map((i) => i.eg.grant.id),
        state: display.state,
        firstName: display.firstName,
      }
      localStorage.setItem('firstnest_my_results', JSON.stringify(data))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success('Saved to My Results.')
    } catch {
      toast.error('Failed to save results.')
    }
  }

  // Summary figures, derived from the SAME items that render the cards below, so
  // the hero can never disagree with the list. No re-evaluation.
  const summary = summariseEligibility(result?.items ?? [], {
    state: display.state,
    price: display.targetPropertyPrice,
    propertyCategory: display.propertyCategory,
    landPrice: display.landPrice,
  })

  const CardList = () => {
    if (!result) return null
    type Item = EligibilityItem & { status: string }
    // Order for DISPLAY: status band first, then category within the band. The
    // sort is stable, so two cards sharing a status and category keep the exact
    // order the engine returned them in — no scheme is reprioritised, only
    // repositioned. `.sort()` mutates, so it runs on the array `.map()` just
    // produced, never on `result.items` itself.
    // Toggle OFF: Not Eligible items are dropped entirely — EXCEPT near
    // misses, which the engine has verified are one realistic change away
    // from qualifying. A close miss is an opportunity, not noise, so it is
    // always shown. Toggle ON: Not Eligible items are kept only when they're
    // relevant to this applicant (own state/territory + own relationship
    // profile) — see isRelevantNonEligible. Filtering happens on the flat
    // list, before grouping, so a scheme excluded here never contributes a
    // stray section header either. Eligible and Check items are never touched.
    const flatItems: Item[] = result.items
      .map((i) => ({ ...i, status: i.eg.status }))
      .filter((item) => (showIneligible ? isRelevantNonEligible(item) : item.status !== 'ineligible' || !!item.nearMiss))
      .sort((a, b) =>
        (STATUS_PRI[a.status] ?? 3) - (STATUS_PRI[b.status] ?? 3) ||
        (CATEGORY_PRI[a.category] ?? 9) - (CATEGORY_PRI[b.category] ?? 9))

    // Group consecutive items with the same (status, category) into blocks
    type Block = { status: string; category: DisplayCategory; items: Item[] }
    const blocks: Block[] = []
    for (const item of flatItems) {
      const last = blocks[blocks.length - 1]
      if (last && last.status === item.status && last.category === item.category) last.items.push(item)
      else blocks.push({ status: item.status, category: item.category, items: [item] })
    }
    const visibleBlocks = blocks

    // Card numbering — presentation only. Counts the cards actually rendered, in
    // render order, continuing across section headers instead of restarting.
    // Derived from `visibleBlocks`, so hiding the ineligible schemes renumbers
    // 1..N over what remains rather than leaving gaps. Nothing here reads or
    // writes eligibility; the numbers follow the order, never set it.
    const cardNumbers = new Map<string, number>()
    for (const block of visibleBlocks) {
      for (const item of block.items) cardNumbers.set(item.eg.grant.id, cardNumbers.size + 1)
    }

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
                  hidden={!showIneligible && item.eg.status === 'ineligible' && !item.nearMiss}
                  variant={item.variant}
                  // Same calculator as the summary card — only for the duty
                  // scheme the applicant actually qualifies for.
                  duty={item.category === 'tax' && item.bucket === 'yes' ? summary.duty : null}
                  index={cardNumbers.get(item.eg.grant.id)}
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
      <Link
        href="/"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: '#BBBBBB', textAlign: 'center', padding: '4px 0', textDecoration: 'none', display: 'block', transition: 'color 150ms' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#444444')}
        onMouseLeave={e => (e.currentTarget.style.color = '#BBBBBB')}
      >
        ← Back to Discover
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-background">
      <Navbar />

      {/* One layout for every width — nothing left to split once the
          duplicate desktop sidebar (same figures the hero already shows) is
          gone. Only the max-width and card chrome change at lg. */}
      <main className="w-full pt-14 lg:pt-14.5 pb-16">
        <div className="max-w-[680px] mx-auto lg:px-6">
          {loadState === 'ready' && result ? (
            <div className="bg-white dark:bg-card lg:rounded-2xl lg:overflow-hidden lg:border lg:border-[rgba(0,0,0,0.06)] dark:lg:border-border">
              <TotalSavingsHero
                summary={summary}
                state={display.state || 'your state'}
                targetPrice={display.targetPropertyPrice}
              />
              <ResultsTabSwitcher />
              <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
              <div className="px-5 pt-5 pb-1">
                <AIChatCard onClick={() => setIsChatOpen(true)} />
              </div>
              <CardList />
              <ActionButtons />
            </div>
          ) : (
            <div className="bg-white dark:bg-card lg:rounded-2xl lg:overflow-hidden lg:border lg:border-[rgba(0,0,0,0.06)] dark:lg:border-border">
              <StatusPanel />
            </div>
          )}
        </div>
      </main>

      {/* ── AI Chat Modal ── */}
      <AIChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        eligibilityProfile={{
          state: display.state,
          targetPropertyPrice: display.targetPropertyPrice,
          eligibleSchemes: result?.items.filter(i => i.eg.status === 'eligible').map(i => i.eg.grant.id) || [],
          ineligibleSchemes: result?.items.filter(i => i.eg.status === 'ineligible').map(i => i.eg.grant.id) || []
        }}
      />
    </div>
  )
}
