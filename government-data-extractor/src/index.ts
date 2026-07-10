/**
 * Phase 1 entry point — static extraction from the hand-configured sources.ts.
 *
 * NOTE: As of Phase 1.5 the DISCOVERY engine (src/discover.ts, `npm run
 * discover`) is the primary way to obtain scheme URLs — it finds schemes
 * automatically. This static runner remains for targeted re-extraction of the
 * curated source list and as a fallback.
 *
 * Flags:
 *   --dry-run           Fetch + extract but do NOT write Excel or change-state.
 *   --force             Reprocess all pages even if unchanged.
 *   --only=<id[,id]>    Restrict to specific source ids.
 *   --concurrency=<n>   Parallel fetches (default 3).
 */
import { SOURCES } from './config/sources';
import { runExtraction } from './pipeline';
import { exportToExcel } from './services/excelExporter';
import { logger } from './utils/logger';

interface CliOptions {
  dryRun: boolean;
  force: boolean;
  only: string[] | null;
  concurrency: number;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { dryRun: false, force: false, only: null, concurrency: 3 };
  for (const arg of argv) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg.startsWith('--only=')) opts.only = arg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith('--concurrency=')) {
      const n = parseInt(arg.slice('--concurrency='.length), 10);
      if (!Number.isNaN(n) && n > 0) opts.concurrency = n;
    }
  }
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const sources = opts.only ? SOURCES.filter((s) => opts.only!.includes(s.id)) : SOURCES;

  logger.info('════════════════════════════════════════════════════════════');
  logger.info(`FirstNest Government Scheme Extractor — Phase 1 (static)`);
  logger.info(`Sources: ${sources.length} | concurrency: ${opts.concurrency} | dryRun: ${opts.dryRun} | force: ${opts.force}`);
  logger.info(`Log file: ${logger.logFile}`);
  logger.info('════════════════════════════════════════════════════════════');

  if (!sources.length) {
    logger.fail('No sources matched — check --only ids.');
    process.exitCode = 1;
    return;
  }

  const { records, failed, detector } = await runExtraction(sources, opts);

  logger.info('────────────────────────────────────────────────────────────');
  logger.info(`Extraction complete: ${records.length} succeeded, ${failed} failed.`);

  if (opts.dryRun) {
    logger.warn('Dry run — skipping Excel write and change-state persistence.');
    logger.info('Sample record:');
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(records[0] ?? {}, null, 2));
    return;
  }

  if (records.length) {
    await exportToExcel(records);
    logger.ok('Updated Excel workbook.');
  } else {
    logger.fail('No records extracted — Excel not written.');
    process.exitCode = 1;
  }

  detector.save();
  logger.ok('Change state saved.');
  logger.info('Done.');
}

main().catch((err) => {
  logger.fail(`Fatal: ${(err as Error).stack || (err as Error).message}`);
  process.exitCode = 1;
});
