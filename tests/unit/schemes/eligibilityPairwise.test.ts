import { describe, it, expect } from 'vitest'
import { evaluateScheme, type ApiScheme, type EligibilityAnswers } from '@/lib/schemes/eligibilityClient'
import { FEDERAL_SCHEMES } from './fixtures/federalSchemes'
import { generatePairwise, type Factor, type Row } from './pairwiseGen'

/**
 * Pairwise-coverage tests over evaluateScheme()'s input space.
 *
 * federalSchemes.test.ts pins ~10 hand-picked, individually-meaningful
 * scenarios per scheme (including the two joint-applicant regressions).
 * This file complements it with breadth: every PAIR of values across the 10
 * core discrete fields the engine reads (see the field scan in session
 * notes — `grep -oE "ra\.[a-zA-Z]+|a\.[a-zA-Z]+"` on eligibilityClient.ts)
 * appears together in at least one generated case. The full discrete answer
 * space is 241,920 profiles (see session notes); pairwise coverage of it
 * takes a fraction of that — the exact row count is asserted below rather
 * than hard-coded, so this file stays honest if a factor changes.
 *
 * Deliberately excluded factors (dead inputs — collected by the
 * questionnaire but not read by any rule in eligibilityClient.ts today):
 * vicLivedInPrior, qldNeverOccupied (retired), coDob, singleParent.
 * State-specific gates (nswNeverOccupied, vicAdf, vicFamilyViolence) are
 * scoped to their own state and don't interact with the federal-only
 * fixtures used here, so they're out of scope for this file.
 *
 * Because these cases are machine-generated, there is no hand-computed
 * "expected bucket" per case — that would defeat the purpose of covering
 * hundreds of combinations. Instead every case is checked against the
 * engine's own documented invariants (see evaluateScheme's doc comment):
 * a `fail()` is sticky and proves at least one hard failure exists; a
 * `check()` only ever downgrades from 'yes', so a 'check' bucket proves NO
 * hard failure occurred; a 'yes' bucket proves every rule passed outright.
 * These invariants would be violated by, for example, a future edit that
 * lets a later `pass()` accidentally overwrite an earlier `fail()`.
 */

const FACTORS: Factor[] = [
  { name: 'state', values: ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] },
  { name: 'is18', values: ['Yes', 'No'] },
  { name: 'buyingWith', values: ['Individually', 'Jointly'] },
  { name: 'citizenship', values: ['Australian Citizen', 'Permanent Resident', 'NZ Special Category Visa (SCV) holder', 'Other'] },
  { name: 'everOwned', values: ['Yes', 'No'] },
  { name: 'hasPartner', values: ['Yes', 'No'] },
  { name: 'priorBenefit', values: ['Yes', 'No'] },
  { name: 'propertyType', values: ['New', 'Established (Existing)', 'Off-the-Plan', 'Land + Build'] },
  { name: 'ppr', values: ['Yes', 'No'] },
  { name: 'entity', values: ['Individual', 'Company', 'Trust'] },
]

const { rows, fullyCovered, totalPairs } = generatePairwise(FACTORS, { seed: 20260830 })

/** Calculator-shaped dwelling type the engine's rule 2 also reads from `a.propertyType`. */
function toDwellingShape(pt: string): EligibilityAnswers['propertyType'] {
  if (pt === 'Off-the-Plan') return 'offplan'
  return 'house'
}

function rowToAnswers(row: Row): EligibilityAnswers {
  const everOwned = row.everOwned === 'Yes'
  const jointly = row.buyingWith === 'Jointly'
  const partnered = row.hasPartner === 'Yes'
  const pprYes = row.ppr === 'Yes'

  return {
    state: row.state,
    firstHomeBuyer: !everOwned,
    income: 90_000,
    hasPartner: jointly || partnered,
    propertyPrice: 700_000,
    deposit: 100_000,
    propertyType: toDwellingShape(row.propertyType),
    rawAnswers: {
      is18: row.is18,
      buyingWith: row.buyingWith,
      citizenship: row.citizenship,
      coCitizenship: jointly ? row.citizenship : undefined,
      everOwned: row.everOwned,
      hasPartner: row.hasPartner,
      partnerOwned: 'No',
      priorBenefit: row.priorBenefit,
      propertyType: row.propertyType,
      ppr: row.ppr,
      moveIn: pprYes ? 'Yes' : undefined,
      entity: row.entity,
    },
  }
}

describe('pairwise coverage generator', () => {
  it('reaches full pairwise coverage of the 10-factor eligibility input space', () => {
    // This is the proof, not an assumption: if a future edit to FACTORS or the
    // generator regresses coverage, this fails loudly instead of silently
    // shipping a covering set that doesn't actually cover.
    expect(fullyCovered).toBe(true)
  })

  it('produces a materially smaller set than the full discrete answer space', () => {
    const fullSpace = FACTORS.reduce((n, f) => n * f.values.length, 1)
    expect(fullSpace).toBe(24_576) // the 10 core factors, unconditional product
    expect(rows.length).toBeLessThan(fullSpace / 100)
    expect(rows.length).toBeGreaterThan(0)
  })

  it('every row is unique', () => {
    const seen = new Set(rows.map((r) => JSON.stringify(r)))
    expect(seen.size).toBe(rows.length)
  })
})

describe(`pairwise coverage × ${FEDERAL_SCHEMES.length} Federal schemes (${totalPairs} pairs, ${rows.length} rows)`, () => {
  for (const scheme of FEDERAL_SCHEMES) {
    describe(scheme.scheme_name, () => {
      it.each(rows.map((row, i) => ({ row, i })))('case #$i does not violate bucket invariants', ({ row }) => {
        assertInvariants(scheme, rowToAnswers(row))
      })
    })
  }
})

function assertInvariants(scheme: ApiScheme, answers: EligibilityAnswers) {
  const { bucket, ruleResults } = evaluateScheme(scheme, answers)

  expect(['yes', 'check', 'no']).toContain(bucket)
  expect(ruleResults.length).toBeGreaterThan(0)
  for (const r of ruleResults) {
    expect(typeof r.text).toBe('string')
    expect(r.text.length).toBeGreaterThan(0)
  }

  const hardFailures = ruleResults.filter((r) => !r.met && !r.isCheck)
  const softChecks = ruleResults.filter((r) => !r.met && r.isCheck)

  if (bucket === 'yes') {
    // A 'yes' can only happen if every single rule passed outright — check()
    // and fail() both prevent it (see evaluateScheme's doc comment).
    expect(hardFailures).toHaveLength(0)
    expect(softChecks).toHaveLength(0)
  } else if (bucket === 'check') {
    // check() only ever downgrades from 'yes'; fail() is sticky and would
    // have forced 'no' instead. So 'check' proves no hard failure occurred.
    expect(hardFailures).toHaveLength(0)
    expect(softChecks.length).toBeGreaterThan(0)
  } else {
    // bucket === 'no' — proves at least one real, non-check failure fired.
    expect(hardFailures.length).toBeGreaterThan(0)
  }
}
