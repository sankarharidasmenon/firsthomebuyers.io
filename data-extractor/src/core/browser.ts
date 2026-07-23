/**
 * Playwright fallback for pages that block plain HTTP (403/anti-bot) or need
 * JavaScript to render content. A single shared Chromium instance is reused.
 */

import type { Browser, BrowserContext } from 'playwright';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let available = true;

const REAL_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function ensure(): Promise<BrowserContext | null> {
  if (!available) return null;
  if (context) return context;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      userAgent: REAL_UA,
      locale: 'en-AU',
      viewport: { width: 1366, height: 900 },
    });
    return context;
  } catch (err) {
    available = false;
    return null;
  }
}

export interface RenderResult {
  status: number;
  finalUrl: string;
  html: string;
}

export async function renderPage(url: string): Promise<RenderResult | null> {
  const ctx = await ensure();
  if (!ctx) return null;
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    // Give client-rendered content a moment; ignore networkidle timeouts on chatty sites.
    await page.waitForTimeout(1200);
    const html = await page.content();
    return {
      status: resp?.status() ?? 0,
      finalUrl: page.url(),
      html,
    };
  } catch {
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

export function browserAvailable(): boolean {
  return available;
}

export async function closeBrowser(): Promise<void> {
  try {
    await context?.close();
    await browser?.close();
  } catch {
    /* ignore */
  }
  context = null;
  browser = null;
}
