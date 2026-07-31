import { describe, it, expect } from 'vitest'
import {
  validateFeedback,
  sanitizeText,
  sanitizeMetadata,
  isFeedbackType,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  EMAIL_MAX_LENGTH,
} from '@/lib/feedback/validation'

/**
 * This module runs on BOTH sides of the trust boundary: the modal uses it for
 * inline errors, and the route handler re-runs it on the untrusted request
 * body. A gap here is a gap in server-side input validation, so the hostile
 * inputs below matter as much as the happy path.
 */

describe('isFeedbackType', () => {
  it.each(['bug', 'ui', 'feature', 'other'])('accepts %s', (value) => {
    expect(isFeedbackType(value)).toBe(true)
  })

  it.each(['', 'BUG', 'spam', 'bug ', null, undefined, 0, {}, []])(
    'rejects %o',
    (value) => {
      expect(isFeedbackType(value)).toBe(false)
    },
  )
})

describe('sanitizeText', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeText('   hello   ', 100)).toBe('hello')
  })

  it('normalises CRLF and lone CR to LF', () => {
    expect(sanitizeText('a\r\nb\rc', 100)).toBe('a\nb\nc')
  })

  it('collapses three or more newlines to a paragraph break', () => {
    expect(sanitizeText('a\n\n\n\n\nb', 100)).toBe('a\n\nb')
  })

  it('preserves a single newline and a deliberate paragraph break', () => {
    expect(sanitizeText('a\nb', 100)).toBe('a\nb')
    expect(sanitizeText('a\n\nb', 100)).toBe('a\n\nb')
  })

  it('strips control characters but keeps tab and newline', () => {
    expect(sanitizeText('a' + String.fromCharCode(0) + 'b' + String.fromCharCode(7) + 'c', 100)).toBe('abc')
    expect(sanitizeText('a\tb\nc', 100)).toBe('a\tb\nc')
  })

  it('strips C1 controls', () => {
    expect(sanitizeText('a' + String.fromCharCode(0x9f) + 'b', 100)).toBe('ab')
  })

  it('hard-caps the length', () => {
    expect(sanitizeText('x'.repeat(500), 100)).toHaveLength(100)
  })

  it.each([null, undefined, 42, {}, []])('returns "" for a non-string (%o)', (value) => {
    expect(sanitizeText(value, 100)).toBe('')
  })

  /**
   * Markup is deliberately NOT stripped: the value is stored as plain text and
   * only ever rendered through React, which escapes. Stripping would mangle
   * legitimate feedback such as "a < b".
   */
  it('leaves angle brackets intact', () => {
    expect(sanitizeText('a < b and 3 > 2', 100)).toBe('a < b and 3 > 2')
    expect(sanitizeText('<script>alert(1)</script>', 100)).toBe('<script>alert(1)</script>')
  })
})

describe('sanitizeMetadata', () => {
  it('flattens newlines to spaces so one field stays one line', () => {
    expect(sanitizeMetadata('Mozilla/5.0\nChrome')).toBe('Mozilla/5.0 Chrome')
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(sanitizeMetadata('')).toBeNull()
    expect(sanitizeMetadata('   ')).toBeNull()
    expect(sanitizeMetadata(null)).toBeNull()
    expect(sanitizeMetadata(undefined)).toBeNull()
  })

  it('caps an oversized value rather than storing it whole', () => {
    const result = sanitizeMetadata('u'.repeat(5_000))
    expect(result).not.toBeNull()
    expect((result as string).length).toBeLessThanOrEqual(500)
  })

  it('keeps a normal user agent unchanged', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    expect(sanitizeMetadata(ua)).toBe(ua)
  })
})

describe('validateFeedback — feedback type', () => {
  it('requires a type', () => {
    const errors = validateFeedback({ feedbackType: '', message: 'A valid message' })
    expect(errors.feedbackType).toBeDefined()
  })

  it('rejects a type outside the allowed set', () => {
    const errors = validateFeedback({
      feedbackType: 'spam' as never,
      message: 'A valid message',
    })
    expect(errors.feedbackType).toBeDefined()
  })

  it('accepts each allowed type', () => {
    for (const feedbackType of ['bug', 'ui', 'feature', 'other'] as const) {
      const errors = validateFeedback({ feedbackType, message: 'A valid message' })
      expect(errors.feedbackType).toBeUndefined()
    }
  })
})

