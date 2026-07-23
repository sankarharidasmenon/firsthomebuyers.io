/**
 * Domain gate. Only official government hosts (matched by suffix against
 * ALLOWED_DOMAINS) are ever fetched. Everything else is skipped.
 */

import { ALLOWED_DOMAINS, BLOCKED_HOST_PATTERNS } from '../config/sources';

export function isAllowedDomain(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).host.toLowerCase();
  } catch {
    return false;
  }
  // must be https/http gov host
  return ALLOWED_DOMAINS.some(
    (d) => host === d || host.endsWith('.' + d) || host === 'www.' + d
  );
}

export function isBlockedHost(url: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((re) => re.test(url));
}
