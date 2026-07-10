/**
 * 7. Review Recommendations — per-scheme reasons a Business Analyst should
 * manually check. Pure explanation; changes no data.
 *
 * A scheme needs review when it is < 90% complete, has an HTML/PDF conflict, or
 * a government PDF could not be downloaded (so some fields may be incomplete).
 */
import type { SchemeQuality } from './types';

// Fields that materially matter to a first home buyer; their absence is worth
// calling out explicitly in the review reasons.
const KEY_FIELDS = [
  'Benefit Value',
  'Income Cap - Single',
  'Income Cap - Couple',
  'Property Price Cap',
  'Minimum Deposit',
  'Occupancy Requirement',
  'Citizenship/Residency',
  'Eligible Property Types',
  'First Home Buyer Required',
];

export function needsReview(q: SchemeQuality): boolean {
  return q.completeness.reviewRequired || q.conflicts.length > 0 || hasBlockedPdf(q);
}

export function hasBlockedPdf(q: SchemeQuality): boolean {
  return q.pdfResults.some((p) => !p.downloaded);
}

/** Human-readable reasons this scheme needs review (empty if it doesn't). */
export function reviewReasons(q: SchemeQuality): string[] {
  const reasons: string[] = [];

  // Missing key fields.
  const missingKey = KEY_FIELDS.filter((label) => q.completeness.missing.includes(label));
  for (const label of missingKey) reasons.push(`${label} unavailable.`);

  // Conflicts.
  for (const c of q.conflicts) {
    reasons.push(`Conflicting ${c.field}: HTML "${c.htmlValue}" vs PDF "${c.pdfValue}".`);
  }

  // Blocked PDFs.
  const blocked = q.pdfResults.filter((p) => !p.downloaded);
  if (blocked.length) {
    const why = blocked[0].reason || 'download failed';
    if (q.completeness.pct >= 100) {
      reasons.push(`Government PDF blocked (${why}) — HTML already contained all fields.`);
    } else {
      reasons.push(`Government PDF blocked (${why}) — some fields may be incomplete.`);
    }
  }

  // Generic low-completeness note if nothing more specific fired.
  if (!reasons.length && q.completeness.reviewRequired) {
    reasons.push(`Completion ${q.completeness.pct}% is below the 90% threshold.`);
  }
  return reasons;
}
