/**
 * Writes output/sources.json — every government URL used for extraction,
 * grouped by scheme, with page + PDF provenance.
 */

import * as path from 'path';
import * as fs from 'fs';
import { log } from '../core/logger';
import { allVisited } from '../core/fetchPage';
import type { SchemeBundle } from '../types';

const OUT_FILE = path.resolve(__dirname, '../../output/sources.json');

export function writeSources(bundles: SchemeBundle[]): string {
  const schemes = bundles.map((b) => ({
    schemeId: b.id,
    schemeName: b.seedName,
    jurisdiction: b.jurisdiction,
    governmentLevel: b.governmentLevel,
    primaryUrl: b.primaryUrl,
    pages: b.pages.map((p) => ({
      url: p.url,
      finalUrl: p.finalUrl,
      title: p.title,
      status: p.statusCode,
      rendered: p.rendered,
      fetchedAt: p.fetchedAt,
    })),
    pdfs: b.pdfs.map((p) => ({ url: p.url, pages: p.pages })),
  }));

  const allUrls = [...new Set(allVisited().map((p) => p.finalUrl))].sort();

  const payload = {
    generatedAt: new Date().toISOString(),
    jurisdictions: ['Australia (Federal)', 'NSW', 'Victoria'],
    totalSchemes: bundles.length,
    totalUrls: allUrls.length,
    allGovernmentUrls: allUrls,
    schemes,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  log.info(`Sources written: ${OUT_FILE} (${allUrls.length} URLs)`);
  return OUT_FILE;
}
