export interface BorrowingInputs {
  annualIncome: number
  partnerIncome: number
  monthlyExpenses: number
  creditCardLimit: number
  otherLoanRepayments: number
  hecsDebt: boolean
  depositAmount: number
  employmentType: string
}

export interface BorrowingResult {
  min: number
  max: number
}

export function calculateBorrowingCapacity(inputs: BorrowingInputs): BorrowingResult {
  const totalIncome = inputs.annualIncome + (inputs.partnerIncome || 0)
  const monthlyIncome = totalIncome / 12

  // APRA 3% serviceability buffer — assess at rate + 3%
  const assessmentRate = (0.065 + 0.03) / 12

  // HEM-based expense floor
  const hemFloor = inputs.partnerIncome > 0 ? 4500 : 3200
  const effectiveExpenses = Math.max(inputs.monthlyExpenses, hemFloor)

  // Credit card assessment: banks use 3.8% of limit as monthly commitment
  const ccRepayment = (inputs.creditCardLimit * 0.038) / 12

  // HECS reduction
  const hecsReduction = inputs.hecsDebt ? monthlyIncome * 0.07 : 0

  const netMonthlyIncome =
    monthlyIncome - effectiveExpenses - ccRepayment -
    inputs.otherLoanRepayments - hecsReduction

  const maxMonthly = Math.max(netMonthlyIncome, 0)
  const borrowingCapacity = maxMonthly / assessmentRate

  return {
    min: Math.max(Math.round((borrowingCapacity * 0.9) / 1000) * 1000, 0),
    max: Math.max(Math.round(borrowingCapacity / 1000) * 1000, 0),
  }
}

export function calculateRepayments(loanAmount: number, annualRate = 0.065): {
  monthly: number
  fortnightly: number
} {
  const monthlyRate = annualRate / 12
  const termMonths = 30 * 12
  const monthly =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  return {
    monthly: Math.round(monthly),
    fortnightly: Math.round((monthly * 12) / 26),
  }
}

export function calculateDepositGap(
  depositAmount: number,
  targetPropertyPrice: number
): { gap: number; depositPercent: number; needsLMI: boolean } {
  const twentyPercent = targetPropertyPrice * 0.2
  const gap = Math.max(twentyPercent - depositAmount, 0)
  const depositPercent = (depositAmount / targetPropertyPrice) * 100
  return { gap, depositPercent, needsLMI: depositAmount < twentyPercent }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(value)
}
