/**
 * HTTP layer built on axios.
 *
 * Responsibilities:
 *  - Enforce the official-host allowlist (never fetch non-.gov.au).
 *  - HEAD request first to capture Last-Modified / ETag cheaply.
 *  - GET the HTML with sensible timeouts, retries and a descriptive UA.
 *  - Download PDF buffers to a temp file for parsing, then let the caller delete.
 */
import axios, { AxiosError } from 'axios';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium } from 'playwright';
import { isOfficialHost } from '../config/sources';
import { logger } from '../utils/logger';
import { sha256 } from '../utils/hash';
import { sleep } from '../utils/helpers';

// Many government sites sit behind CDN bot-protection (Akamai/Cloudflare) that
// rejects non-browser User-Agents with a 403. We send a standard desktop-browser
// UA and Accept headers so we can read the same PUBLIC pages a person would.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-AU,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;

export interface HeadInfo {
  status: number;
  lastModified?: string;
  etag?: string;
  contentType?: string;
}

/** Coerce an axios header value (which may be null/number) to string|undefined. */
function hdr(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function assertOfficial(url: string): void {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!isOfficialHost(host)) {
    throw new Error(`Refusing non-official host: ${host} (${url})`);
  }
}

/** HEAD request — cheap freshness metadata. Falls back gracefully on error. */
export async function headPage(url: string): Promise<HeadInfo | null> {
  assertOfficial(url);
  try {
    const res = await axios.head(url, {
      timeout: DEFAULT_TIMEOUT,
      headers: BROWSER_HEADERS,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return {
      status: res.status,
      lastModified: hdr(res.headers['last-modified']),
      etag: hdr(res.headers['etag']),
      contentType: hdr(res.headers['content-type']),
    };
  } catch (err) {
    logger.debug(`HEAD failed for ${url}: ${(err as Error).message}`);
    return null;
  }
}

export interface GetResult {
  status: number;
  html: string;
  lastModified?: string;
  etag?: string;
  contentType?: string;
}

/** GET an HTML page with retry + backoff, with a curl fallback for 403s. */
export async function getPage(url: string): Promise<GetResult> {
  assertOfficial(url);
  let lastErr: unknown;
  let saw403 = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const origin = new URL(url).origin;
      const res = await axios.get<string>(url, {
        timeout: DEFAULT_TIMEOUT,
        headers: { ...BROWSER_HEADERS, Referer: origin + '/', 'Sec-Fetch-Site': 'same-origin' },
        maxRedirects: 5,
        responseType: 'text',
        transitional: { silentJSONParsing: false },
        validateStatus: () => true,
      });
      if (res.status === 403) saw403 = true;
      if (res.status >= 400) {
        throw new Error(`HTTP ${res.status}`);
      }
      return {
        status: res.status,
        html: typeof res.data === 'string' ? res.data : String(res.data),
        lastModified: hdr(res.headers['last-modified']),
        etag: hdr(res.headers['etag']),
        contentType: hdr(res.headers['content-type']),
      };
    } catch (err) {
      lastErr = err;
      const code = (err as AxiosError)?.code || '';
      logger.warn(
        `GET attempt ${attempt}/${MAX_RETRIES} failed for ${url}: ${
          (err as Error).message
        }${code ? ` (${code})` : ''}`
      );
      if (attempt < MAX_RETRIES) await sleep(attempt * 1500);
    }
  }

  // Some government CDNs (Akamai Bot Manager) block Node's TLS fingerprint while
  // allowing the same request from curl. We fall back to curl — a legitimate,
  // widely-installed HTTP client — on ANY exhausted failure (not only 403s):
  // axios may also fail with ECONNRESET / EPROTO on these hosts.
  const viaCurl = await curlGet(url);
  if (viaCurl) {
    logger.ok(`Recovered via curl fallback: ${url}`);
    return viaCurl;
  }

  if (saw403) {
    logger.warn(`HTTP 403 detected. Attempting Playwright fallback...`);
    const viaPlaywright = await playwrightGet(url);
    if (viaPlaywright) {
      logger.ok(`Recovered via Playwright fallback: ${url}`);
      return viaPlaywright;
    } else {
      logger.warn(`Playwright fallback failed for: ${url}`);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// A couple of realistic desktop UAs to rotate through if a host is picky.
const CURL_USER_AGENTS = [
  USER_AGENT,
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
];

/**
 * Fetch a page by shelling out to curl, retrying with backoff and rotating the
 * User-Agent. Returns null only if curl is unavailable or every attempt failed.
 */
async function curlGet(url: string): Promise<GetResult | null> {
  const origin = new URL(url).origin;
  const marker = '\n__HTTP_STATUS__:';
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ua = CURL_USER_AGENTS[(attempt - 1) % CURL_USER_AGENTS.length];
    const args = [
      '-sSL',
      '--compressed',
      '--http1.1',
      '--retry', '1',
      '--retry-delay', '1',
      '--max-time', String(Math.round((DEFAULT_TIMEOUT * 2) / 1000)),
      '-A', ua,
      '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '-H', 'Accept-Language: en-AU,en;q=0.9',
      '-H', `Referer: ${origin}/`,
      '-w', `${marker}%{http_code}`,
      url,
    ];
    try {
      const body = await new Promise<string>((resolve, reject) => {
        execFile('curl', args, { maxBuffer: 25 * 1024 * 1024 }, (err, stdout) => {
          if (err && !stdout) reject(err);
          else resolve(stdout);
        });
      });
      const idx = body.lastIndexOf(marker);
      if (idx !== -1) {
        const html = body.slice(0, idx);
        const status = parseInt(body.slice(idx + marker.length).trim(), 10) || 0;
        if (status < 400 && html) return { status, html };
        logger.debug(`curl attempt ${attempt}/${maxAttempts} for ${url}: HTTP ${status}`);
      }
    } catch (err) {
      logger.debug(`curl attempt ${attempt}/${maxAttempts} error for ${url}: ${(err as Error).message}`);
    }
    if (attempt < maxAttempts) await sleep(attempt * 1500);
  }
  return null;
}

/**
 * Download a PDF to a temp file and return its path + buffer. Caller MUST call
 * cleanupTempFile() when done (spec: delete temporary PDF after parsing).
 */
export async function downloadPdf(
  url: string
): Promise<{ tempPath: string; buffer: Buffer }> {
  assertOfficial(url);
  const res = await axios.get<ArrayBuffer>(url, {
    timeout: DEFAULT_TIMEOUT * 2,
    headers: { ...BROWSER_HEADERS, Accept: 'application/pdf,*/*' },
    maxRedirects: 5,
    responseType: 'arraybuffer',
    validateStatus: () => true,
  });
  if (res.status >= 400) throw new Error(`HTTP ${res.status} downloading PDF`);
  const buffer = Buffer.from(res.data);
  const name = `scheme-pdf-${sha256(url).slice(0, 12)}.pdf`;
  const tempPath = path.join(os.tmpdir(), name);
  fs.writeFileSync(tempPath, buffer);
  return { tempPath, buffer };
}

export function cleanupTempFile(tempPath: string): void {
  try {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  } catch (err) {
    logger.debug(`Could not delete temp file ${tempPath}: ${(err as Error).message}`);
  }
}

/**
 * Fetch a page by launching a headless Chromium browser.
 * Used exclusively as a last-resort fallback for stubborn 403s.
 */
async function playwrightGet(url: string): Promise<GetResult | null> {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: DEFAULT_TIMEOUT });
    
    if (!response) {
      await browser.close();
      return null;
    }
    
    const html = await page.content();
    const status = response.status();
    await browser.close();
    
    if (status < 400 && html) {
      return { status, html };
    }
    return null;
  } catch (err) {
    logger.debug(`Playwright error for ${url}: ${(err as Error).message}`);
    return null;
  }
}

export { USER_AGENT };
