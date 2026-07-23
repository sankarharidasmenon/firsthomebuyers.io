/**
 * NSW & VIC suburb/postcode data for the location combobox (C14).
 *
 * A curated list of common suburbs powers the searchable dropdown; any valid
 * 4-digit NSW/VIC postcode typed directly is also accepted via `inferState`.
 * State is always derived from the postcode — the applicant never picks it.
 */
import type { StateCode } from './types'

export interface SuburbEntry {
  suburb: string
  postcode: string
  state: StateCode
}

/** Infer NSW/VIC from a 4-digit postcode. Returns null for ACT/other/invalid. */
export function inferState(postcode: string): StateCode | null {
  const pc = Number(String(postcode).trim())
  if (!Number.isInteger(pc) || pc < 200 || pc > 9999) return null
  // NSW: 1000–1999 (LVR/PO), 2000–2599, 2619–2899, 2921–2999
  if ((pc >= 1000 && pc <= 1999) || (pc >= 2000 && pc <= 2599) || (pc >= 2619 && pc <= 2899) || (pc >= 2921 && pc <= 2999)) {
    return 'NSW'
  }
  // ACT (2600–2618, 2900–2920) is intentionally excluded — not NSW/VIC.
  // VIC: 3000–3999, 8000–8999 (PO)
  if ((pc >= 3000 && pc <= 3999) || (pc >= 8000 && pc <= 8999)) return 'VIC'
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
]

/** Search suburbs by name or postcode prefix (case-insensitive) across BOTH states. */
export function searchSuburbs(query: string, limit = 8): SuburbEntry[] {
  const q = query.trim().toLowerCase()
  // Empty query → show a balanced NSW + VIC mix so both states are visible.
  if (!q) {
    const nsw = SUBURBS.filter((s) => s.state === 'NSW')
    const vic = SUBURBS.filter((s) => s.state === 'VIC')
    const mix: SuburbEntry[] = []
    for (let i = 0; i < Math.max(nsw.length, vic.length) && mix.length < limit; i++) {
      if (nsw[i]) mix.push(nsw[i])
      if (vic[i]) mix.push(vic[i])
    }
    return mix.slice(0, limit)
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
