/**
 * 3. Conflict Detection → conflict-report.md.
 *
 * Reports fields where the HTML and PDF versions of a scheme yielded different
 * non-empty values. It NEVER decides which is correct or overwrites anything —
 * every conflict is flagged "Manual Review Required".
 */
import fs from 'fs';
import path from 'path';
import type { Conflict, SchemeQuality } from './types';
import { logger } from '../utils/logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const REPORT = path.join(OUTPUT_DIR, 'conflict-report.md');

export function collectConflicts(results: SchemeQuality[]): Conflict[] {
  return results.flatMap((r) => r.conflicts);
}

export function writeConflictReport(results: SchemeQuality[]): string {
  const conflicts = collectConflicts(results);
  const lines: string[] = [];
  lines.push('# Conflict Report (HTML vs PDF)');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push('');

  if (!conflicts.length) {
    lines.push('✓ **No conflicts detected.** Where both HTML and PDF supplied a value,');
    lines.push('they agreed. (Values sourced from only one of HTML/PDF are not conflicts.)');
    lines.push('');
  } else {
    lines.push(`Found **${conflicts.length}** conflicting field value(s). Values are reported`);
    lines.push('as-is — no automatic resolution is performed.');
    lines.push('');
    for (const c of conflicts) {
      lines.push(`## ${escape(c.schemeName)} [${c.jurisdiction}] — ${escape(c.field)}`);
      lines.push('');
      lines.push(`| Source | Value |`);
      lines.push(`| --- | --- |`);
      lines.push(`| HTML | ${escape(c.htmlValue)} |`);
      lines.push(`| PDF | ${escape(c.pdfValue)} |`);
      lines.push('');
      lines.push('**Status:** Manual Review Required');
      lines.push('');
    }
  }

  ensureDir();
  fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
  logger.ok(`Wrote conflict report → ${REPORT}`);
  return REPORT;
}

function escape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