describe('validateFeedback — message', () => {
  it('requires a message', () => {
    expect(validateFeedback({ feedbackType: 'bug', message: '' }).message).toBeDefined()
  })

  it('rejects a whitespace-only message', () => {
    expect(validateFeedback({ feedbackType: 'bug', message: '     ' }).message).toBeDefined()
  })

  it('rejects a message of only control characters', () => {
    // Sanitises to empty, so it must be caught rather than stored blank.
    expect(validateFeedback({ feedbackType: 'bug', message: String.fromCharCode(0, 7) }).message).toBeDefined()
  })

  it(`rejects a message shorter than ${MESSAGE_MIN_LENGTH} characters`, () => {
    const errors = validateFeedback({ feedbackType: 'bug', message: 'abc' })
    expect(errors.message).toContain(String(MESSAGE_MIN_LENGTH))
  })

  it('accepts a message exactly at the minimum length', () => {
    const message = 'x'.repeat(MESSAGE_MIN_LENGTH)
    expect(validateFeedback({ feedbackType: 'bug', message }).message).toBeUndefined()
  })

  it('accepts a message exactly at the maximum length', () => {
    const message = 'x'.repeat(MESSAGE_MAX_LENGTH)
    expect(validateFeedback({ feedbackType: 'bug', message }).message).toBeUndefined()
  })

  it('rejects a message beyond the maximum length', () => {
    const message = 'x'.repeat(MESSAGE_MAX_LENGTH + 1)
    expect(validateFeedback({ feedbackType: 'bug', message }).message).toBeDefined()
  })
})

describe('validateFeedback — optional email', () => {
  it('accepts an omitted email', () => {
    expect(validateFeedback({ feedbackType: 'bug', message: 'A valid message' }).email)
      .toBeUndefined()
  })

  it.each(['', '   '])('accepts a blank email (%o)', (email) => {
    expect(validateFeedback({ feedbackType: 'bug', message: 'A valid message', email }).email)
      .toBeUndefined()
  })

  it.each([
    'user@example.com',
    'first.last@example.co.uk',
    'user+tag@example.com.au',
  ])('accepts %s', (email) => {
    expect(validateFeedback({ feedbackType: 'bug', message: 'A valid message', email }).email)
      .toBeUndefined()
  })

  it.each([
    'not-an-email',
    'missing@domain',
    '@example.com',
    'user@',
    'user @example.com',
    'user@exa mple.com',
  ])('rejects %o', (email) => {
    expect(validateFeedback({ feedbackType: 'bug', message: 'A valid message', email }).email)
      .toBeDefined()
  })

  it('rejects an email beyond the maximum length', () => {
    const email = `${'a'.repeat(EMAIL_MAX_LENGTH)}@example.com`
    expect(validateFeedback({ feedbackType: 'bug', message: 'A valid message', email }).email)
      .toBeDefined()
  })
})

describe('validateFeedback — overall', () => {
  it('returns no errors for a fully valid submission', () => {
    const errors = validateFeedback({
      feedbackType: 'feature',
      message: 'It would be great if the calculator remembered my last search.',
      email: 'user@example.com',
    })
    expect(errors).toEqual({})
  })

  it('reports every invalid field at once rather than stopping at the first', () => {
    const errors = validateFeedback({ feedbackType: '', message: '', email: 'nope' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'feedbackType', 'message'])
  })

  it('tolerates a completely empty object without throwing', () => {
    expect(() => validateFeedback({})).not.toThrow()
    expect(Object.keys(validateFeedback({})).length).toBeGreaterThan(0)
  })

  it('tolerates non-string field types without throwing', () => {
    const errors = validateFeedback({
      feedbackType: 42 as never,
      message: {} as never,
      email: [] as never,
    })
    expect(errors.feedbackType).toBeDefined()
    expect(errors.message).toBeDefined()
  })
})
