/**
 * Quality analyzer — builds a SchemeQuality for every scheme WITHOUT modifying
 * the crawler, discovery engine, or extraction pipeline.
 *
 * For each scheme it fetches the page + PDFs (using the existing collectors as
 * libraries) and runs the UNCHANGED `extractScheme` three ways:
 *   - combined (HTML + PDF)  → the authoritative record (matches the Excel)
 *   - HTML only              → to see what the page alone yields
 *   - PDF only               → to see what the PDF alone yields
 * Comparing the three gives per-field provenance, conflicts and completeness.
 */
import pLimit from 'p-limit';
import type { Source } from '../types';
import type { ParsedHtml } from '../parsers/htmlParser';
import type { PdfResult, SchemeQuality } from './types';
import { collectWebsite } from '../collectors/websiteCollector';
import { parseHtml } from '../parsers/htmlParser';
import { parsePdf } from '../parsers/pdfParser';
import { downloadPdf, cleanupTempFile } from '../services/pageDownloader';
import { extractScheme } from '../extractors/schemeExtractor';
import { computeCompleteness } from './completenessReport';
import { trackFieldSources } from './sourceTracker';
import { logger } from '../utils/logger';

const EMPTY_PARSED: ParsedHtml = {
  title: '',
  metaDescription: '',
  text: '',
  headings: [],
  listItems: [],
  links: [],
};

const MAX_PDFS_PER_PAGE = 4; // mirrors the pipeline's pdfCollector

/**
 * Download + parse a page's PDFs, capturing per-PDF success/failure metadata.
 * Returns two forms of the text:
 *   - `pdfText`    with the `[PDF url]` markers (identical to what the pipeline
 *                  feeds the extractor — used for the authoritative record)
 *   - `rawPdfText` without markers (used for the PDF-only provenance run, so the
 *                  marker text doesn't leak into field values / conflicts)
 */
async function collectPdfsWithMeta(
  pdfLinks: string[]
): Promise<{ pdfText: string; rawPdfText: string; results: PdfResult[] }> {
  const results: PdfResult[] = [];
  const chunks: string[] = [];
  const rawChunks: string[] = [];
  for (const url of pdfLinks.slice(0, MAX_PDFS_PER_PAGE)) {
    let tempPath: string | undefined;
    try {
      const dl = await downloadPdf(url);
      tempPath = dl.tempPath;
      const parsed = await parsePdf(dl.buffer);
      results.push({ url, downloaded: true, parsed: true, pages: parsed.numPages });
      chunks.push(`[PDF ${url}]\n${parsed.text}`);
      rawChunks.push(parsed.text);
    } catch (err) {
      results.push({ url, downloaded: false, parsed: false, pages: 0, reason: (err as Error).message });
      logger.debug(`Quality: PDF failed ${url} — ${(err as Error).message}`);
    } finally {
      if (tempPath) cleanupTempFile(tempPath);
    }
  }
  return { pdfText: chunks.join('\n\n'), rawPdfText: rawChunks.join('\n\n'), results };
}

/** Analyze a single scheme source. Never throws. */
export async function analyzeScheme(source: Source): Promise<SchemeQuality> {
  const base: SchemeQuality = {
    schemeId: source.id,
    schemeName: source.programName,
    jurisdiction: source.jurisdiction,
    programName: source.programName,
    url: source.url,
    extracted: false,
    record: {} as SchemeQuality['record'],
    completeness: { filled: 0, total: 56, pct: 0, missing: [], reviewRequired: true },
    fieldSources: [],
    conflicts: [],
    pdfFound: false,
    pdfResults: [],
  };

  try {
    const page = await collectWebsite(source);
    const parsed = parseHtml(page.html, source.url);

    const { pdfText, rawPdfText, results: pdfResults } = page.pdfLinks.length
      ? await collectPdfsWithMeta(page.pdfLinks)
      : { pdfText: '', rawPdfText: '', results: [] as PdfResult[] };

    // Run the UNCHANGED extractor three ways.
    // final: HTML + PDF (marked) — matches exactly what the pipeline produces.
    const finalRec = extractScheme({ source, parsed, pdfText, officialUrl: source.url, changed: false });
    // html-only: page text alone.
    const htmlRec = extractScheme({ source, parsed, pdfText: '', officialUrl: source.url, changed: false });
    // pdf-only: PDF text alone (unmarked), empty HTML — for provenance/conflicts.
    const pdfRec = rawPdfText
      ? extractScheme({ source, parsed: EMPTY_PARSED, pdfText: rawPdfText, officialUrl: source.url, changed: false })
      : null;

    const completeness = computeCompleteness(finalRec);
    const { fieldSources, conflicts } = trackFieldSources(
      finalRec.schemeName || source.programName,
      source.jurisdiction,
      finalRec,
      htmlRec,
      pdfRec
    );

    logger.ok(
      `Analyzed ${finalRec.schemeName} [${source.jurisdiction}] — ${completeness.pct}% complete, ${conflicts.length} conflict(s), ${pdfResults.length} PDF(s)`
    );

    return {
      ...base,
      schemeName: finalRec.schemeName || source.programName,
      extracted: true,
      record: finalRec,
      completeness,
      fieldSources,
      conflicts,
      pdfFound: page.pdfLinks.length > 0,
      pdfResults,
    };
  } catch (err) {
    logger.fail(`Quality analysis failed for ${source.programName} — ${(err as Error).message}`);
    return base;
  }
}

/** Analyze all schemes with limited concurrency. */
export async function analyzeAll(sources: Source[], concurrency = 3): Promise<SchemeQuality[]> {
  const limit = pLimit(concurrency);
  return Promise.all(sources.map((s) => limit(() => analyzeScheme(s))));
}
