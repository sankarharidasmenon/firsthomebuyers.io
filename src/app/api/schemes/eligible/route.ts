/**
 * GET /api/schemes/eligible — schemes matching a user's answers (public).
 *
 * Query params: state, firstHomeBuyer, income, hasPartner, propertyPrice,
 * propertyType. Filtering is deterministic and uses db columns (no hardcoded
 * scheme names).
 */
import { listEligible, type EligibilityQuery } from '@/lib/schemes/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const num = (key: string) => (p.get(key) ? Number(p.get(key)) : undefined);

  const query: EligibilityQuery = {
    state: p.get('state') || undefined,
    firstHomeBuyer: p.has('firstHomeBuyer') ? p.get('firstHomeBuyer') !== 'false' : undefined,
    income: num('income'),
    hasPartner: p.get('hasPartner') === 'true',
    propertyPrice: num('propertyPrice'),
    propertyType: p.get('propertyType') || undefined,
    singleParent: p.has('singleParent') ? p.get('singleParent') === 'true' : undefined,
    deposit: num('deposit'),
  };

  try {
    const schemes = await listEligible(query);
    return Response.json({ schemes, count: schemes.length, query });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
