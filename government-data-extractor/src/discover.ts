/**
 * Phase 1.5 entry point — Government Scheme DISCOVERY Engine.
 *
 *   Authorities → crawl landing pages → discover scheme pages → dedupe
 *     → (existing) extractor → Excel  + discovery & verification reports
 *
 * Discovery is now the PRIMARY source of URLs. The hand-configured SOURCES are
 * folded in as a safety-net seed so a curated scheme is never lost if a crawl
 * misses it — but developers no longer need to add URLs by hand.
 *
 * Flags:
 *   --only=<authId[,authId]>  Restrict to authorities (e.g. revenue-nsw,sro-vic)
 *   --max-depth=<n>           Crawl depth (default 4)
 *   --max-pages=<n>           Max pages per authority (default 80)
 *   --concurrency=<n>         Per-authority fetch concurrency (default 2)
 *   --delay=<ms>              Delay between requests (default 400)
 *   --no-robots               Ignore robots.txt (default: respect)
 *   --discover-only           Run discovery + reports, skip extraction/Excel
 *   --seed-known / --no-seed  Include (default) / exclude the curated SOURCES
 */
import type { DiscoveredSource, Source } from './types';
import { SOURCES } from './config/sources';
import { runDiscovery } from './discovery/governmentDiscovery';
import { DuplicateDetector } from './discovery/duplicateDetector';
import { runExtraction } from './pipeline';
import { exportToExcel } from './services/excelExporter';
import { writeDiscoveryReport, writeVerificationReport } from './services/reporter';
import { normalizeUrl } from './utils/helpers';
import { logger } from './utils/logger';

interface CliOptions {
  onlyAuthorities: string[] | null;
  maxDepth: number;
  maxPages: number;
  concurrency: number;
  delayMs: number;
  respectRobots: boolean;
  discoverOnly: boolean;
  seedKnown: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const o: CliOptions = {
    onlyAuthorities: null,
    maxDepth: 4,
    maxPages: 80,
    concurrency: 2,
    delayMs: 400,
    respectRobots: true,
    discoverOnly: false,
    seedKnown: true,
  };
  for (const arg of argv) {
    if (arg.startsWith('--only=')) o.onlyAuthorities = arg.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith('--max-depth=')) o.maxDepth = int(arg, o.maxDepth);
    else if (arg.startsWith('--max-pages=')) o.maxPages = int(arg, o.maxPages);
    else if (arg.startsWith('--concurrency=')) o.concurrency = int(arg, o.concurrency);
    else if (arg.startsWith('--delay=')) o.delayMs = int(arg, o.delayMs);
    else if (arg === '--no-robots') o.respectRobots = false;
    else if (arg === '--discover-only') o.discoverOnly = true;
    else if (arg === '--no-seed') o.seedKnown = false;
    else if (arg === '--seed-known') o.seedKnown = true;
  }
  return o;
}

function int(arg: string, fallback: number): number {
  const n = parseInt(arg.slice(arg.indexOf('=') + 1), 10);
  return Number.isNaN(n) || n <= 0 ? fallback : n;
}

function slugFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop() || 'scheme';
    return seg.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
  } catch {
    return 'scheme';
  }
}

/** Turn a discovered candidate into an extractor Source (reusing known config). */
function toSource(d: DiscoveredSource): Source {
  if (d.matchedKnownId) {
    const known = SOURCES.find((s) => s.id === d.matchedKnownId);
    if (known) return known; // curated name / typeHint / URL wins
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

/**
 * Build the extraction candidate list.
 *
 * Curated SOURCES are the trusted baseline and are ALWAYS kept as-is (they are
 * distinct by design — e.g. each state's "First Home Owner Grant", and the three
 * federal guarantees that share one consolidated page). We seed them into the
 * de-duplicator so that DISCOVERED candidates already represented by a curated
 * source (or by another discovered one) are folded in rather than duplicated.
 * De-duplication of names is jurisdiction-scoped.
 */
function buildCandidates(discovered: DiscoveredSource[], seedKnown: boolean): Source[] {
  const dedupe = new DuplicateDetector();
  const candidates: Source[] = [];

  if (seedKnown) {
    for (const s of SOURCES) {
      candidates.push(s); // always keep curated sources
      dedupe.register({ url: s.url, name: s.programName, jurisdiction: s.jurisdiction });
    }
  }

  for (const d of discovered) {
    // Already represented by a curated source? Skip (it's the same scheme).
    if (d.matchedKnownId && seedKnown && SOURCES.some((s) => s.id === d.matchedKnownId)) continue;
    const src = toSource(d);
    const verdict = dedupe.add({ url: src.url, name: src.programName, jurisdiction: src.jurisdiction });
    if (verdict.isDuplicate) {
      logger.debug(`Discovered candidate merged (${verdict.reason}) ${src.url} → ${verdict.matchedTo?.url}`);
      continue;
    }
    candidates.push(src);
  }
  return candidates;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  logger.info('════════════════════════════════════════════════════════════');
  logger.info('FirstNest Government Scheme Discovery Engine — Phase 1.5');
  logger.info(
    `depth=${opts.maxDepth} maxPages=${opts.maxPages} concurrency=${opts.concurrency} delay=${opts.delayMs}ms robots=${opts.respectRobots}`
  );
  logger.info(`Log file: ${logger.logFile}`);
  logger.info('════════════════════════════════════════════════════════════');

  // 1) DISCOVERY
  const discovery = await runDiscovery({
    onlyAuthorities: opts.onlyAuthorities,
    maxDepth: opts.maxDepth,
    maxPages: opts.maxPages,
    concurrency: opts.concurrency,
    delayMs: opts.delayMs,
    respectRobots: opts.respectRobots,
  });

  writeDiscoveryReport(discovery);
  logger.info(
    `Discovery: ${discovery.stats.discovered} scheme(s) — ${discovery.stats.newSchemes} new, ${discovery.stats.existingSchemes} existing, ${discovery.stats.updatedSchemes} updated, ${discovery.stats.retiredSchemes} retired.`
  );

  if (opts.discoverOnly) {
    writeVerificationReport(discovery, []);
    logger.warn('--discover-only: skipping extraction & Excel.');
    return;
  }

  // 2) CANDIDATES → EXISTING EXTRACTOR
  const candidates = buildCandidates(discovery.discovered, opts.seedKnown);
  logger.info(`Extracting ${candidates.length} candidate scheme(s)…`);
  const { records, failed, detector } = await runExtraction(candidates, {
    concurrency: Math.max(2, opts.concurrency),
  });

  // 3) EXCEL
  if (records.length) {
    await exportToExcel(records);
    detector.save();
    logger.ok(`Extraction complete: ${records.length} row(s), ${failed} failed. Excel + change-state updated.`);
  } else {
    logger.fail('No records extracted — Excel not written.');
    process.exitCode = 1;
  }

  // 4) VERIFICATION REPORT
  writeVerificationReport(discovery, records);
  logger.info('Done.');
}

main().catch((err) => {
  logger.fail(`Fatal: ${(err as Error).stack || (err as Error).message}`);
  process.exitCode = 1;
});
