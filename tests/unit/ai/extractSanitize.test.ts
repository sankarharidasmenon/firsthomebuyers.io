import { describe, it, expect } from 'vitest'
import { sanitizeExtraction } from '@/lib/ai/extractSanitize'

/**
 * The sanitizer is the trust boundary between LLM output and the Answers
 * profile: only known fields, exact enums, sane ranges, and suburbs that exist
 * in the dataset may pass. These tests pin that contract, so a model
 * hallucination can never corrupt an application.
 */

describe('sanitizeExtraction — structure', () => {
  it.each([null, undefined, 42, 'text', []])('returns {} for non-object input (%s)', (v) => {
    expect(sanitizeExtraction(v)).toEqual({})
  })

  it('drops unknown fields entirely', () => {
    expect(sanitizeExtraction({ eligible: true, adminOverride: 'yes', price: 700_000 })).toEqual({ price: 700_000 })
  })
})

describe('sanitizeExtraction — enums', () => {
  it('accepts exact enum values and drops near-misses', () => {
    const out = sanitizeExtraction({
      state: 'VIC',
      propertyType: 'New',
      citizenship: 'Australian Citizen',
      buyingWith: 'Jointly',
      everOwned: 'No',
      ppr: 'yes', // wrong case — must be dropped, not coerced
    })
    expect(out.state).toBe('VIC')
    expect(out.propertyType).toBe('New')
    expect(out.citizenship).toBe('Australian Citizen')
    expect(out.buyingWith).toBe('Jointly')
    expect(out.everOwned).toBe('No')
    expect(out.ppr).toBeUndefined()
  })

  it('drops invented enum values', () => {
    expect(sanitizeExtraction({ state: 'Melbourne', propertyType: 'Castle' })).toEqual({})
  })

  it('a joint purchase implies a partner', () => {
    expect(sanitizeExtraction({ buyingWith: 'Jointly' }).hasPartner).toBe('Yes')
  })
})

describe('sanitizeExtraction — money', () => {
  it('parses numeric strings and rounds', () => {
    expect(sanitizeExtraction({ price: '700000.4', income: 95000 })).toEqual({ price: 700_000, income: 95_000 })
  })

  it('rejects out-of-range and non-finite values', () => {
    const out = sanitizeExtraction({ price: 500, income: 99_000_000, deposit: NaN, coIncome: Infinity })
    expect(out).toEqual({})
  })

  it('allows a zero deposit but not a zero price', () => {
    const out = sanitizeExtraction({ deposit: 0, price: 0 })
    expect(out.deposit).toBe(0)
    expect(out.price).toBeUndefined()
  })
})

describe('sanitizeExtraction — location', () => {
  it('resolves a real suburb to its dataset entry (case-insensitive)', () => {
    const out = sanitizeExtraction({ suburb: 'richmond' })
    expect(out.suburb).toBe('Richmond')
    expect(out.postcode).toBe('3121')
    expect(out.state).toBe('VIC')
  })

  it('drops an invented suburb rather than guessing', () => {
    const out = sanitizeExtraction({ suburb: 'Hobbiton West' })
    expect(out.suburb).toBeUndefined()
    expect(out.postcode).toBeUndefined()
  })

  it('a resolved postcode overrides a contradicting claimed state', () => {
    // Model says NSW but the suburb is 3121 (VIC) — postcode-derived state
    // wins, exactly like the location combobox.
    const out = sanitizeExtraction({ state: 'NSW', suburb: 'Richmond', postcode: '3121' })
    expect(out.state).toBe('VIC')
  })

  it('accepts a bare valid postcode and infers the state', () => {
    const out = sanitizeExtraction({ postcode: '3121' })
    expect(out.postcode).toBe('3121')
    expect(out.state).toBe('VIC')
  })

  it('rejects malformed postcodes', () => {
    expect(sanitizeExtraction({ postcode: '31210' })).toEqual({})
    expect(sanitizeExtraction({ postcode: 'abcd' })).toEqual({})
  })
})

describe('sanitizeExtraction — name', () => {
  it('trims and accepts a normal name', () => {
    expect(sanitizeExtraction({ name: '  Sarah ' }).name).toBe('Sarah')
  })

  it('drops absurdly long names', () => {
    expect(sanitizeExtraction({ name: 'x'.repeat(61) }).name).toBeUndefined()
  })
})
