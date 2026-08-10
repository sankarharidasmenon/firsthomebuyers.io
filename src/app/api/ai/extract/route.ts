/**
 * POST /api/ai/extract — turn a free-text description of a buyer's situation
 * into validated questionnaire fields (see lib/ai/extract.ts). Returns 503
 * when no AI provider is configured so the client can fall back to the form
 * silently rather than erroring.
 */
import { extractAnswersFromText } from '@/lib/ai/extract'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let text: unknown
  try {
    ;({ text } = await req.json())
  } catch {
    return Response.json({ error: 'Expected JSON body with a `text` field.' }, { status: 400 })
  }
  if (typeof text !== 'string' || text.trim().length < 3) {
    return Response.json({ error: 'Describe your situation in a sentence or two first.' }, { status: 400 })
  }
  if (text.length > 2000) {
    return Response.json({ error: 'Keep the description under 2,000 characters.' }, { status: 400 })
  }

  try {
    const fields = await extractAnswersFromText(text.trim())
    return Response.json({ fields })
  } catch (err) {
    const e = err as Error & { code?: string }
    if (e.code === 'not-configured') {
      return Response.json({ error: 'AI fill is not configured in this environment.' }, { status: 503 })
    }
    return Response.json({ error: 'Could not understand that just now — try the questions below.' }, { status: 500 })
  }
}
