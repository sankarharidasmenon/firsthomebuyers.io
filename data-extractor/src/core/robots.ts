/**
 * Minimal robots.txt fetcher + evaluator.
 * Fetches /robots.txt per host, caches it, and evaluates Allow/Disallow for
 * User-agent: * (and our own UA). Conservative: on parse failure we allow,
 * but we always apply a polite crawl delay regardless.
 */

import axios from 'axios';
import { USER_AGENT } from './httpClient';

interface RobotsRule {
  path: string;
  allow: boolean;
}

interface RobotsData {
  rules: RobotsRule[];
  crawlDelayMs: number;
}

const cache = new Map<string, RobotsData>();

function parseRobots(txt: string): RobotsData {
  const lines = txt.split(/\r?\n/);
  const rules: RobotsRule[] = [];
  let crawlDelayMs = 0;
  let appliesToUs = false;

  for (const raw of lines) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      const ua = value.toLowerCase();
      appliesToUs = ua === '*' || USER_AGENT.toLowerCase().includes(ua);
    } else if (appliesToUs && (field === 'disallow' || field === 'allow')) {
      if (value) rules.push({ path: value, allow: field === 'allow' });
    } else if (appliesToUs && field === 'crawl-delay') {
      const n = parseFloat(value);
      if (!isNaN(n)) crawlDelayMs = Math.min(n * 1000, 10000);
    }
  }
  return { rules, crawlDelayMs };
}

export async function getRobots(origin: string): Promise<RobotsData> {
  if (cache.has(origin)) return cache.get(origin)!;
  let data: RobotsData = { rules: [], crawlDelayMs: 0 };
  try {
    const res = await axios.get(`${origin}/robots.txt`, {
      timeout: 12000,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: () => true,
    });
    if (res.status === 200 && typeof res.data === 'string') {
      data = parseRobots(res.data);
    }
  } catch {
    /* allow on failure */
  }
  cache.set(origin, data);
  return data;
}

/** Longest-match rule wins (standard robots semantics). */
export async function isAllowed(url: string): Promise<{ allowed: boolean; crawlDelayMs: number }> {
  let origin: string;
  let pathname: string;
  try {
    const u = new URL(url);
    origin = u.origin;
    pathname = u.pathname + u.search;
  } catch {
    return { allowed: false, crawlDelayMs: 0 };
  }
  const robots = await getRobots(origin);
  let best: RobotsRule | null = null;
  for (const rule of robots.rules) {
    // convert robots wildcard path to prefix match
    const rulePath = rule.path;
    const matches = pathMatches(pathname, rulePath);
    if (matches && (!best || rulePath.length > best.path.length)) best = rule;
  }
  const allowed = best ? best.allow : true;
  return { allowed, crawlDelayMs: robots.crawlDelayMs };
}

function pathMatches(pathname: string, rule: string): boolean {
  // Support '*' wildcard and '$' end-anchor minimally.
  if (rule === '/') return true;
  let pattern = rule.replace(/[.+^${}()|[\]\\]/g, '\\$&'); // escape regex specials except * and $ handled below
  pattern = pattern.replace(/\\\*/g, '.*'); // our escaping turned * into \*, revert to .*
  pattern = pattern.replace(/\*/g, '.*');
  let anchored = false;
  if (pattern.endsWith('$')) {
    anchored = true;
    pattern = pattern.slice(0, -1);
  }
  const re = new RegExp('^' + pattern + (anchored ? '$' : ''));
  return re.test(pathname);
}
