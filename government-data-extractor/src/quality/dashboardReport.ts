/**
 * 6. Overall Quality Dashboard → data-quality-report.md.
 *
 * Executive summary for the Business Analyst: totals, averages, PDF success,
 * conflicts, missing schemes, least-complete schemes, the per-column Field
 * Coverage Summary, and review recommendations. Read-only.
 */
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import type { SchemeQuality } from './types';
import type { MissingSummary } from './missingSchemesReport';
import type { PdfSummary } from './pdfReport';
import { fieldCoverage } from './completenessReport';
import { collectConflicts } from './conflictDetector';
import { needsReview, reviewReasons } from './reviewReport';
import { logger } from '../utils/logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const REPORT = path.join(OUTPUT_DIR, 'data-quality-report.md');

export function writeDataQualityReport(
  results: SchemeQuality[],
  missing: MissingSummary,
  pdf: PdfSummary
): string {
  const extracted = results.filter((r) => r.extracted);
  const avgCompleteness = extracted.length
    ? Math.round(extracted.reduce((s, r) => s + r.completeness.pct, 0) / extracted.length)
    : 0;
  const conflicts = collectConflicts(results);
  const reviewing = results.filter(needsReview);

  const lines: string[] = [];
  lines.push('# Government Scheme Data Quality Report');
  lines.push('');
  lines.push(`**Extraction Date:** ${format(new Date(), 'dd MMM yyyy')}`);
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | ---: |');
  lines.push(`| Total Schemes | ${results.length} |`);
  lines.push(`| Successfully Extracted | ${extracted.length} |`);
  lines.push(`| Average Completeness | ${avgCompleteness}% |`);
  lines.push(`| PDF Success Rate | ${pdf.successRate}% (${pdf.succeeded}/${pdf.attempted}) |`);
  lines.push(`| Conflicts Found | ${conflicts.length} |`);
  lines.push(`| Missing Expected Schemes | ${missing.totalMissing} |`);
  lines.push(`| Schemes Requiring Review | ${reviewing.length} |`);
  lines.push('');

  // Top 5 least complete.
  lines.push('## Top 5 Least Complete Schemes');
  lines.push('');
  lines.push('| Scheme | Jurisdiction | Completion |');
  lines.push('| --- | --- | ---: |');
  const leastComplete = [...extracted].sort((a, b) => a.completeness.pct - b.completeness.pct).slice(0, 5);
  for (const r of leastComplete) {
    lines.push(`| ${escape(r.schemeName)} | ${r.jurisdiction} | ${r.completeness.pct}% |`);
  }
  lines.push('');

  // Field coverage summary (all 56 columns).
  lines.push('## Field Coverage Summary');
  lines.push('');
  lines.push('How often each column is populated across all schemes. Low coverage may mean');
  lines.push("the information isn't published by governments — or that the extractor needs work.");
  lines.push('');
  lines.push('| Field | Populated | Coverage |');
  lines.push('| --- | ---: | ---: |');
  for (const f of fieldCoverage(results)) {
    lines.push(`| ${escape(f.label)} | ${f.populated}/${f.total} | ${bar(f.pct)} ${f.pct}% |`);
  }
  lines.push('');

  // Review recommendations.
  lines.push('## Review Recommendations');
  lines.push('');
  if (!reviewing.length) {
    lines.push('✓ No schemes require manual review.');
  } else {
    for (const r of reviewing) {
      lines.push(`### ${escape(r.schemeName)} [${r.jurisdiction}] — Needs Review`);
      lines.push('');
      for (const reason of reviewReasons(r)) lines.push(`- ${reason}`);
      lines.push('');
    }
  }

  ensureDir();
  fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
  logger.ok(`Wrote data quality report → ${REPORT}`);
  return REPORT;
}

/** Tiny text meter for the coverage column. */
function bar(pct: number): string {
  const filled = Math.round((pct / 100) * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
function escape(s: string): string {
  return s.replace(/\|/g, '\\|');
}
function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
