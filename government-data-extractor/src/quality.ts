/**
 * Quality entry point — `npm run quality`.
 *
 * Generates the Business-Analyst validation reports for the CURRENT scheme set
 * (curated sources + anything in discovered_sources.json), WITHOUT touching the
 * Excel, crawler, discovery engine or extraction pipeline. It re-fetches each
 * scheme and re-runs the unchanged extractor in HTML-only / PDF-only / combined
 * modes to derive completeness, provenance, conflicts and PDF outcomes.
 *
 * Reports written to output/:
 *   extraction-completeness-report.md · source-mapping-report.md
 *   conflict-report.md · missing-schemes-report.md · pdf-report.md
 *   data-quality-report.md
 *
 * Flags: --only=<id,…>  --concurrency=<n>  --curated-only
 */
import fs from 'fs';
import path from 'path';
import type { DiscoveredSource, Source } from './types';
import { SOURCES } from './config/sources';
import { DuplicateDetector } from './discovery/duplicateDetector';
import { normalizeUrl } from './utils/helpers';
import { analyzeAll } from './quality/qualityAnalyzer';
import { writeCompletenessReport } from './quality/completenessReport';
import { writeSourceMappingReport } from './quality/sourceTracker';
import { writeConflictReport } from './quality/conflictDetector';
import { writeMissingSchemesReport } from './quality/missingSchemesReport';
import { writePdfReport } from './quality/pdfReport';
import { writeDataQualityReport } from './quality/dashboardReport';
import { logger } from './utils/logger';

const DISCOVERED_PATH = path.resolve(__dirname, '../output/discovered_sources.json');

interface CliOptions {
  only: string[] | null;
  concurrency: number;
  curatedOnly: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const o: CliOptions = { only: null, concurrency: 3, curatedOnly: false };
  for (const arg of argv) {
    if (arg.startsWith('--only=')) o.only = arg.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith('--concurrency=')) {
      const n = parseInt(arg.slice('--concurrency='.length), 10);
      if (!Number.isNaN(n) && n > 0) o.concurrency = n;
    } else if (arg === '--curated-only') o.curatedOnly = true;
  }
  return o;
}

function loadDiscovered(): DiscoveredSource[] {
  try {
    if (!fs.existsSync(DISCOVERED_PATH)) return [];
    return JSON.parse(fs.readFileSync(DISCOVERED_PATH, 'utf8')) as DiscoveredSource[];
  } catch {
    return [];
  }
}

function slugFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop() || 'scheme';
    return seg.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
  } catch {
    return 'scheme';
  }
}

function toSource(d: DiscoveredSource): Source {
  if (d.matchedKnownId) {
    const known = SOURCES.find((s) => s.id === d.matchedKnownId);
    if (known) return known;
  }
  return {
    id: `${d.authorityId}-${slugFromUrl(d.url)}`,
    programName: d.title,
    administeringBody: d.authority,
    level: d.level,
    jurisdiction: d.jurisdiction,
    url: d.url,
    typeHint: d.typeHint,
  };
}

/** Same candidate set the discovery flow extracts (curated + discovered, deduped). */
function buildCandidates(curatedOnly: boolean): Source[] {
  const dedupe = new DuplicateDetector();
  const candidates: Source[] = [];
  for (const s of SOURCES) {
    candidates.push(s);
    dedupe.register({ url: s.url, name: s.programName, jurisdiction: s.jurisdiction });
  }
  if (!curatedOnly) {
    for (const d of loadDiscovered()) {
      if (d.matchedKnownId && SOURCES.some((s) => s.id === d.matchedKnownId)) continue;
      const src = toSource(d);
      const verdict = dedupe.add({ url: src.url, name: src.programName, jurisdiction: src.jurisdiction });
      if (!verdict.isDuplicate) candidates.push(src);
    }
  }
  return candidates;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  let candidates = buildCandidates(opts.curatedOnly);
  if (opts.only) candidates = candidates.filter((s) => opts.only!.includes(s.id) || opts.only!.includes(s.jurisdiction));

  logger.info('════════════════════════════════════════════════════════════');
  logger.info('FirstNest — Extraction Quality / Validation Reports');
  logger.info(`Analyzing ${candidates.length} scheme(s) · concurrency ${opts.concurrency}`);
  logger.info('(re-fetches pages; does NOT modify the Excel or any pipeline)');
  logger.info('════════════════════════════════════════════════════════════');

  if (!candidates.length) {
    logger.fail('No candidate schemes to analyze.');
    process.exitCode = 1;
    return;
  }

  const results = await analyzeAll(candidates, opts.concurrency);

  // Write every report.
  writeCompletenessReport(results);
  writeSourceMappingReport(
    results.map((r) => ({ schemeName: r.schemeName, jurisdiction: r.jurisdiction, fieldSources: r.fieldSources }))
  );
  writeConflictReport(results);
  const missing = writeMissingSchemesReport(results);
  const pdf = writePdfReport(results);
  writeDataQualityReport(results, missing.summary, pdf.summary);

  const extracted = results.filter((r) => r.extracted).length;
  const avg = extracted ? Math.round(results.reduce((s, r) => s + r.completeness.pct, 0) / results.length) : 0;
  logger.info('────────────────────────────────────────────────────────────');
  logger.ok(`Quality reports complete: ${extracted}/${results.length} analyzed, avg completeness ${avg}%.`);
  logger.info('See output/data-quality-report.md for the dashboard.');
}

main().catch((err) => {
  logger.fail(`Fatal: ${(err as Error).stack || (err as Error).message}`);
  process.exitCode = 1;
});
