import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFakeSupabase,
  type CallRecord,
  type FakeSupabase,
  type SupabaseResult,
} from '../helpers/fakeSupabase'
import { buildWorkbook, buildValidWorkbook, toUploadForm, validRow } from '../helpers/workbook'
import { EXPECTED_HEADERS } from '@/lib/masterData/columns'

/**
 * INTEGRATION — master-data upload pipeline.
 *
 * Exercises the whole chain for real, mocking only the database driver:
 *
 *   FormData -> File -> exceljs parse -> row validation -> import RPC -> HTTP-shaped response
 *              (real)    (real)           (real)            (mocked)      (real)
 *
 * The properties that matter most here are the NEGATIVE ones. A malformed or
 * invalid workbook must never reach the import RPC, because that RPC replaces
 * the entire scheme table. "We rejected the file AND left the database alone"
 * is the assertion, and it cannot be made by unit-testing the validator alone.
 */

// Hoisted so the module factory below can reach it — vi.mock is hoisted above imports.
const supabaseRef = vi.hoisted(() => ({ current: null as FakeSupabase | null }))

vi.mock('@/lib/supabase/server', () => ({
  getAdminClient: () => {
    if (!supabaseRef.current) throw new Error('fake supabase not initialised')
    return supabaseRef.current.client
  },
  getPublicClient: () => {
    if (!supabaseRef.current) throw new Error('fake supabase not initialised')
    return supabaseRef.current.client
  },
  isSupabaseConfigured: () => true,
}))

// Imported after the mock is registered.
const { processMasterDataUpload } = await import('@/lib/masterData/upload')

/** Default: the import RPC succeeds and returns an audit id. */
function importSucceeds(): (call: CallRecord) => SupabaseResult {
  return (call) => {
    if (call.kind === 'rpc' && call.fn === 'import_master_data') {
      return { data: { import_id: 'import-123', count: 2 }, error: null }
    }
    return { data: null, error: null }
  }
}

function setupSupabase(responder = importSucceeds()) {
  supabaseRef.current = createFakeSupabase({ responder })
  return supabaseRef.current
}

let supabase: FakeSupabase

beforeEach(() => {
  supabase = setupSupabase()
})

/** Rows written to the audit table by recordFailedImport. */
function auditRows(db: FakeSupabase) {
  return db.queriesFor('master_data_imports').filter((q) => q.operation === 'insert')
}

function importRpcs(db: FakeSupabase) {
  return db.rpcs.filter((r) => r.fn === 'import_master_data')
}

describe('upload pipeline — successful import', () => {
  it('parses, validates and imports a well-formed workbook', async () => {
    const buffer = await buildValidWorkbook([
      validRow({ scheme_id: 'fhog-nsw' }),
      validRow({
        scheme_id: 'fhbg-fed',
        scheme_name: 'First Home Guarantee',
        official_url: 'https://www.housingaustralia.gov.au/support-buy-home',
      }),
    ])

    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(200)
    expect(outcome.body).toMatchObject({
      success: true,
      schemesImported: 2,
      failed: 0,
      importId: 'import-123',
    })
  })

  it('sends the parsed rows to the transactional import RPC', async () => {
    const buffer = await buildValidWorkbook([validRow({ scheme_id: 'fhog-nsw' })])
    await processMasterDataUpload(toUploadForm(buffer))

    const rpcs = importRpcs(supabase)
    expect(rpcs).toHaveLength(1)

    const schemes = rpcs[0].args?.p_schemes as Array<Record<string, string>>
    expect(schemes).toHaveLength(1)
    expect(schemes[0]).toMatchObject({
      scheme_id: 'fhog-nsw',
      scheme_name: 'First Home Owner Grant (NSW)',
      official_url: 'https://www.revenue.nsw.gov.au/grants-schemes',
    })
    // Every mapped column is present, even when the cell was blank.
    expect(Object.keys(schemes[0]).length).toBe(EXPECTED_HEADERS.length)
  })

  it('carries the upload metadata through to the audit payload', async () => {
    const buffer = await buildValidWorkbook()
    await processMasterDataUpload(
      toUploadForm(buffer, {
        filename: 'schemes-2026.xlsx',
        version: '3.2',
        uploadedBy: 'analyst@firstnest.test',
      }),
    )

    expect(importRpcs(supabase)[0].args?.p_meta).toMatchObject({
      version: '3.2',
      filename: 'schemes-2026.xlsx',
      uploaded_by: 'analyst@firstnest.test',
      total_schemes: 1,
    })
  })

  it('defaults version and uploader when the form omits them', async () => {
    const buffer = await buildValidWorkbook()
    await processMasterDataUpload(toUploadForm(buffer))

    expect(importRpcs(supabase)[0].args?.p_meta).toMatchObject({
      version: '1.0',
      uploaded_by: 'business-analyst',
      filename: 'government_schemes.xlsx',
    })
  })

  it('writes the measured duration back onto the audit row', async () => {
    const buffer = await buildValidWorkbook()
    await processMasterDataUpload(toUploadForm(buffer))

    const updates = supabase
      .queriesFor('master_data_imports')
      .filter((q) => q.operation === 'update')
    expect(updates).toHaveLength(1)
    expect(updates[0].filters).toEqual([{ column: 'id', value: 'import-123' }])
    expect(updates[0].payload).toMatchObject({ duration_ms: expect.any(Number) })
  })

  it('skips fully blank spreadsheet rows', async () => {
    const buffer = await buildWorkbook({ rows: [validRow(), {}, {}] })
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(200)
    expect((importRpcs(supabase)[0].args?.p_schemes as unknown[]).length).toBe(1)
  })
})

