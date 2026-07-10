/**
 * Shared view-model types for scheme/eligibility UI.
 *
 * These are the shapes the presentational components (GrantCard) and the
 * database-driven eligibility client consume. They live here — decoupled from
 * any hardcoded data — so the legacy grantEligibility.ts / dummyData scheme
 * data can be removed while the UI keeps its types.
 */

export type EligibilityStatus = 'eligible' | 'check' | 'ineligible'

export interface Grant {
  id: string
  name: string
  description: string
  value: number | string
  stateValues?: Record<string, number>
  eligibilityRules: string[]
  category: 'grant' | 'concession' | 'federal'
  officialUrl: string
  /** Plain-English benefit line shown under the name for scheme cards (from DB). */
  benefitLine?: string
}

export interface EvaluatedGrant {
  grant: Grant
  status: EligibilityStatus
  value: number | string
  criteria: Array<{ text: string; met: boolean }>
  reason?: string
  alternative?: string
}
