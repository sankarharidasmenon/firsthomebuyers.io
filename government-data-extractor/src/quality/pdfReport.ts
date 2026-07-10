/**
 * 5. PDF Extraction Summary → pdf-report.md.
 *
 * For each scheme: whether a PDF was found, downloaded, parsed, its page count,
 * which fields came from the PDF, and — when a PDF could not be downloaded —
 * whether the HTML already covered everything or some fields may be incomplete.
 */
import fs from 'fs';
import path from 'path';
import type { SchemeQuality } from './types';
import { logger } from '../utils/logger';

const OUTPUT_DIR = path.resolve(__dirname, '../../output');
const REPORT = path.join(OUTPUT_DIR, 'pdf-report.md');

export interface PdfSummary {
  attempted: number;
  succeeded: number;
  successRate: number; // 0–100
}

export function writePdfReport(results: SchemeQuality[]): { path: string; summary: PdfSummary } {
  const lines: string[] = [];
  lines.push('# PDF Extraction Summary');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push('');

  let attempted = 0;
  let succeeded = 0;

  for (const r of results) {
    lines.push(`## ${escape(r.schemeName)} [${r.jurisdiction}]`);
    lines.push('');
    if (!r.pdfFound) {
      lines.push('- **PDF Found:** No');
      lines.push('- **Impact:** All data sourced from HTML.');
      lines.push('');
      continue;
    }

    const fieldsFromPdf = r.fieldSources
      .filter((f) => f.source === 'PDF' || f.source === 'Both')
      .map((f) => f.label);

    for (const pdf of r.pdfResults) {
      attempted++;
      if (pdf.downloaded) succeeded++;
      lines.push(`- **PDF:** ${pdf.url}`);
      lines.push(`  - Downloaded: ${pdf.downloaded ? 'Yes' : 'No'}`);
      lines.push(`  - Parsed: ${pdf.parsed ? 'Yes' : 'No'}`);
      if (pdf.parsed) lines.push(`  - Pages: ${pdf.pages}`);
      if (!pdf.downloaded && pdf.reason) lines.push(`  - Reason: ${pdf.reason}`);
    }

    if (fieldsFromPdf.length) {
      lines.push(`- **Fields where PDF contributed:** ${fieldsFromPdf.join(', ')}`);
    }

    const blocked = r.pdfResults.some((p) => !p.downloaded);
    if (blocked) {
      lines.push(
        r.completeness.pct >= 100
          ? '- **Impact:** No additional information missing — HTML already contained all fields.'
          : `- **Impact:** Some fields may be incomplete (completion ${r.completeness.pct}%).`
      );
    }
    lines.push('');
  }

  const successRate = attempted ? Math.round((succeeded / attempted) * 100) : 100;
  lines.unshift('');
  lines.unshift(`**PDF success rate:** ${succeeded}/${attempted} downloaded (${successRate}%).`);

  ensureDir();
  fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');
  logger.ok(`Wrote PDF report → ${REPORT}`);
  return { path: REPORT, summary: { attempted, succeeded, successRate } };
}

function escape(s: string): string {
  return s.replace(/\|/g, '\\|');
}
function ensureDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
