/**
 * Grant Calculator transport. Posts the calculator's three inputs to its own
 * endpoint and returns the response unchanged — no rules and no fallback here,
 * so the browser and a curl against /api/grant-calculator always agree.
 *
 * Separate from lib/schemes/eligibilityClient.ts on purpose: that one carries
 * the questionnaire rule engine. This file must not import it.
 */
import type { CalculatorInput, CalculatorResult } from '@/lib/calculator/grantCalculator'

export type { CalculatorInput, CalculatorLine, CalculatorResult } from '@/lib/calculator/grantCalculator'

export async function fetchGrantCalculator(input: CalculatorInput): Promise<CalculatorResult> {
  const res = await fetch('/api/grant-calculator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.error ?? `Failed to calculate grants (HTTP ${res.status})`)
  }

  return (await res.json()) as CalculatorResult
}
