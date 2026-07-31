import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFakeSupabase,
  type CallRecord,
  type FakeSupabase,
  type FakeUser,
  type SupabaseResult,
} from '../integration/helpers/fakeSupabase'
import { buildValidWorkbook, toUploadForm, validRow } from '../integration/helpers/workbook'
import { formRequest, jsonRequest, readJson } from './helpers/request'

/**
 * API — POST /api/admin/master-data/upload
 *
 * The only privileged endpoint in the application. It replaces the ENTIRE
 * scheme table, so the tests below care most about the two ways that can go
 * wrong: an unauthorised caller reaching the pipeline at all, and a bad
 * workbook reaching the database.
 *
 * Phase 3 covered the same pipeline through the Server Action. This suite is
 * the HTTP contract: status codes, response bodies, and multipart handling.
 */

const authRef = vi.hoisted(() => ({ current: null as FakeSupabase | null }))
const dbRef = vi.hoisted(() => ({ current: null as FakeSupabase | null }))

vi.mock('@/lib/supabase/serverAuth', () => ({
  getServerAuthClient: () => {
    if (!authRef.current) throw new Error('fake auth client not initialised')
    return Promise.resolve(authRef.current.client)
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  getAdminClient: () => {
    if (!dbRef.current) throw new Error('fake db client not initialised')
    return dbRef.current.client
  },
  getPublicClient: () => {
    if (!dbRef.current) throw new Error('fake db client not initialised')
    return dbRef.current.client
  },
  isSupabaseConfigured: () => true,
}))

const { POST } = await import('@/app/api/admin/master-data/upload/route')

type Role = 'user' | 'admin' | 'super_admin'

function signedInAs(user: FakeUser | null, role: Role = 'user', profileMissing = false) {
  const responder = (call: CallRecord): SupabaseResult => {
    if (call.kind === 'query' && call.table === 'profiles') {
      if (!user || profileMissing) return { data: null, error: null }
      return { data: { id: user.id, email: user.email ?? null, full_name: 'Admin', dob: null, role }, error: null }
    }
    return { data: null, error: null }
  }
  authRef.current = createFakeSupabase({ user, responder })
  return authRef.current
}

function importSucceeds(call: CallRecord): SupabaseResult {
  if (call.kind === 'rpc') return { data: { import_id: 'import-42', count: 1 }, error: null }
  return { data: null, error: null }
}

const upload = (form: FormData) => POST(formRequest('/api/admin/master-data/upload', form))

beforeEach(() => {
  dbRef.current = createFakeSupabase({ responder: importSucceeds })
  signedInAs(null)
})

describe('POST /api/admin/master-data/upload — authorization', () => {
  it.each<[string, FakeUser | null, Role, boolean]>([
    ['an anonymous caller', null, 'user', false],
    ['an ordinary user', { id: 'u1', email: 'user@example.com' }, 'user', false],
    ['a plain admin', { id: 'u2', email: 'admin@example.com' }, 'admin', false],
    ['a user with no profile row', { id: 'u3' }, 'user', true],
  ])('refuses %s with 403', async (_label, user, role, profileMissing) => {
    signedInAs(user, role, profileMissing)
    const form = toUploadForm(await buildValidWorkbook())

    const { status, body } = await readJson<{ success: boolean; error: string }>(await upload(form))

    expect(status).toBe(403)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/super admin/i)
  })

  /** The decisive assertion: refusal happens before ANY database interaction. */
  it('performs no database work for an unauthorised caller', async () => {
    signedInAs({ id: 'u1' }, 'user')
    await upload(toUploadForm(await buildValidWorkbook()))

    expect(dbRef.current?.calls).toHaveLength(0)
  })

  it('does not reveal import details on refusal', async () => {
    signedInAs({ id: 'u1' }, 'user')
    const { body } = await readJson<Record<string, unknown>>(
      await upload(toUploadForm(await buildValidWorkbook())),
    )

    expect(body.importId).toBeUndefined()
    expect(body.schemesImported).toBeUndefined()
  })
})

