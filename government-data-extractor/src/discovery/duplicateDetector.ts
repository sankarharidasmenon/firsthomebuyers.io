/**
 * Duplicate detector — prevents the same scheme being added twice when it is
 * reachable via multiple URLs, or discovered again on a later run.
 *
 * A candidate is a duplicate of an existing one if ANY of:
 *   - normalized URL matches
 *   - content hash (SHA-256 of page text) matches
 *   - scheme-name similarity ≥ threshold (fuzzy — catches "First Home Owner
 *     Grant" vs "First Home Owner (New Homes) Grant")
 *
 * When a duplicate is found the caller UPDATES the existing entry instead of
 * creating a new row (spec: "do not create another row. Instead update it.").
 */
import { normalizeUrl } from '../utils/helpers';

const NAME_SIMILARITY_THRESHOLD = 0.82;

export interface DedupeEntry {
  url: string;
  name: string;
  contentHash?: string;
  /** When set on both sides, names only count as duplicates within the same jurisdiction. */
  jurisdiction?: string;
}

/** Normalise a scheme name for comparison. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // drop parentheticals e.g. "(New Homes)"
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(the|a|an|of|for|to|in|and|scheme|nsw|vic|qld|wa|sa|tas|act|nt)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Token Jaccard similarity of two names (0–1). */
export function nameSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export interface DuplicateVerdict {
  isDuplicate: boolean;
  matchedTo?: DedupeEntry;
  reason?: 'url' | 'hash' | 'name';
}

/** Stateful detector: add entries one by one; it reports matches against prior. */
export class DuplicateDetector {
  private entries: DedupeEntry[] = [];
  private byUrl = new Map<string, DedupeEntry>();
  private byHash = new Map<string, DedupeEntry>();

  seed(entries: DedupeEntry[]): void {
    for (const e of entries) this.register(e);
  }

  check(candidate: DedupeEntry): DuplicateVerdict {
    const url = normalizeUrl(candidate.url);
    if (this.byUrl.has(url)) {
      return { isDuplicate: true, matchedTo: this.byUrl.get(url), reason: 'url' };
    }
    if (candidate.contentHash && this.byHash.has(candidate.contentHash)) {
      return { isDuplicate: true, matchedTo: this.byHash.get(candidate.contentHash), reason: 'hash' };
    }
    for (const e of this.entries) {
      // Same scheme name in different jurisdictions (e.g. every state's "First
      // Home Owner Grant") are DISTINCT schemes — never merge across borders.
      if (candidate.jurisdiction && e.jurisdiction && candidate.jurisdiction !== e.jurisdiction) continue;
      if (nameSimilarity(candidate.name, e.name) >= NAME_SIMILARITY_THRESHOLD) {
        return { isDuplicate: true, matchedTo: e, reason: 'name' };
      }
    }
    return { isDuplicate: false };
  }

  register(entry: DedupeEntry): void {
    const url = normalizeUrl(entry.url);
    const stored: DedupeEntry = { ...entry, url };
    this.entries.push(stored);
    this.byUrl.set(url, stored);
    if (entry.contentHash) this.byHash.set(entry.contentHash, stored);
  }

  /** Check then register in one step; returns the verdict. */
  add(entry: DedupeEntry): DuplicateVerdict {
    const verdict = this.check(entry);
    if (!verdict.isDuplicate) this.register(entry);
    return verdict;
  }
}
