/**
 * Deterministic greedy pairwise (2-way) covering-array generator.
 *
 * Given N factors each with a set of possible values, produces the smallest
 * row set the greedy algorithm can find such that EVERY pair of values from
 * any two different factors appears together in at least one row — the
 * standard "all-pairs" combinatorial testing technique. It catches almost
 * all interaction bugs a full N-way enumeration would, at a small fraction
 * of the size (see eligibilityPairwise.test.ts for the eligibility-specific
 * numbers: ~241,920 possible discrete answer profiles, covered pairwise in
 * well under 100 rows).
 *
 * Algorithm (AETG-style greedy): to build each new row, propose many
 * candidate full assignments from a seeded PRNG, score each by how many
 * currently-uncovered pairs it would cover, and keep the best. Repeat until
 * no pairs remain uncovered. This is not guaranteed globally optimal (exact
 * minimum covering-array construction is NP-hard) but is a well-established,
 * practically-minimal approach.
 *
 * Deterministic on purpose — a seeded LCG, not Math.random() — so the
 * generated case set (and therefore CI results) never changes between runs
 * without an intentional edit to the factors or the seed.
 */

export interface Factor {
  name: string
  values: readonly string[]
}

export type Row = Record<string, string>

/** Small, fast, seedable PRNG (mulberry32) — good enough for test-case shuffling. */
function mulberry32(seed: number) {
  let a = seed
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pairKey(fi: number, vi: string, fj: number, vj: string): string {
  return fi < fj ? `${fi}=${vi}|${fj}=${vj}` : `${fj}=${vj}|${fi}=${vi}`
}

/** Every (factorA=valueA, factorB=valueB) pair across distinct factors. */
function allPairKeys(factors: Factor[]): Set<string> {
  const keys = new Set<string>()
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      for (const vi of factors[i].values) {
        for (const vj of factors[j].values) {
          keys.add(pairKey(i, vi, j, vj))
        }
      }
    }
  }
  return keys
}

function rowPairKeys(factors: Factor[], row: string[]): string[] {
  const keys: string[] = []
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      keys.push(pairKey(i, row[i], j, row[j]))
    }
  }
  return keys
}

export interface PairwiseResult {
  rows: Row[]
  /** True only if every pair really was covered — always check this in a test. */
  fullyCovered: boolean
  totalPairs: number
}

export function generatePairwise(
  factors: Factor[],
  opts: { seed?: number; candidatesPerRow?: number; maxRows?: number } = {},
): PairwiseResult {
  const seed = opts.seed ?? 20260830
  const candidatesPerRow = opts.candidatesPerRow ?? 120
  const maxRows = opts.maxRows ?? 500
  const rand = mulberry32(seed)

  const uncovered = allPairKeys(factors)
  const totalPairs = uncovered.size
  const rows: Row[] = []
  const rawRows: string[][] = []

  while (uncovered.size > 0 && rawRows.length < maxRows) {
    let best: string[] | null = null
    let bestScore = -1

    for (let c = 0; c < candidatesPerRow; c++) {
      const candidate = factors.map((f) => f.values[Math.floor(rand() * f.values.length)])
      let score = 0
      for (const key of rowPairKeys(factors, candidate)) {
        if (uncovered.has(key)) score++
      }
      if (score > bestScore) {
        bestScore = score
        best = candidate
        if (score === (factors.length * (factors.length - 1)) / 2) break // covers every pair this row could
      }
    }

    if (!best) break // should be unreachable — candidatesPerRow >= 1
    for (const key of rowPairKeys(factors, best)) uncovered.delete(key)
    rawRows.push(best)
  }

  for (const raw of rawRows) {
    const row: Row = {}
    factors.forEach((f, i) => { row[f.name] = raw[i] })
    rows.push(row)
  }

  return { rows, fullyCovered: uncovered.size === 0, totalPairs }
}
