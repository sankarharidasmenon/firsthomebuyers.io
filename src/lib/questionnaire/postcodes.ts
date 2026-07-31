/**
 * NSW, VIC, QLD, SA & ACT suburb/postcode data for the location combobox (C14).
 *
 * A curated list of common suburbs powers the searchable dropdown; any valid
 * 4-digit postcode typed directly is also accepted via `inferState`.
 * State is always derived from the postcode — the applicant never picks it.
 */
import type { StateCode } from './types'

/**
 * Where a suburb sits for the federal price caps, which publish a higher figure
 * for the capital city and listed regional centres than for the rest of a state.
 *
 * Optional: a suburb without a region behaves exactly as before — the engine
 * cannot pick between the two caps and reports "confirm the cap for your
 * suburb". Queensland and South Australia are classified at present.
 */
export type PriceCapRegion = 'capital' | 'regional-centre' | 'rest'

export interface SuburbEntry {
  suburb: string
  postcode: string
  state: StateCode
  region?: PriceCapRegion
}

/**
 * South Australian postcodes classified by Housing Australia's price cap.
 *
 * Unlike NSW, VIC and QLD — where only the curated `SUBURBS` entries carry a
 * region — every SA postcode is classified, because the classification could be
 * read directly from the determinant itself: Housing Australia's own Postcode
 * Search Tool, which returns the applicable cap for each of the 1,870 SA
 * localities. Captured 29 July 2026 from
 * https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps
 *
 * Housing Australia defines "capital city" as the ABS Greater Capital City
 * Statistical Area, so for SA the $900,000 cap is Greater Adelaide (which takes
 * in Gawler, Mount Barker and the Adelaide Hills) and $500,000 is the rest of
 * the state. There are no listed SA regional centres — that footnote covers
 * only NSW, VIC and QLD — so no SA postcode maps to 'regional-centre'.
 *
 * The ranges below are a LOSSLESS encoding: expanding them reproduces exactly
 * the 142 capital and 194 rest-of-state postcodes the tool returned, with no
 * overlap and nothing interpolated. Five postcodes are deliberately in NEITHER
 * list because the tool splits them — localities inside one postcode fall on
 * different sides of the boundary (see SA_SPLIT_POSTCODES). Those resolve to
 * undefined so the engine asks the applicant to confirm rather than guessing.
 */
const SA_CAPITAL_RANGES: [number, number][] = [
  [5000, 5000], [5006, 5025], [5031, 5035], [5037, 5052], [5061, 5070],
  [5072, 5076], [5081, 5098], [5106, 5118], [5120, 5121], [5125, 5127],
  [5131, 5134], [5136, 5142], [5144, 5144], [5150, 5156], [5158, 5171],
  [5173, 5174], [5231, 5234], [5240, 5245], [5250, 5252], [5950, 5950],
]

const SA_REST_RANGES: [number, number][] = [
  [5202, 5204], [5210, 5214], [5220, 5223], [5235, 5238], [5253, 5256],
  [5259, 5273], [5275, 5280], [5290, 5291], [5301, 5304], [5306, 5311],
  [5320, 5322], [5330, 5333], [5340, 5346], [5350, 5357], [5360, 5360],
  [5372, 5374], [5381, 5381], [5400, 5401], [5410, 5422], [5431, 5434],
  [5440, 5440], [5451, 5455], [5460, 5462], [5464, 5464], [5470, 5473],
  [5480, 5483], [5485, 5485], [5490, 5491], [5493, 5493], [5495, 5495],
  [5502, 5502], [5510, 5510], [5520, 5523], [5540, 5540], [5550, 5550],
  [5552, 5552], [5554, 5556], [5558, 5558], [5560, 5560], [5570, 5573],
  [5575, 5577], [5580, 5583], [5600, 5609], [5611, 5611], [5630, 5633],
  [5640, 5642], [5650, 5655], [5660, 5661], [5670, 5671], [5680, 5680],
  [5690, 5690], [5700, 5701], [5710, 5710], [5713, 5713], [5715, 5715],
  [5717, 5717], [5719, 5720], [5722, 5725], [5730, 5734],
]

/**
 * SA postcodes the official tool classifies BOTH ways — e.g. 5172 covers
 * Willunga ($900,000) and Yundi ($500,000). A postcode alone cannot decide
 * these, so they stay unclassified and no suburb inside them is curated below.
 */
export const SA_SPLIT_POSTCODES = ['5157', '5172', '5201', '5371', '5501'] as const

const inRanges = (pc: number, ranges: [number, number][]) =>
  ranges.some(([lo, hi]) => pc >= lo && pc <= hi)

/** SA region from the postcode alone, or undefined for split/unknown postcodes. */
function saRegionFromPostcode(postcode: string): PriceCapRegion | undefined {
  const pc = Number(String(postcode).trim())
  if (!Number.isInteger(pc)) return undefined
  if (inRanges(pc, SA_CAPITAL_RANGES)) return 'capital'
  if (inRanges(pc, SA_REST_RANGES)) return 'rest'
  return undefined
}

/**
 * The region for a postcode, or undefined when it is not classified.
 *
 * Housing Australia applies the higher Queensland cap ($1,000,000) to Brisbane,
 * the Gold Coast and the Sunshine Coast, and $700,000 to the rest of the state.
 * "Brisbane" is the Greater Brisbane capital city area, which takes in Ipswich,
 * Logan and Moreton Bay.
 *
 * The curated `SUBURBS` lookup runs first, so NSW, VIC and QLD are unchanged.
 * SA additionally falls back to its complete postcode map above, so a typed SA
 * postcode resolves even when no SA suburb was curated for it.
 */
export function inferRegion(postcode: string): PriceCapRegion | undefined {
  const pc = String(postcode).trim()
  const match = SUBURBS.find((s) => s.postcode === pc)
  if (match?.region) return match.region
  return inferState(pc) === 'SA' ? saRegionFromPostcode(pc) : undefined
}

/** Infer the state from a 4-digit postcode. Returns null for unsupported/invalid. */
export function inferState(postcode: string): StateCode | null {
  const pc = Number(String(postcode).trim())
  if (!Number.isInteger(pc) || pc < 200 || pc > 9999) return null
  // NSW: 1000–1999 (LVR/PO), 2000–2599, 2619–2899, 2921–2999
  if ((pc >= 1000 && pc <= 1999) || (pc >= 2000 && pc <= 2599) || (pc >= 2619 && pc <= 2899) || (pc >= 2921 && pc <= 2999)) {
    return 'NSW'
  }
  // ACT: 2600–2618 and 2900–2920 — the two blocks the NSW ranges above already
  // step around, so adding them here cannot change any NSW answer.
  //
  // Two of these postcodes straddle the border. 2611 covers thirteen ACT
  // localities (Weston Creek and Molonglo) plus four NSW rural ones — Bimberi,
  // Brindabella, Cooleman and Uriarra; 2618 covers Hall ACT plus Springrange and
  // Wallaroo NSW. A postcode alone cannot separate them, and both resolved to
  // null before this change, so mapping them to ACT is strictly more useful than
  // rejecting them. A buyer in one of those six NSW localities would be shown
  // ACT — rare, rural, and noted here deliberately.
  if ((pc >= 2600 && pc <= 2618) || (pc >= 2900 && pc <= 2920)) return 'ACT'
  // VIC: 3000–3999, 8000–8999 (PO)
  if ((pc >= 3000 && pc <= 3999) || (pc >= 8000 && pc <= 8999)) return 'VIC'
  // QLD: 4000–4999, 9000–9999 (PO)
  if ((pc >= 4000 && pc <= 4999) || (pc >= 9000 && pc <= 9999)) return 'QLD'
  // SA: 5000–5799 (street/PO delivery), 5800–5999 (large-volume receiver and
  // PO boxes — 5950 Adelaide Airport is a live locality in Housing Australia's
  // own table, so the whole 5xxx block belongs to SA).
  if (pc >= 5000 && pc <= 5999) return 'SA'
  // WA: 6000–6999
  if (pc >= 6000 && pc <= 6999) return 'WA'
  // TAS: 7000–7999
  if (pc >= 7000 && pc <= 7999) return 'TAS'
  // NT: 0800–0999
  if (pc >= 800 && pc <= 999) return 'NT'
  return null
}