describe('POST /api/admin/master-data/upload — authorized success', () => {
  beforeEach(() => {
    signedInAs({ id: 'boss', email: 'admin@firstnestai.com' }, 'super_admin')
  })

  it('imports a valid workbook and returns 200', async () => {
    const { status, body } = await readJson<{
      success: boolean
      schemesImported: number
      importId: string
    }>(await upload(toUploadForm(await buildValidWorkbook())))

    expect(status).toBe(200)
    expect(body).toMatchObject({ success: true, schemesImported: 1, importId: 'import-42' })
  })

  it('reports the import duration', async () => {
    const { body } = await readJson<{ durationMs: number }>(
      await upload(toUploadForm(await buildValidWorkbook())),
    )
    expect(body.durationMs).toBeTypeOf('number')
  })

  it('attributes the import to the authenticated admin when the form omits an uploader', async () => {
    await upload(toUploadForm(await buildValidWorkbook()))

    const meta = dbRef.current?.rpcs[0].args?.p_meta as Record<string, unknown>
    expect(meta.uploaded_by).toBe('admin@firstnestai.com')
  })

  it('keeps an explicitly supplied uploader', async () => {
    await upload(toUploadForm(await buildValidWorkbook(), { uploadedBy: 'analyst@firstnest.test' }))

    const meta = dbRef.current?.rpcs[0].args?.p_meta as Record<string, unknown>
    expect(meta.uploaded_by).toBe('analyst@firstnest.test')
  })

  /** A super_admin whose profile carries no email still gets an audit trail. */
  it('falls back to a generic uploader when the admin has no email', async () => {
    signedInAs({ id: 'boss' }, 'super_admin')
    await upload(toUploadForm(await buildValidWorkbook()))

    const meta = dbRef.current?.rpcs[0].args?.p_meta as Record<string, unknown>
    expect(meta.uploaded_by).toBe('super-admin')
  })

  it('imports every row in a multi-row workbook', async () => {
    const workbook = await buildValidWorkbook([
      validRow({ scheme_id: 'a' }),
      validRow({
        scheme_id: 'b',
        scheme_name: 'Second Scheme',
        official_url: 'https://example.gov.au/second',
      }),
    ])
    await upload(toUploadForm(workbook))

    expect((dbRef.current?.rpcs[0].args?.p_schemes as unknown[]).length).toBe(2)
  })
})

describe('POST /api/admin/master-data/upload — request and payload failures', () => {
  beforeEach(() => {
    signedInAs({ id: 'boss', email: 'admin@firstnestai.com' }, 'super_admin')
  })

  it('returns 400 when no file is attached', async () => {
    const { status, body } = await readJson<{ success: boolean; error: string }>(
      await upload(new FormData()),
    )

    expect(status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/no file/i)
  })

  it('returns 400 when the body is not multipart form data', async () => {
    const { status, body } = await readJson<{ error: string }>(
      await POST(jsonRequest('/api/admin/master-data/upload', { file: 'nope' })),
    )

    expect(status).toBe(400)
    expect(body.error).toMatch(/multipart\/form-data/i)
  })

  it('returns 422 for a workbook missing the required worksheet', async () => {
    const { buildWorkbook } = await import('../integration/helpers/workbook')
    const workbook = await buildWorkbook({ sheetName: 'WrongSheet', rows: [validRow()] })

    const { status, body } = await readJson<{ success: boolean; errors: unknown[] }>(
      await upload(toUploadForm(workbook)),
    )

    expect(status).toBe(422)
    expect(body.success).toBe(false)
    expect(body.errors.length).toBeGreaterThan(0)
  })

  it('returns 422 for rows that fail validation', async () => {
    const workbook = await buildValidWorkbook([validRow({ official_url: 'not-a-url' })])

    const { status, body } = await readJson<{ errors: Array<{ message: string }> }>(
      await upload(toUploadForm(workbook)),
    )

    expect(status).toBe(422)
    expect(JSON.stringify(body.errors)).toMatch(/Invalid URL/)
  })

  it('never reaches the import RPC when the workbook is rejected', async () => {
    await upload(toUploadForm(await buildValidWorkbook([validRow({ scheme_id: '' })])))

    expect(dbRef.current?.rpcs.filter((r) => r.fn === 'import_master_data')).toHaveLength(0)
  })

  it('returns 422 for a file that is not a spreadsheet', async () => {
    const { status } = await readJson(
      await upload(toUploadForm(Buffer.from('plain text, not xlsx'))),
    )
    expect(status).toBe(422)
  })
})

describe('POST /api/admin/master-data/upload — database failures', () => {
  beforeEach(() => {
    signedInAs({ id: 'boss', email: 'admin@firstnestai.com' }, 'super_admin')
  })

  it('returns 500 when the transactional import rolls back', async () => {
    dbRef.current = createFakeSupabase({
      responder: (call) =>
        call.kind === 'rpc'
          ? { data: null, error: { message: 'deadlock detected' } }
          : { data: null, error: null },
    })

    const { status, body } = await readJson<{ success: boolean; errors: unknown[] }>(
      await upload(toUploadForm(await buildValidWorkbook())),
    )

    expect(status).toBe(500)
    expect(body.success).toBe(false)
    expect(JSON.stringify(body.errors)).toMatch(/rolled back/i)
  })

  it('returns 500 when the driver throws', async () => {
    dbRef.current = createFakeSupabase({
      responder: (call) => {
        if (call.kind === 'rpc') throw new Error('socket hang up')
        return { data: null, error: null }
      },
    })

    const { status, body } = await readJson<{ success: boolean }>(
      await upload(toUploadForm(await buildValidWorkbook())),
    )

    expect(status).toBe(500)
    expect(body.success).toBe(false)
  })
})
