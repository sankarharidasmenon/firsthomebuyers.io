/**
 * Shared extraction pipeline.
 *
 * This is the SAME extraction logic used by both the static extractor
 * (index.ts) and the discovery engine (discover.ts). The extractors themselves
 * are untouched (Phase 1 requirement) — this module only orchestrates them so
 * the two entry points don't duplicate code.
 *
 *   Source → RSS(opt) → Website(GET) → change detection → PDFs → extractScheme
 */
import pLimit from 'p-limit';
import type { Source, SchemeRecord } from './types';
import { collectWebsite } from './collectors/websiteCollector';
import { collectRss } from './collectors/rssCollector';
import { collectPdfs } from './collectors/pdfCollector';
import { parseHtml } from './parsers/htmlParser';
import { extractScheme } from './extractors/schemeExtractor';
import { ChangeDetector } from './services/changeDetector';
import { logger } from './utils/logger';

export interface PipelineOptions {
  dryRun?: boolean;
  force?: boolean;
  concurrency?: number;
}

export interface ExtractionOutcome {
  records: SchemeRecord[];
  failed: number;
  /** Change verdicts keyed by source id — used for verification reporting. */
  changed: Record<string, boolean>;
}

/** Fetch → detect change → extract a single source. Never throws. */
export async function processSource(
  source: Source,
  detector: ChangeDetector,
  opts: PipelineOptions
): Promise<{ record: SchemeRecord | null; changed: boolean }> {
  try {
    logger.info(`Processing: ${source.programName} [${source.jurisdiction}] → ${source.url}`);

    // 1) RSS first (freshness accelerator).
    if (source.rss) {
      const items = await collectRss(source);
      if (items.length) logger.debug(`RSS returned ${items.length} item(s) for ${source.id}`);
    }

    // 2) Website (HEAD → GET → hash → PDF links).
    const page = await collectWebsite(source);

    // 3) Change detection.
    const verdict = detector.evaluate(
      source.url,
      { contentHash: page.contentHash, lastModified: page.lastModified, etag: page.etag },
      opts.force ?? false
    );
    logger.info(
      `Change verdict for ${source.id}: ${verdict.changed ? 'CHANGED' : 'unchanged'} (${verdict.reason})`
    );

    // 4) PDFs (only when the page links any).
    let pdfText = '';
    if (page.pdfLinks.length) {
      const pdfs = await collectPdfs(page.pdfLinks);
      pdfText = pdfs.map((p) => `[PDF ${p.url}]\n${p.text}`).join('\n\n');
    }

    // 5) Extraction.
    const parsed = parseHtml(page.html, source.url);
    const record = extractScheme({
      source,
      parsed,
      pdfText,
      officialUrl: source.url,
      changed: verdict.changed,
    });

    logger.ok(`Extracted scheme: ${record.schemeName} (${record.type || 'type?'})`);

    if (!opts.dryRun) {
      detector.record(
        source.url,
        { contentHash: page.contentHash, lastModified: page.lastModified, etag: page.etag },
        verdict.changed
      );
    }

    return { record, changed: verdict.changed };
  } catch (err) {
    logger.fail(`Failed page: ${source.programName} [${source.id}] — ${(err as Error).message}`);
    return { record: null, changed: false };
  }
}

/** Run the extraction pipeline over a list of sources (concurrency-limited). */
export async function runExtraction(
  sources: Source[],
  opts: PipelineOptions = {},
  detector: ChangeDetector = new ChangeDetector()
): Promise<ExtractionOutcome & { detector: ChangeDetector }> {
  const limit = pLimit(opts.concurrency ?? 3);
  const results = await Promise.all(
    sources.map((s) => limit(async () => ({ id: s.id, ...(await processSource(s, detector, opts)) })))
  );

  const records: SchemeRecord[] = [];
  const changed: Record<string, boolean> = {};
  let failed = 0;
  for (const r of results) {
    changed[r.id] = r.changed;
    if (r.record) records.push(r.record);
    else failed++;
  }
  return { records, failed, changed, detector };
}
