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

export default function GrantsResultsPage() {
  const router = useRouter()
  const [showIneligible, setShowIneligible] = useState(true)
  const [saved, setSaved] = useState(false)

  const { report, step1, step3 } = useMemo(() => {
    const s1 = getStep1() ?? { firstName: DUMMY_USER.firstName, state: DUMMY_USER.state, buyingWith: 'solo' as const }
    const s2 = getStep2() ?? { annualIncome: DUMMY_USER.annualIncome, partnerIncome: DUMMY_USER.partnerIncome, monthlyExpenses: DUMMY_USER.monthlyExpenses }
    const s3 = getStep3() ?? { depositAmount: DUMMY_USER.depositAmount, targetPropertyPrice: DUMMY_USER.targetPropertyPrice, propertyType: DUMMY_USER.propertyType, firstHomeBuyer: DUMMY_USER.firstHomeBuyer }
    const s4 = getStep4() ?? { employmentType: DUMMY_USER.employmentType, creditCardLimit: DUMMY_USER.creditCardLimit, hecsDebt: DUMMY_USER.hecsDebt, otherLoanRepayments: DUMMY_USER.otherLoanRepayments }
    return { report: evaluateEligibility(s1, s2, s3, s4), step1: s1, step3: s3 }
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />

      {/* Desktop: pt-[64px] for taller nav; mobile: pt-[56px] */}
      <main className="w-full pt-[56px] lg:pt-[64px] pb-24">

        {/* ── Mobile layout: single column ── */}
        <div className="lg:hidden">
          <div className="bg-white">
            <TotalSavingsHero
              total={report.grantsTotal}
              eligibleCount={report.eligibleCount}
              state={step1.state || 'your state'}
            />
            <ResultsTabSwitcher />
            <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
            <div className="px-5 flex flex-col gap-6 pt-2 pb-4">
              {report.grants.map(eg => (
                <GrantCard key={eg.grant.id} evaluatedGrant={eg} hidden={!showIneligible && eg.status === 'ineligible'} />
              ))}
              {report.stampDuty && (
                <StampDutyCard result={report.stampDuty} state={step1.state || 'VIC'} hidden={!showIneligible && !report.stampDuty.isEligible} />
              )}
            </div>
            <div className="px-5 pb-6 flex flex-col gap-3">
              <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>NEXT STEPS →</Button>
              <Button onClick={handleSave} variant="secondary" fullWidth size="sm">{saved ? '✓ Saved!' : '💾 Save to My Results'}</Button>
            </div>
          </div>
        </div>

        {/* ── Desktop layout: two-column ── */}
        <div className="hidden lg:block max-w-[1100px] mx-auto px-12 pt-6">
          <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>

            {/* Left column — hero + cards */}
            <div className="bg-white rounded-[16px] overflow-hidden" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
              <TotalSavingsHero
                total={report.grantsTotal}
                eligibleCount={report.eligibleCount}
                state={step1.state || 'your state'}
              />
              <ResultsTabSwitcher />
              <HideIneligibleToggle showIneligible={showIneligible} onChange={setShowIneligible} />
              <div className="px-5 flex flex-col gap-6 pt-2 pb-6">
                {report.grants.map(eg => (
                  <GrantCard key={eg.grant.id} evaluatedGrant={eg} hidden={!showIneligible && eg.status === 'ineligible'} />
                ))}
                {report.stampDuty && (
                  <StampDutyCard result={report.stampDuty} state={step1.state || 'VIC'} hidden={!showIneligible && !report.stampDuty.isEligible} />
                )}
              </div>
            </div>

            {/* Right column — summary panel + actions (sticky) */}
            <div className="flex flex-col gap-4" style={{ position: 'sticky', top: 80 }}>
              {/* Summary card */}
              <div className="bg-white rounded-[16px] p-6" style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.09)' }}>
                <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1rem', color: '#111111', marginBottom: 16 }}>
                  Your summary
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#F0F0F0]">
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#888888' }}>Estimated savings</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1rem', color: '#F5E642' }}>
                      ${report.grantsTotal.toLocaleString('en-AU')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#F0F0F0]">
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#888888' }}>Eligible schemes</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#16A34A' }}>
                      {report.eligibleCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#888888' }}>Property target</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, fontSize: '0.875rem', color: '#111111' }}>
                      ${step3.targetPropertyPrice.toLocaleString('en-AU')}
                    </span>
                  </div>
                </div>
              </div>
              <Button onClick={() => router.push('/next-steps')} variant="primary" fullWidth>NEXT STEPS →</Button>
              <Button onClick={handleSave} variant="secondary" fullWidth size="sm">{saved ? '✓ Saved!' : '💾 Save to My Results'}</Button>
            </div>
          </div>
        </div>
      </main>


    </div>
  )
}
