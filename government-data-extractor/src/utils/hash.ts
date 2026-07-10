/**
 * SHA-256 content hashing used for change detection.
 */
import crypto from 'crypto';

export function sha256(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Hash of the *meaningful* content of a page. We strip scripts/styles and
 * collapse whitespace so cosmetic markup churn does not register as a change.
 */
export function contentHash(normalizedText: string): string {
  return sha256(normalizedText.replace(/\s+/g, ' ').trim());
}
