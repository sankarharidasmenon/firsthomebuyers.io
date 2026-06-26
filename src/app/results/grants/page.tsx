'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TotalSavingsHero } from '@/components/results/TotalSavingsHero'
import { ResultsTabSwitcher } from '@/components/results/ResultsTabSwitcher'
import { GrantCard } from '@/components/results/GrantCard'
import { StampDutyCard } from '@/components/results/StampDutyCard'
import { HideIneligibleToggle } from '@/components/results/HideIneligibleToggle'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/home/Navbar'
import { getStep1, getStep2, getStep3, getStep4, setMyResults } from '@/lib/localStorage'
import { evaluateEligibility } from '@/lib/grantEligibility'
import { DUMMY_USER } from '@/lib/dummyData'

// Grant IDs that are direct cash payments (not scheme benefits)
const CASH_GRANT_IDS = ['fhog']

// Section header — airy, not heavy
function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span style={{ fontSize: '0.9375rem', opacity: 0.75 }}>{icon}</span>
      <div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#444444' }}>
          {title}
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#BBBBBB', marginLeft: 8 }}>
          {description}
        </span>
      </div>
    </div>
  )
}

export default function GrantsResultsPage() {
  const router = useRouter()
  const [showIneligible, setShowIneligible] = useState(true)
  const [saved, setSaved] = useState(false)

  const { report, step1, step3, cashGrants, schemes, cashGrantsTotal, taxSavingsTotal, eligibleSchemesCount } = useMemo(() => {
    const s1 = getStep1() ?? { firstName: DUMMY_USER.firstName, state: DUMMY_USER.state, buyingWith: 'solo' as const }
    const s2 = getStep2() ?? { annualIncome: DUMMY_USER.annualIncome, partnerIncome: DUMMY_USER.partnerIncome, monthlyExpenses: DUMMY_USER.monthlyExpenses }
    const s3 = getStep3() ?? { depositAmount: DUMMY_USER.depositAmount, targetPropertyPrice: DUMMY_USER.targetPropertyPrice, propertyType: DUMMY_USER.propertyType, firstHomeBuyer: DUMMY_USER.firstHomeBuyer }
    const s4 = getStep4() ?? { employmentType: DUMMY_USER.employmentType, creditCardLimit: DUMMY_USER.creditCardLimit, hecsDebt: DUMMY_USER.hecsDebt, otherLoanRepayments: DUMMY_USER.otherLoanRepayments }

    const report = evaluateEligibility(s1, s2, s3, s4)

    // Partition grants into cash vs scheme — no logic change, just display grouping
    const cashGrants = report.grants.filter(eg => CASH_GRANT_IDS.includes(eg.grant.id))
    const schemes = report.grants.filter(eg => !CASH_GRANT_IDS.includes(eg.grant.id))

    const cashGrantsTotal = cashGrants
      .filter(eg => eg.status === 'eligible' && typeof eg.value === 'number')
      .reduce((sum, eg) => sum + (eg.value as number), 0)

    const taxSavingsTotal = report.stampDuty?.isEligible ? report.stampDuty.saving : 0

    const eligibleSchemesCount = schemes.filter(eg => eg.status === 'eligible').length

    return { report, step1: s1, step3: s3, cashGrants, schemes, cashGrantsTotal, taxSavingsTotal, eligibleSchemesCount }
  }, [])

  const handleSave = () => {
    setMyResults({
      borrowing: { min: 0, max: 0 },
      grantsTotal: report.grantsTotal,
      eligibleGrants: report.grants.filter(g => g.status === 'eligible').map(g => g.grant.id),
      state: step1.state,
      firstName: step1.firstName,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Section visibility: hide a section only when all its cards are ineligible AND toggle is OFF
  const showCashSection = showIneligible || cashGrants.some(eg => eg.status !== 'ineligible')
  const showSchemesSection = showIneligible || schemes.some(eg => eg.status !== 'ineligible')
  const showTaxSection = showIneligible || (report.stampDuty?.isEligible ?? false)

  const CardList = () => (
    <div className="px-5 flex flex-col pt-5 pb-6" style={{ gap: 28 }}>

      {/* ── Section 1: Cash Grants ── */}
      {showCashSection && cashGrants.length > 0 && (
        <div className="flex flex-col" style={{ gap: 20 }}>
          <SectionHeader
            icon="💰"
            title="Cash Grants"
            description="One-time payments that do not need to be repaid"
          />
          {cashGrants.map(eg => (
            <GrantCard
              key={eg.grant.id}
              evaluatedGrant={eg}
              hidden={!showIneligible && eg.status === 'ineligible'}
              variant="grant"
            />
          ))}
        </div>
      )}

      {/* ── Section 2: Government Schemes ── */}
      {showSchemesSection && schemes.length > 0 && (
        <div className="flex flex-col" style={{ gap: 20 }}>
          <SectionHeader
            icon="🏠"
            title="Government Schemes"
            description="Programs that help you buy without providing direct cash"
          />
          {schemes.map(eg => (
            <GrantCard
              key={eg.grant.id}
              evaluatedGrant={eg}
              hidden={!showIneligible && eg.status === 'ineligible'}
              variant="scheme"
            />
          ))}
        </div>
      )}

      {/* ── Section 3: Tax & Duty Savings ── */}
      {showTaxSection && report.stampDuty && (
        <div className="flex flex-col" style={{ gap: 20 }}>
          <SectionHeader
            icon="🧾"
            title="Tax & Duty Savings"
            description="Reductions in government taxes on your purchase"
          />
          <StampDutyCard
            result={report.stampDuty}
            state={step1.state || 'VIC'}
            hidden={!showIneligible && !report.stampDuty.isEligible}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />

      <main className="w-full pt-14 lg:pt-14.5 pb-16">

        {/* ── Mobile layout ── */}
        <div className="lg:hidden">
          <div className="bg-white">
            <TotalSavingsHero
              cashGrantsTotal={cashGrantsTotal}
              taxSavingsTotal={taxSavingsTotal}
              eligibleSchemesCount={eligibleSchemesCount}
              totalEligibleCount={report.eligibleCount}
              state={step1.state || 'your state'}
            />
            <ResultsTabSwitcher />
            <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
            <CardList />
            <div className="px-5 pb-7 pt-1 flex flex-col" style={{ gap: 10 }}>
              <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>NEXT STEPS →</Button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: saved ? '#16A34A' : '#AAAAAA',
                  textAlign: 'center',
                  padding: '6px 0',
                  transition: 'color 150ms',
                }}
              >
                {saved ? '✓ Saved to My Results' : '💾 Save to My Results'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop layout ── */}
        <div className="hidden lg:block max-w-275 mx-auto px-12">
          <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>

            {/* Left column */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)' }}>
              <TotalSavingsHero
                cashGrantsTotal={cashGrantsTotal}
                taxSavingsTotal={taxSavingsTotal}
                eligibleSchemesCount={eligibleSchemesCount}
                totalEligibleCount={report.eligibleCount}
                state={step1.state || 'your state'}
              />
              <ResultsTabSwitcher />
              <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
              <CardList />
            </div>

            {/* Right column — ONE unified card */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div
                className="bg-white rounded-2xl"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.08)', overflow: 'hidden' }}
              >
                {/* Summary section */}
                <div className="px-6 pt-6 pb-5">
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', marginBottom: 20 }}>
                    Your summary
                  </p>

                  <div className="flex flex-col" style={{ gap: 18 }}>
                    {/* Cash Grants */}
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>💰 Cash Grants</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.0625rem', color: cashGrantsTotal > 0 ? '#16A34A' : '#CCCCCC' }}>
                        {cashGrantsTotal > 0 ? `$${cashGrantsTotal.toLocaleString('en-AU')}` : '—'}
                      </span>
                    </div>

                    {/* Tax savings */}
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>🧾 Tax & Duty Savings</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.0625rem', color: taxSavingsTotal > 0 ? '#111111' : '#CCCCCC' }}>
                        {taxSavingsTotal > 0 ? `$${taxSavingsTotal.toLocaleString('en-AU')}` : '—'}
                      </span>
                    </div>

                    {/* Eligible schemes */}
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#666666' }}>🏠 Eligible Schemes</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: eligibleSchemesCount > 0 ? '#16A34A' : '#CCCCCC' }}>
                        {eligibleSchemesCount > 0 ? eligibleSchemesCount : '—'}
                      </span>
                    </div>

                    {/* Property target — muted, clearly secondary */}
                    <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#BBBBBB' }}>Property target</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, fontSize: '0.8125rem', color: '#BBBBBB' }}>
                        ${step3.targetPropertyPrice.toLocaleString('en-AU')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions — part of same card */}
                <div className="px-6 pb-6 pt-1 flex flex-col" style={{ gap: 10 }}>
                  <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>
                    NEXT STEPS →
                  </Button>
                  <button
                    type="button"
                    onClick={handleSave}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: saved ? '#16A34A' : '#AAAAAA',
                      textAlign: 'center',
                      padding: '6px 0',
                      transition: 'color 150ms',
                    }}
                  >
                    {saved ? '✓ Saved to My Results' : '💾 Save to My Results'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
