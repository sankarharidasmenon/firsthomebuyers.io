/** GET /api/schemes — all schemes from Supabase (public). */
import { listSchemes } from '@/lib/schemes/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schemes = await listSchemes();
    return Response.json({ schemes, count: schemes.length });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
