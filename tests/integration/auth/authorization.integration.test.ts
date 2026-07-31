import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFakeSupabase,
  type CallRecord,
  type FakeSupabase,
  type FakeUser,
  type SupabaseResult,
} from '../helpers/fakeSupabase'
import { buildValidWorkbook, toUploadForm } from '../helpers/workbook'

/**
 * INTEGRATION — authentication, authorization and the admin Server Action.
 *
 * Two chains run for real here, with only the Supabase driver mocked:
 *
 *   session -> profiles lookup -> role check          (src/lib/auth/session.ts)
 *   Server Action -> role check -> upload pipeline    (admin/master-data/actions.ts)
 *
 * The security-critical assertion is the NEGATIVE one: when authorization
 * fails, the pipeline must not run and the database must not be touched at
 * all. A unit test of requireSuperAdmin alone cannot show that, because the
 * short-circuit lives in the caller.
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

// redirect() is only reached by logout(), but the module imports it at load.
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

const { getSessionUser, getProfile, requireSuperAdmin } = await import('@/lib/auth/session')
const { uploadMasterData } = await import('@/app/admin/master-data/actions')

type Role = 'user' | 'admin' | 'super_admin'

interface SignedInAs {
  user?: FakeUser | null
  role?: Role
  /** When true the auth user exists but has no profiles row. */
  profileMissing?: boolean
}

/** Wires the fake session + profiles lookup that session.ts reads. */
function signedInAs({ user = null, role = 'user', profileMissing = false }: SignedInAs) {
  const responder = (call: CallRecord): SupabaseResult => {
    if (call.kind === 'query' && call.table === 'profiles') {
      if (!user || profileMissing) return { data: null, error: null }
      return {
        data: { id: user.id, email: user.email ?? null, full_name: 'Test User', dob: null, role },
        error: null,
      }
    }
    return { data: null, error: null }
  }
  authRef.current = createFakeSupabase({ user, responder })
  return authRef.current
}

function importSucceeds(call: CallRecord): SupabaseResult {
  if (call.kind === 'rpc') return { data: { import_id: 'import-1', count: 1 }, error: null }
  return { data: null, error: null }
}

beforeEach(() => {
  dbRef.current = createFakeSupabase({ responder: importSucceeds })
  signedInAs({ user: null })
})

describe('getSessionUser', () => {
  it('returns null when there is no session', async () => {
    signedInAs({ user: null })
    expect(await getSessionUser()).toBeNull()
  })

  it('returns the authenticated user', async () => {
    signedInAs({ user: { id: 'user-1', email: 'someone@example.com' } })
    const user = await getSessionUser()
    expect(user?.id).toBe('user-1')
  })
})

describe('getProfile', () => {
  it('returns null when signed out and never queries profiles', async () => {
    const auth = signedInAs({ user: null })
    expect(await getProfile()).toBeNull()
    expect(auth.queriesFor('profiles')).toHaveLength(0)
  })

  it('returns the profile row for the signed-in user', async () => {
    signedInAs({ user: { id: 'user-1', email: 'someone@example.com' }, role: 'user' })
    const profile = await getProfile()
    expect(profile).toMatchObject({ id: 'user-1', role: 'user' })
  })

  /**
   * The lookup must be scoped to the caller's own id. If this filter were ever
   * dropped, `.single()` would return an arbitrary profile row and the role
   * check above it would be reading someone else's role.
   */
  it('scopes the profiles lookup to the caller own id', async () => {
    const auth = signedInAs({ user: { id: 'user-42' }, role: 'user' })
    await getProfile()

    const query = auth.queriesFor('profiles')[0]
    expect(query.filters).toEqual([{ column: 'id', value: 'user-42' }])
    expect(query.expectsSingle).toBe(true)
    expect(query.columns).toContain('role')
  })

  it('returns null when the auth user has no profile row', async () => {
    signedInAs({ user: { id: 'ghost' }, profileMissing: true })
    expect(await getProfile()).toBeNull()
  })
})

