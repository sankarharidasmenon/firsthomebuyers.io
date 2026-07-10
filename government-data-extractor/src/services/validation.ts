/**
 * Pre-export validation (read-only — logs warnings, never mutates data).
 *
 *  - validateRow: per-scheme mandatory-field checks by benefit type.
 *  - validateDataset: whole-file sanity checks (dup ids/urls, empties, oversized
 *    cells, HTML tags, navigation text).
 *
 * Validation NEVER blocks the export or changes values; it surfaces issues for
 * the Business Analyst to review.
 */
import type { SchemeRecord } from '../types';
import { COLUMNS } from './excelExporter';
import { SOURCES } from '../config/sources';
import { logger } from '../utils/logger';

const MAX_CELL_LEN = 1000;
/** Baseline: every curated scheme must be present. Discovery may add more. */
const CURATED_COUNT = SOURCES.length;

function str(v: unknown): string {
  return (v ?? '').toString().trim();
}

/** Mandatory fields per benefit type (spec §7). Returns missing field labels. */
export function validateRow(rec: SchemeRecord): string[] {
  const missing: string[] = [];
  const need = (label: string, key: keyof SchemeRecord) => {
    if (!str(rec[key])) missing.push(label);
  };

  // Common to every scheme.
  need('Scheme Name', 'schemeName');
  need('Official Government URL', 'officialUrl');
  need('Benefit Type', 'benefitType');

  const type = str(rec.type) || str(rec.benefitType);
  switch (type) {
    case 'Grant':
      need('Benefit Value (Grant Amount)', 'benefitValue');
      break;
    case 'Concession':
    case 'Stamp Duty Relief':
      // Threshold + concession method + a property value limit.
      if (!str(rec.fullExemptionThreshold) && !str(rec.partialConcessionRange) && !str(rec.propertyPriceCap)) {
        missing.push('Threshold / Property Value Limit');
      }
      need('Concession Calculation Method', 'concessionCalculationMethod');
      break;
    case 'Guarantee':
      need('Minimum Deposit (Deposit %)', 'minimumDeposit');
      need('Value Calculation Method (Guarantee Description)', 'valueCalculationMethod');
      break;
    default:
      break;
  }
  return missing;
}

export interface DatasetIssue {
  scheme: string;
  field: string;
  issue: string;
}

const HTML_TAG = /<[a-z!/][^>]*>/i;
const NAV_TERMS = [
  'skip to main content', 'show more', 'open all', 'breadcrumb', 'main navigation',
  'toggle navigation', 'back to top', 'was this page helpful',
];

/** Whole-dataset validation (spec §8). Returns a list of issues (empty = clean). */
export function validateDataset(records: SchemeRecord[], expectedCount = CURATED_COUNT): DatasetIssue[] {
  const issues: DatasetIssue[] = [];

  // Count — every curated scheme must be present (more is fine: discovery adds).
  if (records.length < expectedCount) {
    issues.push({ scheme: '(dataset)', field: 'count', issue: `Expected at least ${expectedCount} schemes, got ${records.length}` });
  }

  // Duplicate scheme ids (always a problem).
  seenDuplicates(records.map((r) => str(r.schemeId))).forEach((id) =>
    issues.push({ scheme: id, field: 'Scheme ID', issue: 'Duplicate Scheme ID' })
  );
  // Duplicate URLs — but ONLY flag when the scheme names also match (a true
  // duplicate). Distinct schemes legitimately share one consolidated page (e.g.
  // the three federal guarantees on the Housing Australia hub), which is fine.
  seenDuplicates(
    records.map((r) => `${str(r.officialUrl).toLowerCase()}||${str(r.schemeName).toLowerCase()}`)
  ).forEach((key) =>
    issues.push({ scheme: key.split('||')[1], field: 'Official Government URL', issue: 'Duplicate URL + name' })
  );

  for (const rec of records) {
    const name = str(rec.schemeName) || str(rec.schemeId) || '(unnamed)';
    if (!str(rec.schemeName)) issues.push({ scheme: name, field: 'Scheme Name', issue: 'Empty Scheme Name' });
    if (!str(rec.officialUrl)) issues.push({ scheme: name, field: 'Official Government URL', issue: 'Empty URL' });

    for (const [label, key] of COLUMNS) {
      const value = str(rec[key]);
      if (!value) continue;
      if (value.length > MAX_CELL_LEN) {
        issues.push({ scheme: name, field: label, issue: `Cell too long (${value.length} chars > ${MAX_CELL_LEN})` });
      }
      if (HTML_TAG.test(value)) {
        issues.push({ scheme: name, field: label, issue: 'Contains HTML tags' });
      }
      const lower = value.toLowerCase();
      const nav = NAV_TERMS.find((n) => lower.includes(n));
      if (nav) issues.push({ scheme: name, field: label, issue: `Contains navigation text ("${nav}")` });
    }
  }
  return issues;
}

function seenDuplicates(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()].filter(([, c]) => c > 1).map(([v]) => v);
}

/**
 * Run both validations and log warnings. Returns true when the dataset is clean.
 * Called by the exporter right before writing the workbook.
 */
export function runPreExportValidation(records: SchemeRecord[], expectedCount = CURATED_COUNT): boolean {
  let clean = true;

  // Per-row mandatory-field warnings.
  for (const rec of records) {
    const missing = validateRow(rec);
    if (missing.length) {
      clean = false;
      logger.warn(
        `Row validation: "${str(rec.schemeName) || rec.schemeId}" [${str(rec.type)}] missing → ${missing.join(', ')}`
      );
    }
  }

  // Dataset-level warnings.
  const issues = validateDataset(records, expectedCount);
  for (const i of issues) {
    clean = false;
    logger.warn(`Data validation: [${i.scheme}] ${i.field} — ${i.issue}`);
  }

  if (clean) logger.ok(`Validation passed: ${records.length} rows, no issues.`);
  else logger.warn('Validation found issues (above). Export continues — review before upload.');
  return clean;
}
