'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { StepWrapper } from '@/components/onboarding/StepWrapper'
import { Step1_PersonalDetails } from '@/components/onboarding/Step1_PersonalDetails'
import { Step2_FinancialDetails } from '@/components/onboarding/Step2_FinancialDetails'
import { Step3_PropertyGoals } from '@/components/onboarding/Step3_PropertyGoals'
import { Step4_SituationCheck } from '@/components/onboarding/Step4_SituationCheck'
import { useAutoSave } from '@/hooks/useAutoSave'
import {
  getStep1, setStep1, getStep2, setStep2,
  getStep3, setStep3, getStep4, setStep4,
  setProgress,
  type Step1Data, type Step2Data, type Step3Data, type Step4Data, type Flow,
} from '@/lib/localStorage'

const DEFAULT_STEP1: Step1Data = { firstName: '', state: '', buyingWith: 'solo' }
const DEFAULT_STEP2: Step2Data = { annualIncome: 0, partnerIncome: 0, monthlyExpenses: 0 }
const DEFAULT_STEP3: Step3Data = { depositAmount: 0, targetPropertyPrice: 0, propertyType: 'house', firstHomeBuyer: true }
const DEFAULT_STEP4: Step4Data = { employmentType: 'fulltime', creditCardLimit: 0, hecsDebt: false, otherLoanRepayments: 0 }

type StepErrors = Partial<Record<string, string>>

function validate1(data: Step1Data): StepErrors {
  const e: StepErrors = {}
  if (!data.firstName.trim()) e.firstName = 'Please enter your first name.'
  if (!data.state) e.state = 'Please select a state or territory.'
  if (!data.buyingWith) e.buyingWith = 'Please select an option.'
  return e
}

function validate2(data: Step2Data, isPartner: boolean): StepErrors {
  const e: StepErrors = {}
  if (!data.annualIncome || data.annualIncome <= 0) e.annualIncome = 'Please enter your annual income.'
  if (isPartner && (!data.partnerIncome || data.partnerIncome <= 0)) e.partnerIncome = "Please enter your partner's income."
  if (!data.monthlyExpenses || data.monthlyExpenses <= 0) e.monthlyExpenses = 'Please enter your monthly expenses.'
  return e
}

function validate3(data: Step3Data): StepErrors {
  const e: StepErrors = {}
  if (!data.depositAmount || data.depositAmount <= 0) e.depositAmount = 'Please enter your savings amount.'
  if (!data.targetPropertyPrice || data.targetPropertyPrice <= 0) e.targetPropertyPrice = 'Please enter a target property price.'
  if (!data.propertyType) e.propertyType = 'Please select a property type.'
  return e
}

function validate4(data: Step4Data): StepErrors {
  const e: StepErrors = {}
  if (!data.employmentType) e.employmentType = 'Please select your employment type.'
  return e
}

function OnboardingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const flow = (params.get('flow') ?? 'grants') as Flow
  const initialStep = parseInt(params.get('step') ?? '1', 10)
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [errors, setErrors] = useState<StepErrors>({})

  const [step1, setStep1State] = useState<Step1Data>(DEFAULT_STEP1)
  const [step2, setStep2State] = useState<Step2Data>(DEFAULT_STEP2)
  const [step3, setStep3State] = useState<Step3Data>(DEFAULT_STEP3)
  const [step4, setStep4State] = useState<Step4Data>(DEFAULT_STEP4)

  // Hydrate from localStorage on client only — avoids SSR/client mismatch
  useEffect(() => {
    setStep1State(getStep1() ?? DEFAULT_STEP1)
    setStep2State(getStep2() ?? DEFAULT_STEP2)
    setStep3State(getStep3() ?? DEFAULT_STEP3)
    setStep4State(getStep4() ?? DEFAULT_STEP4)
    setMounted(true)
  }, [])

  // Auto-save for current step data
  const saveStep1 = useCallback((data: Step1Data) => setStep1(data), [])
  const saveStep2 = useCallback((data: Step2Data) => setStep2(data), [])
  const saveStep3 = useCallback((data: Step3Data) => setStep3(data), [])
  const saveStep4 = useCallback((data: Step4Data) => setStep4(data), [])

  const { showIndicator: save1Visible } = useAutoSave(step1, saveStep1)
  const { showIndicator: save2Visible } = useAutoSave(step2, saveStep2)
  const { showIndicator: save3Visible } = useAutoSave(step3, saveStep3)
  const { showIndicator: save4Visible } = useAutoSave(step4, saveStep4)

  const autoSaveVisible = save1Visible || save2Visible || save3Visible || save4Visible

  // Persist progress on step change
  useEffect(() => {
    setProgress({ currentStep, flow, completedSteps: Array.from({ length: currentStep - 1 }, (_, i) => i + 1) })
  }, [currentStep, flow])

  const goNext = () => {
    setDirection(1)
    setErrors({})
    setCurrentStep(s => s + 1)
  }

  const goBack = () => {
    if (currentStep === 1) {
      router.push('/')
      return
    }
    setDirection(-1)
    setErrors({})
    setCurrentStep(s => s - 1)
  }

  const handleStep1Next = () => {
    const errs = validate1(step1)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep1(step1)
    goNext()
  }

  const handleStep2Next = () => {
    const errs = validate2(step2, step1.buyingWith === 'partner')
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep2(step2)
    goNext()
  }

  const handleStep3Next = () => {
    const errs = validate3(step3)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep3(step3)
    goNext()
  }

  const handleStep4Submit = () => {
    const errs = validate4(step4)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep4(step4)
    router.push('/results/grants')
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  if (!mounted) return <div className="min-h-screen bg-white" />

  return (
    <StepWrapper
      currentStep={currentStep}
      totalSteps={4}
      onBack={goBack}
      autoSaveVisible={autoSaveVisible}
    >
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Step1_PersonalDetails
                flow={flow}
                data={step1}
                onChange={setStep1State}
                onNext={handleStep1Next}
                errors={errors}
              />
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Step2_FinancialDetails
                step1={step1}
                data={step2}
                onChange={setStep2State}
                onNext={handleStep2Next}
                onBack={goBack}
                errors={errors}
              />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Step3_PropertyGoals
                data={step3}
                onChange={setStep3State}
                onNext={handleStep3Next}
                onBack={goBack}
                errors={errors}
              />
            </motion.div>
          )}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Step4_SituationCheck
                step1={step1}
                data={step4}
                onChange={setStep4State}
                onSubmit={handleStep4Submit}
                onBack={goBack}
                errors={errors}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepWrapper>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <OnboardingContent />
    </Suspense>
  )
}