describe('upload pipeline — request-level rejection', () => {
  it('rejects a submission with no file and never touches the database', async () => {
    const outcome = await processMasterDataUpload(new FormData())

    expect(outcome.status).toBe(400)
    expect(outcome.body).toMatchObject({ success: false })
    expect(supabase.calls).toHaveLength(0)
  })
})

describe('upload pipeline — structural rejection leaves data untouched', () => {
  it('rejects a workbook whose required worksheet is missing', async () => {
    const buffer = await buildWorkbook({ sheetName: 'Sheet1', rows: [validRow()] })
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
    expect(importRpcs(supabase)).toHaveLength(0)

    const errors = outcome.body.errors as Array<{ message: string }>
    expect(errors[0].message).toMatch(/worksheet "Schemes" not found/i)
    expect(errors[0].message).toMatch(/Sheet1/)
  })

  it('rejects a workbook with missing columns', async () => {
    const buffer = await buildWorkbook({
      headers: EXPECTED_HEADERS.slice(0, 10),
      rows: [validRow()],
    })
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
    expect(importRpcs(supabase)).toHaveLength(0)
    expect(JSON.stringify(outcome.body.errors)).toMatch(/Missing required column/i)
  })

  it('rejects a file that is not a readable workbook', async () => {
    const outcome = await processMasterDataUpload(
      toUploadForm(Buffer.from('this is not a spreadsheet')),
    )

    expect(outcome.status).toBe(422)
    expect(importRpcs(supabase)).toHaveLength(0)
  })

  it('audits every structural rejection without importing', async () => {
    const buffer = await buildWorkbook({ sheetName: 'Wrong', rows: [validRow()] })
    await processMasterDataUpload(toUploadForm(buffer, { version: '9.9' }))

    const audits = auditRows(supabase)
    expect(audits).toHaveLength(1)
    expect(audits[0].payload).toMatchObject({
      status: 'failed',
      total_schemes: 0,
      version: '9.9',
    })
    expect(importRpcs(supabase)).toHaveLength(0)
  })
})

