import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFakeSupabase,
  type CallRecord,
  type FakeSupabase,
  type FakeUser,
  type SupabaseResult,
} from '../integration/helpers/fakeSupabase'
import { asNextRequest, jsonRequest, malformedJsonRequest, readJson, uniqueIp } from './helpers/request'

/**
 * API — POST /api/feedback
 *
 * The most security-sensitive public endpoint: unauthenticated, writes to the
 * database, and attributes rows to user accounts. The assertions that matter
 * most are about what the handler REFUSES to take from the caller — identity
 * comes from the server-side session, never from the request body.
 */

const authRef = vi.hoisted(() => ({ current: null as FakeSupabase | null }))
const configuredRef = vi.hoisted(() => ({ current: true }))

vi.mock('@/lib/supabase/serverAuth', () => ({
  getServerAuthClient: () => {
    if (!authRef.current) throw new Error('fake auth client not initialised')
    return Promise.resolve(authRef.current.client)
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  isSupabaseConfigured: () => configuredRef.current,
  getPublicClient: () => {
    throw new Error('feedback must not use the public client')
  },
  getAdminClient: () => {
    throw new Error('feedback must never use the service-role client')
  },
}))

const { POST } = await import('@/app/api/feedback/route')

interface SessionSpec {
  user?: FakeUser | null
  fullName?: string | null
  /** Force the feedback insert to fail. */
  insertError?: string
}

function session({ user = null, fullName = null, insertError }: SessionSpec = {}) {
  const responder = (call: CallRecord): SupabaseResult => {
    if (call.kind !== 'query') return { data: null, error: null }
    if (call.table === 'profiles') return { data: { full_name: fullName }, error: null }
    if (call.table === 'feedback' && insertError) {
      return { data: null, error: { message: insertError } }
    }
    return { data: null, error: null }
  }
  authRef.current = createFakeSupabase({ user, responder })
  return authRef.current
}

/** A submission that passes validation; override per test. */
function validBody(overrides: Record<string, unknown> = {}) {
  return {
    feedbackType: 'bug',
    message: 'The grant calculator shows the wrong stamp duty for VIC.',
    email: 'user@example.com',
    pageUrl: 'https://firstnest.test/grant-calculator',
    screenResolution: '1920x1080',
    theme: 'dark',
    ...overrides,
  }
}

function post(body: unknown, init: { ip?: string; userAgent?: string } = {}) {
  return POST(
    asNextRequest(
      jsonRequest('/api/feedback', body, {
        ip: init.ip ?? uniqueIp(),
        userAgent: init.userAgent ?? 'Mozilla/5.0 (TestRunner)',
      }),
    ),
  )
}

/** The row the handler tried to insert into `feedback`. */
function insertedRow(db: FakeSupabase): Record<string, unknown> | undefined {
  const insert = db.queriesFor('feedback').find((q) => q.operation === 'insert')
  return insert?.payload as Record<string, unknown> | undefined
}

beforeEach(() => {
  configuredRef.current = true
  session()
})

describe('POST /api/feedback — success', () => {
  it('accepts an anonymous submission with 201', async () => {
    const { status, body } = await readJson<{ ok: boolean }>(await post(validBody()))

    expect(status).toBe(201)
    expect(body).toEqual({ ok: true })
  })

  it('writes the submission to the feedback table', async () => {
    const db = session()
    await post(validBody())

    expect(insertedRow(db)).toMatchObject({
      feedback_type: 'bug',
      message: 'The grant calculator shows the wrong stamp duty for VIC.',
      email: 'user@example.com',
      page_url: 'https://firstnest.test/grant-calculator',
      screen_resolution: '1920x1080',
      theme: 'dark',
    })
  })

  it('stores a blank optional email as null rather than an empty string', async () => {
    const db = session()
    await post(validBody({ email: '   ' }))
    expect(insertedRow(db)?.email).toBeNull()
  })

  it('accepts a submission with no email at all', async () => {
    const { status } = await readJson(await post(validBody({ email: undefined })))
    expect(status).toBe(201)
  })

  it.each(['bug', 'ui', 'feature', 'other'])('accepts feedback type %s', async (feedbackType) => {
    const { status } = await readJson(await post(validBody({ feedbackType })))
    expect(status).toBe(201)
  })

  it('never uses the service-role client', async () => {
    // The mocked getAdminClient throws; reaching 201 proves it was not called.
    const { status } = await readJson(await post(validBody()))
    expect(status).toBe(201)
  })
})

describe('POST /api/feedback — identity is server-derived', () => {
  it('records an anonymous submission with a null user id', async () => {
    const db = session({ user: null })
    await post(validBody())

    expect(insertedRow(db)).toMatchObject({
      user_id: null,
      user_name: null,
      user_email: null,
    })
  })

  /**
   * The decisive authorization test for this endpoint. A caller supplying
   * user_id / user_email in the body must not be able to forge attribution.
   */
  it('ignores identity fields supplied in the request body', async () => {
    const db = session({ user: null })

    await post(
      validBody({
        user_id: '00000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000001',
        user_email: 'victim@example.com',
        user_name: 'Someone Else',
      }),
    )

    const row = insertedRow(db)
    expect(row?.user_id).toBeNull()
    expect(row?.user_email).toBeNull()
    expect(row?.user_name).toBeNull()
  })

  it('attributes a signed-in submission from the session, not the body', async () => {
    const db = session({
      user: { id: 'user-77', email: 'real@example.com' },
      fullName: 'Real User',
    })

    await post(validBody({ user_email: 'spoofed@example.com' }))

    expect(insertedRow(db)).toMatchObject({
      user_id: 'user-77',
      user_email: 'real@example.com',
      user_name: 'Real User',
    })
  })

  it('handles a signed-in user with no profile row', async () => {
    const db = session({ user: { id: 'user-88', email: 'nameless@example.com' }, fullName: null })
    await post(validBody())

    expect(insertedRow(db)).toMatchObject({ user_id: 'user-88', user_name: null })
  })

  it('looks the profile up by the session user id', async () => {
    const db = session({ user: { id: 'user-99', email: 'a@b.test' } })
    await post(validBody())

    expect(db.queriesFor('profiles')[0].filters).toEqual([{ column: 'id', value: 'user-99' }])
  })
})

describe('POST /api/feedback — request metadata', () => {
  it('prefers the User-Agent header over any body-supplied value', async () => {
    const db = session()
    await post(validBody({ userAgent: 'Body-Supplied/1.0' }), { userAgent: 'Header-Agent/2.0' })

    expect(insertedRow(db)?.user_agent).toBe('Header-Agent/2.0')
  })

  it('flattens newlines out of captured metadata', async () => {
    const db = session()
    await post(validBody({ pageUrl: 'https://firstnest.test/a\nInjected: header' }))

    expect(String(insertedRow(db)?.page_url)).not.toContain('\n')
  })

  it.each(['light', 'dark'])('stores the %s theme', async (theme) => {
    const db = session()
    await post(validBody({ theme }))
    expect(insertedRow(db)?.theme).toBe(theme)
  })

  it('stores an unrecognised theme as null rather than passing it through', async () => {
    const db = session()
    await post(validBody({ theme: 'solarized' }))
    expect(insertedRow(db)?.theme).toBeNull()
  })

  it('caps oversized metadata instead of storing it whole', async () => {
    const db = session()
    await post(validBody({ screenResolution: 'x'.repeat(5000) }))

    expect(String(insertedRow(db)?.screen_resolution).length).toBeLessThanOrEqual(500)
  })
})

describe('POST /api/feedback — validation failures', () => {
  it('rejects a missing feedback type with 400 and a field error', async () => {
    const { status, body } = await readJson<{
      ok: boolean
      error: string
      fieldErrors?: Record<string, string>
    }>(await post(validBody({ feedbackType: undefined })))

    expect(status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.fieldErrors?.feedbackType).toBeDefined()
  })

  it('rejects an unknown feedback type', async () => {
    const { status } = await readJson(await post(validBody({ feedbackType: 'spam' })))
    expect(status).toBe(400)
  })

  it('rejects a missing message', async () => {
    const { status, body } = await readJson<{ fieldErrors?: Record<string, string> }>(
      await post(validBody({ message: '' })),
    )
    expect(status).toBe(400)
    expect(body.fieldErrors?.message).toBeDefined()
  })

  it('rejects a message beyond 1000 characters', async () => {
    const { status } = await readJson(await post(validBody({ message: 'x'.repeat(1001) })))
    expect(status).toBe(400)
  })

  it('rejects an invalid email when one is supplied', async () => {
    const { status, body } = await readJson<{ fieldErrors?: Record<string, string> }>(
      await post(validBody({ email: 'not-an-email' })),
    )
    expect(status).toBe(400)
    expect(body.fieldErrors?.email).toBeDefined()
  })

  it('reports every invalid field at once', async () => {
    const { body } = await readJson<{ fieldErrors?: Record<string, string> }>(
      await post({ feedbackType: '', message: '', email: 'bad' }),
    )
    expect(Object.keys(body.fieldErrors ?? {}).sort()).toEqual([
      'email',
      'feedbackType',
      'message',
    ])
  })

  it('writes nothing to the database when validation fails', async () => {
    const db = session()
    await post(validBody({ message: '' }))
    expect(db.queriesFor('feedback')).toHaveLength(0)
  })

  it('rejects a malformed JSON body with 400', async () => {
    const response = await POST(
      asNextRequest(malformedJsonRequest('/api/feedback', '{"feedbackType":', { ip: uniqueIp() })),
    )
    const { status, body } = await readJson<{ error: string }>(response)

    expect(status).toBe(400)
    expect(body.error).toMatch(/invalid request body/i)
  })

  it('rejects an empty body', async () => {
    const { status } = await readJson(await post({}))
    expect(status).toBe(400)
  })
})

describe('POST /api/feedback — spam controls', () => {
  /**
   * The honeypot field is invisible to real users. A bot that fills every input
   * trips it, and the handler reports success while writing nothing — so the
   * bot gets no signal that it was detected.
   */
  it('silently discards a honeypot submission but reports success', async () => {
    const db = session()
    const { status, body } = await readJson<{ ok: boolean }>(
      await post(validBody({ website: 'http://spam.example' })),
    )

    expect(status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(db.queriesFor('feedback')).toHaveLength(0)
  })

  it('ignores an empty honeypot field', async () => {
    const { status } = await readJson(await post(validBody({ website: '' })))
    expect(status).toBe(201)
  })

  it('rate limits a client after five submissions in the window', async () => {
    session()
    const ip = '198.51.100.7'

    for (let i = 0; i < 5; i++) {
      const { status } = await readJson(await post(validBody(), { ip }))
      expect(status, `submission ${i + 1} should succeed`).toBe(201)
    }

    const { status, body } = await readJson<{ error: string }>(await post(validBody(), { ip }))
    expect(status).toBe(429)
    expect(body.error).toMatch(/try again/i)
  })

  it('rate limits per client, not globally', async () => {
    session()
    const busy = '198.51.100.8'
    for (let i = 0; i < 6; i++) await post(validBody(), { ip: busy })

    // A different client is unaffected.
    const { status } = await readJson(await post(validBody(), { ip: '198.51.100.9' }))
    expect(status).toBe(201)
  })

  it('does not spend rate-limit budget on requests that fail validation', async () => {
    session()
    const ip = '198.51.100.10'

    for (let i = 0; i < 8; i++) {
      const { status } = await readJson(await post(validBody({ message: '' }), { ip }))
      expect(status).toBe(400)
    }

    // Budget untouched, so a valid submission still succeeds.
    const { status } = await readJson(await post(validBody(), { ip }))
    expect(status).toBe(201)
  })
})

describe('POST /api/feedback — error handling', () => {
  it('returns 503 when Supabase is not configured', async () => {
    configuredRef.current = false

    const { status, body } = await readJson<{ ok: boolean; error: string }>(await post(validBody()))

    expect(status).toBe(503)
    expect(body.ok).toBe(false)
    expect(body.error).toMatch(/temporarily unavailable/i)
  })

  it('returns 500 when the insert fails', async () => {
    session({ insertError: 'duplicate key value violates unique constraint' })

    const { status, body } = await readJson<{ ok: boolean; error: string }>(await post(validBody()))

    expect(status).toBe(500)
    expect(body.ok).toBe(false)
  })

  /** An internal database message must not reach the client. */
  it('does not leak the database error message to the caller', async () => {
    session({ insertError: 'relation "feedback" does not exist' })
    const { body } = await readJson<{ error: string }>(await post(validBody()))

    expect(body.error).not.toMatch(/relation/i)
    expect(body.error).toMatch(/could not save|went wrong/i)
  })

  it('returns 500 when the auth client throws unexpectedly', async () => {
    authRef.current = createFakeSupabase({
      responder: () => {
        throw new Error('socket hang up')
      },
    })

    const { status, body } = await readJson<{ ok: boolean }>(await post(validBody()))

    expect(status).toBe(500)
    expect(body.ok).toBe(false)
  })
})
