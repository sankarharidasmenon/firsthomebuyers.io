/**
 * 4. Missing Expected Schemes → missing-schemes-report.md.
 *
 * Compares extracted schemes against the expected-scheme registry
 * (config/expectedSchemes.ts) per authority and lists any expected scheme that
 * was not extracted. Read-only.
 */
import fs from 'fs';
import path from 'path';
import type { SchemeQuality } from './types';
import { AUTHORITIES } from '../config/authorities';
import { EXPECTED_SCHEMES } from '../config/expectedSchemes';
import { nameSimilarity } from '../discovery/duplicateDetector';
import { logger } from '../utils/logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const REPORT = path.join(OUTPUT_DIR, 'missing-schemes-report.md');

export interface MissingSummary {
  totalExpected: number;
  totalFound: number;
  totalMissing: number;
}

export function writeMissingSchemesReport(results: SchemeQuality[]): { path: string; summary: MissingSummary } {
  const lines: string[] = [];
  lines.push('# Missing Expected Schemes Report');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push('');

  let totalExpected = 0;
  let totalFound = 0;
  let totalMissing = 0;

  for (const [authorityId, expected] of Object.entries(EXPECTED_SCHEMES)) {
    const authority = AUTHORITIES.find((a) => a.id === authorityId);
    const jurisdiction = authority?.jurisdiction ?? authorityId;
    const inJurisdiction = results.filter((r) => r.jurisdiction === jurisdiction);

    const missing = expected.filter(
      (name) => !inJurisdiction.some((r) => matches(r, name))
    );
    const found = expected.length - missing.length;
    totalExpected += expected.length;
    totalFound += found;
    totalMissing += missing.length;

    lines.push(`## ${authority?.name ?? authorityId} [${jurisdiction}]`);
    lines.push('');
    lines.push(`- **Expected:** ${expected.length}`);
    lines.push(`- **Found:** ${found}`);
    if (missing.length === 0) {
      lines.push('- **Status:** ✓ Complete');
    } else {
      lines.push('- **Status:** ⚠ Missing');
      for (const m of missing) lines.push(`  - Missing: ${m}`);
    }
    lines.push('');
  }

  lines.unshift('');
  lines.unshift(`**Totals:** ${totalFound}/${totalExpected} expected schemes found · ${totalMissing} missing.`);

  ensureDir();
  fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
  logger.ok(`Wrote missing-schemes report → ${REPORT}`);
  return { path: REPORT, summary: { totalExpected, totalFound, totalMissing } };
}

/** A result satisfies an expected scheme name (match on program or scheme name). */
function matches(r: SchemeQuality, expectedName: string): boolean {
  return (
    nameSimilarity(r.programName, expectedName) >= 0.6 ||
    nameSimilarity(r.schemeName, expectedName) >= 0.6
  );
}

function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
