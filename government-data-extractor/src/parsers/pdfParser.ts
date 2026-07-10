/**
 * PDF → text parsing using pdf-parse. We only need the plain text; extractors
 * pull structured facts from it exactly as they do from HTML text.
 */
import { normalizeWhitespace } from '../utils/helpers';

// pdf-parse has no bundled types beyond @types/pdf-parse; require lazily so a
// missing/broken install of the native-ish lib fails per-PDF, not at startup.
export interface ParsedPdf {
  text: string;
  numPages: number;
  info?: Record<string, unknown>;
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse') as (
    b: Buffer
  ) => Promise<{ text: string; numpages: number; info: Record<string, unknown> }>;
  const result = await pdfParse(buffer);
  return {
    text: normalizeWhitespace(result.text),
    numPages: result.numpages,
    info: result.info,
  };
}