export const SUBURBS: SuburbEntry[] = [
  // ── NSW ──
  { suburb: 'Sydney', postcode: '2000', state: 'NSW' },
  { suburb: 'Haymarket', postcode: '2000', state: 'NSW' },
  { suburb: 'The Rocks', postcode: '2000', state: 'NSW' },
  { suburb: 'Surry Hills', postcode: '2010', state: 'NSW' },
  { suburb: 'Darlinghurst', postcode: '2010', state: 'NSW' },
  { suburb: 'Paddington', postcode: '2021', state: 'NSW' },
  { suburb: 'Bondi', postcode: '2026', state: 'NSW' },
  { suburb: 'Bondi Junction', postcode: '2022', state: 'NSW' },
  { suburb: 'Randwick', postcode: '2031', state: 'NSW' },
  { suburb: 'Coogee', postcode: '2034', state: 'NSW' },
  { suburb: 'Marrickville', postcode: '2204', state: 'NSW' },
  { suburb: 'Newtown', postcode: '2042', state: 'NSW' },
  { suburb: 'Leichhardt', postcode: '2040', state: 'NSW' },
  { suburb: 'Parramatta', postcode: '2150', state: 'NSW' },
  { suburb: 'Blacktown', postcode: '2148', state: 'NSW' },
  { suburb: 'Liverpool', postcode: '2170', state: 'NSW' },
  { suburb: 'Penrith', postcode: '2750', state: 'NSW' },
  { suburb: 'Campbelltown', postcode: '2560', state: 'NSW' },
  { suburb: 'Hornsby', postcode: '2077', state: 'NSW' },
  { suburb: 'Chatswood', postcode: '2067', state: 'NSW' },
  { suburb: 'Manly', postcode: '2095', state: 'NSW' },
  { suburb: 'Cronulla', postcode: '2230', state: 'NSW' },
  { suburb: 'Newcastle', postcode: '2300', state: 'NSW' },
  { suburb: 'Wollongong', postcode: '2500', state: 'NSW' },
  { suburb: 'Central Coast (Gosford)', postcode: '2250', state: 'NSW' },
  { suburb: 'Byron Bay', postcode: '2481', state: 'NSW' },
  { suburb: 'Coffs Harbour', postcode: '2450', state: 'NSW' },
  { suburb: 'Wagga Wagga', postcode: '2650', state: 'NSW' },
  { suburb: 'Albury', postcode: '2640', state: 'NSW' },
  { suburb: 'Dubbo', postcode: '2830', state: 'NSW' },
  { suburb: 'Orange', postcode: '2800', state: 'NSW' },
  { suburb: 'Tamworth', postcode: '2340', state: 'NSW' },

  // ── VIC ──
  { suburb: 'Melbourne', postcode: '3000', state: 'VIC' },
  { suburb: 'Southbank', postcode: '3006', state: 'VIC' },
  { suburb: 'Docklands', postcode: '3008', state: 'VIC' },
  { suburb: 'Carlton', postcode: '3053', state: 'VIC' },
  { suburb: 'Fitzroy', postcode: '3065', state: 'VIC' },
  { suburb: 'Richmond', postcode: '3121', state: 'VIC' },
  { suburb: 'South Yarra', postcode: '3141', state: 'VIC' },
  { suburb: 'St Kilda', postcode: '3182', state: 'VIC' },
  { suburb: 'Brunswick', postcode: '3056', state: 'VIC' },
  { suburb: 'Footscray', postcode: '3011', state: 'VIC' },
  { suburb: 'Preston', postcode: '3072', state: 'VIC' },
  { suburb: 'Box Hill', postcode: '3128', state: 'VIC' },
  { suburb: 'Glen Waverley', postcode: '3150', state: 'VIC' },
  { suburb: 'Dandenong', postcode: '3175', state: 'VIC' },
  { suburb: 'Frankston', postcode: '3199', state: 'VIC' },
  { suburb: 'Werribee', postcode: '3030', state: 'VIC' },
  { suburb: 'Point Cook', postcode: '3030', state: 'VIC' },
  { suburb: 'Craigieburn', postcode: '3064', state: 'VIC' },
  { suburb: 'Sunshine', postcode: '3020', state: 'VIC' },
  { suburb: 'Ringwood', postcode: '3134', state: 'VIC' },
  { suburb: 'Geelong', postcode: '3220', state: 'VIC' },
  { suburb: 'Ballarat', postcode: '3350', state: 'VIC' },
  { suburb: 'Bendigo', postcode: '3550', state: 'VIC' },
  { suburb: 'Shepparton', postcode: '3630', state: 'VIC' },
  { suburb: 'Traralgon', postcode: '3844', state: 'VIC' },
  { suburb: 'Warrnambool', postcode: '3280', state: 'VIC' },
  { suburb: 'Mildura', postcode: '3500', state: 'VIC' },
  { suburb: 'Wodonga', postcode: '3690', state: 'VIC' },
  { suburb: 'Torquay', postcode: '3228', state: 'VIC' },
  { suburb: 'Pakenham', postcode: '3810', state: 'VIC' },

  // ── QLD ──
  { suburb: 'Brisbane', postcode: '4000', state: 'QLD', region: 'capital' },
  { suburb: 'South Brisbane', postcode: '4101', state: 'QLD', region: 'capital' },
  { suburb: 'Fortitude Valley', postcode: '4006', state: 'QLD', region: 'capital' },
  { suburb: 'New Farm', postcode: '4005', state: 'QLD', region: 'capital' },
  { suburb: 'Toowong', postcode: '4066', state: 'QLD', region: 'capital' },
  { suburb: 'Chermside', postcode: '4032', state: 'QLD', region: 'capital' },
  { suburb: 'Carindale', postcode: '4152', state: 'QLD', region: 'capital' },
  { suburb: 'Sunnybank', postcode: '4109', state: 'QLD', region: 'capital' },
  { suburb: 'Logan Central', postcode: '4114', state: 'QLD', region: 'capital' },
  { suburb: 'Ipswich', postcode: '4305', state: 'QLD', region: 'capital' },
  { suburb: 'Springfield Lakes', postcode: '4300', state: 'QLD', region: 'capital' },
  { suburb: 'Redcliffe', postcode: '4020', state: 'QLD', region: 'capital' },
  { suburb: 'Caboolture', postcode: '4510', state: 'QLD', region: 'capital' },
  { suburb: 'Gold Coast (Southport)', postcode: '4215', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Surfers Paradise', postcode: '4217', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Robina', postcode: '4226', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Coomera', postcode: '4209', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Sunshine Coast (Maroochydore)', postcode: '4558', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Caloundra', postcode: '4551', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Noosa Heads', postcode: '4567', state: 'QLD', region: 'regional-centre' },
  { suburb: 'Toowoomba', postcode: '4350', state: 'QLD', region: 'rest' },
  { suburb: 'Cairns', postcode: '4870', state: 'QLD', region: 'rest' },
  { suburb: 'Townsville', postcode: '4810', state: 'QLD', region: 'rest' },
  { suburb: 'Mackay', postcode: '4740', state: 'QLD', region: 'rest' },
  { suburb: 'Rockhampton', postcode: '4700', state: 'QLD', region: 'rest' },
  { suburb: 'Bundaberg', postcode: '4670', state: 'QLD', region: 'rest' },
  { suburb: 'Hervey Bay', postcode: '4655', state: 'QLD', region: 'rest' },
  { suburb: 'Gladstone', postcode: '4680', state: 'QLD', region: 'rest' },

  // ── SA ──
  // Every postcode and region below was read from Housing Australia's Postcode
  // Search Tool on 29 July 2026 (see SA_CAPITAL_RANGES above): 'capital' is the
  // $900,000 Greater Adelaide cap, 'rest' the $500,000 rest-of-SA cap. No
  // suburb in a split postcode (SA_SPLIT_POSTCODES) is listed here.
  { suburb: 'Adelaide', postcode: '5000', state: 'SA', region: 'capital' },
  { suburb: 'North Adelaide', postcode: '5006', state: 'SA', region: 'capital' },
  { suburb: 'Woodville', postcode: '5011', state: 'SA', region: 'capital' },
  { suburb: 'Port Adelaide', postcode: '5015', state: 'SA', region: 'capital' },
  { suburb: 'Semaphore', postcode: '5019', state: 'SA', region: 'capital' },
  { suburb: 'Henley Beach', postcode: '5022', state: 'SA', region: 'capital' },
  { suburb: 'Marion', postcode: '5043', state: 'SA', region: 'capital' },
  { suburb: 'Glenelg', postcode: '5045', state: 'SA', region: 'capital' },
  { suburb: 'Brighton', postcode: '5048', state: 'SA', region: 'capital' },
  { suburb: 'Unley', postcode: '5061', state: 'SA', region: 'capital' },
  { suburb: 'Mitcham', postcode: '5062', state: 'SA', region: 'capital' },
  { suburb: 'Burnside', postcode: '5066', state: 'SA', region: 'capital' },
  { suburb: 'Norwood', postcode: '5067', state: 'SA', region: 'capital' },
  { suburb: 'Campbelltown', postcode: '5074', state: 'SA', region: 'capital' },
  { suburb: 'Prospect', postcode: '5082', state: 'SA', region: 'capital' },
  { suburb: 'Modbury', postcode: '5092', state: 'SA', region: 'capital' },
  { suburb: 'Mawson Lakes', postcode: '5095', state: 'SA', region: 'capital' },
  { suburb: 'Parafield Gardens', postcode: '5107', state: 'SA', region: 'capital' },
  { suburb: 'Salisbury', postcode: '5108', state: 'SA', region: 'capital' },
  { suburb: 'Elizabeth', postcode: '5112', state: 'SA', region: 'capital' },
  { suburb: 'Andrews Farm', postcode: '5114', state: 'SA', region: 'capital' },
  { suburb: 'Munno Para', postcode: '5115', state: 'SA', region: 'capital' },
  { suburb: 'Gawler', postcode: '5118', state: 'SA', region: 'capital' },
  { suburb: 'Golden Grove', postcode: '5125', state: 'SA', region: 'capital' },
  { suburb: 'Stirling', postcode: '5152', state: 'SA', region: 'capital' },
  { suburb: 'Noarlunga Centre', postcode: '5168', state: 'SA', region: 'capital' },
  { suburb: 'Seaford', postcode: '5169', state: 'SA', region: 'capital' },
  { suburb: 'Aldinga Beach', postcode: '5173', state: 'SA', region: 'capital' },
  { suburb: 'Hahndorf', postcode: '5245', state: 'SA', region: 'capital' },
  { suburb: 'Mount Barker', postcode: '5251', state: 'SA', region: 'capital' },
  { suburb: 'Victor Harbor', postcode: '5211', state: 'SA', region: 'rest' },
  { suburb: 'Goolwa', postcode: '5214', state: 'SA', region: 'rest' },
  { suburb: 'Kingscote', postcode: '5223', state: 'SA', region: 'rest' },
  { suburb: 'Murray Bridge', postcode: '5253', state: 'SA', region: 'rest' },
  { suburb: 'Strathalbyn', postcode: '5255', state: 'SA', region: 'rest' },
  { suburb: 'Naracoorte', postcode: '5271', state: 'SA', region: 'rest' },
  { suburb: 'Mount Gambier', postcode: '5290', state: 'SA', region: 'rest' },
  { suburb: 'Loxton', postcode: '5333', state: 'SA', region: 'rest' },
  { suburb: 'Renmark', postcode: '5341', state: 'SA', region: 'rest' },
  { suburb: 'Berri', postcode: '5343', state: 'SA', region: 'rest' },
  { suburb: 'Tanunda', postcode: '5352', state: 'SA', region: 'rest' },
  { suburb: 'Nuriootpa', postcode: '5355', state: 'SA', region: 'rest' },
  { suburb: 'Clare', postcode: '5453', state: 'SA', region: 'rest' },
  { suburb: 'Port Pirie', postcode: '5540', state: 'SA', region: 'rest' },
  { suburb: 'Kadina', postcode: '5554', state: 'SA', region: 'rest' },
  { suburb: 'Wallaroo', postcode: '5556', state: 'SA', region: 'rest' },
  { suburb: 'Whyalla', postcode: '5600', state: 'SA', region: 'rest' },
  { suburb: 'Port Lincoln', postcode: '5606', state: 'SA', region: 'rest' },
  { suburb: 'Port Augusta', postcode: '5700', state: 'SA', region: 'rest' },
  { suburb: 'Roxby Downs', postcode: '5725', state: 'SA', region: 'rest' },

  // ── SA — postcode 5172 (a SPLIT postcode; see SA_SPLIT_POSTCODES) ──
  // Verified live against Housing Australia's Postcode Search Tool, 29 July 2026.
  // Postcode 5172 straddles the Greater Adelaide boundary — the tool returns two
  // different caps for localities sharing this one postcode:
  //
  //     $900,000 (Greater Adelaide)  The Range, Whites Valley, Willunga,
  //                                  Willunga South
  //     $500,000 (rest of SA)        Dingabledinga, Hope Forest, Kuitpo Colony,
  //                                  Kyeema, Montarra, Pages Flat,
  //                                  Willunga Hill, Yundi
  //
  // `region` is deliberately OMITTED on every entry below. `inferRegion` resolves
  // by POSTCODE, taking the first matching SUBURBS row — so tagging these would
  // make one locality's cap silently stand in for the other eleven, and a Yundi
  // buyer would be given Willunga's $900,000 cap (or vice versa), a $400,000
  // error. Leaving them untagged keeps `inferRegion('5172')` undefined, which is
  // what makes the engine ask the applicant to confirm their suburb instead of
  // guessing. The classification above is recorded here rather than in the
  // `region` field for exactly that reason.
  { suburb: 'Willunga', postcode: '5172', state: 'SA' },
  { suburb: 'Willunga South', postcode: '5172', state: 'SA' },
  { suburb: 'Willunga Hill', postcode: '5172', state: 'SA' },
  { suburb: 'Whites Valley', postcode: '5172', state: 'SA' },
  { suburb: 'The Range', postcode: '5172', state: 'SA' },
  { suburb: 'Yundi', postcode: '5172', state: 'SA' },
  { suburb: 'Hope Forest', postcode: '5172', state: 'SA' },
  { suburb: 'Kuitpo Colony', postcode: '5172', state: 'SA' },
  { suburb: 'Kyeema', postcode: '5172', state: 'SA' },
  { suburb: 'Pages Flat', postcode: '5172', state: 'SA' },
  { suburb: 'Montarra', postcode: '5172', state: 'SA' },
  { suburb: 'Dingabledinga', postcode: '5172', state: 'SA' },

  // ── ACT ──
  // Every locality and postcode below was read from the Australian Government
  // postcode data behind Housing Australia's Postcode Search Tool on 29 July
  // 2026 — the complete ACT set, 115 localities across 25 postcodes. None is
  // invented.
  //
  // No `region` is set: the ACT publishes a SINGLE territory-wide federal price
  // cap of $1,000,000 with no capital/regional split, so there is nothing for a
  // region to disambiguate. `resolveStateCaps` returns one cap, and the engine
  // decides from it without needing the suburb.
  { suburb: 'Barton', postcode: '2600', state: 'ACT' },
  { suburb: 'Capital Hill', postcode: '2600', state: 'ACT' },
  { suburb: 'Deakin', postcode: '2600', state: 'ACT' },
  { suburb: 'Parkes', postcode: '2600', state: 'ACT' },
  { suburb: 'Russell', postcode: '2600', state: 'ACT' },
  { suburb: 'Yarralumla', postcode: '2600', state: 'ACT' },
  { suburb: 'Acton', postcode: '2601', state: 'ACT' },
  { suburb: 'City', postcode: '2601', state: 'ACT' },
  { suburb: 'Ainslie', postcode: '2602', state: 'ACT' },
  { suburb: 'Dickson', postcode: '2602', state: 'ACT' },
  { suburb: 'Downer', postcode: '2602', state: 'ACT' },
  { suburb: 'Hackett', postcode: '2602', state: 'ACT' },
  { suburb: 'Lyneham', postcode: '2602', state: 'ACT' },
  { suburb: "O'Connor", postcode: '2602', state: 'ACT' },
  { suburb: 'Watson', postcode: '2602', state: 'ACT' },
  { suburb: 'Forrest', postcode: '2603', state: 'ACT' },
  { suburb: 'Griffith', postcode: '2603', state: 'ACT' },
  { suburb: 'Red Hill', postcode: '2603', state: 'ACT' },
  { suburb: 'Kingston', postcode: '2604', state: 'ACT' },
  { suburb: 'Narrabundah', postcode: '2604', state: 'ACT' },
  { suburb: 'Curtin', postcode: '2605', state: 'ACT' },
  { suburb: 'Garran', postcode: '2605', state: 'ACT' },
  { suburb: 'Hughes', postcode: '2605', state: 'ACT' },
  { suburb: 'Chifley', postcode: '2606', state: 'ACT' },
  { suburb: 'Lyons', postcode: '2606', state: 'ACT' },
  { suburb: "O'Malley", postcode: '2606', state: 'ACT' },
  { suburb: 'Phillip', postcode: '2606', state: 'ACT' },
  { suburb: 'Farrer', postcode: '2607', state: 'ACT' },
  { suburb: 'Isaacs', postcode: '2607', state: 'ACT' },
  { suburb: 'Mawson', postcode: '2607', state: 'ACT' },
  { suburb: 'Pearce', postcode: '2607', state: 'ACT' },
  { suburb: 'Torrens', postcode: '2607', state: 'ACT' },
  { suburb: 'Canberra Airport', postcode: '2609', state: 'ACT' },
  { suburb: 'Fyshwick', postcode: '2609', state: 'ACT' },
  { suburb: 'Pialligo', postcode: '2609', state: 'ACT' },
  { suburb: 'Symonston', postcode: '2609', state: 'ACT' },
  { suburb: 'Chapman', postcode: '2611', state: 'ACT' },
  { suburb: 'Coombs', postcode: '2611', state: 'ACT' },
  { suburb: 'Denman Prospect', postcode: '2611', state: 'ACT' },
  { suburb: 'Duffy', postcode: '2611', state: 'ACT' },
  { suburb: 'Fisher', postcode: '2611', state: 'ACT' },
  { suburb: 'Holder', postcode: '2611', state: 'ACT' },
  { suburb: 'Rivett', postcode: '2611', state: 'ACT' },
  { suburb: 'Stirling', postcode: '2611', state: 'ACT' },
  { suburb: 'Uriarra Village', postcode: '2611', state: 'ACT' },
  { suburb: 'Waramanga', postcode: '2611', state: 'ACT' },
  { suburb: 'Weston', postcode: '2611', state: 'ACT' },
  { suburb: 'Whitlam', postcode: '2611', state: 'ACT' },
  { suburb: 'Wright', postcode: '2611', state: 'ACT' },
  { suburb: 'Braddon', postcode: '2612', state: 'ACT' },
  { suburb: 'Campbell', postcode: '2612', state: 'ACT' },
  { suburb: 'Reid', postcode: '2612', state: 'ACT' },
  { suburb: 'Turner', postcode: '2612', state: 'ACT' },
  { suburb: 'Aranda', postcode: '2614', state: 'ACT' },
  { suburb: 'Cook', postcode: '2614', state: 'ACT' },
  { suburb: 'Hawker', postcode: '2614', state: 'ACT' },
  { suburb: 'Macquarie', postcode: '2614', state: 'ACT' },
  { suburb: 'Page', postcode: '2614', state: 'ACT' },
  { suburb: 'Scullin', postcode: '2614', state: 'ACT' },
  { suburb: 'Weetangera', postcode: '2614', state: 'ACT' },
  { suburb: 'Charnwood', postcode: '2615', state: 'ACT' },
  { suburb: 'Dunlop', postcode: '2615', state: 'ACT' },
  { suburb: 'Florey', postcode: '2615', state: 'ACT' },
  { suburb: 'Flynn', postcode: '2615', state: 'ACT' },
  { suburb: 'Fraser', postcode: '2615', state: 'ACT' },
  { suburb: 'Higgins', postcode: '2615', state: 'ACT' },
  { suburb: 'Holt', postcode: '2615', state: 'ACT' },
  { suburb: 'Latham', postcode: '2615', state: 'ACT' },
  { suburb: 'Macgregor', postcode: '2615', state: 'ACT' },
  { suburb: 'Macnamara', postcode: '2615', state: 'ACT' },
  { suburb: 'Melba', postcode: '2615', state: 'ACT' },
  { suburb: 'Spence', postcode: '2615', state: 'ACT' },
  { suburb: 'Strathnairn', postcode: '2615', state: 'ACT' },
  { suburb: 'Belconnen', postcode: '2617', state: 'ACT' },
  { suburb: 'Bruce', postcode: '2617', state: 'ACT' },
  { suburb: 'Evatt', postcode: '2617', state: 'ACT' },
  { suburb: 'Giralang', postcode: '2617', state: 'ACT' },
  { suburb: 'Kaleen', postcode: '2617', state: 'ACT' },
  { suburb: 'Lawson', postcode: '2617', state: 'ACT' },
  { suburb: 'Mckellar', postcode: '2617', state: 'ACT' },
  { suburb: 'Hall', postcode: '2618', state: 'ACT' },
  { suburb: 'Greenway', postcode: '2900', state: 'ACT' },
  { suburb: 'Kambah', postcode: '2902', state: 'ACT' },
  { suburb: 'Oxley', postcode: '2903', state: 'ACT' },
  { suburb: 'Wanniassa', postcode: '2903', state: 'ACT' },
  { suburb: 'Fadden', postcode: '2904', state: 'ACT' },
  { suburb: 'Gowrie', postcode: '2904', state: 'ACT' },
  { suburb: 'Macarthur', postcode: '2904', state: 'ACT' },
  { suburb: 'Monash', postcode: '2904', state: 'ACT' },
  { suburb: 'Bonython', postcode: '2905', state: 'ACT' },
  { suburb: 'Calwell', postcode: '2905', state: 'ACT' },
  { suburb: 'Chisholm', postcode: '2905', state: 'ACT' },
  { suburb: 'Gilmore', postcode: '2905', state: 'ACT' },
  { suburb: 'Isabella Plains', postcode: '2905', state: 'ACT' },
  { suburb: 'Richardson', postcode: '2905', state: 'ACT' },
  { suburb: 'Theodore', postcode: '2905', state: 'ACT' },
  { suburb: 'Banks', postcode: '2906', state: 'ACT' },
  { suburb: 'Conder', postcode: '2906', state: 'ACT' },
  { suburb: 'Gordon', postcode: '2906', state: 'ACT' },
  { suburb: 'Crace', postcode: '2911', state: 'ACT' },
  { suburb: 'Mitchell', postcode: '2911', state: 'ACT' },
  { suburb: 'Gungahlin', postcode: '2912', state: 'ACT' },
  { suburb: 'Casey', postcode: '2913', state: 'ACT' },
  { suburb: 'Franklin', postcode: '2913', state: 'ACT' },
  { suburb: 'Ngunnawal', postcode: '2913', state: 'ACT' },
  { suburb: 'Nicholls', postcode: '2913', state: 'ACT' },
  { suburb: 'Palmerston', postcode: '2913', state: 'ACT' },
  { suburb: 'Taylor', postcode: '2913', state: 'ACT' },
  { suburb: 'Amaroo', postcode: '2914', state: 'ACT' },
  { suburb: 'Bonner', postcode: '2914', state: 'ACT' },
  { suburb: 'Forde', postcode: '2914', state: 'ACT' },
  { suburb: 'Harrison', postcode: '2914', state: 'ACT' },
  { suburb: 'Jacka', postcode: '2914', state: 'ACT' },
  { suburb: 'Moncrieff', postcode: '2914', state: 'ACT' },
  { suburb: 'Throsby', postcode: '2914', state: 'ACT' },

  // ── WA ──
  // Greater Perth GCCSA (capital) — sourced from Australia Post locality data,
  // classified by ABS Greater Capital City Statistical Area boundaries.
  // Perth CBD & inner
  { suburb: 'Perth', postcode: '6000', state: 'WA', region: 'capital' },
  { suburb: 'East Perth', postcode: '6004', state: 'WA', region: 'capital' },
  { suburb: 'West Perth', postcode: '6005', state: 'WA', region: 'capital' },
  { suburb: 'Northbridge', postcode: '6003', state: 'WA', region: 'capital' },
  { suburb: 'Highgate', postcode: '6003', state: 'WA', region: 'capital' },
  // Inner west
  { suburb: 'Subiaco', postcode: '6008', state: 'WA', region: 'capital' },
  { suburb: 'Shenton Park', postcode: '6008', state: 'WA', region: 'capital' },
  { suburb: 'Nedlands', postcode: '6009', state: 'WA', region: 'capital' },
  { suburb: 'Dalkeith', postcode: '6009', state: 'WA', region: 'capital' },
  { suburb: 'Crawley', postcode: '6009', state: 'WA', region: 'capital' },
  { suburb: 'Claremont', postcode: '6010', state: 'WA', region: 'capital' },
  { suburb: 'Swanbourne', postcode: '6010', state: 'WA', region: 'capital' },
  { suburb: 'Cottesloe', postcode: '6011', state: 'WA', region: 'capital' },
  { suburb: 'Peppermint Grove', postcode: '6011', state: 'WA', region: 'capital' },
  { suburb: 'Mosman Park', postcode: '6012', state: 'WA', region: 'capital' },
  { suburb: 'Floreat', postcode: '6014', state: 'WA', region: 'capital' },
  { suburb: 'Wembley', postcode: '6014', state: 'WA', region: 'capital' },
  { suburb: 'Jolimont', postcode: '6014', state: 'WA', region: 'capital' },
  { suburb: 'City Beach', postcode: '6015', state: 'WA', region: 'capital' },
  { suburb: 'Osborne Park', postcode: '6017', state: 'WA', region: 'capital' },
  { suburb: 'Churchlands', postcode: '6018', state: 'WA', region: 'capital' },
  { suburb: 'Innaloo', postcode: '6018', state: 'WA', region: 'capital' },
  { suburb: 'Karrinyup', postcode: '6018', state: 'WA', region: 'capital' },
  { suburb: 'Gwelup', postcode: '6018', state: 'WA', region: 'capital' },
  { suburb: 'Scarborough', postcode: '6019', state: 'WA', region: 'capital' },
  { suburb: 'Doubleview', postcode: '6018', state: 'WA', region: 'capital' },
  // North inner
  { suburb: 'Leederville', postcode: '6007', state: 'WA', region: 'capital' },
  { suburb: 'Mount Lawley', postcode: '6050', state: 'WA', region: 'capital' },
  { suburb: 'Inglewood', postcode: '6052', state: 'WA', region: 'capital' },
  { suburb: 'Bedford', postcode: '6052', state: 'WA', region: 'capital' },
  { suburb: 'Bayswater', postcode: '6053', state: 'WA', region: 'capital' },
  { suburb: 'Bassendean', postcode: '6054', state: 'WA', region: 'capital' },
  { suburb: 'Guildford', postcode: '6055', state: 'WA', region: 'capital' },
  { suburb: 'Midland', postcode: '6056', state: 'WA', region: 'capital' },
  { suburb: 'Midvale', postcode: '6056', state: 'WA', region: 'capital' },
  { suburb: 'High Wycombe', postcode: '6057', state: 'WA', region: 'capital' },
  { suburb: 'Maida Vale', postcode: '6057', state: 'WA', region: 'capital' },
  { suburb: 'Forrestfield', postcode: '6058', state: 'WA', region: 'capital' },
  { suburb: 'Dianella', postcode: '6059', state: 'WA', region: 'capital' },
  { suburb: 'Balga', postcode: '6061', state: 'WA', region: 'capital' },
  { suburb: 'Mirrabooka', postcode: '6061', state: 'WA', region: 'capital' },
  { suburb: 'Nollamara', postcode: '6061', state: 'WA', region: 'capital' },
  { suburb: 'Westminster', postcode: '6061', state: 'WA', region: 'capital' },
  { suburb: 'Morley', postcode: '6062', state: 'WA', region: 'capital' },
  { suburb: 'Embleton', postcode: '6062', state: 'WA', region: 'capital' },
  { suburb: 'Beechboro', postcode: '6063', state: 'WA', region: 'capital' },
  { suburb: 'Girrawheen', postcode: '6064', state: 'WA', region: 'capital' },
  { suburb: 'Koondoola', postcode: '6064', state: 'WA', region: 'capital' },
  { suburb: 'Balcatta', postcode: '6021', state: 'WA', region: 'capital' },
  { suburb: 'Stirling', postcode: '6021', state: 'WA', region: 'capital' },
  // Joondalup corridor
  { suburb: 'Wanneroo', postcode: '6065', state: 'WA', region: 'capital' },
  { suburb: 'Landsdale', postcode: '6065', state: 'WA', region: 'capital' },
  { suburb: 'Hocking', postcode: '6065', state: 'WA', region: 'capital' },
  { suburb: 'Darch', postcode: '6065', state: 'WA', region: 'capital' },
  { suburb: 'Madeley', postcode: '6065', state: 'WA', region: 'capital' },
  { suburb: 'Malaga', postcode: '6090', state: 'WA', region: 'capital' },
  { suburb: 'Joondalup', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Edgewater', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Ocean Reef', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Mullaloo', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Heathridge', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Beldon', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Connolly', postcode: '6027', state: 'WA', region: 'capital' },
  { suburb: 'Currambine', postcode: '6028', state: 'WA', region: 'capital' },
  { suburb: 'Kinross', postcode: '6028', state: 'WA', region: 'capital' },
  { suburb: 'Clarkson', postcode: '6030', state: 'WA', region: 'capital' },
  { suburb: 'Mindarie', postcode: '6030', state: 'WA', region: 'capital' },
  { suburb: 'Quinns Rocks', postcode: '6030', state: 'WA', region: 'capital' },
  { suburb: 'Merriwa', postcode: '6030', state: 'WA', region: 'capital' },
  { suburb: 'Ridgewood', postcode: '6030', state: 'WA', region: 'capital' },
  { suburb: 'Eglinton', postcode: '6034', state: 'WA', region: 'capital' },
  { suburb: 'Yanchep', postcode: '6035', state: 'WA', region: 'capital' },
  { suburb: 'Butler', postcode: '6036', state: 'WA', region: 'capital' },
  { suburb: 'Two Rocks', postcode: '6037', state: 'WA', region: 'capital' },
  { suburb: 'Alkimos', postcode: '6038', state: 'WA', region: 'capital' },
  { suburb: 'Ellenbrook', postcode: '6069', state: 'WA', region: 'capital' },
  { suburb: 'The Vines', postcode: '6069', state: 'WA', region: 'capital' },
  // Kalamunda Hills
  { suburb: 'Kalamunda', postcode: '6076', state: 'WA', region: 'capital' },
  // South of river — Fremantle & surrounds
  { suburb: 'Fremantle', postcode: '6160', state: 'WA', region: 'capital' },
  { suburb: 'North Fremantle', postcode: '6159', state: 'WA', region: 'capital' },
  { suburb: 'Beaconsfield', postcode: '6162', state: 'WA', region: 'capital' },
  { suburb: 'South Fremantle', postcode: '6162', state: 'WA', region: 'capital' },
  { suburb: 'Hamilton Hill', postcode: '6163', state: 'WA', region: 'capital' },
  { suburb: 'Spearwood', postcode: '6163', state: 'WA', region: 'capital' },
  { suburb: 'Hilton', postcode: '6163', state: 'WA', region: 'capital' },
  { suburb: "O'Connor", postcode: '6163', state: 'WA', region: 'capital' },
  { suburb: 'Bibra Lake', postcode: '6163', state: 'WA', region: 'capital' },
  { suburb: 'Munster', postcode: '6166', state: 'WA', region: 'capital' },
  { suburb: 'Henderson', postcode: '6166', state: 'WA', region: 'capital' },
  // Cockburn
  { suburb: 'Cockburn Central', postcode: '6164', state: 'WA', region: 'capital' },
  { suburb: 'Jandakot', postcode: '6164', state: 'WA', region: 'capital' },
  { suburb: 'Yangebup', postcode: '6164', state: 'WA', region: 'capital' },
  { suburb: 'Success', postcode: '6164', state: 'WA', region: 'capital' },
  { suburb: 'Atwell', postcode: '6164', state: 'WA', region: 'capital' },
  { suburb: 'Hammond Park', postcode: '6164', state: 'WA', region: 'capital' },
  { suburb: 'Aubin Grove', postcode: '6164', state: 'WA', region: 'capital' },
  // Canning & Gosnells
  { suburb: 'Canning Vale', postcode: '6155', state: 'WA', region: 'capital' },
  { suburb: 'Willetton', postcode: '6155', state: 'WA', region: 'capital' },
  { suburb: 'Riverton', postcode: '6148', state: 'WA', region: 'capital' },
  { suburb: 'Shelley', postcode: '6148', state: 'WA', region: 'capital' },
  { suburb: 'Rossmoyne', postcode: '6148', state: 'WA', region: 'capital' },
  { suburb: 'Ferndale', postcode: '6148', state: 'WA', region: 'capital' },
  { suburb: 'Bull Creek', postcode: '6149', state: 'WA', region: 'capital' },
  { suburb: 'Leeming', postcode: '6149', state: 'WA', region: 'capital' },
  { suburb: 'Winthrop', postcode: '6150', state: 'WA', region: 'capital' },
  { suburb: 'Murdoch', postcode: '6150', state: 'WA', region: 'capital' },
  { suburb: 'Langford', postcode: '6147', state: 'WA', region: 'capital' },
  { suburb: 'Lynwood', postcode: '6147', state: 'WA', region: 'capital' },
  { suburb: 'Parkwood', postcode: '6147', state: 'WA', region: 'capital' },
  { suburb: 'Bentley', postcode: '6102', state: 'WA', region: 'capital' },
  { suburb: 'St James', postcode: '6102', state: 'WA', region: 'capital' },
  { suburb: 'Cannington', postcode: '6107', state: 'WA', region: 'capital' },
  { suburb: 'Beckenham', postcode: '6107', state: 'WA', region: 'capital' },
  { suburb: 'Kenwick', postcode: '6107', state: 'WA', region: 'capital' },
  { suburb: 'Thornlie', postcode: '6108', state: 'WA', region: 'capital' },
  { suburb: 'Maddington', postcode: '6109', state: 'WA', region: 'capital' },
  { suburb: 'Gosnells', postcode: '6110', state: 'WA', region: 'capital' },
  { suburb: 'Martin', postcode: '6110', state: 'WA', region: 'capital' },
  { suburb: 'Kelmscott', postcode: '6111', state: 'WA', region: 'capital' },
  { suburb: 'Camillo', postcode: '6111', state: 'WA', region: 'capital' },
  { suburb: 'Armadale', postcode: '6112', state: 'WA', region: 'capital' },
  // Belmont / east
  { suburb: 'Victoria Park', postcode: '6100', state: 'WA', region: 'capital' },
  { suburb: 'Burswood', postcode: '6100', state: 'WA', region: 'capital' },
  { suburb: 'East Victoria Park', postcode: '6101', state: 'WA', region: 'capital' },
  { suburb: 'Carlisle', postcode: '6101', state: 'WA', region: 'capital' },
  { suburb: 'Rivervale', postcode: '6103', state: 'WA', region: 'capital' },
  { suburb: 'Belmont', postcode: '6104', state: 'WA', region: 'capital' },
  { suburb: 'Redcliffe', postcode: '6104', state: 'WA', region: 'capital' },
  { suburb: 'Ascot', postcode: '6104', state: 'WA', region: 'capital' },
  { suburb: 'Cloverdale', postcode: '6105', state: 'WA', region: 'capital' },
  // Peel region (part of Greater Perth GCCSA)
  { suburb: 'Mandurah', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Halls Head', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Greenfields', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Meadow Springs', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Lakelands', postcode: '6180', state: 'WA', region: 'capital' },
  { suburb: 'Falcon', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Madora Bay', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Dudley Park', postcode: '6210', state: 'WA', region: 'capital' },
  { suburb: 'Dawesville', postcode: '6211', state: 'WA', region: 'capital' },
  // WA Rest — South West
  { suburb: 'Bunbury', postcode: '6230', state: 'WA', region: 'rest' },
  { suburb: 'Dalyellup', postcode: '6230', state: 'WA', region: 'rest' },
  { suburb: 'Eaton', postcode: '6232', state: 'WA', region: 'rest' },
  { suburb: 'Australind', postcode: '6233', state: 'WA', region: 'rest' },
  { suburb: 'Harvey', postcode: '6220', state: 'WA', region: 'rest' },
  { suburb: 'Collie', postcode: '6225', state: 'WA', region: 'rest' },
  { suburb: 'Busselton', postcode: '6280', state: 'WA', region: 'rest' },
  { suburb: 'Vasse', postcode: '6280', state: 'WA', region: 'rest' },
  { suburb: 'Dunsborough', postcode: '6281', state: 'WA', region: 'rest' },
  { suburb: 'Yallingup', postcode: '6282', state: 'WA', region: 'rest' },
  { suburb: 'Cowaramup', postcode: '6284', state: 'WA', region: 'rest' },
  { suburb: 'Margaret River', postcode: '6285', state: 'WA', region: 'rest' },
  { suburb: 'Augusta', postcode: '6290', state: 'WA', region: 'rest' },
  { suburb: 'Manjimup', postcode: '6258', state: 'WA', region: 'rest' },
  { suburb: 'Pemberton', postcode: '6260', state: 'WA', region: 'rest' },
  { suburb: 'Bridgetown', postcode: '6255', state: 'WA', region: 'rest' },
  // WA Rest — Great Southern
  { suburb: 'Albany', postcode: '6330', state: 'WA', region: 'rest' },
  { suburb: 'Yakamia', postcode: '6330', state: 'WA', region: 'rest' },
  { suburb: 'Middleton Beach', postcode: '6330', state: 'WA', region: 'rest' },
  { suburb: 'Denmark', postcode: '6333', state: 'WA', region: 'rest' },
  { suburb: 'Mount Barker', postcode: '6324', state: 'WA', region: 'rest' },
  { suburb: 'Katanning', postcode: '6317', state: 'WA', region: 'rest' },
  { suburb: 'Narrogin', postcode: '6312', state: 'WA', region: 'rest' },
  { suburb: 'Wagin', postcode: '6315', state: 'WA', region: 'rest' },
  // WA Rest — Wheat Belt & Mid West
  { suburb: 'Northam', postcode: '6401', state: 'WA', region: 'rest' },
  { suburb: 'York', postcode: '6302', state: 'WA', region: 'rest' },
  { suburb: 'Toodyay', postcode: '6566', state: 'WA', region: 'rest' },
  { suburb: 'Merredin', postcode: '6415', state: 'WA', region: 'rest' },
  { suburb: 'Moora', postcode: '6510', state: 'WA', region: 'rest' },
  { suburb: 'Geraldton', postcode: '6530', state: 'WA', region: 'rest' },
  { suburb: 'Wonthella', postcode: '6530', state: 'WA', region: 'rest' },
  { suburb: 'Spalding', postcode: '6530', state: 'WA', region: 'rest' },
  { suburb: 'Northampton', postcode: '6535', state: 'WA', region: 'rest' },
  { suburb: 'Dongara', postcode: '6525', state: 'WA', region: 'rest' },
  { suburb: 'Jurien Bay', postcode: '6516', state: 'WA', region: 'rest' },
  { suburb: 'Carnarvon', postcode: '6701', state: 'WA', region: 'rest' },
  { suburb: 'Exmouth', postcode: '6707', state: 'WA', region: 'rest' },
  // WA Rest — Goldfields-Esperance
  { suburb: 'Kalgoorlie', postcode: '6430', state: 'WA', region: 'rest' },
  { suburb: 'Boulder', postcode: '6432', state: 'WA', region: 'rest' },
  { suburb: 'Coolgardie', postcode: '6429', state: 'WA', region: 'rest' },
  { suburb: 'Kambalda West', postcode: '6442', state: 'WA', region: 'rest' },
  { suburb: 'Norseman', postcode: '6443', state: 'WA', region: 'rest' },
  { suburb: 'Southern Cross', postcode: '6426', state: 'WA', region: 'rest' },
  { suburb: 'Esperance', postcode: '6450', state: 'WA', region: 'rest' },
  // WA Rest — Pilbara
  { suburb: 'Port Hedland', postcode: '6721', state: 'WA', region: 'rest' },
  { suburb: 'South Hedland', postcode: '6722', state: 'WA', region: 'rest' },
  { suburb: 'Karratha', postcode: '6714', state: 'WA', region: 'rest' },
  { suburb: 'Dampier', postcode: '6713', state: 'WA', region: 'rest' },
  { suburb: 'Roebourne', postcode: '6718', state: 'WA', region: 'rest' },
  { suburb: 'Wickham', postcode: '6720', state: 'WA', region: 'rest' },
  { suburb: 'Newman', postcode: '6753', state: 'WA', region: 'rest' },
  { suburb: 'Tom Price', postcode: '6751', state: 'WA', region: 'rest' },
  // WA Rest — Kimberley
  { suburb: 'Broome', postcode: '6725', state: 'WA', region: 'rest' },
  { suburb: 'Derby', postcode: '6728', state: 'WA', region: 'rest' },
  { suburb: 'Kununurra', postcode: '6743', state: 'WA', region: 'rest' },

  // ── TAS ──
  // Greater Hobart GCCSA (capital) — Hobart, Clarence, Glenorchy, Kingborough
  // and Brighton LGAs, sourced from ABS 2021 GCCSA boundaries.
  { suburb: 'Hobart', postcode: '7000', state: 'TAS', region: 'capital' },
  { suburb: 'North Hobart', postcode: '7000', state: 'TAS', region: 'capital' },
  { suburb: 'West Hobart', postcode: '7000', state: 'TAS', region: 'capital' },
  { suburb: 'Mount Stuart', postcode: '7000', state: 'TAS', region: 'capital' },
  { suburb: 'South Hobart', postcode: '7004', state: 'TAS', region: 'capital' },
  { suburb: 'Battery Point', postcode: '7004', state: 'TAS', region: 'capital' },
  { suburb: 'Sandy Bay', postcode: '7005', state: 'TAS', region: 'capital' },
  { suburb: 'Mount Nelson', postcode: '7007', state: 'TAS', region: 'capital' },
  { suburb: 'New Town', postcode: '7008', state: 'TAS', region: 'capital' },
  { suburb: 'Lenah Valley', postcode: '7008', state: 'TAS', region: 'capital' },
  { suburb: 'Moonah', postcode: '7009', state: 'TAS', region: 'capital' },
  { suburb: 'Derwent Park', postcode: '7009', state: 'TAS', region: 'capital' },
  { suburb: 'Glenorchy', postcode: '7010', state: 'TAS', region: 'capital' },
  { suburb: 'Montrose', postcode: '7010', state: 'TAS', region: 'capital' },
  { suburb: 'Claremont', postcode: '7011', state: 'TAS', region: 'capital' },
  { suburb: 'Berriedale', postcode: '7011', state: 'TAS', region: 'capital' },
  { suburb: 'Lindisfarne', postcode: '7015', state: 'TAS', region: 'capital' },
  { suburb: 'Rose Bay', postcode: '7015', state: 'TAS', region: 'capital' },
  { suburb: 'Risdon Vale', postcode: '7016', state: 'TAS', region: 'capital' },
  { suburb: 'Bellerive', postcode: '7018', state: 'TAS', region: 'capital' },
  { suburb: 'Howrah', postcode: '7018', state: 'TAS', region: 'capital' },
  { suburb: 'Mornington', postcode: '7018', state: 'TAS', region: 'capital' },
  { suburb: 'Rosny', postcode: '7018', state: 'TAS', region: 'capital' },
  { suburb: 'Warrane', postcode: '7018', state: 'TAS', region: 'capital' },
  { suburb: 'Rokeby', postcode: '7019', state: 'TAS', region: 'capital' },
  { suburb: 'Clarendon Vale', postcode: '7019', state: 'TAS', region: 'capital' },
  { suburb: 'Granton', postcode: '7030', state: 'TAS', region: 'capital' },
  { suburb: 'Brighton', postcode: '7030', state: 'TAS', region: 'capital' },
  { suburb: 'Herdsmans Cove', postcode: '7030', state: 'TAS', region: 'capital' },
  { suburb: 'Kingston', postcode: '7050', state: 'TAS', region: 'capital' },
  { suburb: 'Kingston Beach', postcode: '7050', state: 'TAS', region: 'capital' },
  { suburb: 'Blackmans Bay', postcode: '7052', state: 'TAS', region: 'capital' },
  { suburb: 'Bonnet Hill', postcode: '7053', state: 'TAS', region: 'capital' },
  { suburb: 'Margate', postcode: '7054', state: 'TAS', region: 'capital' },
  { suburb: 'Snug', postcode: '7054', state: 'TAS', region: 'capital' },
  { suburb: 'Huntingfield', postcode: '7055', state: 'TAS', region: 'capital' },
  { suburb: 'Sandfly', postcode: '7059', state: 'TAS', region: 'capital' },
  { suburb: 'Midway Point', postcode: '7171', state: 'TAS', region: 'capital' },
  { suburb: 'Sorell', postcode: '7172', state: 'TAS', region: 'capital' },
  { suburb: 'Dodges Ferry', postcode: '7173', state: 'TAS', region: 'capital' },
  // TAS Rest — Launceston & surrounds
  { suburb: 'Launceston', postcode: '7250', state: 'TAS', region: 'rest' },
  { suburb: 'Prospect', postcode: '7250', state: 'TAS', region: 'rest' },
  { suburb: 'St Leonards', postcode: '7250', state: 'TAS', region: 'rest' },
  { suburb: 'Ravenswood', postcode: '7250', state: 'TAS', region: 'rest' },
  { suburb: 'Riverside', postcode: '7250', state: 'TAS', region: 'rest' },
  { suburb: 'Kings Meadows', postcode: '7249', state: 'TAS', region: 'rest' },
  { suburb: 'Newnham', postcode: '7248', state: 'TAS', region: 'rest' },
  { suburb: 'Invermay', postcode: '7248', state: 'TAS', region: 'rest' },
  { suburb: 'Mowbray', postcode: '7248', state: 'TAS', region: 'rest' },
  { suburb: 'Rocherlea', postcode: '7248', state: 'TAS', region: 'rest' },
  { suburb: 'Legana', postcode: '7277', state: 'TAS', region: 'rest' },
  { suburb: 'Relbia', postcode: '7258', state: 'TAS', region: 'rest' },
  { suburb: 'George Town', postcode: '7253', state: 'TAS', region: 'rest' },
  { suburb: 'Longford', postcode: '7301', state: 'TAS', region: 'rest' },
  { suburb: 'Westbury', postcode: '7303', state: 'TAS', region: 'rest' },
  { suburb: 'Deloraine', postcode: '7304', state: 'TAS', region: 'rest' },
  { suburb: 'Latrobe', postcode: '7307', state: 'TAS', region: 'rest' },
  { suburb: 'Port Sorell', postcode: '7307', state: 'TAS', region: 'rest' },
  // TAS Rest — Devonport
  { suburb: 'Devonport', postcode: '7310', state: 'TAS', region: 'rest' },
  { suburb: 'Spreyton', postcode: '7310', state: 'TAS', region: 'rest' },
  { suburb: 'Ulverstone', postcode: '7315', state: 'TAS', region: 'rest' },
  { suburb: 'Penguin', postcode: '7316', state: 'TAS', region: 'rest' },
  { suburb: 'Sulphur Creek', postcode: '7316', state: 'TAS', region: 'rest' },
  // TAS Rest — Burnie / North West
  { suburb: 'Burnie', postcode: '7320', state: 'TAS', region: 'rest' },
  { suburb: 'Somerset', postcode: '7322', state: 'TAS', region: 'rest' },
  { suburb: 'Wynyard', postcode: '7325', state: 'TAS', region: 'rest' },
  { suburb: 'Smithton', postcode: '7330', state: 'TAS', region: 'rest' },
  { suburb: 'Stanley', postcode: '7331', state: 'TAS', region: 'rest' },
  // TAS Rest — East Coast & Midlands
  { suburb: 'Scottsdale', postcode: '7260', state: 'TAS', region: 'rest' },
  { suburb: 'St Helens', postcode: '7216', state: 'TAS', region: 'rest' },
  { suburb: 'Scamander', postcode: '7215', state: 'TAS', region: 'rest' },
  { suburb: 'Bicheno', postcode: '7215', state: 'TAS', region: 'rest' },
  { suburb: 'Swansea', postcode: '7190', state: 'TAS', region: 'rest' },
  { suburb: 'Triabunna', postcode: '7190', state: 'TAS', region: 'rest' },
  { suburb: 'Orford', postcode: '7190', state: 'TAS', region: 'rest' },
  { suburb: 'Ross', postcode: '7209', state: 'TAS', region: 'rest' },
  { suburb: 'Campbell Town', postcode: '7210', state: 'TAS', region: 'rest' },
  { suburb: 'Evandale', postcode: '7212', state: 'TAS', region: 'rest' },
  { suburb: 'Fingal', postcode: '7214', state: 'TAS', region: 'rest' },
  { suburb: 'Oatlands', postcode: '7120', state: 'TAS', region: 'rest' },
  { suburb: 'New Norfolk', postcode: '7140', state: 'TAS', region: 'rest' },
  // TAS Rest — Huon / Southern
  { suburb: 'Huonville', postcode: '7109', state: 'TAS', region: 'rest' },
  { suburb: 'Grove', postcode: '7109', state: 'TAS', region: 'rest' },
  { suburb: 'Geeveston', postcode: '7116', state: 'TAS', region: 'rest' },
  // TAS Rest — West Coast
  { suburb: 'Queenstown', postcode: '7467', state: 'TAS', region: 'rest' },
  { suburb: 'Strahan', postcode: '7468', state: 'TAS', region: 'rest' },
  { suburb: 'Zeehan', postcode: '7469', state: 'TAS', region: 'rest' },
  { suburb: 'Rosebery', postcode: '7470', state: 'TAS', region: 'rest' },

  // ── NT ──
  // Greater Darwin GCCSA (capital) — Darwin, Palmerston, and Litchfield
  // urban corridor, sourced from ABS 2021 GCCSA boundaries.
  // Darwin city & inner suburbs
  { suburb: 'Darwin', postcode: '0800', state: 'NT', region: 'capital' },
  { suburb: 'Stuart Park', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'Parap', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'Fannie Bay', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'Larrakeyah', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'Bayview', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'The Gardens', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'Winnellie', postcode: '0820', state: 'NT', region: 'capital' },
  { suburb: 'Coconut Grove', postcode: '0810', state: 'NT', region: 'capital' },
  { suburb: 'Rapid Creek', postcode: '0810', state: 'NT', region: 'capital' },
  { suburb: 'Nightcliff', postcode: '0810', state: 'NT', region: 'capital' },
  { suburb: 'Casuarina', postcode: '0810', state: 'NT', region: 'capital' },
  { suburb: 'Tiwi', postcode: '0810', state: 'NT', region: 'capital' },
  { suburb: 'Wulagi', postcode: '0812', state: 'NT', region: 'capital' },
  { suburb: 'Karama', postcode: '0812', state: 'NT', region: 'capital' },
  { suburb: 'Malak', postcode: '0812', state: 'NT', region: 'capital' },
  { suburb: 'Marrara', postcode: '0812', state: 'NT', region: 'capital' },
  { suburb: 'Anula', postcode: '0812', state: 'NT', region: 'capital' },
  { suburb: 'Berrimah', postcode: '0828', state: 'NT', region: 'capital' },
  // Palmerston
  { suburb: 'Palmerston', postcode: '0830', state: 'NT', region: 'capital' },
  { suburb: 'Durack', postcode: '0830', state: 'NT', region: 'capital' },
  { suburb: 'Woodroffe', postcode: '0830', state: 'NT', region: 'capital' },
  { suburb: 'Farrar', postcode: '0830', state: 'NT', region: 'capital' },
  { suburb: 'Kilgariff', postcode: '0830', state: 'NT', region: 'capital' },
  { suburb: 'Rosebery', postcode: '0832', state: 'NT', region: 'capital' },
  { suburb: 'Bakewell', postcode: '0832', state: 'NT', region: 'capital' },
  { suburb: 'Gunn', postcode: '0832', state: 'NT', region: 'capital' },
  { suburb: 'Johnston', postcode: '0832', state: 'NT', region: 'capital' },
  { suburb: 'Mitchell', postcode: '0832', state: 'NT', region: 'capital' },
  { suburb: 'Bellamack', postcode: '0832', state: 'NT', region: 'capital' },
  { suburb: 'Zuccoli', postcode: '0832', state: 'NT', region: 'capital' },
  // NT Rest — Alice Springs
  { suburb: 'Alice Springs', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'Gillen', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'Sadadeen', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'Araluen', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'Desert Springs', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'East Side', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'The Gap', postcode: '0870', state: 'NT', region: 'rest' },
  { suburb: 'Larapinta', postcode: '0875', state: 'NT', region: 'rest' },
  // NT Rest — regional
  { suburb: 'Katherine', postcode: '0850', state: 'NT', region: 'rest' },
  { suburb: 'Emungalan', postcode: '0852', state: 'NT', region: 'rest' },
  { suburb: 'Mataranka', postcode: '0852', state: 'NT', region: 'rest' },
  { suburb: 'Tennant Creek', postcode: '0860', state: 'NT', region: 'rest' },
  { suburb: 'Nhulunbuy', postcode: '0880', state: 'NT', region: 'rest' },
  { suburb: 'Yirrkala', postcode: '0880', state: 'NT', region: 'rest' },
  { suburb: 'Jabiru', postcode: '0886', state: 'NT', region: 'rest' },
  { suburb: 'Pine Creek', postcode: '0847', state: 'NT', region: 'rest' },
]

/** Search suburbs by name or postcode prefix (case-insensitive) across all states. */
export function searchSuburbs(query: string, limit = 8): SuburbEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']
    const grouped = states.map(st => SUBURBS.filter(s => s.state === st))
    const mix: SuburbEntry[] = []
    const maxLen = Math.max(...grouped.map(g => g.length))
    for (let i = 0; i < maxLen && mix.length < limit; i++) {
      for (const g of grouped) {
        if (g[i] && mix.length < limit) mix.push(g[i])
      }
    }
    return mix
  }
  const starts: SuburbEntry[] = []
  const contains: SuburbEntry[] = []
  for (const s of SUBURBS) {
    const name = s.suburb.toLowerCase()
    if (name.startsWith(q) || s.postcode.startsWith(q)) starts.push(s)
    else if (name.includes(q) || s.postcode.includes(q)) contains.push(s)
  }
  return [...starts, ...contains].slice(0, limit)
}
