'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ExternalLink, Search } from 'lucide-react'
import { calculateSchemesLibrary, type CalculatorMatch, type MatchStatus, type CitizenshipStatus, type LocationType, type PurchasingEntity } from '@/lib/schemesLibrary/calculator'
import { searchSuburbs, type SuburbEntry, type PriceCapRegion } from '@/lib/questionnaire/postcodes'

/**
 * Visual language: a printed assessment document, not a fintech app screen —
 * paper card, ink/muted ink, hairline borders, Space Grotesk for headings and
 * figures, Inter for body text. Deliberately flat: no shadows-as-elevation
 * beyond the outer page, no pill-fill selection states, dotted rules instead
 * of card-in-card nesting.
 */
const INK = '#151726'
const MUTED = '#666A76'
const LINE = '#E2DFD6'
const PAPER = '#FDFCF9'
const GROTESK = 'var(--font-grotesk), "Space Grotesk", sans-serif'
const SANS = 'Inter, sans-serif'

const TAG_STYLE: Record<MatchStatus, { bg: string; text: string; label: string }> = {
  eligible: { bg: '#E5F3E0', text: '#2E6A1E', label: 'Eligible' },
  check: { bg: '#FDF1DD', text: '#7A4E00', label: 'Check required' },
  ineligible: { bg: '#FCE7E9', text: '#8A1424', label: 'Not eligible' },
}

type Category = 'Grant' | 'Deposit_Guarantee' | 'Shared_Equity' | 'Stamp_Duty_Exemption' | 'Stamp_Duty_Concession' | 'Tax_Incentive'

const CATEGORY_META: Record<Category, { bg: string; text: string; label: string }> = {
  Grant: { bg: '#E7EEFB', text: '#1F3E80', label: 'Grant' },
  Deposit_Guarantee: { bg: '#EFE9FA', text: '#4C2E96', label: 'Deposit guarantee' },
  Shared_Equity: { bg: '#E1F3EE', text: '#0F6D58', label: 'Shared equity' },
  Stamp_Duty_Exemption: { bg: '#FDF1DD', text: '#7A4E00', label: 'Stamp duty exemption' },
  Stamp_Duty_Concession: { bg: '#EAEAFB', text: '#3730A3', label: 'Stamp duty concession' },
  Tax_Incentive: { bg: '#F3E4DA', text: '#8A4A21', label: 'Tax incentive' },
}

const STATUS_ORDER: MatchStatus[] = ['eligible', 'check', 'ineligible']

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']
const PROPERTY_TYPES: { value: 'established' | 'new' | 'offplan' | 'vacant_land'; label: string }[] = [
  { value: 'established', label: 'Established' },
  { value: 'new', label: 'New' },
  { value: 'offplan', label: 'Off-the-plan' },
  { value: 'vacant_land', label: 'Vacant land (to build)' },
]
const CITIZENSHIP_OPTIONS: { value: CitizenshipStatus; label: string }[] = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'permanent_resident', label: 'Permanent resident' },
  { value: 'other', label: 'Other / temporary visa' },
]
const YES_NO: { value: 'Yes' | 'No'; label: string }[] = [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]

/**
 * Housing Australia's own price-cap notes for these schemes (e.g. FED_HGS_FHG's
 * Capital_City_NSW band: "Sydney and regional centres (Newcastle, Lake
 * Macquarie, Illawarra)") confirm 'regional-centre' shares the higher
 * capital-city cap, not the lower rest-of-state one — so both collapse to
 * 'capital_city' here. Only 'rest' maps to 'regional'.
 */
function regionToLocationType(region: PriceCapRegion | undefined): LocationType | undefined {
  if (region === 'capital' || region === 'regional-centre') return 'capital_city'
  if (region === 'rest') return 'regional'
  return undefined
}

function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return '$' + n.toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

function SnapField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md p-2.5" style={{ border: `1px solid ${LINE}` }}>
      <span className="block mb-1" style={{ fontFamily: SANS, fontSize: 10.5, color: MUTED }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function MiniSelect<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-transparent outline-none appearance-none"
      style={{ fontFamily: GROTESK, fontWeight: 600, fontSize: 13.5, color: INK, border: 'none', padding: 0 }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function MiniToggle<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex rounded-md overflow-hidden w-fit" style={{ border: `1px solid ${LINE}` }}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="px-2.5 py-1 transition-colors"
          style={{
            fontFamily: SANS,
            fontSize: 11.5,
            fontWeight: 600,
            background: value === o.value ? INK : 'transparent',
            color: value === o.value ? PAPER : MUTED,
            borderLeft: i > 0 ? `1px solid ${LINE}` : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function MiniCurrency({ value, onChange, placeholder }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span style={{ fontFamily: GROTESK, fontWeight: 600, fontSize: 13.5, color: MUTED }}>$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value === null ? '' : value.toLocaleString('en-AU')}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '')
          onChange(digits === '' ? null : Number(digits))
        }}
        className="w-full bg-transparent outline-none min-w-0 placeholder:font-normal"
        style={{ fontFamily: GROTESK, fontWeight: 600, fontSize: 13.5, color: value === null ? '#B9B6AC' : INK, border: 'none', padding: 0 }}
      />
    </div>
  )
}

