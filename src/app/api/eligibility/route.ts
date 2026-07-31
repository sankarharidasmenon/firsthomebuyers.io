/**
 * POST /api/eligibility — the ONE place eligibility is evaluated at runtime.
 *
 * Body: the normalised EligibilityAnswers produced by
 * `logic.ts → toEligibilityAnswers()`.
 *
 * Loads scheme rows from Supabase (the only metadata source), runs the engine
 * once per scheme, and returns the finished EligibilityResult. The browser
 * renders that result verbatim — it does not evaluate anything itself, so the
 * page and `scripts/audit-bd02.ts` cannot disagree.
 */
import { buildEligibilityResult, type ApiScheme, type EligibilityAnswers } from '@/lib/schemes/eligibilityClient';
import { listSchemes } from '@/lib/schemes/repository';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const answers = (await req.json()) as EligibilityAnswers;
    if (!answers || typeof answers.state !== 'string') {
      return Response.json({ error: 'Invalid answers payload: `state` is required.' }, { status: 400 });
    }

    const schemes = (await listSchemes()) as unknown as ApiScheme[];
    const result = buildEligibilityResult(schemes, answers);

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
