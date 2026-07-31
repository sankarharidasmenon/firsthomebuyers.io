'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, CheckCircle2, Home, Landmark, PiggyBank, Check, Lock, ShieldCheck, Gift, Wallet, MapPin, Building, Info, ArrowRight } from 'lucide-react'
import * as Slider from '@radix-ui/react-slider'
import { Button } from '@/components/ui/button'
import { fetchGrantCalculator, type CalculatorResult } from '@/lib/calculator/calculatorClient'
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
    let animationFrameId: number
    const duration = 500 // ms
    const startValue = displayValue

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const factor = Math.min(progress / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - factor, 4)
      setDisplayValue(Math.floor(startValue + (value - startValue) * easeOutQuart))

      if (factor < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
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

  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [calcError, setCalcError] = useState(false)

  // Computed by the calculator's own engine via /api/grant-calculator — NOT the
  // questionnaire engine, which needs answers this screen never collects and so
  // returned "check required" for everything. Debounced so slider drags don't
  // spam the network; stale responses are ignored.
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      fetchGrantCalculator({ state, propertyType, propertyPrice })
        .then((res) => { if (!cancelled) { setResult(res); setCalcError(false) } })
        .catch(() => { if (!cancelled) { setResult(null); setCalcError(true) } })
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [state, propertyType, propertyPrice])

  const totalSavings = result?.totalValue ?? 0
  const duty = result?.duty ?? null
  // Cash grants first, then the duty saving, then the non-cash schemes.
  const lines: { key: string; name: string; value: number | string }[] = [
    ...(result?.grants ?? []).map((g) => ({ key: g.id, name: g.name, value: g.value })),
    ...(duty?.calculable && (duty.saving ?? 0) > 0
      ? [{ key: 'stamp-duty', name: 'Stamp duty saving', value: duty.saving as number }]
      : []),
    ...(result?.schemes ?? []).map((s) => ({ key: s.id, name: s.name, value: s.value })),
  ]

  return (
    <section id="grant-calculator" className="relative w-full overflow-hidden scroll-mt-20 lg:scroll-mt-24 bg-[#FEFCE8] dark:bg-background py-10 lg:py-12 border-y border-border/40">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{ background: 'radial-gradient(ellipse at top left, rgba(245,230,66,0.20) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 right-0 w-full h-full opacity-60" style={{ background: 'radial-gradient(ellipse at bottom right, rgba(245,230,66,0.14) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-6 lg:gap-16 items-stretch">

          {/* LEFT SIDE: Editorial */}
          <div className="flex flex-col justify-between h-full fade-up py-0 lg:py-2">
            <div>
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left w-full">
                {/* <div className="inline-flex items-center gap-2 bg-fn-yellow-light text-fn-navy text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Grant Calculator
                </div> */}

                <h2 className="text-3xl mb-4 max-w-[320px] lg:max-w-none" style={{ fontFamily: "var(--font-body, 'Inter'), sans-serif", fontWeight: 500, color: '#111111', letterSpacing: '-0.5px' }}>
                  Grant Calculator
                  {/* <br className="hidden lg:inline" /> could <span className="pr-1">unlock,</span> <br className="hidden lg:inline" /> right now */}
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
                    <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full shrink-0 mt-0.5" style={{ background: 'rgba(245,230,66,0.4)', color: '#111111' }}>
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
              <div className="hidden lg:flex p-3 rounded-xl gap-3 text-[0.8125rem] text-secondary-foreground max-w-[380px] mt-6" style={{ background: 'rgba(245,230,66,0.20)', border: '1px solid rgba(212,196,0,0.35)' }}>
                <div className="mt-0.5" style={{ color: '#C4A000' }}><Sparkles size={16} fill="currentColor" /></div>
                <p><strong>Results are estimates only.</strong> Final eligibility is subject to government rules.</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Calculator Card */}
          <div className="relative fade-up w-full" style={{ animationDelay: '100ms' }}>
            <div className="relative flex flex-col bg-white/40 backdrop-blur-3xl border border-white/70 dark:from-surface dark:to-surface/50 dark:border-border rounded-[24px] p-4 sm:p-6 lg:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-white/60">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: '#FBF6A8', color: '#111111' }}>
                  <Home size={18} />
                </div>
                <h3 className="text-[1.125rem] font-bold text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Your Grant Snapshot</h3>
              </div>

              {/* Form Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] text-muted-foreground font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    State / Territory
                  </label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger
                      className="w-full h-11 px-3.5 bg-transparent border border-[#DDDDDD] dark:border-border/50 rounded-xl text-[0.875rem] font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none hover:border-border transition-colors shadow-sm"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <div className="flex items-center gap-2.5 w-full text-left">
                        <MapPin size={16} className="shrink-0 opacity-80" style={{ color: '#C4A000' }} />
                        <span className="truncate"><SelectValue placeholder="Select state" /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="rounded-xl shadow-xl">
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.75rem] text-muted-foreground font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Property Type
                  </label>
                  <Select value={propertyType} onValueChange={(value) => setPropertyType(value as 'house' | 'townhouse' | 'apartment' | 'offplan')}>
                    <SelectTrigger
                      className="w-full h-11 px-3.5 bg-transparent border border-[#DDDDDD] dark:border-border/50 rounded-xl text-[0.875rem] font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none hover:border-border transition-colors shadow-sm"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <div className="flex items-center gap-2.5 w-full text-left">
                        <Building size={16} className="shrink-0 opacity-80" style={{ color: '#C4A000' }} />
                        <span className="truncate"><SelectValue placeholder="Select property type" /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="rounded-xl shadow-xl">
                      <SelectItem value="house">Existing House</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="offplan">New build / Off-the-plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Slider Area */}
              <div className="flex flex-col mb-4">
                <label className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground font-medium mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Estimated Property Price <Info size={14} className="opacity-50" />
                </label>
                
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5 mb-1"
                  value={[propertyPrice]}
                  min={300000}
                  max={1200000}
                  step={10000}
                  onValueChange={(val) => setPropertyPrice(val[0])}
                >
                  <Slider.Track className="relative grow rounded-full h-[4px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #EEEEEE, #EEEEEE 3px, transparent 3px, transparent 6px)' }}>
                    <Slider.Range className="absolute rounded-full h-full" style={{ background: '#F5E642' }} />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-[18px] h-[18px] border-[3px] border-white dark:border-background rounded-full shadow-md focus:outline-none focus:ring-4 transition-transform hover:scale-110 cursor-grab active:cursor-grabbing"
                    style={{ background: '#111111' }}
                    aria-label="Property Price"
                  />
                </Slider.Root>

                <div className="flex justify-between items-center mt-2.5 text-[0.75rem] font-medium text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span className="w-[60px] text-left text-[0.6875rem] uppercase tracking-wide">$300K</span>
                  <span className="text-[1.125rem] font-bold text-foreground tracking-tight tabular-nums flex-1 text-center">
                    <AnimatedNumber value={propertyPrice} />
                  </span>
                  <span className="w-[60px] text-right text-[0.6875rem] uppercase tracking-wide">$1.2M+</span>
                </div>
              </div>

              {/* Inner Grants Card */}
              <div className="dark:bg-card/50 dark:border-border/50 rounded-2xl p-4 sm:p-5 mb-4 mt-4" style={{ background: '#FEFCE8', border: '1px solid rgba(212,196,0,0.35)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'rgba(245,230,66,0.5)', color: '#111111' }}>
                    <Wallet size={16} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-[0.9375rem] text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>Estimated Grants & Savings</span>
                </div>

                <div className="flex flex-col w-full gap-3.5 mb-2 min-h-[180px]">
                  {lines.map((line, i) => (
                    <div key={`${line.key}-${i}`} className="flex items-start sm:items-center justify-between gap-3 sm:gap-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <span className="font-medium text-[0.875rem] text-foreground leading-snug">{line.name}</span>
                      <span className={`text-[#16A34A] font-bold tracking-tight mt-0.5 sm:mt-0 tabular-nums ${typeof line.value === 'number' ? 'text-[0.9375rem] shrink-0' : 'text-right text-[0.75rem] sm:text-[0.8125rem] max-w-[55%] sm:max-w-none leading-tight'}`}>
                        {typeof line.value === 'number' ? <AnimatedNumber value={line.value} /> : line.value}
                      </span>
                    </div>
                  ))}
                  {lines.length === 0 && (
                    <div className="py-2 text-center text-[0.875rem] text-muted-foreground italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {calcError ? 'Unable to estimate right now — please try again.' : 'Adjust values to see eligible grants.'}
                    </div>
                  )}
                </div>

                {/* Footer Total */}
                <div className="mt-4 pt-4 dark:border-border/40 flex justify-between items-center gap-2" style={{ borderTop: '1px solid rgba(212,196,0,0.35)' }}>
                  <span className="font-bold text-[0.875rem] sm:text-[0.9375rem] text-foreground leading-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Total Estimated Value
                  </span>
                  <span className="text-[1.5rem] sm:text-[1.75rem] font-bold text-[#16A34A] tracking-tight shrink-0 tabular-nums" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <AnimatedNumber value={totalSavings} />
                  </span>
                </div>
              </div>

              <div className="text-[0.625rem] text-muted-foreground mb-6 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                * Stamp duty savings, LMI savings and cash grants combined.<br />
                Eligibility conditions apply. FHSS assumes max voluntary contributions over 4 years.
              </div>

              {/* Bottom Sticky CTA inside the card */}
              <div className="p-4 bg-white dark:bg-input border border-[#EEEEEE] dark:border-border/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: '#FBF6A8', color: '#111111' }}>
                    <Gift size={18} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-[0.875rem]" style={{ fontFamily: 'Inter, sans-serif' }}>Want your personalised results?</span>
                    <span className="text-[0.6875rem] text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Answer a few quick questions to see what you qualify for.
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full sm:w-auto whitespace-nowrap h-10 px-5 rounded-lg text-[#111111] font-bold text-[0.8125rem] transition-colors hover:brightness-95"
                  style={{ background: '#F5E642' }}
                  onClick={() => window.location.href = '/onboarding'}
                >
                  Get My Results <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
