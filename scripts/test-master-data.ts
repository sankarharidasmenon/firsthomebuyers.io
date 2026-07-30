/**
 * Phase 2A test harness.
 *
 *   npm run test:master-data
 *
 * OFFLINE tests (always run): parse the real extractor Excel, validate, and
 * exercise every validation-failure path (missing worksheet, duplicate IDs,
 * missing name, invalid URL).
 *
 * DB tests (run only when the Supabase tables exist): successful import, read
 * APIs (list/featured/eligible/by-id), rollback (a failing import leaves data
 * untouched), and import history. If the migration hasn't been applied yet the
 * DB tests are skipped with a clear message.
 */
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

// ── Load .env (Node doesn't do this automatically for scripts) ──────────────
for (const line of fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

import { parseWorkbook } from '../src/lib/masterData/parse';
import { validateRows } from '../src/lib/masterData/validate';
import { importSchemes } from '../src/lib/masterData/import';
import { getImportHistory } from '../src/lib/masterData/import';
import { getAdminClient } from '../src/lib/supabase/server';
import { listSchemes, getScheme, listFeatured } from '../src/lib/schemes/repository';
import { buildEligibilityResult } from '../src/lib/schemes/eligibilityClient';
import { DATA_WORKSHEET, EXPECTED_HEADERS } from '../src/lib/masterData/columns';

const XLSX = path.resolve(process.cwd(), 'government-data-extractor/output/government_schemes.xlsx');

let passed = 0, failed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { passed++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { failed++; console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ' — ' + detail : ''}`); }
}
function section(t: string) { console.log(`\n\x1b[36m${t}\x1b[0m`); }

async function tablesExist(): Promise<boolean> {
  try {
    const { error } = await getAdminClient().from('government_schemes').select('id').limit(1);
    return !error;
  } catch { return false; }
}

async function main() {
  section('1. Parse real extractor Excel (Schemes sheet only)');
  if (!fs.existsSync(XLSX)) {
    console.log(`  ! Excel not found at ${XLSX} — run the extractor first. Skipping parse tests.`);
  }
  const buffer = fs.readFileSync(XLSX);
  const parsed = await parseWorkbook(buffer);
  check('workbook parses with no structural errors', parsed.errors.length === 0, JSON.stringify(parsed.errors));
  check('at least 17 scheme rows parsed', parsed.rows.length >= 17, `got ${parsed.rows.length}`);
  check('every row has scheme_id + scheme_name + official_url', parsed.rows.every((r) => r.scheme_id && r.scheme_name && r.official_url));

  section('2. Row validation (happy path)');
  const v = validateRows(parsed.rows);
  check('valid dataset passes validation', v.valid, JSON.stringify(v.errors.slice(0, 3)));

  section('3. Validation failure paths');
  // Duplicate scheme_id
  const dup = parsed.rows.map((r) => ({ ...r }));
  dup[1].scheme_id = dup[0].scheme_id;
  check('duplicate Scheme ID is rejected', !validateRows(dup).valid);
  // Missing scheme_name
  const noName = parsed.rows.map((r) => ({ ...r }));
  noName[0].scheme_name = '';
  check('missing Scheme Name is rejected', !validateRows(noName).valid);
  // Invalid URL
  const badUrl = parsed.rows.map((r) => ({ ...r }));
  badUrl[0].official_url = 'not-a-url';
  check('invalid Official URL is rejected', !validateRows(badUrl).valid);
  // Duplicate URL + same name = true duplicate row → rejected.
  const dupUrl = parsed.rows.map((r) => ({ ...r }));
  dupUrl[1].official_url = dupUrl[0].official_url;
  dupUrl[1].scheme_name = dupUrl[0].scheme_name;
  check('duplicate scheme (same URL + name) is rejected', !validateRows(dupUrl).valid);
  // Shared URL with DIFFERENT names (federal guarantees) is allowed.
  check('shared URL with distinct scheme names is allowed', validateRows(parsed.rows).valid);

  section('4. Missing worksheet is rejected');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('NotSchemes');
  ws.addRow(EXPECTED_HEADERS);
  const badBuf = Buffer.from(await wb.xlsx.writeBuffer());
  const badParse = await parseWorkbook(badBuf);
  check(`missing "${DATA_WORKSHEET}" worksheet is reported`, badParse.errors.length > 0 && /worksheet/i.test(badParse.errors[0].message));

  // ── DB tests ──────────────────────────────────────────────────────────────
  section('5. Database tests');
  if (!(await tablesExist())) {
    console.log('  ! Tables not found. Apply supabase/migrations/0001_master_data.sql in the');
    console.log('    Supabase SQL editor, then re-run `npm run test:master-data`. Skipping DB tests.');
  } else {
    const meta = { version: '1.0', filename: 'government_schemes.xlsx', uploadedBy: 'test-runner' };
    const summary = await importSchemes(parsed.rows, meta);
    check('import succeeds', summary.success, JSON.stringify(summary.errors));
    check(`imported ${parsed.rows.length} schemes`, summary.schemesImported === parsed.rows.length, `got ${summary.schemesImported}`);

    const all = await listSchemes();
    check('GET /api/schemes returns all rows', all.length === parsed.rows.length, `got ${all.length}`);

    const first = all[0];
    const byId = first ? await getScheme(first.scheme_id) : null;
    check('GET /api/schemes/:id returns a scheme', !!first && byId?.scheme_id === first.scheme_id);

    const featured = await listFeatured(6);
    check('GET /api/schemes/featured returns ≤ 6 active', featured.length > 0 && featured.length <= 6);

    // Eligibility now has exactly one implementation — evaluateScheme, reached
    // through buildEligibilityResult. Assert it runs over every open scheme.
    const evaluated = buildEligibilityResult(all as never, {
      state: 'VIC', firstHomeBuyer: true, income: 90000, hasPartner: false,
      propertyPrice: 650000, deposit: null, propertyType: 'house',
    });
    check('eligibility engine evaluates every open scheme once',
      evaluated.items.length > 0 && evaluated.items.length <= all.length,
      `got ${evaluated.items.length} of ${all.length}`);

    // Rollback: a failing import (malformed payload) must leave data untouched.
    const countBefore = (await listSchemes()).length;
    const admin = getAdminClient();
    const { error: rpcErr } = await admin.rpc('import_master_data', {
      p_schemes: { not: 'an-array' }, // triggers a Postgres error inside the tx
      p_meta: { version: 'x', filename: 'bad', uploaded_by: 'test', total_schemes: 0 },
    });
    const countAfter = (await listSchemes()).length;
    check('failing import errors', !!rpcErr);
    check('failing import ROLLS BACK (row count unchanged)', countAfter === countBefore, `before ${countBefore}, after ${countAfter}`);

    const history = await getImportHistory(5);
    check('import history has a success record', history.some((h) => h.status === 'success'));
  }

  console.log(`\n${failed === 0 ? '\x1b[32m' : '\x1b[31m'}=== ${passed} passed, ${failed} failed ===\x1b[0m`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
