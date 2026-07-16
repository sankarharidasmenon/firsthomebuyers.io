/**
 * One-shot import of government_schemes.xlsx → Supabase.
 *
 * Prerequisites:
 *   1. Run supabase/migrations/0001_master_data.sql in the Supabase SQL editor
 *   2. Ensure .env.local exists with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/import-schemes.ts
 */
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

import { parseWorkbook } from '../src/lib/masterData/parse';
import { validateRows } from '../src/lib/masterData/validate';
import { importSchemes } from '../src/lib/masterData/import';

const XLSX_PATHS = [
  path.resolve(process.cwd(), 'government-data-extractor/output/government_schemes.xlsx'),
  path.resolve(process.cwd(), 'government_schemes.xlsx'),
];

async function main() {
  const xlsxPath = XLSX_PATHS.find(fs.existsSync);
  if (!xlsxPath) {
    console.error('❌  Could not find government_schemes.xlsx in project root or government-data-extractor/output/');
    process.exit(1);
  }
  console.log(`📂  Reading: ${xlsxPath}`);

  const buffer = fs.readFileSync(xlsxPath);

  console.log('📊  Parsing workbook...');
  const parsed = await parseWorkbook(buffer);
  if (parsed.errors.length > 0) {
    console.error('❌  Parse errors:');
    parsed.errors.forEach(e => console.error(`    Row ${e.row}: ${e.message}`));
    process.exit(1);
  }
  console.log(`✅  Parsed ${parsed.rows.length} rows`);

  console.log('🔍  Validating rows...');
  const validation = validateRows(parsed.rows);
  if (!validation.valid) {
    console.error('❌  Validation errors:');
    validation.errors.slice(0, 10).forEach(e => console.error(`    Row ${e.row}: ${e.message}`));
    process.exit(1);
  }
  console.log(`✅  All rows valid`);

  console.log('⬆️   Importing to Supabase...');
  const summary = await importSchemes(parsed.rows, {
    version: '1.0',
    filename: path.basename(xlsxPath),
    uploadedBy: 'import-script',
  });

  if (!summary.success) {
    console.error('❌  Import failed:');
    summary.errors?.forEach(e => console.error(`    ${e.message}`));
    process.exit(1);
  }

  console.log(`\n🎉  Import complete — ${summary.schemesImported} schemes loaded in ${summary.durationMs}ms`);
}

main().catch(e => { console.error(e); process.exit(1); });
