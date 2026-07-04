'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, Home, Landmark, Calculator, PiggyBank, ArrowRight, Check, Lock, ShieldCheck, Gift } from 'lucide-react'
import { SliderField } from '@/components/ui/SliderField'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Button } from '@/components/ui/button'
import { evaluateEligibility, EligibilityReport } from '@/lib/grantEligibility'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Animated Counter Component ---
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    const duration = 500 // ms
    const startValue = displayValue

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const factor = Math.min(progress / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - factor, 4)
      setDisplayValue(Math.floor(startValue + (value - startValue) * easeOutQuart))

      if (factor < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <span>${displayValue.toLocaleString('en-AU')}</span>
  )
}

export function GrantCalculatorSection() {
  // Calculator State
  const [state, setState] = useState('VIC')
  const [propertyType, setPropertyType] = useState<'house' | 'townhouse' | 'apartment' | 'offplan'>('offplan')
  const [propertyPrice, setPropertyPrice] = useState(700000)
  const [depositAmount, setDepositAmount] = useState(70000)
  const [buyingWith, setBuyingWith] = useState<'solo' | 'partner'>('solo')

  const [report, setReport] = useState<EligibilityReport | null>(null)

  useEffect(() => {
    // Generate mocked step data to feed the existing eligibility engine
    const step1 = { state, buyingWith, firstName: 'User' }
    const step2 = { annualIncome: 90000, partnerIncome: buyingWith === 'partner' ? 90000 : 0, monthlyExpenses: 2000 }
    const step3 = { depositAmount, targetPropertyPrice: propertyPrice, propertyType, firstHomeBuyer: true }
    const step4 = { employmentType: 'fulltime' as const, creditCardLimit: 0, hecsDebt: false, otherLoanRepayments: 0 }

    const result = evaluateEligibility(step1, step2, step3, step4)
    setReport(result)
  }, [state, propertyType, propertyPrice, depositAmount, buyingWith])

  const totalSavings = report?.grantsTotal || 0
  const eligibleGrants = report?.grants.filter(g => g.status === 'eligible') || []

  return (
    <section className="relative w-full overflow-hidden bg-[#FDF8F0] dark:bg-background py-10 lg:py-12 border-y border-border/40">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--color-fn-yellow-pale)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(245,230,66,0.05)_0%,_transparent_60%)] opacity-80" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_#FFF9EA_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_bottom_right,_rgba(245,230,66,0.03)_0%,_transparent_60%)] opacity-80" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-6 lg:gap-16 items-stretch">

          {/* LEFT SIDE: Editorial */}
          <div className="flex flex-col justify-between h-full fade-up py-0 lg:py-2">
            <div>
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left w-full">
                <div className="inline-flex items-center gap-2 bg-fn-yellow-light text-fn-navy text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Grant Calculator
                </div>

                <h2 className="text-3xl lg:text-5xl font-bold leading-[1.15] tracking-tight text-foreground mb-4 max-w-[320px] lg:max-w-none">
                  See what you <br className="hidden lg:inline" /> could <span className="gradient-text italic pr-1">unlock,</span> <br className="hidden lg:inline" /> right now
                </h2>

                <p className="text-[0.9375rem] lg:text-base text-secondary-foreground mb-5 lg:mb-6 max-w-[300px] lg:max-w-[380px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Instantly estimate the grants and savings you may be eligible for as an Australian first home buyer.
                </p>
              </div>

              <ul className="space-y-3 lg:space-y-4 mb-0 lg:mb-6 mx-auto lg:mx-0 max-w-fit lg:max-w-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                {[
                  { title: '100% Free', sub: 'No obligations or hidden costs.', icon: <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5" /> },
                  { title: 'Instant Estimate', sub: 'Get an instant breakdown in seconds.', icon: <Lock className="w-4 h-4 lg:w-5 lg:h-5" /> },
                  { title: 'Government Verified', sub: 'Based on official scheme information.', icon: <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> }
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 lg:gap-4 items-start">
                    <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 text-primary-hover shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                      <span className="font-bold text-[0.875rem] lg:text-base text-foreground leading-tight">{item.title}</span>
                      <span className="text-[0.75rem] lg:text-sm text-secondary-foreground leading-tight">{item.sub}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop Disclaimer */}
              <div className="hidden lg:flex p-3 rounded-xl bg-primary/10 border border-primary/20 gap-3 text-[0.8125rem] text-secondary-foreground max-w-[380px] mt-6">
                <div className="mt-0.5 text-primary-hover"><Sparkles size={16} fill="currentColor" /></div>
                <p><strong>Results are estimates only.</strong> Final eligibility is subject to government rules.</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Calculator Card */}
          <div className="relative fade-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute -inset-1 bg-gradient-to-b from-primary/30 to-transparent rounded-[24px] blur-xl opacity-50 dark:opacity-20" />

            <div className="relative flex flex-col bg-white dark:bg-card border border-border dark:border-border rounded-[24px] p-4 lg:p-4 shadow-modal">

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFFCE8] text-primary-hover dark:bg-primary/20 dark:text-primary">
                  <Home size={18} />
                </div>
                <h3 className="text-lg font-bold font-heading text-foreground">Your Grant Snapshot</h3>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.8125rem] font-semibold text-secondary-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                    State / Territory
                  </label>
                  <div className="relative">
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger 
                        className="w-full h-[38px] px-3 bg-background dark:bg-input border border-border dark:border-border rounded-[10px] text-[0.875rem] font-medium focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:border-muted-foreground transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="NSW">New South Wales (NSW)</SelectItem>
                        <SelectItem value="VIC">Victoria (VIC)</SelectItem>
                        <SelectItem value="QLD">Queensland (QLD)</SelectItem>
                        <SelectItem value="WA">Western Australia (WA)</SelectItem>
                        <SelectItem value="SA">South Australia (SA)</SelectItem>
                        <SelectItem value="TAS">Tasmania (TAS)</SelectItem>
                        <SelectItem value="ACT">Australian Capital Territory (ACT)</SelectItem>
                        <SelectItem value="NT">Northern Territory (NT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[0.8125rem] font-semibold text-secondary-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Property Type
                  </label>
                  <div className="relative">
                    <Select value={propertyType} onValueChange={(value) => setPropertyType(value as any)}>
                      <SelectTrigger 
                        className="w-full h-[38px] px-3 bg-background dark:bg-input border border-border dark:border-border rounded-[10px] text-[0.875rem] font-medium focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:border-muted-foreground transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="house">Existing House</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="offplan">New build / Off-the-plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <SliderField
                  label="Estimated Property Price"
                  value={propertyPrice}
                  min={300000}
                  max={1200000}
                  step={10000}
                  onChange={setPropertyPrice}
                />
              </div>

              {/* Live Results Card */}
              <div className="bg-[#FFFCE8] dark:bg-primary/5 rounded-[16px] p-3 mb-2.5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/20 text-primary-hover dark:text-primary">
                    <Landmark size={16} />
                  </div>
                  <span className="font-bold text-[1rem] font-heading text-foreground">Estimated Grants & Savings</span>
                </div>

                <div className="space-y-1 mb-2">
                  {report?.stampDuty?.isEligible && (
                    <div className="flex justify-between items-center font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-[0.875rem] text-secondary-foreground">Stamp Duty Concession</span>
                      <span className="text-foreground text-[1rem]"><AnimatedNumber value={report.stampDuty.saving} /></span>
                    </div>
                  )}
                  {eligibleGrants.map((eg, i) => (
                    <div key={i} className="flex justify-between items-center font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="text-[0.875rem] text-secondary-foreground">{eg.grant.name}</span>
                      <span className="text-foreground text-[1rem]">
                        {typeof eg.value === 'number' ? <AnimatedNumber value={eg.value} /> : eg.value}
                      </span>
                    </div>
                  ))}
                  {!report?.stampDuty?.isEligible && eligibleGrants.length === 0 && (
                    <div className="text-[0.875rem] text-muted-foreground italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Adjust values to see eligible grants.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-primary/20 dark:border-border flex justify-between items-center">
                  <span className="font-bold text-[1.0625rem] text-foreground font-heading">Total Estimated Value</span>
                  <span className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    <AnimatedNumber value={totalSavings} />
                  </span>
                </div>
              </div>

              <div className="text-[0.65rem] text-muted-foreground mb-2.5 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                * Stamp duty savings, LMI savings and cash grants combined.<br />
                Eligibility conditions apply. FHSS assumes max voluntary contributions over 4 years.
              </div>

              {/* CTA Box */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 bg-background dark:bg-input rounded-[16px] border border-border dark:border-border shadow-sm gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFFCE8] dark:bg-primary/20 text-primary-hover dark:text-primary shrink-0">
                    <Gift size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground mb-0.5 font-heading text-[0.9375rem]">Want your personalised results?</span>
                    <span className="text-[0.75rem] text-secondary-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Answer a few quick questions to see what you qualify for.
                    </span>
                  </div>
                </div>
                <Button variant="primary" className="w-full lg:w-auto whitespace-nowrap h-9 text-[0.8125rem]" onClick={() => window.location.href = '/onboarding'}>
                  Get My Results <ArrowRight className="ml-1.5" size={16} />
                </Button>
              </div>
            </div>

            {/* Mobile Disclaimer (Hidden on desktop) */}
            <div className="flex lg:hidden mt-4 p-2.5 rounded-xl bg-primary/5 border border-primary/10 gap-2.5 text-[0.75rem] text-secondary-foreground max-w-full">
              <div className="mt-0.5 text-primary-hover"><Sparkles size={14} fill="currentColor" /></div>
              <p><strong>Results are estimates only.</strong> Final eligibility is subject to government rules.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
