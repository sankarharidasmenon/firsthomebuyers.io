'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Sparkles, CheckCircle2,
  Gift, TrendingUp, Tag, MapPin,
  ShieldCheck, DollarSign, FileText, Calendar,
} from 'lucide-react'
import ScrollReveal from '@/components/ScrollReveal'

const placeholders = [
  'Can I buy with a 5% deposit?',
  'What grants apply in NSW?',
  'How much can I borrow on $120k income?',
  'Can I avoid LMI?',
]

type PillTheme = 'yellow' | 'cream' | 'slate'

const themeMap: Record<PillTheme, { pill: string; icon: string }> = {
  yellow: {
    pill: 'bg-fn-yellow-light text-fn-navy hover:bg-fn-yellow hover:-translate-y-0.5 hover:shadow-[0_3px_14px_rgba(255,204,0,0.32)]',
    icon: 'text-fn-yellow-deep',
  },
  cream: {
    pill: 'bg-fn-yellow-pale text-fn-navy border border-fn-yellow-deep/20 hover:bg-fn-yellow-light hover:border-fn-yellow-deep/40 hover:-translate-y-0.5 hover:shadow-sm',
    icon: 'text-fn-yellow-deep',
  },
  slate: {
    pill: 'bg-muted text-foreground hover:bg-accent hover:-translate-y-0.5 hover:shadow-sm',
    icon: 'text-muted-foreground',
  },
}

const prompts: Array<{ label: string; icon: React.ElementType; theme: PillTheme }> = [
  { label: 'First home grants',           icon: Gift,        theme: 'yellow' },
  { label: 'Borrowing capacity',          icon: TrendingUp,  theme: 'slate'  },
  { label: 'Stamp duty savings',          icon: Tag,         theme: 'cream'  },
  { label: 'Best suburbs under budget',   icon: MapPin,      theme: 'yellow' },
  { label: 'Can I avoid LMI?',            icon: ShieldCheck, theme: 'slate'  },
  { label: 'How much deposit do I need?', icon: DollarSign,  theme: 'cream'  },
  { label: 'FHOG eligibility',            icon: FileText,    theme: 'yellow' },
  { label: 'Buying timeline help',        icon: Calendar,    theme: 'slate'  },
]

const aiSteps = [
  'Checking grant eligibility',
  'Analysing borrowing capacity',
  'Matching NSW schemes',
  'Reviewing deposit strength',
  'Checking first-home buyer status',
]

const miniConvo = [
  { role: 'user', text: 'What grants am I eligible for?' },
  { role: 'ai',  text: 'You may qualify for up to $41,800 across 3 schemes.' },
  { role: 'user', text: 'Can I buy with a 5% deposit?' },
  { role: 'ai', text: 'You may qualify for the Home Guarantee Scheme with no LMI required.' },
]