/**
 * Suburb/postcode search, scoped to the selected state — replaces a blunt
 * "capital city or regional?" guess with the same verified postcode data the
 * app's real onboarding flow uses (src/lib/questionnaire/postcodes.ts).
 */
function SuburbSearch({ state, value, onChange }: { state: string; value: SuburbEntry | null; onChange: (v: SuburbEntry | null) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const results = searchSuburbs(query, 8).filter((s) => s.state === state)

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5">
        <Search size={12} style={{ color: MUTED, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search suburb or postcode"
          value={value ? `${value.suburb} (${value.postcode})` : query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(null)
            setQuery(e.target.value)
            setOpen(true)
          }}
          className="w-full bg-transparent outline-none min-w-0 placeholder:font-normal"
          style={{ fontFamily: GROTESK, fontWeight: 600, fontSize: 13.5, color: INK, border: 'none', padding: 0 }}
        />
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute z-20 overflow-hidden"
          style={{ top: 'calc(100% + 6px)', left: 0, minWidth: 220, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(21,23,38,0.14)' }}
        >
          {results.map((r) => (
            <button
              key={`${r.suburb}-${r.postcode}`}
              type="button"
              onClick={() => {
                onChange(r)
                setQuery('')
                setOpen(false)
              }}
              className="w-full flex justify-between gap-2 px-2.5 py-2 text-left hover:bg-[#F1EFE9]"
              style={{ fontFamily: SANS, fontSize: 12.5, color: INK, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <span>{r.suburb}</span>
              <span style={{ color: MUTED }}>{r.postcode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// A single flowing ledger row rather than a card-per-category — the category
// is a small coloured tag on the left, not a container. No per-category
// header/chrome means no card ever sits half-empty next to a taller one.
function LedgerRow({ category, m, first }: { category: Category; m: CalculatorMatch; first: boolean }) {
  const [open, setOpen] = useState(false)
  const catMeta = CATEGORY_META[category]
  const amount = m.status === 'eligible' && m.scheme.grant_amount_dollars ? money(m.scheme.grant_amount_dollars) : null
  const summary = m.reasons[0] ?? m.scheme.description ?? null
  const extraReasons = m.reasons.slice(1)

  return (
    <div style={{ borderTop: first ? 'none' : `1px dotted ${LINE}` }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left flex items-start gap-2.5 px-3.5 py-2.5">
        <span
          className="shrink-0 rounded-md text-center w-[84px] sm:w-[108px]"
          style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.3, padding: '4px 5px', marginTop: 1, background: catMeta.bg, color: catMeta.text }}
        >
          {catMeta.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2 flex-wrap">
            <p style={{ fontFamily: SANS, fontWeight: 600, fontSize: 12.5, color: INK, margin: 0 }}>{m.scheme.scheme_name}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {amount && <span style={{ fontFamily: GROTESK, fontWeight: 700, fontSize: 12, color: INK }}>{amount}</span>}
              <ChevronDown size={13} style={{ color: MUTED, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
            </div>
          </div>
          {summary && <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, lineHeight: 1.45, margin: '3px 0 0' }}>{summary}</p>}
        </div>
      </button>

      {open && (
        <div className="ml-3.5 sm:ml-[126px] pl-3.5 pr-3.5 pb-3" style={{ borderLeft: `1px dotted ${LINE}` }}>
          {extraReasons.length > 0 && (
            <ul className="mb-2" style={{ paddingLeft: 14 }}>
              {extraReasons.map((r, i) => (
                <li key={i} style={{ fontFamily: SANS, fontSize: 11, color: MUTED, lineHeight: 1.5, listStyle: 'disc' }}>{r}</li>
              ))}
            </ul>
          )}

          {m.toVerify.length > 0 && (
            <div className="mb-2">
              <p style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED, margin: '0 0 5px' }}>
                Also confirm before applying
              </p>
              <div className="flex flex-col gap-1.5">
                {m.toVerify.map((v, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span
                      className="shrink-0 rounded px-1"
                      style={{ fontSize: 8.5, fontWeight: 700, marginTop: 1.5, background: v.mandatory ? '#FCE7E9' : '#F1EFE9', color: v.mandatory ? '#8A1424' : MUTED }}
                    >
                      {v.mandatory ? 'REQUIRED' : 'OPTIONAL'}
                    </span>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: MUTED, lineHeight: 1.45 }}>{v.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {m.scheme.official_url && (
            <a
              href={m.scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: MUTED, textDecoration: 'underline' }}
            >
              Official page <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function SchemesLibraryCalculator() {
  const [state, setState] = useState('NSW')
  const [propertyType, setPropertyType] = useState<'new' | 'established' | 'offplan' | 'vacant_land'>('established')
  const [propertyPrice, setPropertyPrice] = useState<number | null>(700_000)
  const [buyingWithPartnerAnswer, setBuyingWithPartnerAnswer] = useState<'Yes' | 'No'>('No')
  const [income, setIncome] = useState<number | null>(null)
  const [everOwnedAnswer, setEverOwnedAnswer] = useState<'Yes' | 'No'>('No')
  const [citizenshipStatus, setCitizenshipStatus] = useState<CitizenshipStatus>('citizen')
  const [willLiveInAnswer, setWillLiveInAnswer] = useState<'Yes' | 'No'>('Yes')
  const [suburbSelection, setSuburbSelection] = useState<SuburbEntry | null>(null)
  const [yearsSinceOwnedText, setYearsSinceOwnedText] = useState('')
  const [entityAnswer, setEntityAnswer] = useState<'Yes' | 'No'>('Yes')
  const [singleParentAnswer, setSingleParentAnswer] = useState<'Yes' | 'No'>('No')

  // A suburb picked for a different state is no longer valid — derived at
  // render time rather than synced back into state via an effect, so a
  // state change never resolves price caps against the wrong suburb.
  const activeSuburb = suburbSelection && suburbSelection.state === state ? suburbSelection : null

  const buyingWithPartner = buyingWithPartnerAnswer === 'Yes'
  const everOwnedProperty = everOwnedAnswer === 'Yes'
  const willLiveIn = willLiveInAnswer === 'Yes'
  const locationType = regionToLocationType(activeSuburb?.region)
  const yearsSinceOwned = yearsSinceOwnedText.trim() === '' ? undefined : Number(yearsSinceOwnedText)
  const purchasingEntity: PurchasingEntity = entityAnswer === 'Yes' ? 'individual' : 'company_or_trust'
  const isSingleParent = singleParentAnswer === 'Yes'

  const result = useMemo(
    () =>
      calculateSchemesLibrary({
        state,
        propertyType,
        propertyPrice: propertyPrice ?? 0,
        buyingWithPartner,
        income: income ?? undefined,
        everOwnedProperty,
        citizenshipStatus,
        willLiveIn,
        locationType,
        yearsSinceOwned,
        purchasingEntity,
        isSingleParent,
      }),
    [
      state, propertyType, propertyPrice, buyingWithPartner, income, everOwnedProperty, citizenshipStatus, willLiveIn,
      locationType, yearsSinceOwned, purchasingEntity, isSingleParent,
    ],
  )

  // Eligible, then check required, then not eligible — result.matches is
  // already sorted this way by the engine; group it for section headers
  // without disturbing that order within each group.
  const byStatus: Record<MatchStatus, CalculatorMatch[]> = { eligible: [], check: [], ineligible: [] }
  for (const m of result.matches) byStatus[m.status].push(m)
  const populatedStatuses = STATUS_ORDER.filter((s) => byStatus[s].length > 0)

  return (
    <div className="rounded-2xl mx-auto" style={{ background: PAPER, border: `1px solid ${LINE}`, boxShadow: '0 4px 28px rgba(21,23,38,0.08)', padding: '26px 22px 22px' }}>
      {/* Header */}
      <div className="pb-3 mb-5" style={{ borderBottom: `2px solid ${INK}` }}>
        <h2 style={{ fontFamily: GROTESK, fontSize: 'clamp(19px, 2.6vw, 24px)', fontWeight: 600, color: INK, margin: 0, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.02em' }}>
          Grants, schemes &amp; savings
        </h2>
      </div>

      {/* Inputs */}
      <p style={{ fontFamily: SANS, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: MUTED, margin: '0 0 8px' }}>
        What this is based on
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <SnapField label="State / territory">
          <MiniSelect value={state} onChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} />
        </SnapField>
        <SnapField label="Property type">
          <MiniSelect value={propertyType} onChange={setPropertyType} options={PROPERTY_TYPES} />
        </SnapField>
        <SnapField label="Property price">
          <MiniCurrency value={propertyPrice} onChange={setPropertyPrice} placeholder="700,000" />
        </SnapField>
        <SnapField label="Household income (optional)">
          <MiniCurrency value={income} onChange={setIncome} placeholder="95,000" />
        </SnapField>
        <SnapField label="Citizenship / residency">
          <MiniSelect value={citizenshipStatus} onChange={setCitizenshipStatus} options={CITIZENSHIP_OPTIONS} />
        </SnapField>
        <SnapField label="Buying as an individual">
          <MiniToggle value={entityAnswer} onChange={setEntityAnswer} options={YES_NO} />
        </SnapField>
        <SnapField label="Buying with a partner">
          <MiniToggle value={buyingWithPartnerAnswer} onChange={setBuyingWithPartnerAnswer} options={YES_NO} />
        </SnapField>
        <SnapField label="Single parent / guardian">
          <MiniToggle value={singleParentAnswer} onChange={setSingleParentAnswer} options={YES_NO} />
        </SnapField>
        <SnapField label="Owned property before">
          <MiniToggle value={everOwnedAnswer} onChange={setEverOwnedAnswer} options={YES_NO} />
        </SnapField>
        <SnapField label="Will live in property">
          <MiniToggle value={willLiveInAnswer} onChange={setWillLiveInAnswer} options={YES_NO} />
        </SnapField>
      </div>

      {/* Optional refinements — resolve "check" verdicts instead of guessing */}
      <div className="rounded-md p-3 mb-5 flex flex-wrap gap-x-8 gap-y-3" style={{ border: `1px dashed ${LINE}` }}>
        <div style={{ minWidth: 200 }}>
          <span className="block mb-1.5" style={{ fontFamily: SANS, fontSize: 10.5, color: MUTED }}>Suburb or postcode (optional)</span>
          <SuburbSearch state={state} value={activeSuburb} onChange={setSuburbSelection} />
        </div>
        {everOwnedProperty && (
          <div>
            <span className="block mb-1.5" style={{ fontFamily: SANS, fontSize: 10.5, color: MUTED }}>Years since you last owned? (optional)</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 12"
              value={yearsSinceOwnedText}
              onChange={(e) => setYearsSinceOwnedText(e.target.value)}
              className="bg-transparent outline-none"
              style={{ fontFamily: GROTESK, fontWeight: 600, fontSize: 13.5, color: INK, border: 'none', borderBottom: `1px solid ${LINE}`, padding: '0 0 2px', width: 90 }}
            />
          </div>
        )}
        <p className="w-full" style={{ fontFamily: SANS, fontSize: 10.5, color: MUTED, lineHeight: 1.5, margin: 0 }}>
          Leave these blank and we&apos;ll flag the affected schemes as &quot;check required&quot; instead of guessing.
        </p>
      </div>

      {/* Results, sorted eligible → check required → not eligible */}
      <p style={{ fontFamily: SANS, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: MUTED, margin: '0 0 8px' }}>
        Grants, schemes &amp; savings
      </p>
      {populatedStatuses.length > 0 ? (
        <div className="rounded-lg mb-5 overflow-hidden" style={{ border: `1px solid ${LINE}`, background: PAPER }}>
          {populatedStatuses.map((status, si) => (
            <div key={status}>
              <div className="px-3.5 py-1.5" style={{ background: TAG_STYLE[status].bg, borderTop: si === 0 ? 'none' : `1px solid ${LINE}` }}>
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: TAG_STYLE[status].text }}>
                  {TAG_STYLE[status].label} ({byStatus[status].length})
                </span>
              </div>
              {byStatus[status].map((m, i) => (
                <LedgerRow key={m.scheme.scheme_id} category={m.scheme.scheme_type as Category} m={m} first={i === 0} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: SANS, fontSize: 12, color: MUTED, padding: '10px 0 20px' }}>
          No Federal or {state} schemes match this combination.
        </p>
      )}

      {/* Bottom line */}
      <div className="rounded-lg px-4 py-3.5 mb-4 flex justify-between items-center flex-wrap gap-3" style={{ background: '#CFF25B', color: '#33420A' }}>
        <div>
          <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, opacity: 0.75, margin: '0 0 2px' }}>Eligible now</p>
          <p style={{ fontFamily: GROTESK, fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1 }}>{result.eligibleCount}</p>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(51,66,10,0.25)' }} />
        <div>
          <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, opacity: 0.75, margin: '0 0 2px' }}>Need checking</p>
          <p style={{ fontFamily: GROTESK, fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1 }}>{result.checkCount}</p>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(51,66,10,0.25)' }} />
        <div>
          <p style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, opacity: 0.75, margin: '0 0 2px' }}>Eligible cash grants</p>
          <p style={{ fontFamily: GROTESK, fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1 }}>{money(result.cashGrantsTotal)}</p>
        </div>
      </div>
    </div>
  )
}