describe('requireSuperAdmin', () => {
  it('refuses an anonymous caller', async () => {
    signedInAs({ user: null })
    expect(await requireSuperAdmin()).toBeNull()
  })

  it('refuses an ordinary user', async () => {
    signedInAs({ user: { id: 'user-1' }, role: 'user' })
    expect(await requireSuperAdmin()).toBeNull()
  })

  /** 'admin' is deliberately NOT sufficient — only super_admin may import. */
  it('refuses a plain admin', async () => {
    signedInAs({ user: { id: 'user-2' }, role: 'admin' })
    expect(await requireSuperAdmin()).toBeNull()
  })

  it('admits a super_admin and returns their profile', async () => {
    signedInAs({ user: { id: 'boss', email: 'admin@firstnestai.com' }, role: 'super_admin' })
    const profile = await requireSuperAdmin()
    expect(profile).toMatchObject({ id: 'boss', role: 'super_admin' })
  })

  it('refuses a caller whose profile row is missing', async () => {
    signedInAs({ user: { id: 'ghost' }, profileMissing: true })
    expect(await requireSuperAdmin()).toBeNull()
  })
})

describe('uploadMasterData Server Action — permission failures', () => {
  it.each<[string, SignedInAs]>([
    ['anonymous', { user: null }],
    ['ordinary user', { user: { id: 'u1' }, role: 'user' }],
    ['plain admin', { user: { id: 'u2' }, role: 'admin' }],
    ['user without a profile', { user: { id: 'u3' }, profileMissing: true }],
  ])('refuses %s with 403 and imports nothing', async (_label, session) => {
    signedInAs(session)
    const buffer = await buildValidWorkbook()

    const result = await uploadMasterData(toUploadForm(buffer))

    expect(result).toMatchObject({ success: false, httpStatus: 403 })
    expect(result.error).toMatch(/super admin/i)

    // The decisive assertion: no database interaction of ANY kind occurred.
    expect(dbRef.current?.calls).toHaveLength(0)
  })

  it('does not leak scheme data or import ids on refusal', async () => {
    signedInAs({ user: { id: 'u1' }, role: 'user' })
    const result = await uploadMasterData(toUploadForm(await buildValidWorkbook()))

    expect(result.importId).toBeUndefined()
    expect(result.schemesImported).toBeUndefined()
  })
})

describe('uploadMasterData Server Action — authorized path', () => {
  beforeEach(() => {
    signedInAs({ user: { id: 'boss', email: 'admin@firstnestai.com' }, role: 'super_admin' })
  })

  it('runs the full pipeline for a super_admin', async () => {
    const result = await uploadMasterData(toUploadForm(await buildValidWorkbook()))

    expect(result).toMatchObject({
      success: true,
      httpStatus: 200,
      schemesImported: 1,
      importId: 'import-1',
    })
    expect(dbRef.current?.rpcs.map((r) => r.fn)).toContain('import_master_data')
  })

  /** Attribution comes from the verified session, not from client-supplied form data. */
  it('stamps the audit trail with the authenticated admin email', async () => {
    await uploadMasterData(toUploadForm(await buildValidWorkbook()))

    const meta = dbRef.current?.rpcs[0].args?.p_meta as Record<string, unknown>
    expect(meta.uploaded_by).toBe('admin@firstnestai.com')
  })

  it('keeps an explicitly supplied uploader', async () => {
    const form = toUploadForm(await buildValidWorkbook(), { uploadedBy: 'analyst@firstnest.test' })
    await uploadMasterData(form)

    const meta = dbRef.current?.rpcs[0].args?.p_meta as Record<string, unknown>
    expect(meta.uploaded_by).toBe('analyst@firstnest.test')
  })

  it('propagates a validation rejection through the action', async () => {
    const form = new FormData() // no file
    const result = await uploadMasterData(form)

    expect(result).toMatchObject({ success: false, httpStatus: 400 })
    expect(dbRef.current?.rpcs).toHaveLength(0)
  })

  it('propagates a database failure through the action', async () => {
    dbRef.current = createFakeSupabase({
      responder: (call) =>
        call.kind === 'rpc'
          ? { data: null, error: { message: 'rollback' } }
          : { data: null, error: null },
    })

    const result = await uploadMasterData(toUploadForm(await buildValidWorkbook()))
    expect(result).toMatchObject({ success: false, httpStatus: 500 })
  })
})
