'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ShieldAlert, Home, Lock, Calculator, TrendingUp, Gift, Landmark, CheckCircle2, AlertCircle, AlertTriangle, BadgeDollarSign, Info, Users, MapPin, Clock, Building, FileText, CheckCircle, XCircle, Search, HelpCircle, DollarSign, Wallet } from 'lucide-react'
import './questionnaire.css'
import {
  EMPTY_ANSWERS, STEP_META, INPUT_STEPS,
  CITIZENSHIP_OPTIONS, PROPERTY_TYPE_OPTIONS, PURCHASE_ENTITY_OPTIONS, FAMILY_VIOLENCE_OPTIONS,
  type Answers,
} from '@/lib/questionnaire/types'
import {
  validateFast, validateProperty, validateAbout, validateHistory, validateIncome,
  hardStop, type Errors, type HardStop,
  isJoint, showMoveIn, showCoCitizenship, showCoDob, showPartnerOwned, showNsw, showVicLivedIn, showVic, showCoIncome,
} from '@/lib/questionnaire/logic'
import { loadAnswers, saveAnswers, saveStepProgress } from '@/lib/questionnaire/storage'
import { Q, Chips, Segmented, Rows, Duo, Currency, Cond, LocationCombobox } from './controls'
import { Results } from './Results'
import { LiveEligibilityPanel, ProvisionalBoard } from './LiveEligibilityPanel'
import { ConversationalFill } from './ConversationalFill'
import type { ExtractedFields } from '@/lib/ai/extractSanitize'

const YES_NO = [{ value: 'Yes' as const, label: 'Yes' }, { value: 'No' as const, label: 'No' }]
const ALL_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']
const SUPPORTED_STATE_CHIPS = ['NSW', 'VIC', 'QLD', 'SA', 'ACT', 'WA', 'TAS', 'NT']
const STATE_CHIPS = ALL_STATES.map((s) => ({ value: s, label: SUPPORTED_STATE_CHIPS.includes(s) ? s : `${s} · soon` }))
const PROP_CHIPS = PROPERTY_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))
const ENTITY_CHIPS = PURCHASE_ENTITY_OPTIONS.map((v) => ({ value: v, label: v }))
const FV_CHIPS = FAMILY_VIOLENCE_OPTIONS.map((v) => ({ value: v, label: v }))
const BUYING = [
  { value: 'Individually' as const, emoji: '', label: 'Just me', desc: 'Buying on my own' },
  { value: 'Jointly' as const, emoji: '', label: 'With a partner', desc: 'A partner or co-buyer' },
]

const VALIDATORS = { fast: validateFast, property: validateProperty, about: validateAbout, history: validateHistory, income: validateIncome } as const

