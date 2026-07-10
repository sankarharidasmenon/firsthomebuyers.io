/** GET /api/schemes/featured — active schemes for homepage cards (public). */
import { listFeatured } from '@/lib/schemes/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get('limit')) || 6;
  try {
    const schemes = await listFeatured(limit);
    return Response.json({ schemes, count: schemes.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
