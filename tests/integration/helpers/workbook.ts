/**
 * Builds real .xlsx buffers in memory with the same library the application
 * parses with (exceljs), so the parser under test does genuine Excel work
 * rather than reading a hand-rolled stub.
 *
 * Committed binary fixtures were rejected deliberately: they are opaque in code
 * review and cannot be varied per test case, which is exactly what the parser's
 * structural failure paths need.
 */
import ExcelJS from 'exceljs'
import { COLUMN_MAP, DATA_WORKSHEET, EXPECTED_HEADERS } from '@/lib/masterData/columns'

/** A scheme row keyed by DB column name; unspecified columns become ''. */
export type SchemeRowFixture = Record<string, string>

export interface WorkbookSpec {
  /** Defaults to the required "Schemes" sheet. */
  sheetName?: string
  /** Defaults to all 56 expected headers, in order. */
  headers?: string[]
  rows: SchemeRowFixture[]
}

/** A row that passes validation; override individual fields per test. */
export function validRow(overrides: SchemeRowFixture = {}): SchemeRowFixture {
  return {
    scheme_id: 'fhog-nsw',
    scheme_name: 'First Home Owner Grant (NSW)',
    official_url: 'https://www.revenue.nsw.gov.au/grants-schemes',
    type: 'Grant',
    level: 'State',
    applicable_states: 'NSW',
    benefit_value: '$10,000',
    status: 'Open',
    priority_ranking: '1',
    ...overrides,
  }
}

/** Serialise a workbook to a Buffer. */
export async function buildWorkbook(spec: WorkbookSpec): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(spec.sheetName ?? DATA_WORKSHEET)

  const headers = spec.headers ?? EXPECTED_HEADERS
  sheet.addRow(headers)

  // Map DB column -> header so fixtures can be written in DB terms while the
  // sheet is still laid out in the extractor's header order.
  const headerForColumn = new Map(COLUMN_MAP.map((c) => [c.column, c.header]))

  for (const row of spec.rows) {
    const cells = headers.map((header) => {
      const entry = Object.entries(row).find(([column]) => headerForColumn.get(column) === header)
      return entry ? entry[1] : ''
    })
    sheet.addRow(cells)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/** The common case: a well-formed workbook containing `rows`. */
export function buildValidWorkbook(rows: SchemeRowFixture[] = [validRow()]): Promise<Buffer> {
  return buildWorkbook({ rows })
}

/**
 * Wrap a workbook buffer in the multipart form the upload pipeline receives, so
 * tests exercise the same FormData -> File -> arrayBuffer path as a real submit.
 */
export function toUploadForm(
  buffer: Buffer,
  fields: { filename?: string; version?: string; uploadedBy?: string } = {},
): FormData {
  const form = new FormData()
  const filename = fields.filename ?? 'government_schemes.xlsx'
  const file = new File([new Uint8Array(buffer)], filename, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  form.set('file', file)
  if (fields.version !== undefined) form.set('version', fields.version)
  if (fields.uploadedBy !== undefined) form.set('uploadedBy', fields.uploadedBy)
  return form
}