export default function AskAISection() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const [phFade, setPhFade] = useState(true)
  const [checkedCount, setCheckedCount] = useState(0)

  // Rotate placeholder with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setPhFade(false)
      setTimeout(() => {
        setPhIdx(i => (i + 1) % placeholders.length)
        setPhFade(true)
      }, 250)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  // Loop the AI checklist animation
  const tick = useCallback(() => {
    setCheckedCount(c => {
      if (c >= aiSteps.length) return 0
      return c + 1
    })
  }, [])

  useEffect(() => {
    const delay = checkedCount >= aiSteps.length ? 2200 : checkedCount === 0 ? 400 : 750
    const t = setTimeout(tick, delay)
    return () => clearTimeout(t)
  }, [checkedCount, tick])

  const handleSubmit = (text: string) => {
    const q = (text || query).trim()
    if (!q) return
    router.push(`/ai-assistant?q=${encodeURIComponent(q)}`)
  }

  return (
    <section id="ai-guidance" className="bg-background py-10 scroll-mt-20 lg:scroll-mt-24">
      <ScrollReveal className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-fn-yellow-light text-fn-navy text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Ask FirstNest AI</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Get personalised guidance for grants, borrowing capacity, and buying readiness — in plain English.
          </p>
        </div>

        {/* Two-column layout — equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* LEFT — animated glow border wrapper */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              padding: '1px',
              boxShadow: '0 0 40px rgba(255, 204, 0, 0.08), 0 12px 40px rgba(0,0,0,0.04)',
            }}
          >
            {/* Rotating conic gradient — creates the travelling border shimmer */}
            <div
              className="absolute w-[200%] aspect-square top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 62%, rgba(255,204,0,0.9) 74%, rgba(255,204,0,0.45) 83%, transparent 90%, transparent 100%)',
                animation: 'border-glow-spin 8s linear infinite',
              }}
            />

            {/* Card surface — sits above the gradient */}
            <div className="relative bg-card rounded-[23px] h-full flex flex-col p-6 lg:p-8 z-10">

              <h3 className="text-xl font-bold text-foreground mb-1.5">What do you want to know?</h3>
              <p className="text-sm text-muted-foreground mb-4">Choose a topic or type your own question below.</p>

              {/* Quick prompts — grid layout for balanced fill */}
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 mb-4">
                {prompts.map(({ label, icon: Icon, theme }) => {
                  const s = themeMap[theme]
                  return (
                    <button
                      key={label}
                      onClick={() => handleSubmit(label)}
                      className={`w-full inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-all duration-200 ${s.pill}`}
                    >
                      <Icon className={`w-3 h-3 shrink-0 ${s.icon}`} />
                      <span className="truncate">{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Input area */}
              <div className="relative mb-3">
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(query)
                    }
                  }}
                  rows={3}
                  className="w-full bg-background border border-input rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-transparent focus:outline-none focus:border-fn-yellow focus:ring-2 focus:ring-fn-yellow/20 resize-none transition-all duration-150 leading-relaxed"
                />
                {!query && (
                  <p
                    className="absolute top-3.5 left-4 text-sm text-muted-foreground pointer-events-none select-none"
                    style={{ opacity: phFade ? 1 : 0, transition: 'opacity 250ms' }}
                  >
                    {placeholders[phIdx]}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={() => handleSubmit(query)}
                className="w-full bg-fn-yellow text-fn-navy font-bold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 hover:bg-fn-yellow-dark transition-all duration-200 shadow-sm"
              >
                Get AI guidance
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Helper note — honest about where response appears */}
              <p className="text-[11px] text-muted-foreground text-center mt-2 leading-snug">
                Your personalised answer will open in the AI Assistant workspace.
              </p>

              {/* Capability indicator — not a generated answer, just what AI covers */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-col gap-1.5">
                  {[
                    'Government scheme matching',
                    'State-specific guidance',
                    'Personalised recommendations',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-fn-success shrink-0" />
                      <span className="text-xs text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Live AI presence panel */}
          <div className="bg-fn-yellow-pale border border-black/5 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] p-6 lg:p-8 flex flex-col gap-4">

            {/* Animated AI checklist */}
            <div className="bg-white/70 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-fn-yellow mb-3">AI scanning your profile</p>
              <div className="flex flex-col gap-2.5">
                {aiSteps.map((step, i) => {
                  const done = i < checkedCount
                  const active = i === checkedCount
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-all duration-500 ${
                        done
                          ? 'bg-fn-success'
                          : active
                          ? 'bg-fn-yellow animate-pulse'
                          : 'bg-gray-200'
                      }`}>
                        {done && (
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,5 4,7.5 8,3" />
                          </svg>
                        )}
                        {active && <div className="w-1.5 h-1.5 bg-fn-navy rounded-full" />}
                      </div>
                      <p className={`text-sm transition-colors duration-300 ${
                        done ? 'text-fn-navy font-medium' : active ? 'text-fn-navy font-semibold' : 'text-gray-400'
                      }`}>
                        {step}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mini AI conversation — flex-1 fills remaining space between checklist and benefit */}
            <div className="flex-1 flex flex-col justify-end gap-2">
              {miniConvo.map((msg:any, i:any) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] text-xs leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                    msg.role === 'ai'
                      ? 'bg-white border border-black/5 text-fn-navy rounded-tl-sm shadow-sm'
                      : 'bg-fn-navy text-white rounded-tr-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated benefit highlight */}
            <div className="bg-fn-yellow-light border border-fn-yellow-deep/20 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-fn-navy/50 mb-0.5">Estimated eligible benefit</p>
                <p className="text-2xl font-extrabold text-fn-navy leading-none">AUD $41,800</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-fn-success animate-pulse" />
                <p className="text-[9px] font-bold text-fn-navy/50 uppercase tracking-widest">Live</p>
              </div>
            </div>

          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
