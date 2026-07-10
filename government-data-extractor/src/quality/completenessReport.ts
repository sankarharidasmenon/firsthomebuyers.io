/**
 * 1. Extraction Completeness Report + Field Coverage Summary.
 *
 * Read-only: measures how many of the 56 columns are populated per scheme and
 * across all schemes. Never fills or guesses anything.
 */
import fs from 'fs';
import path from 'path';
import type { SchemeRecord } from '../types';
import type { Completeness, SchemeQuality } from './types';
import { COLUMNS } from '../services/excelExporter';
import { logger } from '../utils/logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const REPORT = path.join(OUTPUT_DIR, 'extraction-completeness-report.md');

const REVIEW_THRESHOLD = 90; // completion < 90% → needs manual review

function str(v: unknown): string {
  return (v ?? '').toString().trim();
}

/** Compute completeness for one record against all 56 columns. */
export function computeCompleteness(record: SchemeRecord): Completeness {
  const total = COLUMNS.length;
  const missing: string[] = [];
  let filled = 0;
  for (const [label, key] of COLUMNS) {
    if (str(record[key])) filled++;
    else missing.push(label);
  }
  const pct = Math.round((filled / total) * 1000) / 10;
  return { filled, total, pct, missing, reviewRequired: pct < REVIEW_THRESHOLD };
}

/** Field coverage across all schemes: for each column, populated / total. */
export function fieldCoverage(results: SchemeQuality[]): Array<{ label: string; populated: number; total: number; pct: number }> {
  const total = results.length || 1;
  return COLUMNS.map(([label, key]) => {
    const populated = results.filter((r) => str(r.record[key])).length;
    return { label, populated, total: results.length, pct: Math.round((populated / total) * 100) };
  });
}

export function writeCompletenessReport(results: SchemeQuality[]): string {
  const lines: string[] = [];
  lines.push('# Extraction Completeness Report');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()} · ${results.length} scheme(s)_`);
  lines.push('');
  lines.push('| Scheme | Jurisdiction | Fields Filled | Completion | Review Required |');
  lines.push('| --- | --- | ---: | ---: | :---: |');
  for (const r of [...results].sort((a, b) => a.completeness.pct - b.completeness.pct)) {
    const c = r.completeness;
    lines.push(
      `| ${escape(r.schemeName)} | ${r.jurisdiction} | ${c.filled} / ${c.total} | ${c.pct}% | ${c.reviewRequired ? '⚠ Yes' : 'No'} |`
    );
  }
  lines.push('');

  lines.push('## Per-scheme detail');
  lines.push('');
  for (const r of results) {
    const c = r.completeness;
    lines.push(`### ${r.schemeName} [${r.jurisdiction}]`);
    lines.push('');
    lines.push(`- **Fields Filled:** ${c.filled} / ${c.total}`);
    lines.push(`- **Completion:** ${c.pct}%`);
    lines.push(`- **Review Required:** ${c.reviewRequired ? 'Yes (below 90%)' : 'No'}`);
    if (c.missing.length) {
      lines.push(`- **Missing Fields (${c.missing.length}):** ${c.missing.join(', ')}`);
    }
    lines.push('');
  }

  ensureDir();
  fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
  logger.ok(`Wrote completeness report → ${REPORT}`);
  return REPORT;
}

function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function escape(s: string): string {
  return s.replace(/\|/g, '\\|');
}

export { REVIEW_THRESHOLD };
