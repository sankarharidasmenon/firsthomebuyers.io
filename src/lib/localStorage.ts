export type Flow = 'grants' | 'borrowing'

export interface ProgressData {
  currentStep: number
  flow: Flow
  completedSteps: number[]
  lastSaved: string
  expiresAt: string
}

export interface Step1Data {
  firstName: string
  state: string
  buyingWith: 'solo' | 'partner'
}

export interface Step2Data {
  annualIncome: number
  partnerIncome: number
  monthlyExpenses: number
}

export interface Step3Data {
  depositAmount: number
  targetPropertyPrice: number
  propertyType: 'house' | 'townhouse' | 'apartment' | 'offplan'
  firstHomeBuyer: boolean
}

export interface Step4Data {
  employmentType: 'fulltime' | 'parttime' | 'selfemployed' | 'casual' | 'contract'
  creditCardLimit: number
  hecsDebt: boolean
  otherLoanRepayments: number
}

export interface SavedResults {
  savedAt: string
  expiresAt: string
  borrowing: { min: number; max: number }
  grantsTotal: number
  eligibleGrants: string[]
  state: string
  firstName: string
}

export interface SavedScenario {
  id: string
  savedAt: string
  sliders: {
    extraSavings: number
    incomeIncrease: number
    hasPartner: boolean
    partnerIncome: number
  }
  result: { min: number; max: number }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

function makeExpiry(): string {
  return new Date(Date.now() + SEVEN_DAYS_MS).toISOString()
}

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// Progress
export function getProgress(): ProgressData | null {
  const data = safeGet<ProgressData>('firstnest_progress')
  if (!data) return null
  if (isExpired(data.expiresAt)) return null
  return data
}

export function setProgress(data: Omit<ProgressData, 'lastSaved' | 'expiresAt'>): void {
  safeSet('firstnest_progress', {
    ...data,
    lastSaved: new Date().toISOString(),
    expiresAt: makeExpiry(),
  })
}

export function clearProgress(): void {
  safeRemove('firstnest_progress')
}

// Step 1
export function getStep1(): Step1Data | null {
  return safeGet<Step1Data>('firstnest_step_1')
}

export function setStep1(data: Step1Data): void {
  safeSet('firstnest_step_1', data)
}

// Step 2
export function getStep2(): Step2Data | null {
  return safeGet<Step2Data>('firstnest_step_2')
}

export function setStep2(data: Step2Data): void {
  safeSet('firstnest_step_2', data)
}

// Step 3
export function getStep3(): Step3Data | null {
  return safeGet<Step3Data>('firstnest_step_3')
}

export function setStep3(data: Step3Data): void {
  safeSet('firstnest_step_3', data)
}

// Step 4
export function getStep4(): Step4Data | null {
  return safeGet<Step4Data>('firstnest_step_4')
}

export function setStep4(data: Step4Data): void {
  safeSet('firstnest_step_4', data)
}

// My Results
export function getMyResults(): SavedResults | null {
  const data = safeGet<SavedResults>('firstnest_my_results')
  if (!data) return null
  if (isExpired(data.expiresAt)) return null
  return data
}

export function setMyResults(data: Omit<SavedResults, 'savedAt' | 'expiresAt'>): void {
  safeSet('firstnest_my_results', {
    ...data,
    savedAt: new Date().toISOString(),
    expiresAt: makeExpiry(),
  })
}

export function clearMyResults(): void {
  safeRemove('firstnest_my_results')
}

// Saved Scenarios
export function getSavedScenarios(): SavedScenario[] {
  return safeGet<SavedScenario[]>('firstnest_saved_scenarios') ?? []
}

export function addSavedScenario(scenario: Omit<SavedScenario, 'id' | 'savedAt'>): void {
  const existing = getSavedScenarios()
  const newScenario: SavedScenario = {
    ...scenario,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
  }
  safeSet('firstnest_saved_scenarios', [newScenario, ...existing])
}

export function removeSavedScenario(id: string): void {
  const existing = getSavedScenarios()
  safeSet('firstnest_saved_scenarios', existing.filter(s => s.id !== id))
}

export function clearAllData(): void {
  ;['firstnest_progress', 'firstnest_step_1', 'firstnest_step_2',
    'firstnest_step_3', 'firstnest_step_4', 'firstnest_my_results',
    'firstnest_saved_scenarios'].forEach(safeRemove)
}

export function hasExpiredSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('firstnest_progress')
    if (!raw) return false
    const data = JSON.parse(raw) as ProgressData
    return isExpired(data.expiresAt)
  } catch {
    return false
  }
}
