/**
 * POST /api/uploads/delete — best-effort cleanup of feedback screenshots that
 * will never be referenced by a `feedback` row.
 *
 * Called from the browser in three situations, none of which are "the user
 * submitted feedback": a card was removed after its upload finished, the
 * modal was closed (or the tab closed/refreshed) while an upload was
 * sitting there unsubmitted, or the /api/feedback insert failed after the
 * uploads had already succeeded. In every case the object was written to S3
 * but no database row will ever point at it, so it's deleted rather than
 * left as an orphan.
 *
 * Anonymous (matches /api/uploads/presigned-url — feedback itself can be
 * submitted signed out). A key only does anything if it looks like one this
 * app's own presign route would have issued (see deleteFeedbackAttachments),
 * so this can't be used to delete arbitrary bucket objects.
 *
 * Also reachable via `navigator.sendBeacon`, which browsers use to fire this
 * off during page unload — the body arrives as plain-text JSON in that case,
 * which `request.json()` parses the same as an ordinary fetch POST.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { deleteFeedbackAttachments, isAwsConfigured } from '@/lib/aws/s3';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_MAX_KEYS = 5000;

const recentRequests = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip || 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  if (recentRequests.size > RATE_LIMIT_MAX_KEYS) {
    for (const [k, times] of recentRequests) {
      if (times.every((t) => t <= cutoff)) recentRequests.delete(k);
    }
  }

  const hits = (recentRequests.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentRequests.set(key, hits);
    return true;
  }

  hits.push(now);
  recentRequests.set(key, hits);
  return false;
}

interface DeleteRequestBody {
  keys?: unknown;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  if (!isAwsConfigured()) {
    return NextResponse.json({ ok: true, deleted: [] });
  }

  let body: DeleteRequestBody;
  try {
    body = (await request.json()) as DeleteRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    return NextResponse.json({ ok: true, deleted: [] });
  }

  try {
    const deleted = await deleteFeedbackAttachments(body.keys);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    // Cleanup is best-effort — log for a human to reconcile later, but don't
    // surface this as a hard failure to a caller that's often just a
    // sendBeacon with nobody listening for the response.
    console.error('[uploads/delete] unexpected error:', error);
    return NextResponse.json({ error: 'Could not delete objects.' }, { status: 500 });
  }
}
