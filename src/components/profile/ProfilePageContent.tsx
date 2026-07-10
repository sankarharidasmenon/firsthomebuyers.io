'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Home,
  Target,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  Pencil,
  X,
} from 'lucide-react'
import {
  getStep1, setStep1,
  getStep2, setStep2,
  getStep3, setStep3,
  getStep4, setStep4,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
} from '@/lib/localStorage'
import { dummyAvatarUrl } from '@/lib/avatar'
import { useAuth } from '@/lib/auth/AuthProvider'
import { saveOnboardingAnswers } from '@/lib/scenarios/actions'
import { toast } from 'sonner'
import { dispatchOnboardingUpdated } from '@/lib/onboardingChannel'

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function computeCompletion(
  s1: Step1Data | null,
  s2: Step2Data | null,
  s3: Step3Data | null,
  s4: Step4Data | null,
): { pct: number; missing: string[] } {
  const fields: [boolean, string][] = [
    [!!s1?.firstName?.trim(), 'First name'],
    [!!s1?.state, 'State'],
    [!!s1?.buyingWith, 'Buying situation'],
    [!!s2?.annualIncome, 'Annual income'],
    [!!s2?.monthlyExpenses, 'Monthly expenses'],
    [!!s3?.depositAmount, 'Savings amount'],
    [!!s3?.targetPropertyPrice, 'Target property price'],
    [!!s3?.propertyType, 'Property type'],
    [!!s4?.employmentType, 'Employment type'],
  ]
  const done = fields.filter(([ok]) => ok).length
  const missing = fields.filter(([ok]) => !ok).map(([, label]) => label)
  return { pct: Math.round((done / fields.length) * 100), missing }
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  fulltime: 'Full-time',
  parttime: 'Part-time',
  selfemployed: 'Self-employed',
  casual: 'Casual',
  contract: 'Contract',
}

const PROPERTY_LABELS: Record<string, string> = {
  house: '🏠 House',
  townhouse: '🏘️ Townhouse',
  apartment: '🏢 Apartment',
  offplan: '🏗️ Off-the-plan',
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ show }: { show: boolean }) {
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 ${
        show
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      } bg-[#111] dark:bg-[#F5E642] text-white dark:text-[#111]`}
    >
      <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
      <span className="text-sm font-semibold">Changes saved!</span>
    </div>
  )
}

// ── Section card wrapper ───────────────────────────────────────────────────

interface SectionCardProps {
  id: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  summary: React.ReactNode
  editForm: React.ReactNode
}

function SectionCard({
  id,
  icon,
  title,
  subtitle,
  isEditing,
  onEdit,
  onCancel,
  summary,
  editForm,
}: SectionCardProps) {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-card border rounded-3xl overflow-hidden transition-all duration-300 ${
        isEditing
          ? 'border-fn-yellow shadow-[0_0_0_2px_rgba(245,230,66,0.35)] dark:border-fn-yellow/40 ring-4 ring-fn-yellow/10'
          : 'border-[rgba(0,0,0,0.04)] dark:border-border shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
      }`}
    >
      {/* Card header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-6 sm:px-8 border-b border-[rgba(0,0,0,0.04)] dark:border-border/60 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FAFAF9] dark:bg-input flex items-center justify-center text-xl shrink-0 shadow-sm border border-[rgba(0,0,0,0.02)] dark:border-border text-foreground">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground leading-snug">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl bg-fn-yellow text-fn-navy hover:bg-[#E5D632] hover:shadow-md transition-all duration-200 cursor-pointer shadow-sm w-full sm:w-auto shrink-0 border-none"
          >
            ✏️ Update
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border border-[rgba(0,0,0,0.1)] dark:border-border bg-transparent text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer w-full sm:w-auto shrink-0"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className={`grid transition-all duration-300 ${isEditing ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[1fr] opacity-100'}`}>
          <div className="overflow-hidden">
            {isEditing ? editForm : summary}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Data row ──────────────────────────────────────────────────────────────

function DataRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-4 sm:py-5 border-b border-[rgba(0,0,0,0.03)] dark:border-border/40 last:border-0 group">
      <div className="flex items-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-[15px] font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-[16px] font-bold text-foreground text-left sm:text-right ml-9 sm:ml-0">{value || '—'}</span>
    </div>
  )
}

