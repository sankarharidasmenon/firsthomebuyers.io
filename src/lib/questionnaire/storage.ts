/**
 * Persistence for the questionnaire. Saves the full 21-answer model under a new
 * key AND mirrors the legacy step keys the existing results pages read, so the
 * backend/API contract and downstream pages keep working untouched.
 */
import { EMPTY_ANSWERS, type Answers } from './types'
import { toLegacySteps } from './logic'
import { setStep1, setStep2, setStep3, setProgress } from '@/lib/localStorage'

const KEY = 'firstnest_questionnaire'

export function loadAnswers(): Answers {
  if (typeof window === 'undefined') return EMPTY_ANSWERS
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_ANSWERS
    return { ...EMPTY_ANSWERS, ...(JSON.parse(raw) as Partial<Answers>) }
  } catch {
    return EMPTY_ANSWERS
  }
}

export function saveAnswers(a: Answers): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(a))
  } catch {
    /* quota / unavailable — non-fatal */
  }
  // Mirror to legacy keys so /results/* + the existing API mapping keep working.
  const { step1, step2, step3 } = toLegacySteps(a)
  setStep1(step1)
  setStep2(step2)
  setStep3(step3)
}

export function saveStepProgress(currentStep: number): void {
  setProgress({ currentStep, flow: 'grants', completedSteps: Array.from({ length: Math.max(0, currentStep - 1) }, (_, i) => i + 1) })
}
