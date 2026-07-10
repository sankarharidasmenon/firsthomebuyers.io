/**
 * Excel parser — reads ONLY the "Schemes" worksheet and maps every column to
 * its db field via COLUMN_MAP. Ignores any other worksheets (e.g. a future
 * "Info"/documentation sheet). Never guesses: unmapped/blank cells become ''.
 *
 * Structural problems (missing worksheet, wrong/missing columns) are returned as
 * errors and abort — the importer must not run on a malformed workbook.
 */
import ExcelJS from 'exceljs';
import {
  COLUMN_MAP,
  DATA_WORKSHEET,
  EXPECTED_HEADERS,
  REQUIRED_COLUMN_COUNT,
  type SchemeRowInput,
} from './columns';
import type { ParseResult, ValidationError } from './types';

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  // Rich text / hyperlink / formula cell objects.
  const v = value as { text?: string; result?: unknown; richText?: { text: string }[] };
  if (typeof v.text === 'string') return v.text.trim();
  if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join('').trim();
  if (v.result !== undefined && v.result !== null) return String(v.result).trim();
  return '';
}

export async function parseWorkbook(buffer: Buffer | ArrayBuffer): Promise<ParseResult> {
  const errors: ValidationError[] = [];
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer as ArrayBuffer);
  } catch (err) {
    return { rows: [], errors: [{ row: 0, message: `Excel file is not readable: ${(err as Error).message}` }] };
  }

  const sheet = workbook.getWorksheet(DATA_WORKSHEET);
  if (!sheet) {
    const names = workbook.worksheets.map((w) => w.name).join(', ') || '(none)';
    return {
      rows: [],
      errors: [{ row: 0, message: `Required worksheet "${DATA_WORKSHEET}" not found. Worksheets present: ${names}.` }],
    };
  }

  // Header row → column index. Map each expected header to its actual column.
  const headerRow = sheet.getRow(1);
  const headerByName = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const name = cellText(cell.value);
    if (name) headerByName.set(name, colNumber);
  });

  if (headerByName.size < REQUIRED_COLUMN_COUNT) {
    errors.push({
      row: 1,
      message: `Expected ${REQUIRED_COLUMN_COUNT} columns, found ${headerByName.size}.`,
    });
  }
  const missing = EXPECTED_HEADERS.filter((h) => !headerByName.has(h));
  if (missing.length) {
    errors.push({ row: 1, message: `Missing required column(s): ${missing.join(', ')}.` });
  }
  if (errors.length) return { rows: [], errors };

  // Data rows → objects keyed by db column.
  const rows: SchemeRowInput[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const obj: SchemeRowInput = {};
    let anyValue = false;
    for (const { header, column } of COLUMN_MAP) {
      const colNumber = headerByName.get(header)!;
      const text = cellText(row.getCell(colNumber).value);
      obj[column] = text;
      if (text) anyValue = true;
    }
    if (anyValue) rows.push(obj); // skip fully-blank rows
  }

  return { rows, errors: [] };
}
