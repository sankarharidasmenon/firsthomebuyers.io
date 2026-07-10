/**
 * Deterministic First Home Buyer domain filter (NO AI / NO LLM).
 *
 * Answers one question for every crawled page: "Would this page help an
 * Australian buy their FIRST HOME?" — using only rule-based phrase matching on
 * the URL, title and H1. If not clearly yes, the page is rejected with a reason.
 *
 * Evaluation order (first match wins):
 *   1. ARCHIVED   → reject (superseded/old program)
 *   2. REJECT     → reject (off-topic: payroll/land tax, EV, rental, pension, …)
 *   3. ADMIN      → not a scheme; attach to its parent scheme instead
 *   4. ALLOW      → relevant, tagged with a First Home Buyer category
 *   5. otherwise  → reject ("not specifically about first home buying")
 *
 * Rule 1 (must belong to a configured authority) is enforced upstream — the
 * crawler only ever visits the authorities in authorities.ts.
 */
import type { CrawledPage, FhbCategory } from '../types';

export type RejectKind = 'archived' | 'off-topic' | 'admin' | 'not-fhb';

export interface DomainVerdict {
  relevant: boolean;
  category?: FhbCategory;
  matchedPhrase?: string;
  confidence: number; // deterministic 0–100, for reporting only
  kind: 'relevant' | RejectKind;
  reason: string;
}

// ── Rule 2: ALLOW phrases → FHB category (checked on URL slug + title + H1) ──
// Ordered most-specific first so the best category wins.
const ALLOW: Array<[string, FhbCategory]> = [
  ['family home guarantee', 'Government Guarantees'],
  ['regional first home buyer guarantee', 'Government Guarantees'],
  ['regional first home', 'Government Guarantees'],
  ['first home guarantee', 'Government Guarantees'],
  ['home guarantee', 'Government Guarantees'],
  ['help to buy', 'Shared Equity Programs'],
  ['shared equity', 'Shared Equity Programs'],
  ['home buyer helper', 'Shared Equity Programs'],
  ['first home super saver', 'First Home Buyer Tax Benefits'],
  ['first home owner rate', 'Stamp Duty Assistance'],
  ['first home owner grant', 'First Home Owner Grants'],
  ['first home grant', 'First Home Owner Grants'],
  ['homegrown territory', 'First Home Owner Grants'],
  ['first homeowner', 'First Home Owner Grants'],
  ['first home owner', 'First Home Owner Grants'],
  ['first home buyers assistance', 'Stamp Duty Assistance'],
  ['first home buyer assistance', 'Stamp Duty Assistance'],
  ['home buyer concession', 'Stamp Duty Assistance'],
  ['transfer duty concession', 'Stamp Duty Assistance'],
  ['stamp duty concession', 'Stamp Duty Assistance'],
  ['stamp duty exemption', 'Stamp Duty Assistance'],
  ['home purchase assistance', 'Government Housing Purchase Programs'],
  ['affordable home ownership', 'Government Housing Purchase Programs'],
  ['first home buyer', 'First Home Buyer Support'],
  ['first home', 'First Home Buyer Support'],
  ['owner occupier', 'First Home Buyer Support'],
  ['owner-occupier', 'First Home Buyer Support'],
];

