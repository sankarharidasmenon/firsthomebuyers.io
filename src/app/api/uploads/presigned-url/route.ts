/**
 * POST /api/uploads/presigned-url — mints a short-lived S3 PUT URL for one
 * feedback screenshot.
 *
 * The browser never touches AWS credentials and never uploads through this
 * server: it POSTs {fileName, contentType, fileSize} here, gets back
 * {uploadUrl, key}, then PUTs the file straight to S3 with that URL. The
 * bucket stays private throughout.
 *
 * Anonymous callers are allowed (feedback itself can be submitted signed
 * out), so abuse is bounded with the same kind of small fixed-window IP
 * limiter used by /api/feedback rather than an auth check.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createFeedbackUploadUrl, isAwsConfigured, PresignValidationError } from '@/lib/aws/s3';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 40; // generous: up to 5 files across several submissions/retries
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

interface PresignRequestBody {
  fileName?: unknown;
  contentType?: unknown;
  fileSize?: unknown;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: 'Too many upload requests — please try again shortly.' },
      { status: 429 }
    );
  }

  if (!isAwsConfigured()) {
    console.error('[uploads/presigned-url] AWS is not configured.');
    return NextResponse.json(
      { error: 'Attachment uploads are temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  let body: PresignRequestBody;
  try {
    body = (await request.json()) as PresignRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const result = await createFeedbackUploadUrl({
      fileName: body.fileName,
      contentType: body.contentType,
      fileSize: body.fileSize,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof PresignValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[uploads/presigned-url] unexpected error:', error);
    return NextResponse.json({ error: 'Could not prepare the upload. Please try again.' }, { status: 500 });
  }
}
