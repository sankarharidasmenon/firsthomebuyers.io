/**
 * Excel workbook writer (exceljs).
 * Professional formatting: bold header, frozen first row, auto-filter,
 * wrapped text, auto-fitted columns, single worksheet "Government Schemes".
 */

import * as path from 'path';
import * as fs from 'fs';
import ExcelJS from 'exceljs';
import { ALL_COLUMNS } from '../config/columns';
import { log } from '../core/logger';
import type { SchemeRecord } from '../types';

const OUT_DIR = path.resolve(__dirname, '../../output');
const OUT_FILE = path.join(OUT_DIR, 'government_schemes.xlsx');

export async function writeExcel(records: SchemeRecord[]): Promise<string> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'data-extractor';
  wb.created = new Date();
  const ws = wb.addWorksheet('Government Schemes', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Columns
  ws.columns = ALL_COLUMNS.map((c) => ({ header: c, key: c }));

  // Header styling
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FF111111' }, size: 11 };
  header.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  header.height = 28;
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E642' } };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'hair', color: { argb: 'FFEEEEEE' } },
    };
  });

  // Rows
  records.forEach((rec, i) => {
    const row: Record<string, string | number> = {};
    for (const c of ALL_COLUMNS) row[c] = c === 'S.No' ? i + 1 : rec[c] ?? '';
    const added = ws.addRow(row);
    added.alignment = { vertical: 'top', wrapText: true };
    if (i % 2 === 1) {
      added.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFBF3' } };
      });
    }
  });

  // Auto-filter across the header
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ALL_COLUMNS.length } };

  // Auto-fit column widths (bounded)
  ws.columns.forEach((col) => {
    let max = String(col.header || '').length;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value == null ? '' : String(cell.value);
      const longestLine = v.split('\n').reduce((m, l) => Math.max(m, l.length), 0);
      if (longestLine > max) max = longestLine;
    });
    col.width = Math.min(Math.max(max + 2, 12), 60);
  });

  await wb.xlsx.writeFile(OUT_FILE);
  log.info(`Excel written: ${OUT_FILE} (${records.length} rows)`);
  return OUT_FILE;
}
