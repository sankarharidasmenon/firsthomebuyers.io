/**
 * Report generators for the discovery engine:
 *   - discovery-report.md   — what was crawled / found / rejected
 *   - verification report    — per-authority Found vs Configured, new schemes
 *                              (printed to console AND written to markdown)
 */
import fs from 'fs';
import path from 'path';
import type { DiscoveredSource, SchemeRecord } from '../types';
import type { DiscoveryResult } from '../discovery/governmentDiscovery';
import { SOURCES } from '../config/sources';
import { expectedFor } from '../config/expectedSchemes';
import { nameSimilarity } from '../discovery/duplicateDetector';
import { logger } from '../utils/logger';

/**
 * The name to use when comparing a discovered scheme against the registry. If it
 * matched a curated source (e.g. a hub page titled "First Home Buyers" that maps
 * to "First Home Owner Grant"), use the curated program name so registry checks
 * don't raise false missing/new flags.
 */
function registryName(d: DiscoveredSource): string {
  if (d.matchedKnownId) {
    const known = SOURCES.find((s) => s.id === d.matchedKnownId);
    if (known) return known.programName;
  }
  return d.title;
}

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const DISCOVERY_REPORT = path.join(OUTPUT_DIR, 'discovery-report.md');
const VERIFICATION_REPORT = path.join(OUTPUT_DIR, 'verification-report.md');

function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/** Write discovery-report.md summarising the crawl. */
export function writeDiscoveryReport(result: DiscoveryResult): string {
  const { stats, discovered, retired } = result;
  const lines: string[] = [];
  lines.push('# Government Scheme Discovery Report');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('| --- | ---: |');
  lines.push(`| Authorities Crawled | ${stats.authoritiesCrawled} |`);
  lines.push(`| Pages Crawled | ${stats.pagesCrawled} |`);
  lines.push(`| Internal Links | ${stats.internalLinks} |`);
  lines.push(`| Potential Scheme Pages | ${stats.potentialSchemePages} |`);
  lines.push(`| Schemes Discovered (deduped) | ${stats.discovered} |`);
  lines.push(`| New Schemes | ${stats.newSchemes} |`);
  lines.push(`| Existing Schemes | ${stats.existingSchemes} |`);
  lines.push(`| Updated / Renamed | ${stats.updatedSchemes} |`);
  lines.push(`| Retired Schemes | ${stats.retiredSchemes} |`);
  lines.push(`| Rejected Pages | ${stats.rejectedPages} |`);
  lines.push('');

  lines.push('## Per-authority');
  lines.push('');
  lines.push('| Authority | Jurisdiction | Pages | Links | Schemes | Admin merged | Rejected |');
  lines.push('| --- | --- | ---: | ---: | ---: | ---: | ---: |');
  for (const a of stats.perAuthority) {
    lines.push(
      `| ${a.authority} | ${a.jurisdiction} | ${a.pagesCrawled} | ${a.linksSeen} | ${a.discovered} | ${a.adminAttached} | ${a.rejected.length} |`
    );
  }
  lines.push('');

  lines.push('## Discovered schemes (First Home Buyer only)');
  lines.push('');
  lines.push('| Confidence | Status | Jurisdiction | Category | Scheme | Related | PDFs | URL |');
  lines.push('| ---: | --- | --- | --- | --- | ---: | ---: | --- |');
  for (const d of [...discovered].sort((a, b) => b.confidence - a.confidence)) {
    lines.push(
      `| ${d.confidence}% | ${d.status} | ${d.jurisdiction} | ${d.category ?? ''} | ${escapePipes(d.title)} | ${d.relatedPages?.length ?? 0} | ${d.pdfUrls?.length ?? 0} | ${d.url} |`
    );
  }
  lines.push('');

  // Rejected pages with reasons (spec: every rejected page must include a reason).
  lines.push('## Rejected pages (with reasons)');
  lines.push('');
  for (const a of stats.perAuthority) {
    if (!a.rejected.length) continue;
    lines.push(`### ${a.authority} [${a.jurisdiction}]`);
    lines.push('');
    for (const r of a.rejected) {
      lines.push(`- ✗ **${escapePipes(r.title || r.url)}** — ${r.reason}`);
    }
    lines.push('');
  }

  if (retired.length) {
    lines.push('## Retired (previously discovered, not found this run)');
    lines.push('');
    for (const r of retired) lines.push(`- ${escapePipes(r.title)} — ${r.url}`);
    lines.push('');
  }

  ensureDir();
  const content = lines.join('\n');
  fs.writeFileSync(DISCOVERY_REPORT, content, 'utf8');
  logger.ok(`Wrote discovery report → ${DISCOVERY_REPORT}`);
  return DISCOVERY_REPORT;
}

