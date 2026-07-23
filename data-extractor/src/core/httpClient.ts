/**
 * HTTP client with retries + exponential backoff and a polite per-host delay.
 * Returns raw HTML for HTML pages, or a Buffer for binary (PDF) resources.
 */

import axios, { AxiosResponse } from 'axios';

export const USER_AGENT =
  'FirstNest-FHB-Research/1.0 (+deterministic scheme data collection; contact: research@firstnest.local)';

const lastHit = new Map<string, number>();
const DEFAULT_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Enforce a minimum gap between requests to the same host. */
async function throttle(host: string, delayMs: number): Promise<void> {
  const now = Date.now();
  const prev = lastHit.get(host) ?? 0;
  const wait = Math.max(0, prev + delayMs - now);
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
}

export interface HttpResult {
  status: number;
  finalUrl: string;
  contentType: string;
  data: string | Buffer;
}

export async function httpGet(
  url: string,
  opts: { binary?: boolean; delayMs?: number; retries?: number } = {}
): Promise<HttpResult> {
  const { binary = false, delayMs = DEFAULT_DELAY_MS, retries = 3 } = opts;
  const host = safeHost(url);
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    await throttle(host, delayMs);
    try {
      const res: AxiosResponse = await axios.get(url, {
        timeout: 25000,
        maxRedirects: 6,
        responseType: binary ? 'arraybuffer' : 'text',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: binary
            ? 'application/pdf,*/*'
            : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-AU,en;q=0.9',
        },
        validateStatus: () => true,
      });

      // Retry on transient server errors / rate limiting
      if ([429, 500, 502, 503, 504].includes(res.status) && attempt < retries) {
        const backoff = Math.min(1000 * 2 ** attempt, 8000);
        await sleep(backoff);
        attempt++;
        continue;
      }

      return {
        status: res.status,
        finalUrl: (res.request?.res?.responseUrl as string) || url,
        contentType: String(res.headers['content-type'] || ''),
        data: binary ? Buffer.from(res.data) : String(res.data),
      };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = Math.min(1000 * 2 ** attempt, 8000);
        await sleep(backoff);
        attempt++;
        continue;
      }
      break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
