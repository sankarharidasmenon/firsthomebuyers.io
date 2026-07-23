/**
 * Deterministic classification helpers used during discovery.
 * - isFhbCandidate: does this link/anchor look like a First-Home-Buyer scheme page?
 * - inferProgramType: apply the spec's Program Type Rules (name-based, never invented).
 * - isSectionLink: does this link point to a sub-section of a scheme (eligibility, apply…)?
 */

import { FHB_KEYWORDS } from '../config/sources';
import type { ProgramType } from '../types';

export function isFhbCandidate(anchorText: string, url: string): boolean {
  const hay = `${anchorText} ${decodeURIComponent(url)}`;
  return FHB_KEYWORDS.some((re) => re.test(hay));
}

/**
 * Program Type Rules (from spec):
 *   contains "grant"                         -> Grant
 *   everything else FHB-related              -> Scheme
 * Types are NEVER invented — only these two values are ever returned.
 */
export function inferProgramType(name: string, seedType?: ProgramType): ProgramType {
  if (seedType) return seedType;
  return /\bgrant\b/i.test(name) ? 'Grant' : 'Scheme';
}

const SECTION_KEYWORDS = [
  'eligib',
  'apply',
  'application',
  'how to',
  'benefit',
  'faq',
  'frequently asked',
  'guideline',
  'guide',
  'form',
  'document',
  'evidence',
  'legislation',
  'exemption',
  'concession',
  'overview',
  'about',
];

export function isSectionLink(anchorText: string, url: string, parentPath: string): boolean {
  const at = anchorText.toLowerCase();
  const anchorMatch = SECTION_KEYWORDS.some((k) => at.includes(k));
  let underParent = false;
  try {
    const p = new URL(url).pathname.toLowerCase();
    // same directory family as the scheme's landing page
    const parentDir = parentPath.replace(/\/[^/]*$/, '');
    underParent = parentDir.length > 1 && p.startsWith(parentDir);
    if (!underParent) {
      const urlMatch = SECTION_KEYWORDS.some((k) => p.includes(k));
      return anchorMatch && urlMatch;
    }
  } catch {
    return false;
  }
  return underParent || anchorMatch;
}

/**
 * Anchors that describe a SUB-PAGE / action of a scheme (not a distinct scheme).
 * Used to stop hub discovery from promoting "Apply for…", "Lodgement guide…",
 * "Repay…", "Objections…", "Approved agents…" etc. into their own rows.
 */
const SECTION_ANCHOR_RE =
  /^(apply|applying|how to apply|understanding|about|overview|lodgement|lodge|repay|repaying|objection|objections|approved agents?|manage|managing|update|complete|completing|calculate|calculator|register|log ?in|sign ?in|contact|guide|guidelines?|forms?|documents?|evidence|eligibility|benefits?|payment|processing|before you|after you|next steps|frequently asked|faqs?)\b/i;

export function isSectionAnchor(anchorText: string): boolean {
  return SECTION_ANCHOR_RE.test(anchorText.trim());
}

/** Try to derive a clean scheme name from an anchor / page title. */
export function cleanSchemeName(raw: string): string {
  return raw
    .replace(/\s*[-|–—]\s*(Revenue NSW|State Revenue Office.*|SRO.*|NSW Government|Housing Australia|ATO|Australian Taxation Office).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