/**
 * Build the verification report per AUTHORITY:
 *   ✓ discovered FHB schemes (with category)
 *   ✗ rejected pages (with reasons)
 *   ⚠ registry checks — expected scheme missing / genuinely new scheme found
 *
 * Prints to console and writes verification-report.md. `records` are the rows
 * successfully extracted.
 */
export function writeVerificationReport(
  result: DiscoveryResult,
  records: SchemeRecord[]
): string {
  const { discovered, retired, stats } = result;
  const crawledAuthorityIds = new Set(stats.perAuthority.map((a) => a.authorityId));

  const out: string[] = [];
  const bar = '═'.repeat(54);
  out.push(bar);
  out.push('  Government Scheme Verification Report');
  out.push(bar);
  out.push('');

  let missingTotal = 0;
  let newTotal = 0;

  // Report only authorities we actually crawled this run.
  for (const authStats of stats.perAuthority) {
    const found = discovered.filter((d) => d.authorityId === authStats.authorityId);
    const expected = expectedFor(authStats.authorityId);
    out.push(`${authStats.authority} [${authStats.jurisdiction}]`);
    out.push(`  Found: ${found.length}   Expected (registry): ${expected.length}`);
    out.push('');

    // ✓ discovered schemes
    for (const d of found) {
      out.push(`  ✓ ${d.title}${d.category ? `  (${d.category})` : ''}`);
    }
    // ✗ rejected pages with reasons
    for (const r of authStats.rejected) {
      out.push('');
      out.push(`  ✗ ${r.title || r.url}`);
      out.push(`    Rejected — ${r.reason}`);
    }

    // ⚠ registry: expected scheme not discovered (compare on curated names)
    const missing = expected.filter(
      (name) => !found.some((d) => nameSimilarity(registryName(d), name) >= 0.6)
    );
    for (const m of missing) {
      missingTotal++;
      out.push('');
      out.push(`  ⚠ Expected scheme NOT found: ${m}`);
      out.push('    May have moved, been renamed, or retired — verify manually.');
    }
    // ⚠ registry: a genuinely new scheme (not curated, not in the registry)
    const unexpected = found.filter(
      (d) => !d.matchedKnownId && !expected.some((name) => nameSimilarity(registryName(d), name) >= 0.6)
    );
    for (const u of unexpected) {
      newTotal++;
      out.push('');
      out.push(`  ⚠ New scheme (not in registry): ${u.title}  (${u.confidence}%)`);
    }
    out.push('');
  }

  out.push(bar);
  out.push(`  Total Schemes Found    : ${stats.discovered}`);
  out.push(`  Extracted Successfully : ${records.length}`);
  out.push(`  New (not in registry)  : ${newTotal}`);
  out.push(`  Expected but missing   : ${missingTotal}`);
  out.push(`  Updated Schemes        : ${stats.updatedSchemes}`);
  out.push(`  Retired Schemes        : ${stats.retiredSchemes}`);
  out.push(`  Rejected Pages         : ${stats.rejectedPages}`);
  out.push(bar);
  if (retired.length) {
    out.push('');
    out.push('Retired schemes:');
    for (const r of retired) out.push(`  - ${r.title}`);
  }

  const text = out.join('\n');
  // eslint-disable-next-line no-console
  console.log('\n' + text + '\n');

  ensureDir();
  fs.writeFileSync(VERIFICATION_REPORT, text + '\n', 'utf8');
  logger.ok(`Wrote verification report → ${VERIFICATION_REPORT}`);
  return VERIFICATION_REPORT;
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, '\\|');
}

export { DISCOVERY_REPORT, VERIFICATION_REPORT };
