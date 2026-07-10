/**
 * Change detection: persists per-URL fingerprints (content hash, Last-Modified,
 * ETag) between runs so we can skip unchanged pages and flag what changed.
 *
 * State is stored as JSON in /output/.change-state.json. This is intentionally
 * simple; a later phase can swap the storage for Supabase without touching the
 * calling code (see `ChangeDetector` interface shape).
 */
import fs from 'fs';
import path from 'path';
import type { ChangeRecord } from '../types';
import { logger } from '../utils/logger';

const STATE_FILE = path.resolve(__dirname, '../../output/.change-state.json');

type StateMap = Record<string, ChangeRecord>;

function load(): StateMap {
  try {
    if (!fs.existsSync(STATE_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as StateMap;
  } catch (err) {
    logger.warn(`Could not read change state: ${(err as Error).message}`);
    return {};
  }
}

function persist(state: StateMap): void {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    logger.warn(`Could not persist change state: ${(err as Error).message}`);
  }
}

export interface ChangeVerdict {
  changed: boolean;
  reason: 'new' | 'hash' | 'last-modified' | 'etag' | 'unchanged' | 'forced';
  previous?: ChangeRecord;
}

export class ChangeDetector {
  private state: StateMap;

  constructor() {
    this.state = load();
  }

  /**
   * Decide whether a page changed vs the last recorded fingerprint.
   * Priority follows the spec: Last-Modified → ETag → content hash.
   */
  evaluate(
    url: string,
    fingerprint: { contentHash: string; lastModified?: string; etag?: string },
    force = false
  ): ChangeVerdict {
    const previous = this.state[url];
    if (force) return { changed: true, reason: 'forced', previous };
    if (!previous) return { changed: true, reason: 'new' };

    if (
      fingerprint.lastModified &&
      previous.lastModified &&
      fingerprint.lastModified !== previous.lastModified
    ) {
      return { changed: true, reason: 'last-modified', previous };
    }
    if (fingerprint.etag && previous.etag && fingerprint.etag !== previous.etag) {
      return { changed: true, reason: 'etag', previous };
    }
    if (fingerprint.contentHash !== previous.contentHash) {
      return { changed: true, reason: 'hash', previous };
    }
    return { changed: false, reason: 'unchanged', previous };
  }

  /** Record a fresh fingerprint. Updates lastChangedAt only when it changed. */
  record(
    url: string,
    fingerprint: { contentHash: string; lastModified?: string; etag?: string },
    changed: boolean
  ): void {
    const now = new Date().toISOString();
    const previous = this.state[url];
    this.state[url] = {
      url,
      contentHash: fingerprint.contentHash,
      lastModified: fingerprint.lastModified,
      etag: fingerprint.etag,
      lastCheckedAt: now,
      lastChangedAt: changed ? now : previous?.lastChangedAt || now,
    };
  }

  save(): void {
    persist(this.state);
  }
}
