/**
 * POST /api/grant-calculator — Grant Calculator only (public, read-only).
 *
 * Separate from /api/eligibility by design: that route runs the questionnaire
 * rule engine, which needs the full answer set. This one runs the calculator's
 * own engine over the three inputs the calculator collects. Neither route
 * shares logic with the other; see lib/calculator/grantCalculator.ts.
 *
 * Reads scheme metadata through the existing repository, unmodified. Writes
 * nothing.
 */
import { listSchemes } from '@/lib/schemes/repository'
import { calculateGrants, type CalculatorInput, type CalculatorScheme } from '@/lib/calculator/grantCalculator'

export const dynamic = 'force-dynamic'

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']
const PROPERTY_TYPES = ['house', 'townhouse', 'apartment', 'offplan']

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const state = String(body?.state ?? '').toUpperCase()
    const propertyType = String(body?.propertyType ?? '')
    const propertyPrice = Number(body?.propertyPrice)

    if (!STATES.includes(state)) {
      return Response.json({ error: `Unknown state: ${body?.state}` }, { status: 400 })
    }
    if (!PROPERTY_TYPES.includes(propertyType)) {
      return Response.json({ error: `Unknown property type: ${body?.propertyType}` }, { status: 400 })
    }
    if (!Number.isFinite(propertyPrice) || propertyPrice < 0) {
      return Response.json({ error: `Invalid property price: ${body?.propertyPrice}` }, { status: 400 })
    }

    const schemes = (await listSchemes()) as unknown as CalculatorScheme[]
    const input: CalculatorInput = {
      state,
      propertyType: propertyType as CalculatorInput['propertyType'],
      propertyPrice,
    }

    return Response.json(calculateGrants(schemes, input))
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
