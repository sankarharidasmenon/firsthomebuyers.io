'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BorrowingRangeDisplay } from '@/components/results/BorrowingRangeDisplay'
import { DepositGapIndicator } from '@/components/results/DepositGapIndicator'
import { ScenarioSliders } from '@/components/results/ScenarioSliders'
import { ResultsTabSwitcher } from '@/components/results/ResultsTabSwitcher'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/home/Navbar'
import { getStep1, getStep2, getStep3, getStep4 } from '@/lib/localStorage'
import { calculateBorrowingCapacity, type BorrowingInputs } from '@/lib/calculations'
import { DUMMY_USER } from '@/lib/dummyData'

// Derive all inputs + results from whatever is in localStorage at read time.
function resolveFromLocalStorage() {
  const s1 = getStep1() ?? { firstName: DUMMY_USER.firstName, state: DUMMY_USER.state, buyingWith: 'solo' as const }
  const s2 = getStep2() ?? { annualIncome: DUMMY_USER.annualIncome, partnerIncome: 0, monthlyExpenses: DUMMY_USER.monthlyExpenses }
  const s3 = getStep3() ?? { depositAmount: DUMMY_USER.depositAmount, targetPropertyPrice: DUMMY_USER.targetPropertyPrice, propertyType: 'house' as const, firstHomeBuyer: true }
  const s4 = getStep4() ?? { employmentType: 'fulltime' as const, creditCardLimit: DUMMY_USER.creditCardLimit, hecsDebt: DUMMY_USER.hecsDebt, otherLoanRepayments: 0 }

  // Coerce strings → numbers in case localStorage serialised them as strings
  const annualIncome      = Number(s2.annualIncome)      || 0
  const partnerIncome     = Number(s2.partnerIncome)     || 0
  const monthlyExpenses   = Number(s2.monthlyExpenses)   || 0
  const creditCardLimit   = Number(s4.creditCardLimit)   || 0
  const otherLoanRepayments = Number(s4.otherLoanRepayments) || 0
  const depositAmount     = Number(s3.depositAmount)     || 0

  // If income is missing fall back to DUMMY_USER so the page is always meaningful
  const effectiveIncome   = annualIncome   > 0 ? annualIncome   : DUMMY_USER.annualIncome
  const effectiveExpenses = monthlyExpenses > 0 ? monthlyExpenses : DUMMY_USER.monthlyExpenses
  const usingFallback = annualIncome === 0

  const inputs: BorrowingInputs = {
    annualIncome:      effectiveIncome,
    partnerIncome:     s1.buyingWith === 'partner' ? partnerIncome : 0,
    monthlyExpenses:   effectiveExpenses,
    creditCardLimit,
    otherLoanRepayments,
    hecsDebt:          s4.hecsDebt,
    depositAmount:     depositAmount > 0 ? depositAmount : DUMMY_USER.depositAmount,
    employmentType:    s4.employmentType,
  }

  return {
    baseInputs: inputs,
    baseResult: calculateBorrowingCapacity(inputs),
    step1: s1,
    step3: { ...s3, depositAmount: inputs.depositAmount },
    usingFallback,
  }
}

export default function BorrowingResultsPage() {
  const router = useRouter()

  const [resolved, setResolved] = useState<ReturnType<typeof resolveFromLocalStorage> | null>(null)

  useEffect(() => {
    setResolved(resolveFromLocalStorage())
  }, [])

  const [currentResult, setCurrentResult] = useState(() =>
    resolved ? resolved.baseResult : { min: 0, max: 0 }
  )

  // Sync currentResult whenever resolved data becomes available.
  useEffect(() => {
    if (resolved) setCurrentResult(resolved.baseResult)
  }, [resolved])

  // Use stable memos derived from the resolved snapshot (not re-derived on every render).
  const baseInputs = useMemo(() => resolved?.baseInputs ?? null, [resolved])
  const baseResult = useMemo(() => resolved?.baseResult ?? { min: 0, max: 0 }, [resolved])
  const step1      = useMemo(() => resolved?.step1 ?? { firstName: '', state: '', buyingWith: 'solo' as const }, [resolved])
  const step3      = useMemo(() => resolved?.step3 ?? { depositAmount: 0, targetPropertyPrice: 0, propertyType: 'house' as const, firstHomeBuyer: true }, [resolved])
  const usingFallback = resolved?.usingFallback ?? false

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-background">
      <Navbar />

      <main className="w-full pt-14 lg:pt-16 pb-24">

        {/* Fallback notice — shown when income data was missing */}
        {usingFallback && (
          <div className="lg:max-w-275 lg:mx-auto lg:px-12 pt-3 px-4">
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1, marginTop: 1 }}>💡</span>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: '#92400E', marginBottom: 2 }}>
                  Showing estimates based on typical figures
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#B45309', lineHeight: 1.5 }}>
                  We couldn&apos;t find your income details.{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/onboarding?step=2')}
                    style={{ fontWeight: 600, color: '#92400E', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Update your income
                  </button>{' '}
                  to see your real borrowing capacity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile layout: single column ── */}
        <div className="lg:hidden bg-white dark:bg-card">
          <BorrowingRangeDisplay
            min={currentResult.min}
            max={currentResult.max}
            firstName={step1.firstName}
            depositAmount={step3.depositAmount}
            targetPropertyPrice={step3.targetPropertyPrice}
          />
          <ResultsTabSwitcher />
          <DepositGapIndicator
            depositAmount={step3.depositAmount}
            targetPropertyPrice={step3.targetPropertyPrice}
          />
          <div className="h-px bg-grey-light mx-5 mt-6" />
          <div className="pt-4">
            {baseInputs && (
              <ScenarioSliders
                baseInputs={baseInputs}
                baseResult={baseResult}
                onResultChange={setCurrentResult}
              />
            )}
          </div>
          <div className="px-5 pb-6 flex flex-col gap-3">
            <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>
              NEXT STEPS →
            </Button>
            <Link
              href="/"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.8125rem', color: '#BBBBBB', textAlign: 'center', padding: '4px 0', textDecoration: 'none', display: 'block', transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#444444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#BBBBBB')}
            >
              ← Back to Discover
            </Link>
          </div>
        </div>

        {/* ── Desktop layout: two-column ── */}
        <div className="hidden lg:block max-w-275 mx-auto px-12 pt-6">
          <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>

            {/* Left: hero + deposit gap */}
            <div className="bg-white dark:bg-card rounded-2xl overflow-hidden pb-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #EEEEEE' }}>
              <BorrowingRangeDisplay
                min={currentResult.min}
                max={currentResult.max}
                firstName={step1.firstName}
                depositAmount={step3.depositAmount}
                targetPropertyPrice={step3.targetPropertyPrice}
              />
              <ResultsTabSwitcher />
              <DepositGapIndicator
                depositAmount={step3.depositAmount}
                targetPropertyPrice={step3.targetPropertyPrice}
              />
            </div>

            {/* Right: scenario sliders (sticky) */}
            <div className="flex flex-col gap-4" style={{ position: 'sticky', top: 80 }}>
              <div className="bg-white dark:bg-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #EEEEEE' }}>
                {baseInputs && (
                  <ScenarioSliders
                    baseInputs={baseInputs}
                    baseResult={baseResult}
                    onResultChange={setCurrentResult}
                  />
                )}
              </div>
              <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>
                NEXT STEPS →
              </Button>
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}
