/**
 * POST /api/feedback — records a submission from the floating feedback widget.
 *
 * Security notes:
 *  - Writes with the CALLER's own Supabase session (anon or authenticated) via
 *    getServerAuthClient(), so Row Level Security applies. The service-role key
 *    is never used here and never reaches the browser.
 *  - Identity columns (user_id / user_name / user_email) come from the
 *    server-side session, never from the request body, so a caller cannot
 *    attribute feedback to somebody else.
 *  - Every field is re-validated and sanitised server-side; the client-side
 *    checks in the modal are UX only.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerAuthClient } from '@/lib/supabase/serverAuth';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import {
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  isFeedbackType,
  sanitizeMetadata,
  sanitizeText,
  validateFeedback,
} from '@/lib/feedback/validation';
import type {
  FeedbackApiResponse,
  FeedbackInsert,
  FeedbackSubmission,
  ThemeName,
} from '@/lib/feedback/types';

/* ── Spam control ─────────────────────────────────────────────────────────
   A small fixed-window limiter keyed on client IP. In-process only (resets on
   redeploy and is per-instance), which is enough to stop casual flooding; a
   shared store would be the next step if abuse becomes real. */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
/** Guards the map itself from unbounded growth under a distributed flood. */
const RATE_LIMIT_MAX_KEYS = 5000;

const recentSubmissions = new Map<string, number[]>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip || 'unknown';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  // Opportunistic sweep so expired keys don't accumulate.
  if (recentSubmissions.size > RATE_LIMIT_MAX_KEYS) {
    for (const [k, times] of recentSubmissions) {
      if (times.every((t) => t <= cutoff)) recentSubmissions.delete(k);
    }
  }

  const hits = (recentSubmissions.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(key, hits);
    return true;
  }

  hits.push(now);
  recentSubmissions.set(key, hits);
  return false;
}

function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark';
}

function json(body: FeedbackApiResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  let body: Partial<FeedbackSubmission>;
  try {
    body = (await request.json()) as Partial<FeedbackSubmission>;
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  // Honeypot: a real user never sees this field. Report success so bots get no
  // signal, but write nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const fieldErrors = validateFeedback(body);
  if (Object.keys(fieldErrors).length > 0) {
    return json(
      { ok: false, error: 'Please check the highlighted fields.', fieldErrors },
      400
    );
  }

  if (isRateLimited(clientKey(request))) {
    return json(
      { ok: false, error: "You've sent a few messages already — please try again a little later." },
      429
    );
  }

  if (!isSupabaseConfigured()) {
    console.error('[feedback] Supabase is not configured; submission dropped.');
    return json({ ok: false, error: 'Feedback is temporarily unavailable. Please try again later.' }, 503);
  }

  // Narrowed by validateFeedback above, but re-checked so the type is provable.
  if (!isFeedbackType(body.feedbackType)) {
    return json({ ok: false, error: 'Please check the highlighted fields.' }, 400);
  }

  try {
    const supabase = await getServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userName: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle<{ full_name: string | null }>();
      userName = profile?.full_name ?? null;
    }

    const email = sanitizeText(body.email, EMAIL_MAX_LENGTH);

    const row: FeedbackInsert = {
      feedback_type: body.feedbackType,
      message: sanitizeText(body.message, MESSAGE_MAX_LENGTH),
      email: email || null,
      page_url: sanitizeMetadata(body.pageUrl),
      // The request header is authoritative; the client value is only a fallback.
      user_agent: sanitizeMetadata(request.headers.get('user-agent') ?? body.userAgent),
      screen_resolution: sanitizeMetadata(body.screenResolution),
      theme: isThemeName(body.theme) ? body.theme : null,
      user_id: user?.id ?? null,
      user_name: userName,
      user_email: user?.email ?? null,
    };

    const { error } = await supabase.from('feedback').insert(row);

    if (error) {
      console.error('[feedback] insert failed:', error.message);
      return json({ ok: false, error: 'We could not save your feedback. Please try again.' }, 500);
    }

    return json({ ok: true }, 201);
  } catch (error) {
    console.error('[feedback] unexpected error:', error);
    return json({ ok: false, error: 'Something went wrong on our end. Please try again.' }, 500);
  }
}