describe('upload pipeline — validation rejection leaves data untouched', () => {
  it('rejects duplicate scheme IDs and reports the first occurrence', async () => {
    const buffer = await buildValidWorkbook([
      validRow({ scheme_id: 'dup', official_url: 'https://example.gov.au/a' }),
      validRow({ scheme_id: 'dup', official_url: 'https://example.gov.au/b' }),
    ])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
    expect(importRpcs(supabase)).toHaveLength(0)

    // Asserted on the structured errors rather than a JSON string, which would
    // escape the quotes around the duplicated id.
    const errors = outcome.body.errors as Array<{ row: number; field?: string; message: string }>
    const duplicate = errors.find((e) => e.field === 'Scheme ID' && /Duplicate/.test(e.message))
    expect(duplicate).toBeDefined()
    expect(duplicate?.row).toBe(3)
    expect(duplicate?.message).toContain('dup')
    expect(duplicate?.message).toContain('first seen at row 2')
  })

  it('rejects a missing scheme name', async () => {
    const buffer = await buildValidWorkbook([validRow({ scheme_name: '' })])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
    expect(JSON.stringify(outcome.body.errors)).toMatch(/Scheme Name is required/)
    expect(importRpcs(supabase)).toHaveLength(0)
  })

  it('rejects an invalid official URL', async () => {
    const buffer = await buildValidWorkbook([validRow({ official_url: 'not-a-url' })])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
    expect(JSON.stringify(outcome.body.errors)).toMatch(/Invalid URL/)
    expect(importRpcs(supabase)).toHaveLength(0)
  })

  it('rejects a non-numeric priority', async () => {
    const buffer = await buildValidWorkbook([validRow({ priority_ranking: 'high' })])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
    expect(JSON.stringify(outcome.body.errors)).toMatch(/must be a number/)
  })

  it('reports every invalid row at once rather than stopping at the first', async () => {
    const buffer = await buildValidWorkbook([
      validRow({ scheme_id: '', official_url: 'https://example.gov.au/a' }),
      validRow({ scheme_name: '', official_url: 'nope' }),
    ])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    const errors = outcome.body.errors as Array<{ row: number }>
    expect(errors.length).toBeGreaterThanOrEqual(3)
    // Row numbers account for the header row.
    expect(errors.map((e) => e.row)).toContain(2)
    expect(errors.map((e) => e.row)).toContain(3)
  })

  it('audits a validation rejection', async () => {
    const buffer = await buildValidWorkbook([validRow({ scheme_id: '' })])
    await processMasterDataUpload(toUploadForm(buffer))

    expect(auditRows(supabase)).toHaveLength(1)
    expect(importRpcs(supabase)).toHaveLength(0)
  })
})

describe('upload pipeline — database failure handling', () => {
  it('reports a rolled-back import as a server error, not a partial success', async () => {
    setupSupabase((call) => {
      if (call.kind === 'rpc') return { data: null, error: { message: 'deadlock detected' } }
      return { data: null, error: null }
    })

    const buffer = await buildValidWorkbook()
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(500)
    expect(outcome.body.success).toBe(false)
    expect(JSON.stringify(outcome.body.errors)).toMatch(/rolled back/i)
    expect(JSON.stringify(outcome.body.errors)).toMatch(/deadlock detected/)
  })

  it('audits the failure when the import RPC errors', async () => {
    supabase = setupSupabase((call) => {
      if (call.kind === 'rpc') return { data: null, error: { message: 'constraint violation' } }
      return { data: null, error: null }
    })

    const buffer = await buildValidWorkbook()
    await processMasterDataUpload(toUploadForm(buffer))

    const audits = auditRows(supabase)
    expect(audits).toHaveLength(1)
    expect(JSON.stringify(audits[0].payload)).toMatch(/constraint violation/)
  })

  it('surfaces an unexpected driver exception as a 500', async () => {
    setupSupabase((call) => {
      if (call.kind === 'rpc') throw new Error('socket hang up')
      return { data: null, error: null }
    })

    const buffer = await buildValidWorkbook()
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(500)
    expect(outcome.body).toMatchObject({ success: false, error: 'socket hang up' })
  })

  it('still returns the correct outcome when audit logging itself fails', async () => {
    // recordFailedImport swallows its own errors by design — a broken audit
    // trail must not convert a 422 into a 500.
    setupSupabase((call) => {
      if (call.kind === 'query' && call.operation === 'insert') {
        throw new Error('audit table unavailable')
      }
      return { data: null, error: null }
    })

    const buffer = await buildValidWorkbook([validRow({ scheme_id: '' })])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(422)
  })

  it('treats a successful RPC with no import id as a success', async () => {
    supabase = setupSupabase((call) => {
      if (call.kind === 'rpc') return { data: {}, error: null }
      return { data: null, error: null }
    })

    // Distinct name AND url: the validator treats a repeated url+name pair as a
    // duplicate row, so varying only the id would fail validation instead.
    const buffer = await buildValidWorkbook([
      validRow(),
      validRow({
        scheme_id: 'second',
        scheme_name: 'Second Scheme',
        official_url: 'https://example.gov.au/second',
      }),
    ])
    const outcome = await processMasterDataUpload(toUploadForm(buffer))

    expect(outcome.status).toBe(200)
    // Falls back to the submitted row count when the RPC omits one.
    expect(outcome.body.schemesImported).toBe(2)
    // No id means no duration update to write.
    expect(
      supabase.queriesFor('master_data_imports').filter((q) => q.operation === 'update'),
    ).toHaveLength(0)
  })
})