// ── Compact input ──────────────────────────────────────────────────────────

function ProfileInput({
  label,
  value,
  onChange,
  type = 'text',
  prefix,
  placeholder,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  prefix?: string
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-border dark:border-border bg-background dark:bg-input focus-within:ring-2 focus-within:ring-fn-yellow/50 focus-within:border-fn-yellow-deep transition-all">
        {prefix && <span className="text-muted-foreground text-sm font-medium shrink-0">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none border-none"
        />
      </div>
    </div>
  )
}

// ── Chip selector ──────────────────────────────────────────────────────────

function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-150 cursor-pointer ${
              value === opt.value
                ? 'bg-fn-navy text-white dark:bg-fn-yellow dark:text-fn-navy border-fn-navy dark:border-fn-yellow'
                : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

type EditingSection = 'personal' | 'financial' | 'property' | null

export default function ProfilePageContent() {
  const router = useRouter()
  const { user, onboardingReady } = useAuth()

  const [step1, setStep1State] = useState<Step1Data | null>(null)
  const [step2, setStep2State] = useState<Step2Data | null>(null)
  const [step3, setStep3State] = useState<Step3Data | null>(null)
  const [step4, setStep4State] = useState<Step4Data | null>(null)
  const [mounted, setMounted] = useState(false)
  const [editing, setEditing] = useState<EditingSection>(null)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Draft state for editing
  const [draftS1, setDraftS1] = useState<Step1Data | null>(null)
  const [draftS2, setDraftS2] = useState<Step2Data | null>(null)
  const [draftS3, setDraftS3] = useState<Step3Data | null>(null)
  const [draftS4, setDraftS4] = useState<Step4Data | null>(null)

  // RC-2 fix: read localStorage only after Supabase hydration is complete.
  // onboardingReady is set to true by AuthProvider once resolveOnboardingAnswers()
  // has finished writing Supabase data into localStorage. For guest users
  // onboardingReady is true immediately (no Supabase call needed).
  useEffect(() => {
    if (!onboardingReady) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep1State(getStep1())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep2State(getStep2())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep3State(getStep3())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep4State(getStep4())
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [onboardingReady])

  const firstName = step1?.firstName || 'there'
  const avatarUrl = dummyAvatarUrl(step1?.firstName)
  const { pct, missing } = computeCompletion(step1, step2, step3, step4)

  const triggerToast = useCallback(() => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2800)
  }, [])

  const startEdit = (section: EditingSection) => {
    setEditing(section)
    if (section === 'personal') {
      setDraftS1(step1 ?? { firstName: '', state: '', buyingWith: 'solo' })
      setDraftS4(step4 ?? { employmentType: 'fulltime', creditCardLimit: 0, hecsDebt: false, otherLoanRepayments: 0 })
    }
    if (section === 'financial') {
      setDraftS2(step2 ?? { annualIncome: 0, partnerIncome: 0, monthlyExpenses: 0 })
      setDraftS4(step4 ?? { employmentType: 'fulltime', creditCardLimit: 0, hecsDebt: false, otherLoanRepayments: 0 })
    }
    if (section === 'property') {
      setDraftS3(step3 ?? { depositAmount: 0, targetPropertyPrice: 0, propertyType: 'house', firstHomeBuyer: true })
    }
  }

  const cancelEdit = () => setEditing(null)

  /**
   * Persist onboarding answers for a profile save.
   *
   * Architecture contract (authenticated users):
   *   1. Validate (caller responsibility)
   *   2. Persist COMPLETE object to Supabase (canonical store)
   *   3. On success → update localStorage (working cache)
   *   4. Update React state
   *   5. Dispatch invalidation event so other pages/tabs re-read
   *
   * Guest users skip the Supabase step — localStorage is their sole store.
   * We always pass ALL FOUR complete step objects to saveOnboardingAnswers so
   * we never partially overwrite the Supabase record.
   */
  const savePersonal = async () => {
    if (!draftS1 || !draftS4) return
    if (user) {
        const res = await saveOnboardingAnswers({
          step1: draftS1 as unknown as Record<string, unknown>,
          step2: (step2 ?? {}) as unknown as Record<string, unknown>,
          step3: (step3 ?? {}) as unknown as Record<string, unknown>,
          step4: draftS4 as unknown as Record<string, unknown>,
        })
        if (!res.ok) {
          toast.error('Could not save changes. Please try again.')
          return
        }
      }
      // localStorage update (primary for guest; cache sync for auth)
      setStep1(draftS1)
      setStep4(draftS4)
      // React state
      setStep1State(draftS1)
      setStep4State(draftS4)
      setEditing(null)
      triggerToast()
      if (user) dispatchOnboardingUpdated()
  }

  const saveFinancial = async () => {
    if (!draftS2 || !draftS4) return
    if (user) {
        const res = await saveOnboardingAnswers({
          step1: (step1 ?? {}) as unknown as Record<string, unknown>,
          step2: draftS2 as unknown as Record<string, unknown>,
          step3: (step3 ?? {}) as unknown as Record<string, unknown>,
          step4: draftS4 as unknown as Record<string, unknown>,
        })
        if (!res.ok) {
          toast.error('Could not save changes. Please try again.')
          return
        }
      }
      setStep2(draftS2)
      setStep4(draftS4)
      setStep2State(draftS2)
      setStep4State(draftS4)
      setEditing(null)
      triggerToast()
      if (user) dispatchOnboardingUpdated()
  }

  const saveProperty = async () => {
    if (!draftS3) return
    if (user) {
        const res = await saveOnboardingAnswers({
          step1: (step1 ?? {}) as unknown as Record<string, unknown>,
          step2: (step2 ?? {}) as unknown as Record<string, unknown>,
          step3: draftS3 as unknown as Record<string, unknown>,
          step4: (step4 ?? {}) as unknown as Record<string, unknown>,
        })
        if (!res.ok) {
          toast.error('Could not save changes. Please try again.')
          return
        }
      }
      setStep3(draftS3)
      setStep3State(draftS3)
      setEditing(null)
      triggerToast()
      if (user) dispatchOnboardingUpdated()
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  const hasData = !!(step1 || step2 || step3 || step4)

  // ── No data state ──────────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] dark:bg-background flex items-center justify-center px-5">
        <div className="max-w-sm text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-fn-yellow/20 flex items-center justify-center">
            <User className="w-8 h-8 text-fn-yellow-deep" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground mb-2">No profile yet</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Complete the quick questionnaire to build your personalised home buying profile.
            </p>
          </div>
          <button
            onClick={() => router.push('/onboarding?flow=grants')}
            className="flex items-center gap-2 bg-fn-yellow text-fn-navy font-bold rounded-full px-7 py-3.5 text-sm hover:bg-fn-yellow-dark transition-colors duration-200 shadow-[0_4px_16px_rgba(245,230,66,0.5)]"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative"
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #FAFAF9 50%, #FFFFFF 100%)' }}
      />
      <div className="hidden dark:block absolute inset-0 pointer-events-none bg-background" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-20 pt-24 lg:pt-28">

        {/* ── Page header ── */}
        <div className="mb-10 flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#FFF8D6] to-[#F5E642] flex items-center justify-center mb-6 shadow-xl shadow-fn-yellow/20 border-4 border-white dark:border-card text-fn-navy">
            {/* Dummy avatar: gender-appropriate portrait inferred from the name;
                neutral silhouette when the name's gender is unknown or the image
                fails to load. TODO: replace with a real user-uploaded avatar. */}
            {avatarUrl && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={firstName ? `${firstName}'s profile photo` : 'Profile photo'}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <User
                size={44}
                strokeWidth={1.75}
                className="text-fn-navy/80"
                aria-label={firstName ? `${firstName}'s profile` : 'Profile'}
              />
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Welcome back, {firstName}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            {pct >= 100 ? "Your profile is complete. You're ready to explore your options." : "You're almost done. Complete your profile to unlock better recommendations."}
          </p>
        </div>

        {/* ── Hero summary card ── */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-card border border-[rgba(0,0,0,0.05)] dark:border-border mb-12 p-8 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] group hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FDFBF2] dark:from-card dark:via-card dark:to-card pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center gap-10">
            {/* Left */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-6">Profile Progress</h2>
              <div className="flex flex-col gap-3">
                <EligibilityBadge label="Government Support Evaluated" eligible={!!(step3?.firstHomeBuyer)} />
                <EligibilityBadge label="Borrowing Estimate Ready" eligible={!!(step2?.annualIncome)} />
                <EligibilityBadge label="Personalised Recommendations Unlocked" eligible={pct >= 70} />
              </div>
            </div>

            {/* Right: progress ring */}
            <div className="flex flex-col items-center justify-center shrink-0 bg-white dark:bg-input rounded-3xl p-6 shadow-sm border border-[rgba(0,0,0,0.03)] dark:border-border min-w-[200px]">
              <ProfileRing pct={pct} />
              <p className="text-sm font-bold text-foreground mt-4">Profile Complete</p>
              {missing.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2 max-w-[160px]">
                  Missing: <span className="text-foreground font-medium">{missing[0]}</span>
                  {missing.length > 1 && <span> +{missing.length - 1} more</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Desktop Adaptive Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">

            {/* 1. Personal Details */}
            <SectionCard
              id="section-personal"
              icon="👤"
              title="Personal Details"
              subtitle="Name, location & buying situation"
              isEditing={editing === 'personal'}
              onEdit={() => startEdit('personal')}
              onCancel={cancelEdit}
              summary={
                <div>
                  <DataRow icon="👤" label="First Name" value={step1?.firstName || '—'} />
                  <DataRow icon="📍" label="State" value={step1?.state || '—'} />
                  <DataRow icon="👥" label="Buying With" value={step1?.buyingWith === 'partner' ? 'With a partner' : 'Solo'} />
                  <DataRow icon="💼" label="Employment" value={EMPLOYMENT_LABELS[step4?.employmentType ?? ''] || '—'} />
                </div>
              }
              editForm={
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileInput
                      label="First Name"
                      value={draftS1?.firstName ?? ''}
                      onChange={(v) => setDraftS1(d => d ? { ...d, firstName: v } : d)}
                      placeholder="e.g. Sarah"
                    />
                    <ChipSelect
                      label="State"
                      options={['NSW','VIC','QLD','SA','WA','TAS','ACT','NT'].map(s => ({ value: s, label: s }))}
                      value={(draftS1?.state ?? '') as string}
                      onChange={(v) => setDraftS1(d => d ? { ...d, state: v } : d)}
                    />
                  </div>
                  <ChipSelect
                    label="Buying With"
                    options={[
                      { value: 'solo', label: '👤 Just me' },
                      { value: 'partner', label: '👥 With partner' },
                    ]}
                    value={draftS1?.buyingWith ?? 'solo'}
                    onChange={(v) => setDraftS1(d => d ? { ...d, buyingWith: v as Step1Data['buyingWith'] } : d)}
                  />
                  <ChipSelect
                    label="Employment Type"
                    options={Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                    value={draftS4?.employmentType ?? 'fulltime'}
                    onChange={(v) => setDraftS4(d => d ? { ...d, employmentType: v as Step4Data['employmentType'] } : d)}
                  />
                  <SaveCancelRow onSave={savePersonal} onCancel={cancelEdit} />
                </div>
              }
            />

            {/* 3. Property Goals */}
            <SectionCard
              id="section-property"
              icon="🎯"
              title="Buying Goals"
              subtitle="Savings, target price & property type"
              isEditing={editing === 'property'}
              onEdit={() => startEdit('property')}
              onCancel={cancelEdit}
              summary={
                <div>
                  <DataRow icon="💰" label="Current Savings" value={fmt(step3?.depositAmount ?? 0)} />
                  <DataRow icon="🎯" label="Target Property Price" value={fmt(step3?.targetPropertyPrice ?? 0)} />
                  <DataRow icon="🏡" label="Property Type" value={PROPERTY_LABELS[step3?.propertyType ?? ''] || '—'} />
                  <DataRow icon="✨" label="First Home Buyer" value={step3?.firstHomeBuyer ? 'Yes' : 'No'} />
                </div>
              }
              editForm={
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProfileInput
                      label="Current Savings"
                      value={draftS3?.depositAmount || ''}
                      onChange={(v) => setDraftS3(d => d ? { ...d, depositAmount: parseFloat(v) || 0 } : d)}
                      type="number"
                      prefix="$"
                      placeholder="0"
                    />
                    <ProfileInput
                      label="Target Property Price"
                      value={draftS3?.targetPropertyPrice || ''}
                      onChange={(v) => setDraftS3(d => d ? { ...d, targetPropertyPrice: parseFloat(v) || 0 } : d)}
                      type="number"
                      prefix="$"
                      placeholder="0"
                    />
                  </div>
                  <ChipSelect
                    label="Property Type"
                    options={[
                      { value: 'house', label: '🏠 House' },
                      { value: 'townhouse', label: '🏘️ Townhouse' },
                      { value: 'apartment', label: '🏢 Apartment' },
                      { value: 'offplan', label: '🏗️ Off-plan' },
                    ]}
                    value={draftS3?.propertyType ?? 'house'}
                    onChange={(v) => setDraftS3(d => d ? { ...d, propertyType: v as Step3Data['propertyType'] } : d)}
                  />
                  <ChipSelect
                    label="First Home Buyer?"
                    options={[
                      { value: 'true', label: '✨ Yes' },
                      { value: 'false', label: '🏡 No' },
                    ]}
                    value={draftS3?.firstHomeBuyer ? 'true' : 'false'}
                    onChange={(v) => setDraftS3(d => d ? { ...d, firstHomeBuyer: v === 'true' } : d)}
                  />
                  <SaveCancelRow onSave={saveProperty} onCancel={cancelEdit} />
                </div>
              }
            />

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">

            {/* 2. Financial Snapshot */}
            <SectionCard
              id="section-financial"
              icon="💰"
              title="Financial Snapshot"
              subtitle="Income, expenses & liabilities"
              isEditing={editing === 'financial'}
              onEdit={() => startEdit('financial')}
              onCancel={cancelEdit}
              summary={
                <div>
                  <DataRow icon="💵" label="Annual Income" value={fmt(step2?.annualIncome ?? 0)} />
                  {step1?.buyingWith === 'partner' && (
                    <DataRow icon="💵" label="Partner Income" value={fmt(step2?.partnerIncome ?? 0)} />
                  )}
                  <DataRow icon="📉" label="Monthly Expenses" value={step2?.monthlyExpenses ? `${fmt(step2.monthlyExpenses)}/mo` : '—'} />
                  <DataRow icon="💳" label="Credit Card Limit" value={step4?.creditCardLimit ? fmt(step4.creditCardLimit) : 'None'} />
                  <DataRow icon="💸" label="Other Loan Repayments" value={step4?.otherLoanRepayments ? `${fmt(step4.otherLoanRepayments)}/mo` : 'None'} />
                  <DataRow icon="🎓" label="HECS / HELP Debt" value={step4?.hecsDebt ? 'Yes' : 'No'} />
                </div>
              }
              editForm={
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4">
                    <ProfileInput
                      label="Annual Income"
                      value={draftS2?.annualIncome || ''}
                      onChange={(v) => setDraftS2(d => d ? { ...d, annualIncome: parseFloat(v) || 0 } : d)}
                      type="number"
                      prefix="$"
                      placeholder="0"
                    />
                    {step1?.buyingWith === 'partner' && (
                      <ProfileInput
                        label="Partner Income"
                        value={draftS2?.partnerIncome || ''}
                        onChange={(v) => setDraftS2(d => d ? { ...d, partnerIncome: parseFloat(v) || 0 } : d)}
                        type="number"
                        prefix="$"
                        placeholder="0"
                      />
                    )}
                    <ProfileInput
                      label="Monthly Expenses"
                      value={draftS2?.monthlyExpenses || ''}
                      onChange={(v) => setDraftS2(d => d ? { ...d, monthlyExpenses: parseFloat(v) || 0 } : d)}
                      type="number"
                      prefix="$"
                      placeholder="0"
                    />
                    <ProfileInput
                      label="Credit Card Limit"
                      value={draftS4?.creditCardLimit || ''}
                      onChange={(v) => setDraftS4(d => d ? { ...d, creditCardLimit: parseFloat(v) || 0 } : d)}
                      type="number"
                      prefix="$"
                      placeholder="0 or none"
                    />
                    <ProfileInput
                      label="Other Loan Repayments / mo"
                      value={draftS4?.otherLoanRepayments || ''}
                      onChange={(v) => setDraftS4(d => d ? { ...d, otherLoanRepayments: parseFloat(v) || 0 } : d)}
                      type="number"
                      prefix="$"
                      placeholder="0"
                    />
                  </div>
                  <ChipSelect
                    label="HECS / HELP Debt"
                    options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]}
                    value={draftS4?.hecsDebt ? 'true' : 'false'}
                    onChange={(v) => setDraftS4(d => d ? { ...d, hecsDebt: v === 'true' } : d)}
                  />
                  <SaveCancelRow onSave={saveFinancial} onCancel={cancelEdit} />
                </div>
              }
            />

            {/* 4. Quick actions strip */}
            <div className="flex flex-col gap-4 mt-2">
              <ActionCard
                icon={<Target className="w-5 h-5" />}
                label="View My Results"
                description="Grants, borrowing capacity & next steps"
                onClick={() => router.push('/results/grants')}
              />
              <ActionCard
                icon={<ArrowRight className="w-5 h-5" />}
                label="Update Questionnaire"
                description="Go through the onboarding steps again"
                onClick={() => router.push('/onboarding?flow=grants')}
              />
            </div>
          </div>
        </div>
      </div>

      <Toast show={showToast} />
    </div>
  )
}

// ── Small sub-components ───────────────────────────────────────────────────

function EligibilityBadge({ label, eligible }: { label: string; eligible: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
      eligible 
        ? 'bg-white dark:bg-card border-[rgba(0,0,0,0.04)] dark:border-border shadow-sm' 
        : 'bg-transparent border-dashed border-[rgba(0,0,0,0.1)] dark:border-border opacity-70'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${eligible ? 'bg-fn-yellow text-fn-navy shadow-sm' : 'bg-[#FAFAF9] dark:bg-input border border-[rgba(0,0,0,0.05)] dark:border-border'}`}>
        {eligible && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </div>
      <span className={`text-[15px] ${eligible ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
        {label}
      </span>
    </div>
  )
}

function ProfileRing({ pct }: { pct: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.05)" className="dark:stroke-white/10" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#F5E642"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground leading-none">{pct}%</span>
      </div>
    </div>
  )
}

function SaveCancelRow({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-full border border-[rgba(0,0,0,0.1)] dark:border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-150 cursor-pointer bg-transparent whitespace-nowrap"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="flex-1 px-4 sm:px-6 py-2.5 rounded-full bg-fn-yellow hover:bg-[#E5D632] text-fn-navy font-bold text-sm transition-all duration-150 cursor-pointer shadow-sm whitespace-nowrap"
      >
        Save Changes
      </button>
    </div>
  )
}

function ActionCard({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left flex items-center gap-5 bg-white dark:bg-card border border-[rgba(0,0,0,0.05)] dark:border-border rounded-3xl p-5 hover:border-fn-yellow-deep/40 dark:hover:border-fn-yellow/30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FAFAF9] dark:bg-input flex items-center justify-center text-fn-navy shrink-0 group-hover:bg-fn-yellow group-hover:text-fn-navy transition-colors shadow-sm border border-[rgba(0,0,0,0.02)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-foreground leading-snug">{label}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-snug">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all ml-auto shrink-0" />
    </button>
  )
}
