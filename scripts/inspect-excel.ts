/**
 * Quick script to print the actual headers and first data row from the Excel.
 * Usage: npx tsx scripts/inspect-excel.ts
 */
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const PATHS = [
  path.resolve(process.cwd(), 'government_schemes.xlsx'),
  path.resolve(process.cwd(), 'government-data-extractor/output/government_schemes.xlsx'),
];

async function main() {
  for (const xlsxPath of PATHS) {
    if (!fs.existsSync(xlsxPath)) continue;
    console.log(`\n📂  File: ${xlsxPath}`);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(fs.readFileSync(xlsxPath) as unknown as ArrayBuffer);
    console.log(`📋  Worksheets: ${wb.worksheets.map(w => w.name).join(', ')}`);
    for (const ws of wb.worksheets) {
      const headerRow = ws.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: false }, cell => {
        const v = cell.value;
        let text = '';
        if (typeof v === 'string') text = v.trim();
        else if (v && typeof v === 'object' && 'richText' in (v as object)) text = ((v as { richText: { text: string }[] }).richText || []).map(r => r.text).join('').trim();
        else if (v != null) text = String(v).trim();
        if (text) headers.push(text);
      });
      console.log(`\n  Sheet "${ws.name}" — ${headers.length} columns:`);
      headers.forEach((h, i) => console.log(`    [${i + 1}] ${h}`));
      // Print first data row
      const dataRow = ws.getRow(2);
      console.log(`\n  First data row sample:`);
      dataRow.eachCell({ includeEmpty: false }, (cell, col) => {
        if (col <= 10) {
          const v = cell.value;
          let text = '';
          if (typeof v === 'string') text = v.trim().slice(0, 80);
          else if (v != null) text = String(v).slice(0, 80);
          console.log(`    col ${col}: ${text}`);
        }
      });
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
