/**
 * 2. Source Tracking (HTML vs PDF provenance) + source-mapping-report.md.
 *
 * Provenance is derived WITHOUT touching the extractor: for each scheme we run
 * the unchanged extractScheme three ways — HTML-only, PDF-only and combined —
 * and compare the field outputs:
 *
 *   value only from HTML-run          → HTML
 *   value only from PDF-run           → PDF
 *   same value from both runs         → Both
 *   different non-empty from each run → Conflict (see conflictDetector)
 *   config/computed (id, urls, tags)  → Config/Derived
 */
import fs from 'fs';
import path from 'path';
import type { SchemeRecord } from '../types';
import type { Conflict, FieldSource } from './types';
import { COLUMNS } from '../services/excelExporter';
import { logger } from '../utils/logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const REPORT = path.join(OUTPUT_DIR, 'source-mapping-report.md');

// Columns that come from the Source config or are computed constants, not from
// the page/PDF text — so provenance HTML/PDF is not meaningful for them.
const CONFIG_FIELDS = new Set<keyof SchemeRecord>([
  'schemeId', 'schemeName', 'acronym', 'level', 'administeringBody',
  'applicableStates', 'officialUrl', 'lastVerifiedDate', 'sourceWebsite',
  'eligibilityTag', 'priorityRanking', 'catchyLine',
]);

function str(v: unknown): string {
  return (v ?? '').toString().trim();
}
function norm(v: string): string {
  return v.toLowerCase().replace(/\s+/g, ' ').replace(/[.,;]+$/, '').trim();
}

/**
 * Derive per-field provenance and collect conflicts for one scheme.
 * `pdf` may be null when the scheme has no (parsable) PDF.
 */
export function trackFieldSources(
  schemeName: string,
  jurisdiction: string,
  finalRec: SchemeRecord,
  htmlRec: SchemeRecord,
  pdfRec: SchemeRecord | null
): { fieldSources: FieldSource[]; conflicts: Conflict[] } {
  const fieldSources: FieldSource[] = [];
  const conflicts: Conflict[] = [];

  for (const [label, key] of COLUMNS) {
    const value = str(finalRec[key]);
    const htmlValue = str(htmlRec[key]);
    const pdfValue = pdfRec ? str(pdfRec[key]) : '';

    let source: FieldSource['source'];
    if (!value) {
      source = 'none';
    } else if (CONFIG_FIELDS.has(key)) {
      source = 'Config/Derived';
    } else {
      const hasH = !!htmlValue;
      const hasP = !!pdfValue;
      if (hasH && hasP) {
        if (norm(htmlValue) === norm(pdfValue)) {
          source = 'Both';
        } else {
          source = 'Conflict';
          conflicts.push({ schemeName, jurisdiction, field: label, htmlValue, pdfValue });
        }
      } else if (hasH) source = 'HTML';
      else if (hasP) source = 'PDF';
      else source = 'Config/Derived'; // present in combined only (computed/interaction)
    }

    fieldSources.push({ key, label, value, source, htmlValue, pdfValue });
  }

  return { fieldSources, conflicts };
}

export function writeSourceMappingReport(
  results: Array<{ schemeName: string; jurisdiction: string; fieldSources: FieldSource[] }>
): string {
  const lines: string[] = [];
  lines.push('# Source Mapping Report (HTML vs PDF)');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push('');
  lines.push('For each scheme, the origin of every populated field. `Both` means');
  lines.push('HTML and PDF agreed; `Conflict` means they disagreed (see conflict report).');
  lines.push('');

  for (const r of results) {
    lines.push(`## ${escape(r.schemeName)} [${r.jurisdiction}]`);
    lines.push('');
    lines.push('| Field | Value | Source |');
    lines.push('| --- | --- | --- |');
    for (const f of r.fieldSources) {
      if (f.source === 'none') continue; // only populated fields
      lines.push(`| ${escape(f.label)} | ${escape(truncate(f.value))} | ${badge(f.source)} |`);
    }
    lines.push('');
  }

  ensureDir();
  fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
  logger.ok(`Wrote source-mapping report → ${REPORT}`);
  return REPORT;
}

function badge(s: FieldSource['source']): string {
  return s === 'Conflict' ? '⚠ Conflict' : s;
}
function truncate(s: string, n = 80): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function escape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export { CONFIG_FIELDS };
