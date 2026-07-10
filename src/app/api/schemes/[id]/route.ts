/** GET /api/schemes/:id — one scheme by scheme_id or uuid (public). */
import { getScheme } from '@/lib/schemes/repository';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const scheme = await getScheme(id);
    if (!scheme) return Response.json({ error: `Scheme "${id}" not found.` }, { status: 404 });
    return Response.json({ scheme });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
