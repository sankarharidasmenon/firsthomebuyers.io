/**
 * Orchestrator / CLI entry.
 *
 *   npm run scrape        full run → output/government_schemes.xlsx, sources.json, logs
 *   npm run scrape:dry    discovery + extraction, but skip writing the Excel file
 *
 * Pipeline: discover & collect → build records → merge dupes → validate → export.
 */

import { discoverAndCollect } from './discovery/crawler';
import { buildRecord } from './extract/schemeRecord';
import { mergeRecords } from './merge/mergeRecords';
import { validate } from './validate/validate';
import { writeExcel } from './output/excel';
import { writeSources } from './output/sourcesJson';
import { log } from './core/logger';
import { closeBrowser, browserAvailable } from './core/browser';
import type { SchemeRecord } from './types';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const started = Date.now();

  log.banner('════════ FirstNest — Australian FHB Government Scheme Extractor ════════');
  log.info(`Mode: ${dryRun ? 'DRY RUN (no Excel written)' : 'FULL RUN'}`);

  // 1. Discover + collect all pages/PDFs per scheme
  log.banner('▶ Phase 1: Discovery & collection');
  const bundles = await discoverAndCollect();
  log.info(`Collected ${bundles.length} scheme bundles`);
  if (!browserAvailable()) {
    log.warn('Playwright browser was unavailable — pages needing JS/anti-bot bypass may be incomplete. Run `npx playwright install chromium`.');
  }

  // 2. Build one record per scheme
  log.banner('▶ Phase 2: Deterministic field extraction');
  const rawRecords: SchemeRecord[] = [];
  for (const b of bundles) {
    try {
      const rec = buildRecord(b);
      rawRecords.push(rec);
      log.row(`Extracted: ${rec['UI/UX Scheme Name (official)']} [${rec['UI/UX Program Type']} · ${rec['UI/UX Applicable States/Territories']}]`);
    } catch (err) {
      log.error(`Extraction failed for ${b.id}: ${(err as Error).message}`);
    }
  }

  // 3. Merge duplicates
  log.banner('▶ Phase 3: Merge & de-duplicate');
  const merged = mergeRecords(rawRecords);
  log.info(`After merge: ${merged.length} unique schemes`);

  // 4. Validate
  log.banner('▶ Phase 4: Validation');
  const valid = validate(merged);

  // 5. Export
  log.banner('▶ Phase 5: Export');
  writeSources(bundles);
  if (!dryRun) {
    await writeExcel(valid);
  } else {
    log.info('Dry run — skipped Excel write.');
  }

  await closeBrowser();
  log.summary();
  log.info(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  await log.close();
}

main().catch(async (err) => {
  log.error(`Fatal: ${(err as Error).stack || err}`);
  await closeBrowser();
  await log.close();
  process.exit(1);
});