export function QuestionnaireFlow() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [showResults, setShowResults] = useState(false)
  // Fast-path teaser: shown once after the first step's three answers, with
  // the provisional board and the choice to refine or jump straight out.
  const [teaser, setTeaser] = useState(false)
  const [a, setA] = useState<Answers>(EMPTY_ANSWERS)
  const [errors, setErrors] = useState<Errors>({})
  const [stop, setStop] = useState<HardStop | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setA(loadAnswers())
    setMounted(true)
  }, [])

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setA((prev) => { const next = { ...prev, [key]: value }; saveAnswers(next); return next })
    setErrors((e) => (e[key as keyof Errors] ? { ...e, [key]: undefined } : e))
  }

  useEffect(() => { if (mounted) saveStepProgress(idx + 1) }, [idx, mounted])

  const stepId = INPUT_STEPS[idx]
  const total = INPUT_STEPS.length

  const goNext = () => {
    const errs = VALIDATORS[stepId](a)
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (stepId === 'about') { const hs = hardStop(a); if (hs) { setStop(hs); return } }
    setErrors({})
    // Fast path complete → provisional board first, refinement is opt-in.
    if (stepId === 'fast') { setTeaser(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (idx === total - 1) { router.push('/results/grants'); return }
    setIdx((i) => i + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const refine = () => { setTeaser(false); setIdx(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // Merge AI-extracted fields into the answers. Already-sanitized upstream;
  // the one extra rule mirrors the state chip handler: a state change without
  // a resolved suburb clears the old suburb rather than leaving a mismatch.
  const applyExtracted = (fields: ExtractedFields) => {
    setA((prev) => {
      const next: Answers = { ...prev, ...fields }
      if (fields.state && fields.state !== prev.state && !fields.suburb && !fields.postcode) {
        next.suburb = ''
        next.postcode = ''
      }
      saveAnswers(next)
      return next
    })
    setErrors({})
  }

  const goBack = () => {
    if (showResults) { setShowResults(false); return }
    if (teaser) { setTeaser(false); return }
    setErrors({})
    if (idx === 0) { router.push('/'); return }
    setIdx((i) => i - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const continueAsSole = () => {
    setA((prev) => { const next: Answers = { ...prev, buyingWith: 'Individually', coCitizenship: '', coDob: '', coIncome: null }; saveAnswers(next); return next })
    setStop(null)
  }
  const restart = () => { setA(EMPTY_ANSWERS); saveAnswers(EMPTY_ANSWERS); setErrors({}); setStop(null); setIdx(0); setShowResults(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (!mounted) return <div className="fhbq" />

  const meta = STEP_META[stepId]
  const progressPct = showResults ? 100 : ((idx + 1) / total) * 100

  return (
    <div className="fhbq">
      {/* DESKTOP HEADER (hidden on mobile) */}
      <div className="fhbq-desktop-header">
        <button className="back-btn" onClick={goBack}><ArrowLeft size={16} /> Back</button>
        <div className="step-info">Step {idx + 1} of {total}</div>
        <button className="save-btn" onClick={() => router.push('/')}>Save & Exit</button>
      </div>

      <div className="fhbq-layout">
        <div className="fhbq-main">
          {/* MOBILE HEADER (hidden on desktop) */}
          <div className="fhbq-mobile-header">
            {!showResults && !stop && !teaser && (
              <div>
                <div className="fhbq-plabels">
                  <span>Step {idx + 1} of {total}</span>
                  <span>{meta.mini}</span>
                </div>
                <div className="fhbq-track"><div className="fhbq-fill" style={{ width: `${progressPct}%` }} /></div>
              </div>
            )}
          </div>

          {stop ? (
            <div className="fhbq-card">
              <StopScreen stop={stop} onSole={stop.allowSole ? continueAsSole : undefined} onBack={() => setStop(null)} onHome={() => router.push('/')} />
            </div>
          ) : teaser ? (
            <motion.div className="fhbq-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              <div className="fhbq-eyebrow">Instant estimate</div>
              <h1 className="fhbq-title">Here&rsquo;s where you stand</h1>
              <p className="fhbq-sub">
                Based on just three answers — {a.state}, a ${(a.price ?? 0).toLocaleString('en-AU')} property,
                and your ownership history. Refining takes about two more minutes.
              </p>
              <ProvisionalBoard a={a} />
              <div className="fhbq-nav" style={{ marginTop: 18 }}>
                <button className="fhbq-btn ghost" onClick={() => router.push('/results/grants')}>
                  Skip — see full results
                </button>
                <button className="fhbq-btn primary" onClick={refine}>
                  Refine my results <ArrowRight size={15} />
                </button>
              </div>
              <button className="fhbq-teaser-back" onClick={goBack}>
                <ArrowLeft size={13} /> Change my three answers
              </button>
            </motion.div>
          ) : showResults ? (
            <div className="fhbq-card">
              <div className="fhbq-eyebrow">All done</div>
              <h1 className="fhbq-title">Nice work, {a.name || 'there'}</h1>
              <p className="fhbq-sub">Here’s what you may be eligible for, based on your answers.</p>
              <Results a={a} />
              <div className="fhbq-nav">
                <button className="fhbq-btn ghost" onClick={goBack}><ArrowLeft size={15} /> Edit answers</button>
                <button className="fhbq-btn primary" onClick={restart}>Start over</button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div className="fhbq-card" key={stepId} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
                {/* <div className="fhbq-eyebrow">{meta.eyebrow}</div> */}
                <h1 className="fhbq-title">{meta.title}</h1>
                <p className="fhbq-sub">{meta.sub}</p>

                {stepId === 'fast' && (
                  <>
                    <ConversationalFill onApply={applyExtracted} />
                    <Q label="Which state or territory are you buying in?" help="Grants, concessions, and property price caps vary significantly depending on the state or territory where you intend to buy." error={errors.state}>
                      <Chips options={STATE_CHIPS} value={a.state} onChange={(v) => {
                        const nextState = v as Answers['state'];
                        if (a.state !== nextState) {
                          setA((prev) => {
                            const next = { ...prev, state: nextState, suburb: '', postcode: '' };
                            saveAnswers(next);
                            return next;
                          });
                          setErrors((e) => (e.state ? { ...e, state: undefined } : e));
                        } else {
                          set('state', nextState);
                        }
                      }} disabled={(v) => !SUPPORTED_STATE_CHIPS.includes(v)} />
                    </Q>
                    <Q label="What’s your target purchase price?" help="An estimate is fine — every scheme has price caps, so this decides more of your eligibility than any other answer. You can adjust it any time." error={errors.price}>
                      <Currency value={a.price} onChange={(v) => set('price', v)} placeholder="650,000" invalid={!!errors.price} />
                    </Q>
                    <Q label="Have you ever owned residential property in Australia?" help="First-home buyer schemes generally require that you haven’t owned before, though some exceptions exist." error={errors.everOwned}>
                      <Segmented options={YES_NO} value={a.everOwned} onChange={(v) => set('everOwned', v)} />
                    </Q>
                  </>
                )}

                {stepId === 'property' && (
                  <>
                    <Q label="What type of property are you planning to buy?" help="Certain grants, such as the First Home Owner Grant, are strictly limited to new builds or substantial renovations." error={errors.propertyType}>
                      <Chips options={PROP_CHIPS} value={a.propertyType} onChange={(v) => set('propertyType', v)} />
                    </Q>
                    {/* The single target price was asked on the fast-path step;
                        only the Land + Build split is collected here. */}
                    {a.propertyType === 'Land + Build' && (
                      <>
                        <Q label="What is the purchase price of the vacant land?" help="Stamp duty is calculated on the land value when building a new home." error={errors.landPrice}>
                          <Currency value={a.landPrice} onChange={(v) => set('landPrice', v)} placeholder="300,000" invalid={!!errors.landPrice} />
                        </Q>
                        <Q label="What is your build price?" help="Enter the fixed-price building contract amount only. Do not include the land purchase price." error={errors.buildPrice}>
                          <Currency value={a.buildPrice} onChange={(v) => set('buildPrice', v)} placeholder="400,000" invalid={!!errors.buildPrice} />
                        </Q>
                      </>
                    )}
                    <Q label="Where is the property located?" help="Some grants are only available for properties in specific postcodes or regional areas." error={errors.postcode}>
                      <LocationCombobox suburb={a.suburb} postcode={a.postcode} stateFilter={a.state}
                        onSelect={(v) => { set('suburb', v.suburb); set('postcode', v.postcode); set('state', v.state) }} invalid={!!errors.postcode} />
                    </Q>
                    <Q label="Will this be your Principal Place of Residence (PPR)?" help="Most first-home buyer grants and concessions require you to live in the property as your main residence for a specified period." error={errors.ppr}>
                      <Segmented options={YES_NO} value={a.ppr} onChange={(v) => set('ppr', v)} />
                    </Q>
                    {/* Presentation only — mirrors the existing `ppr` soft stop so the
                        user hears about it here rather than only on the results page.
                        It never gates Next and no rule reads it. */}
                    <Cond open={a.ppr === 'No'}>
                      <div className="fhbq-notice" role="status" aria-live="polite">
                        <AlertTriangle size={15} className="ic" aria-hidden="true" />
                        <p>
                          You may not be eligible for some government grants and home buyer
                          schemes. Most first-home grants and stamp-duty concessions require you
                          to live in the property as your principal place of residence. Your
                          results will still be assessed based on your answers.
                        </p>
                      </div>
                    </Cond>
                    <Cond open={showMoveIn(a)}>
                      <Q label="Will you move in within the required government timeframe?" help="Most schemes require you to move in within 12 months of settlement and live there continuously." error={errors.moveIn}>
                        <Segmented options={YES_NO} value={a.moveIn} onChange={(v) => set('moveIn', v)} />
                      </Q>
                    </Cond>
                    <Cond open={showNsw(a)}>
                      <div className="fhbq-block state">
                        <span className="fhbq-tag state">NSW-specific</span>
                        <Q label="Is this a new home that has never been previously occupied or sold as a place of residence?" help="The NSW First Home Owner Grant is only available for new homes meeting this condition." error={errors.nswNeverOccupied}>
                          <Segmented options={YES_NO} value={a.nswNeverOccupied} onChange={(v) => set('nswNeverOccupied', v)} />
                        </Q>
                      </div>
                    </Cond>
                  </>
                )}

                {stepId === 'about' && (
                  <>
                    <Q label="What’s your name?" help="Your name is used to personalise your results and is not shared with any government agency." error={errors.name}>
                      <input className={`fhbq-input${errors.name ? ' invalid' : ''}`} placeholder="e.g. Sarah" value={a.name} onChange={(e) => set('name', e.target.value)} />
                    </Q>
                    <Q label="Are you 18 years of age or older?" help="Confirms you meet the minimum legal age to purchase property or apply for a grant." error={errors.is18}>
                      <Segmented options={YES_NO} value={a.is18} onChange={(v) => set('is18', v)} />
                    </Q>
                    <Q label="Are you buying on your own, or with someone else?" help="Government schemes assess eligibility differently depending on whether you are applying individually or jointly with a partner.">
                      <Duo options={BUYING} value={a.buyingWith} onChange={(v) => {
                        set('buyingWith', v)
                        if (v === 'Individually') { set('coCitizenship', ''); set('coDob', ''); set('coIncome', null) }
                      }} />
                    </Q>
                    <Q label="What is your citizenship or residency status?" help="Most government grants require you to be an Australian citizen or permanent resident, though some states offer exceptions." error={errors.citizenship}>
                      <Rows options={CITIZENSHIP_OPTIONS} value={a.citizenship} onChange={(v) => set('citizenship', v)} />
                    </Q>
                    {/* Presentation only: a heads-up for the weakest combination of
                        answers. It never gates Next, is not part of `errors`, and no
                        rule reads it — PPR (asked on the previous step) and
                        citizenship are still scored exactly as before. */}
                    <Cond open={a.citizenship === 'Other'}>
                      <div className="fhbq-notice" role="status" aria-live="polite">
                        <AlertTriangle size={15} className="ic" aria-hidden="true" />
                        <p>
                          Based on your current selections, you may not be eligible for some
                          government grants and home buyer schemes. Eligibility often depends on
                          your citizenship/residency status and intended occupancy. Your results
                          will still be assessed based on your answers.
                        </p>
                      </div>
                    </Cond>
                    <Cond open={isJoint(a)}>
                      <div className="fhbq-block co">
                        <span className="fhbq-tag co">Co-buyer details</span>
                        {showCoCitizenship(a) && (
                          <Q label="Your co-buyer’s citizenship or residency status" help="Both applicants must generally satisfy the residency requirements for most government schemes." error={errors.coCitizenship}>
                            <Rows options={CITIZENSHIP_OPTIONS} value={a.coCitizenship} onChange={(v) => set('coCitizenship', v)} />
                          </Q>
                        )}
                        {showCoDob(a) && (
                          <Q label="When was your co-buyer born?" help="All applicants must meet minimum age requirements, typically 18 years old, to be eligible for government assistance." error={errors.coDob}>
                            <input type="date" className={`fhbq-input${errors.coDob ? ' invalid' : ''}`} value={a.coDob} onChange={(e) => set('coDob', e.target.value)} max="2010-01-01" />
                          </Q>
                        )}
                      </div>
                    </Cond>
                    <Q label="Will the property be purchased by an individual, a company, or a trust?" help="Most first-home buyer grants are available only to individuals purchasing in their own name. Companies and trusts are generally not eligible." error={errors.entity}>
                      <Chips options={ENTITY_CHIPS} value={a.entity} onChange={(v) => set('entity', v)} />
                    </Q>
                  </>
                )}

                {stepId === 'history' && (
                  <>
                    {/* Prior ownership itself was asked on the fast-path step;
                        only VIC's occupancy follow-up remains here. */}
                    <Cond open={showVicLivedIn(a)}>
                      <div className="fhbq-block state">
                        <span className="fhbq-tag state">VIC-specific</span>
                        <Q label="You said you’ve owned property before — did you ever live in it as your Principal Place of Residence?" help="VIC eligibility considers prior occupancy history, not ownership alone." error={errors.vicLivedInPrior}>
                          <Segmented options={YES_NO} value={a.vicLivedInPrior} onChange={(v) => set('vicLivedInPrior', v)} />
                        </Q>
                      </div>
                    </Cond>
                    <Q label="Do you currently have a spouse or domestic partner?" help="Your partner's ownership history can affect your eligibility for grants or duty concessions." error={errors.hasPartner}>
                      <Segmented options={YES_NO} value={a.hasPartner} onChange={(v) => set('hasPartner', v)} />
                    </Q>
                    <Cond open={showPartnerOwned(a)}>
                      <Q label="Has your spouse or partner ever owned residential property in Australia?" help="A partner’s prior ownership can affect eligibility for grants or duty concessions." error={errors.partnerOwned}>
                        <Segmented options={YES_NO} value={a.partnerOwned} onChange={(v) => set('partnerOwned', v)} />
                      </Q>
                    </Cond>
                    <Q label="Have you or your spouse previously received a First Home Owner Grant or first-home buyer concession?" help="You can generally only receive a First Home Owner Grant once. Prior recipients are typically ineligible for future grants." error={errors.priorBenefit}>
                      <Segmented options={YES_NO} value={a.priorBenefit} onChange={(v) => set('priorBenefit', v)} />
                    </Q>
                    {showVic(a) && (
                      <div className="fhbq-block state" style={{ marginTop: 4 }}>
                        <span className="fhbq-tag state">VIC-specific</span>
                        <Q label="Are you currently serving in the Australian Defence Force (ADF)?" help="ADF members may qualify for exemptions from certain VIC residency requirements." error={errors.vicAdf}>
                          <Segmented options={YES_NO} value={a.vicAdf} onChange={(v) => set('vicAdf', v)} />
                        </Q>
                        <Q label="Have you previously received family-violence-related relief affecting first-home buyer eligibility?" help="VIC legislation provides special provisions for some victim-survivors of family violence." error={errors.vicFamilyViolence}>
                          <Chips options={FV_CHIPS} value={a.vicFamilyViolence} onChange={(v) => set('vicFamilyViolence', v)} />
                        </Q>
                      </div>
                    )}
                  </>
                )}

                {stepId === 'income' && (
                  <>
                    <Q label="What is your annual taxable income (before tax)?" help="Many schemes have strict income thresholds. Your Notice of Assessment (NOA) from the previous financial year is typically used to verify this." error={errors.income}>
                      <Currency value={a.income} onChange={(v) => set('income', v)} placeholder="85,000" invalid={!!errors.income} />
                    </Q>
                    <Cond open={showCoIncome(a)}>
                      <div className="fhbq-block co">
                        <span className="fhbq-tag co">Co-buyer income</span>
                        <Q label="What is your co-buyer's annual taxable income (before tax)?" help="For joint applications, your combined taxable income is assessed against couple thresholds for most government schemes." error={errors.coIncome}>
                          <Currency value={a.coIncome} onChange={(v) => set('coIncome', v)} placeholder="75,000" invalid={!!errors.coIncome} />
                        </Q>
                      </div>
                    </Cond>
                    <Q label="How much deposit have you saved so far?" help="Federal guarantee schemes typically require a minimum deposit of 2% to 5% to avoid Lenders Mortgage Insurance." error={errors.deposit}>
                      <Currency value={a.deposit} onChange={(v) => set('deposit', v)} placeholder="40,000" invalid={!!errors.deposit} />
                    </Q>
                  </>
                )}

                <div className="fhbq-nav">
                  <button className="fhbq-btn ghost" onClick={goBack}><ArrowLeft size={15} /> {idx === 0 ? 'Home' : 'Back'}</button>
                  <button className="fhbq-btn primary" onClick={goNext}>
                    {idx === total - 1 ? 'Check government grants & schemes' : 'Next'} <ArrowRight size={15} />
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* SIDE PANEL (desktop only) — live eligibility once a state is chosen,
            static contextual copy before that and on the results screen. Hidden
            on the teaser screen, whose inline board would duplicate it. */}
        {!stop && !teaser && (!showResults && a.state
          ? <LiveEligibilityPanel a={a} />
          : <ContextualSidePanel stepId={stepId} showResults={showResults} a={a} />)}
      </div>
    </div>
  )
}

function StopScreen({ stop, onSole, onBack, onHome }: { stop: HardStop; onSole?: () => void; onBack: () => void; onHome: () => void }) {
  return (
    <div className="fhbq-stop">
      <span className="ic"><ShieldAlert size={26} /></span>
      <h2>{stop.title}</h2>
      <p>{stop.message}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
        {onSole && <button className="fhbq-btn primary" onClick={onSole}>Continue as a sole applicant</button>}
        <button className="fhbq-btn ghost" onClick={onBack}>Go back &amp; edit</button>
        <button className="fhbq-btn ghost" onClick={onHome}>Home</button>
      </div>
    </div>
  )
}

function ContextualSidePanel({ stepId, showResults, a }: { stepId: string, showResults: boolean, a: Answers }) {
  if (showResults) {
    return (
      <div className="fhbq-side">
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-green"><CheckCircle size={16} /></div> Eligible Schemes</h3>
          <p className="text-sm text-grey mt-2">Grants and schemes you are highly likely to qualify for based on your answers.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><Search size={16} /></div> Check Required</h3>
          <p className="text-sm text-grey mt-2">Schemes that require further verification, such as specific regional locations or veteran status.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-purple"><XCircle size={16} /></div> Not Eligible</h3>
          <p className="text-sm text-grey mt-2">Options you do not qualify for, usually due to price caps or previous property ownership.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><Calculator size={16} /></div> Borrowing Capacity</h3>
          <p className="text-sm text-grey mt-2">An estimate of what banks may lend you based on your stated before-tax income.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-purple"><Home size={16} /></div> Recommended Next Steps</h3>
          <p className="text-sm text-grey mt-2">Review your personalized dashboard and connect with a broker to get pre-approved.</p>
        </div>
      </div>
    )
  }

  if (stepId === 'fast') {
    return (
      <div className="fhbq-side">
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><Home size={16} /></div> Buying your first home</h3>
          <p className="text-sm text-grey mt-2 mb-3">We only ask a few questions so we can calculate:</p>
          <ul className="fhbq-action-list">
            <li><TrendingUp size={14} className="color-green" /> Your borrowing capacity</li>
            <li><Gift size={14} className="color-green" /> Grants you qualify for</li>
            <li><BadgeDollarSign size={14} className="color-green" /> Stamp duty savings</li>
            <li><Landmark size={14} className="color-green" /> Government schemes</li>
          </ul>
        </div>
        <div className="fhbq-side-card flex-row">
          <div className="icon-wrap bg-green"><Lock size={16} /></div>
          <p className="text-sm text-grey" style={{ margin: 0 }}>Your information stays <strong>private</strong> and is only used to personalise your results.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-purple"><Calculator size={16} /></div> What happens next</h3>
          <p className="text-sm text-grey mt-2">Calculate your borrowing power and discover matching properties in minutes.</p>
        </div>
      </div>
    )
  }

  if (stepId === 'property') {
    return (
      <div className="fhbq-side">
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-purple"><Landmark size={16} /></div> Property Price Caps</h3>
          <ul className="fhbq-bullet-list">
            <li>NSW stamp duty concessions depend on property value.</li>
            <li>VIC has different thresholds for exemptions and concessions.</li>
            <li>Final eligibility is determined after all answers are completed.</li>
          </ul>
        </div>

        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-green"><Building size={16} /></div> Property Types</h3>
          <ul className="fhbq-bullet-list">
            <li><strong>New Home:</strong> Never been lived in.</li>
            <li><strong>Established:</strong> Existing residential property.</li>
            <li><strong>Off-the-Plan:</strong> Buying before construction finishes.</li>
            <li><strong>Land + Build:</strong> Vacant land and a construction contract.</li>
          </ul>
        </div>

        {/* {showMoveIn(a) && (
          <div className="fhbq-side-card">
            <h3><div className="icon-wrap bg-yellow"><Clock size={16} /></div> Owner-Occupier Rules</h3>
            <ul className="fhbq-bullet-list">
              <li>Must usually live in the property as your primary residence.</li>
              <li>Move in within the required timeframe (usually 12 months).</li>
              <li>Continue living there for the required minimum period.</li>
            </ul>
          </div>
        )} */}

        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><HelpCircle size={16} /></div> Why We Ask This</h3>
          <ul className="fhbq-bullet-list">
            <li>Purchase price directly affects scheme eligibility.</li>
            <li>Some schemes have strict postcode restrictions.</li>
            <li>Regional properties may have different limits.</li>
          </ul>
        </div>
      </div>
    )
  }

  if (stepId === 'about') {
    return (
      <div className="fhbq-side">
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-purple"><CheckCircle2 size={16} /></div> Age Requirement</h3>
          <p className="text-sm text-grey mt-2">You generally must be at least 18 years of age to legally purchase property and apply for government grants.</p>
        </div>

        {isJoint(a) && (
          <div className="fhbq-side-card">
            <h3><div className="icon-wrap bg-purple"><Users size={16} /></div> Joint Applications</h3>
            <ul className="fhbq-bullet-list">
              <li>Both applicants may need to satisfy eligibility.</li>
              <li>Combined ownership history matters.</li>
              <li>Combined income may be assessed.</li>
            </ul>
          </div>
        )}

        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><MapPin size={16} /></div> Residency Requirements</h3>
          <ul className="fhbq-bullet-list">
            <li>Australian Citizens</li>
            <li>Permanent Residents</li>
            <li>SCV holders</li>
            <li>State differences</li>
          </ul>
        </div>

        {isJoint(a) && (showCoCitizenship(a) || showCoDob(a)) && (
          <div className="fhbq-side-card">
            <h3><div className="icon-wrap bg-green"><Users size={16} /></div> Co-buyer Assessment</h3>
            <ul className="fhbq-bullet-list">
              <li>Both applicants are assessed.</li>
              <li>Previous ownership is considered.</li>
              <li>Household income may affect eligibility.</li>
            </ul>
          </div>
        )}

        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-green"><Home size={16} /></div> First Home Buyer Definition</h3>
          <p className="text-sm text-grey mt-2">You must not have previously owned a residential property in Australia, though exceptions exist for some states.</p>
        </div>
      </div>
    )
  }

  if (stepId === 'history') {
    return (
      <div className="fhbq-side">
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><FileText size={16} /></div> Previous Property Ownership</h3>
          <ul className="fhbq-bullet-list">
            <li>Some schemes require never owning property.</li>
            <li>Some schemes consider previous occupancy.</li>
            <li>Rules differ between programs.</li>
          </ul>
        </div>

        {showPartnerOwned(a) && (
          <div className="fhbq-side-card">
            <h3><div className="icon-wrap bg-purple"><Users size={16} /></div> Partner Ownership</h3>
            <p className="text-sm text-grey mt-2">A partner's prior ownership history can impact your ability to claim first-home buyer concessions.</p>
          </div>
        )}

        {showVic(a) && (
          <>
            <div className="fhbq-side-card">
              <h3><div className="icon-wrap bg-green"><ShieldAlert size={16} /></div> Defence Force Members</h3>
              <ul className="fhbq-bullet-list">
                <li>Certain schemes contain ADF exemptions.</li>
                <li>Residency requirements may differ.</li>
                <li>Final eligibility depends on scheme rules.</li>
              </ul>
            </div>

            <div className="fhbq-side-card">
              <h3><div className="icon-wrap bg-purple"><HelpCircle size={16} /></div> Family Violence Provisions</h3>
              <ul className="fhbq-bullet-list">
                <li>Some Victorian schemes include special provisions.</li>
                <li>These questions help determine exemptions.</li>
                <li>Additional evidence may be required.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    )
  }

  if (stepId === 'income') {
    return (
      <div className="fhbq-side">
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><Info size={16} /></div> Why income matters</h3>
          <p className="text-sm text-grey mt-2">Government assistance programs, like the Home Guarantee Scheme, are income-tested.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-purple"><Calculator size={16} /></div> Borrowing Capacity</h3>
          <p className="text-sm text-grey mt-2">We calculate a quick estimate of how much banks may lend you based on your gross (before-tax) income.</p>
        </div>
        <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-green"><BadgeDollarSign size={16} /></div> Income Thresholds</h3>
          <p className="text-sm text-grey mt-2">Thresholds vary by scheme (e.g., $125k for singles or $200k for couples for federal guarantees).</p>
        </div>

        {showCoIncome(a) && (
          <div className="fhbq-side-card">
            <h3><div className="icon-wrap bg-purple"><Users size={16} /></div> Co-buyer Income</h3>
            <p className="text-sm text-grey mt-2">When buying jointly, your combined household income is assessed against the scheme's limits.</p>
          </div>
        )}

        {/* <div className="fhbq-side-card">
          <h3><div className="icon-wrap bg-yellow"><FileText size={16} /></div> Government Assessment</h3>
          <p className="text-sm text-grey mt-2">Your Notice of Assessment (NOA) from the previous financial year is typically used by lenders to verify this income.</p>
        </div> */}
      </div>
    )
  }

  return <div className="fhbq-side" />
}
