import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { jsonRequest, malformedJsonRequest, readJson } from './helpers/request'

/**
 * API — POST /api/contact
 *
 * The only endpoint with a third-party side effect (SMTP). nodemailer is mocked
 * because it is an external service, per the "mock only external services"
 * rule; everything else — validation, transport configuration, the mock-send
 * fallback — runs for real.
 */

const sendMail = vi.hoisted(() => vi.fn())
const createTransport = vi.hoisted(() => vi.fn())

vi.mock('nodemailer', () => ({
  default: {
    createTransport: (...args: unknown[]) => {
      createTransport(...args)
      return { sendMail }
    },
  },
}))

const { POST } = await import('@/app/api/contact/route')

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    reason: 'I would like help understanding the First Home Guarantee.',
    ...overrides,
  }
}

const post = (body: unknown) => POST(jsonRequest('/api/contact', body))

/** SMTP settings are read from the environment at request time. */
const originalEnv = { ...process.env }

beforeEach(() => {
  sendMail.mockReset().mockResolvedValue({ messageId: 'test-message-id' })
  createTransport.mockReset()
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASS
})

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('POST /api/contact — success', () => {
  it('accepts a valid submission with 200', async () => {
    const { status, body } = await readJson<{ success: boolean }>(await post(validBody()))

    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
  })

  /**
   * Without SMTP credentials the route logs instead of sending, so local
   * development works without a mail account. Verify it really does not send.
   */
  it('does not attempt delivery when SMTP is not configured', async () => {
    await post(validBody())
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('sends the message once SMTP credentials are present', async () => {
    process.env.SMTP_USER = 'smtp-user'
    process.env.SMTP_PASS = 'smtp-pass'

    const { status } = await readJson(await post(validBody()))

    expect(status).toBe(200)
    expect(sendMail).toHaveBeenCalledTimes(1)
  })

  it('addresses the message to support and carries the submitted details', async () => {
    process.env.SMTP_USER = 'smtp-user'
    await post(validBody())

    const mail = sendMail.mock.calls[0][0] as { to: string; subject: string; text: string }
    expect(mail.to).toContain('support@')
    expect(mail.subject).toMatch(/contact/i)
    expect(mail.text).toContain('Sarah Chen')
    expect(mail.text).toContain('sarah@example.com')
    expect(mail.text).toContain('First Home Guarantee')
  })

  it('honours the configured SMTP host and port', async () => {
    process.env.SMTP_USER = 'smtp-user'
    process.env.SMTP_HOST = 'smtp.mailtrap.test'
    process.env.SMTP_PORT = '2525'
    process.env.SMTP_SECURE = 'false'

    await post(validBody())

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.mailtrap.test', port: 2525, secure: false }),
    )
  })

  it('treats SMTP_SECURE=true as an implicit-TLS connection', async () => {
    process.env.SMTP_USER = 'smtp-user'
    process.env.SMTP_SECURE = 'true'

    await post(validBody())

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: true }))
  })
})

describe('POST /api/contact — validation failures', () => {
  it.each([
    ['missing name', { name: undefined }],
    ['empty name', { name: '' }],
    ['non-string name', { name: 42 }],
  ])('rejects a %s with 400', async (_label, overrides) => {
    const { status, body } = await readJson<{ error: string }>(await post(validBody(overrides)))

    expect(status).toBe(400)
    expect(body.error).toMatch(/name/i)
  })

  it.each([
    ['missing email', { email: undefined }],
    ['malformed email', { email: 'not-an-email' }],
    ['email without a domain', { email: 'someone@' }],
    ['email with spaces', { email: 'a b@example.com' }],
    ['non-string email', { email: 123 }],
  ])('rejects %s with 400', async (_label, overrides) => {
    const { status, body } = await readJson<{ error: string }>(await post(validBody(overrides)))

    expect(status).toBe(400)
    expect(body.error).toMatch(/email/i)
  })

  it.each([
    ['missing reason', { reason: undefined }],
    ['empty reason', { reason: '' }],
    ['non-string reason', { reason: [] }],
  ])('rejects a %s with 400', async (_label, overrides) => {
    const { status, body } = await readJson<{ error: string }>(await post(validBody(overrides)))

    expect(status).toBe(400)
    expect(body.error).toMatch(/reason/i)
  })

  it('never sends mail when validation fails', async () => {
    process.env.SMTP_USER = 'smtp-user'
    await post(validBody({ email: 'bad' }))
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('rejects an entirely empty body', async () => {
    const { status } = await readJson(await post({}))
    expect(status).toBe(400)
  })
})

describe('POST /api/contact — error handling', () => {
  it('returns 500 when the mail transport fails', async () => {
    process.env.SMTP_USER = 'smtp-user'
    sendMail.mockRejectedValueOnce(new Error('535 authentication failed'))

    const { status, body } = await readJson<{ error: string }>(await post(validBody()))

    expect(status).toBe(500)
    expect(body.error).toBe('Failed to send message')
  })

  /** SMTP internals must not reach the caller. */
  it('does not leak the transport error to the client', async () => {
    process.env.SMTP_USER = 'smtp-user'
    sendMail.mockRejectedValueOnce(new Error('535 authentication failed for user admin@internal'))

    const { body } = await readJson<{ error: string }>(await post(validBody()))

    expect(body.error).not.toMatch(/535|admin@internal/)
  })

  /**
   * EDGE CASE — a malformed body throws inside the same try block as delivery,
   * so it surfaces as 500 rather than 400. Documented as current behaviour;
   * see "Remaining API gaps" in the Phase 4 report.
   */
  it('returns 500 (not 400) for a malformed JSON body', async () => {
    const { status } = await readJson(await POST(malformedJsonRequest('/api/contact')))
    expect(status).toBe(500)
  })
})

describe('POST /api/contact — known gaps', () => {
  /**
   * The handler interpolates `name`, `email` and `reason` directly into an HTML
   * email body with no escaping, so a submission containing markup is delivered
   * as live HTML to the support inbox.
   *
   * Left as a todo rather than a passing test on purpose: asserting the current
   * behaviour would lock the flaw in and turn the eventual fix into a failing
   * test. Raised in the Phase 4 report instead.
   */
  it.todo('should HTML-escape submitted values before embedding them in the email body')
})