// ── REJECT groups → reason (checked on URL slug + title + H1) ────────────────
const REJECT: Array<{ phrases: string[]; reason: string }> = [
  {
    phrases: ['payroll tax', 'land tax', 'landholder', 'insurance duty', 'gambling', 'liquor', 'tobacco', 'mineral', 'royalt'],
    reason: 'Business/other taxation — not first home buyer assistance.',
  },
  {
    phrases: ['business', 'commercial', 'farming', 'primary producer', 'investment property'],
    reason: 'Business/commercial/investment — not first home buyer assistance.',
  },
  {
    phrases: ['electric vehicle', ' ev ', 'vehicle', 'solar', 'battery'],
    reason: 'Not related to first home buyers (vehicle/energy scheme).',
  },
  {
    phrases: ['community housing', 'social housing', 'public housing', 'rental', 'tenancy', 'lease', 'renting'],
    reason: 'Housing assistance not related to purchasing a first home.',
  },
  {
    phrases: ['disability', 'ndis', 'aged care', 'pension', 'seniors', 'concession card'],
    reason: 'Welfare/concession scheme — not first home buyer assistance.',
  },
  {
    phrases: ['relationship duty', 'marriage', 'family law', 'probate', 'deceased estate', 'personal relationship'],
    reason: 'Not a first home buyer assistance scheme (relationship/estate duty).',
  },
  {
    phrases: ['news', 'media release', 'media-release', 'speech', 'budget', 'consultation'],
    reason: 'News/announcement content — not a scheme.',
  },
];

// ── ARCHIVED markers (URL path tokens + title) → reject ──────────────────────
const ARCHIVE = ['archive', 'archived', 'previous', 'old', 'historic', 'historical', 'former', 'expired', 'closed', 'superseded'];

// ── ADMIN / support page tokens (URL path) → attach to parent, not a scheme ──
const ADMIN = [
  'apply', 'application', 'form', 'forms', 'payment', 'guide', 'guideline', 'guidelines',
  'faq', 'faqs', 'contact', 'agent', 'agents', 'downloads', 'resources', 'calculator',
  'search', 'objection', 'objections', 'appeal', 'appeals', 'lodge', 'lodgement', 'lodgment',
];

function slugTokens(url: string): string[] {
  try {
    return new URL(url).pathname.toLowerCase().split(/[/-]+/).filter(Boolean);
  } catch {
    return [];
  }
}

function slugText(url: string): string {
  return ' ' + slugTokens(url).join(' ') + ' ';
}

/** Evaluate a crawled page against the FHB domain rules. */
export function evaluateDomain(page: CrawledPage): DomainVerdict {
  const slug = slugText(page.url);
  const title = ` ${page.title.toLowerCase()} `;
  const h1 = ` ${page.h1.toLowerCase()} `;
  const identity = `${slug}${title}${h1}`; // URL + title + H1 only (not body/meta)
  const tokens = new Set([...slugTokens(page.url), ...title.split(/\s+/), ...h1.split(/\s+/)]);

  // 1) Archived / superseded — reject even if it also looks like a scheme.
  const archiveHit = ARCHIVE.find((a) => tokens.has(a));
  if (archiveHit) {
    return reject('archived', `Archived or superseded program ("${archiveHit}").`);
  }

  // 2) Off-topic reject phrases.
  for (const group of REJECT) {
    const hit = group.phrases.find((p) => identity.includes(p));
    if (hit) return reject('off-topic', group.reason, hit);
  }

  // 3) Administrative/support page — belongs to a parent scheme, not its own row.
  const adminHit = ADMIN.find((t) => slugTokens(page.url).includes(t));
  if (adminHit) {
    return reject('admin', `Administrative/support page ("${adminHit}") — attached to parent scheme.`, adminHit);
  }

  // 4) ALLOW — must be specifically about first home buying.
  for (const [phrase, category] of ALLOW) {
    if (identity.includes(phrase)) {
      const strong = slug.includes(phrase) || h1.includes(phrase);
      const confidence = strong ? 98 : title.includes(phrase) ? 92 : 85;
      return {
        relevant: true,
        category,
        matchedPhrase: phrase,
        confidence,
        kind: 'relevant',
        reason: `Matched "${phrase}" → ${category}.`,
      };
    }
  }

  // 5) Not clearly about first home buying.
  return reject('not-fhb', 'Not specifically about first home buying.');
}

function reject(kind: RejectKind, reason: string, matchedPhrase?: string): DomainVerdict {
  return { relevant: false, confidence: 0, kind, reason, matchedPhrase };
}

/** True when a page is an administrative sub-page (candidate to attach to a parent). */
export function isAdminPage(v: DomainVerdict): boolean {
  return v.kind === 'admin';
}
