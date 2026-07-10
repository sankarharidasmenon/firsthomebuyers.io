/**
 * PDF collector: downloads linked PDFs to a temp file, extracts text, then
 * deletes the temp file (spec: never keep the PDF). Returns concatenated text
 * for the extractors to mine, prefixed with a source marker per document.
 *
 * We cap how many PDFs we pull per page to stay polite and fast.
 */
import { downloadPdf, cleanupTempFile } from '../services/pageDownloader';
import { parsePdf } from '../parsers/pdfParser';
import { logger } from '../utils/logger';

const MAX_PDFS_PER_PAGE = 4;
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB safety cap

export interface CollectedPdf {
  url: string;
  text: string;
  numPages: number;
}

export async function collectPdfs(pdfLinks: string[]): Promise<CollectedPdf[]> {
  const out: CollectedPdf[] = [];
  const targets = pdfLinks.slice(0, MAX_PDFS_PER_PAGE);

  for (const url of targets) {
    let tempPath: string | undefined;
    try {
      const dl = await downloadPdf(url);
      tempPath = dl.tempPath;
      if (dl.buffer.length > MAX_PDF_BYTES) {
        logger.warn(`Skipping oversized PDF (${dl.buffer.length} bytes): ${url}`);
        continue;
      }
      logger.ok(`Downloaded PDF: ${url} (${dl.buffer.length} bytes)`);
      const parsed = await parsePdf(dl.buffer);
      logger.ok(`Parsed PDF: ${url} — ${parsed.numPages} page(s), ${parsed.text.length} chars`);
      out.push({ url, text: parsed.text, numPages: parsed.numPages });
    } catch (err) {
      logger.warn(`PDF failed (${url}): ${(err as Error).message}`);
    } finally {
      if (tempPath) cleanupTempFile(tempPath);
    }
  }

  return out;
}
