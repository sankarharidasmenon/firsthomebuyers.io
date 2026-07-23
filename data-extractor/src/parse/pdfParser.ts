/**
 * PDF download + text extraction using pdf-parse.
 * PDFs are cached on disk to avoid re-downloading between runs.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { httpGet } from '../core/httpClient';
import { log } from '../core/logger';
import type { FetchedPdf } from '../types';

const CACHE_DIR = path.resolve(__dirname, '../../output/pdf-cache');

export async function fetchPdf(url: string): Promise<FetchedPdf | null> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const key = crypto.createHash('md5').update(url).digest('hex');
  const cachePath = path.join(CACHE_DIR, `${key}.pdf`);

  let buffer: Buffer;
  try {
    if (fs.existsSync(cachePath)) {
      buffer = fs.readFileSync(cachePath);
    } else {
      const res = await httpGet(url, { binary: true, retries: 2 });
      if (res.status !== 200 || !(res.data instanceof Buffer)) {
        log.broken(url, `PDF HTTP ${res.status}`);
        return null;
      }
      buffer = res.data;
      fs.writeFileSync(cachePath, buffer);
    }
  } catch (err) {
    log.broken(url, `PDF download failed: ${(err as Error).message}`);
    return null;
  }

  try {
    // Lazy require: pdf-parse pulls in a test file at import time in some setups.
    const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string; numpages: number }>;
    const parsed = await pdfParse(buffer);
    const text = parsed.text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    log.pdf(url, `${parsed.numpages} pages, ${text.length} chars`);
    return { url, text, pages: parsed.numpages };
  } catch (err) {
    log.warn(`PDF parse failed ${url}: ${(err as Error).message}`);
    return null;
  }
}
