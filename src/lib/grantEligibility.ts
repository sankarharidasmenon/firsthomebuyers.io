import { GRANTS_DUMMY, type Grant } from './dummyData'
import { calculateStampDuty } from './stampDuty'
import type { Step1Data, Step2Data, Step3Data, Step4Data } from './localStorage'

export type EligibilityStatus = 'eligible' | 'check' | 'ineligible'

export interface EvaluatedGrant {
  grant: Grant
  status: EligibilityStatus
  value: number | string
  criteria: Array<{ text: string; met: boolean }>
  reason?: string
  alternative?: string
}

export interface EligibilityReport {
  grants: EvaluatedGrant[]
  grantsTotal: number
  eligibleCount: number
  stampDuty: ReturnType<typeof calculateStampDuty> | null
}

const INCOME_CAP_SINGLE = 125000
const INCOME_CAP_JOINT = 200000

export function evaluateEligibility(
  step1: Step1Data,
  step2: Step2Data,
  step3: Step3Data,
  step4: Step4Data
): EligibilityReport {
  const state = step1.state
  const totalIncome = step2.annualIncome + (step2.partnerIncome || 0)
  const isFirstHomeBuyer = step3.firstHomeBuyer
  const propertyPrice = step3.targetPropertyPrice
  const depositAmount = step3.depositAmount
  const depositPct = depositAmount / propertyPrice
  const isJoint = step1.buyingWith === 'partner'
  const incomeCap = isJoint ? INCOME_CAP_JOINT : INCOME_CAP_SINGLE

  const stampDuty = calculateStampDuty(propertyPrice, state, isFirstHomeBuyer)
  const stampDutySaving = stampDuty.isEligible ? stampDuty.saving : 0

  const evaluated: EvaluatedGrant[] = GRANTS_DUMMY.map(grant => {
    if (grant.id === 'stamp-duty-concession') {
      // Handled separately via StampDutyCard
      return null
    }

    if (grant.id === 'fhog') {
      const stateValues = grant.stateValues ?? {}
      const stateValue = stateValues[state] ?? 0
      const isNewHome = step3.propertyType === 'offplan'

      if (!isFirstHomeBuyer) {
        return {
          grant, status: 'ineligible' as EligibilityStatus,
          value: stateValue,
          criteria: [
            { text: 'Must be a first home buyer', met: false },
          ],
          reason: 'You indicated you have owned property before.',
        }
      }

      if (stateValue === 0) {
        return {
          grant, status: 'ineligible' as EligibilityStatus,
          value: 0,
          criteria: [
            { text: `FHOG not available in ${state}`, met: false },
          ],
          reason: `The First Home Owner Grant is not available in ${state}.`,
        }
      }

      if (!isNewHome) {
        return {
          grant, status: 'check' as EligibilityStatus,
          value: stateValue,
          criteria: [
            { text: 'First home buyer', met: true },
            { text: 'New or substantially renovated home required', met: false },
          ],
          reason: `In ${state}, FHOG is available for new or substantially renovated homes only.`,
          alternative: 'Select "Off-the-plan" property type to confirm eligibility.',
        }
      }

      return {
        grant, status: 'eligible' as EligibilityStatus,
        value: stateValue,
        criteria: [
          { text: 'First home buyer', met: true },
          { text: 'New or substantially renovated home', met: true },
          { text: `Buying in ${state}`, met: true },
        ],
      }
    }

    if (grant.id === 'fhss') {
      if (!isFirstHomeBuyer) {
        return {
          grant, status: 'ineligible' as EligibilityStatus,
          value: 50000,
          criteria: [{ text: 'Must be a first home buyer', met: false }],
          reason: 'You indicated you have owned property before.',
        }
      }
      return {
        grant, status: 'eligible' as EligibilityStatus,
        value: 50000,
        criteria: [
          { text: 'First home buyer', met: true },
          { text: 'Has voluntary super contributions', met: true },
        ],
      }
    }

    if (grant.id === 'fhbg') {
      const incomeOk = totalIncome <= incomeCap
      const depositOk = depositPct >= 0.05 && depositPct < 0.20

      if (!isFirstHomeBuyer) {
        return {
          grant, status: 'ineligible' as EligibilityStatus,
          value: 'LMI waived',
          criteria: [{ text: 'Must be a first home buyer', met: false }],
          reason: 'You indicated you have owned property before.',
        }
      }

      const criteria = [
        { text: 'First home buyer', met: true },
        { text: `Income under $${incomeCap.toLocaleString()}`, met: incomeOk },
        { text: 'Deposit between 5%–20%', met: depositOk },
      ]

      if (!incomeOk) {
        return {
          grant, status: 'ineligible' as EligibilityStatus,
          value: 'LMI waived',
          criteria,
          reason: `Your household income exceeds the cap of $${incomeCap.toLocaleString()} for this scheme.`,
        }
      }

      if (!depositOk) {
        return {
          grant, status: 'check' as EligibilityStatus,
          value: 'LMI waived',
          criteria,
          reason: 'Your deposit is outside the 5%–20% range required for this scheme.',
        }
      }

      return { grant, status: 'eligible' as EligibilityStatus, value: 'LMI waived', criteria }
    }

    if (grant.id === 'shared-equity') {
      const incomeOk = totalIncome <= incomeCap

      if (!isFirstHomeBuyer || !incomeOk) {
        return {
          grant, status: 'ineligible' as EligibilityStatus,
          value: 'Up to 40% co-contribution',
          criteria: [
            { text: 'First home buyer', met: isFirstHomeBuyer },
            { text: `Income under $${incomeCap.toLocaleString()}`, met: incomeOk },
          ],
          reason: !isFirstHomeBuyer
            ? 'You indicated you have owned property before.'
            : `Income exceeds cap of $${incomeCap.toLocaleString()}.`,
        }
      }

      return {
        grant, status: 'check' as EligibilityStatus,
        value: 'Up to 40% co-contribution',
        criteria: [
          { text: 'First home buyer', met: true },
          { text: `Income under $${incomeCap.toLocaleString()}`, met: true },
          { text: 'Program availability — check eligibility', met: false },
        ],
        reason: 'This program has limited places — check the official website for availability.',
      }
    }

    return {
      grant, status: 'check' as EligibilityStatus,
      value: 0,
      criteria: [{ text: 'Check official eligibility criteria', met: false }],
    }
  }).filter(Boolean) as EvaluatedGrant[]

  let grantsTotal = stampDutySaving
  let eligibleCount = stampDuty.isEligible ? 1 : 0

  evaluated.forEach(eg => {
    if (eg.status === 'eligible' && typeof eg.value === 'number') {
      grantsTotal += eg.value
      eligibleCount++
    } else if (eg.status === 'eligible') {
      eligibleCount++
    }
  })

  return {
    grants: evaluated,
    grantsTotal,
    eligibleCount,
    stampDuty,
  }
}
