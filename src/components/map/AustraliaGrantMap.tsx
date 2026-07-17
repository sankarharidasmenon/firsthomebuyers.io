'use client'

import { useState } from 'react'

interface StateGrant {
  abbr: string
  name: string
  totalValue: number
  grants: Array<{ name: string; value: string; federal?: boolean }>
  stampDutyNote: string
  propertyPriceCap: string
}

const STATE_DATA: Record<string, StateGrant> = {
  WA: {
    abbr: 'WA', name: 'Western Australia', totalValue: 27765,
    grants: [
      { name: 'First Home Owner Grant', value: '$10,000' },
      { name: 'Stamp Duty Concession', value: 'Up to $17,765' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: 'Full exemption under $430k',
    propertyPriceCap: '$600,000',
  },
  NT: {
    abbr: 'NT', name: 'Northern Territory', totalValue: 60000,
    grants: [
      { name: 'First Home Owner Grant', value: '$10,000' },
      { name: 'Stamp Duty Concession', value: 'Up to $23,928' },
      { name: 'BuildBonus Grant', value: '$20,000' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
    ],
    stampDutyNote: 'Full exemption under $500k',
    propertyPriceCap: '$650,000',
  },
  QLD: {
    abbr: 'QLD', name: 'Queensland', totalValue: 80000,
    grants: [
      { name: 'First Home Owner Grant', value: '$30,000' },
      { name: 'Stamp Duty Concession', value: 'Up to $8,750' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: 'Full concession under $500k',
    propertyPriceCap: '$700,000',
  },
  SA: {
    abbr: 'SA', name: 'South Australia', totalValue: 65000,
    grants: [
      { name: 'First Home Owner Grant', value: '$15,000' },
      { name: 'Stamp Duty Concession', value: 'Full exemption' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: 'Full exemption under $650k',
    propertyPriceCap: '$650,000',
  },
  NSW: {
    abbr: 'NSW', name: 'New South Wales', totalValue: 41335,
    grants: [
      { name: 'First Home Owner Grant', value: '$10,000' },
      { name: 'Stamp Duty Concession', value: 'Up to $31,335' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: 'Full exemption under $650k, partial $650k–$800k',
    propertyPriceCap: '$800,000',
  },
  ACT: {
    abbr: 'ACT', name: 'Australian Capital Territory', totalValue: 35700,
    grants: [
      { name: 'Home Buyer Concession', value: 'Full duty waiver' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: 'Full duty waiver (income-tested)',
    propertyPriceCap: '$1,000,000',
  },
  VIC: {
    abbr: 'VIC', name: 'Victoria', totalValue: 42870,
    grants: [
      { name: 'First Home Owner Grant', value: '$10,000' },
      { name: 'Stamp Duty Concession', value: 'Up to $32,870' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: 'Full exemption under $600k, partial $600k–$750k',
    propertyPriceCap: '$750,000',
  },
  TAS: {
    abbr: 'TAS', name: 'Tasmania', totalValue: 70000,
    grants: [
      { name: 'First Home Owner Grant', value: '$20,000' },
      { name: 'Stamp Duty Concession', value: '50% reduction' },
      { name: 'First Home Super Saver', value: 'Up to $50,000', federal: true },
      { name: 'First Home Guarantee', value: '5% deposit', federal: true },
    ],
    stampDutyNote: '50% stamp duty reduction for new homes',
    propertyPriceCap: '$600,000',
  },
}

function getColor(abbr: string, isSelected: boolean, isHovered: boolean) {
  if (isHovered) return '#F5E642'
  if (isSelected) return '#D4C400'
  const value = STATE_DATA[abbr]?.totalValue ?? 0
  if (value >= 70000) return '#16A34A'
  if (value >= 50000) return '#22C55E'
  if (value >= 35000) return '#86EFAC'
  return '#BBF7D0'
}

function formatValue(v: number) {
  return `$${(v / 1000).toFixed(0)}k`
}

// ViewBox: 0 0 860 700
// Approximate equirectangular:  x = (lon - 113) * 21,  y = (lat - 10) * 20.6
// All paths are original simplified representations of Australian state boundaries.
const STATE_PATHS: Record<string, { path: string; labelX: number; labelY: number }> = {
  // WA: large western state — straight 129°E eastern border, NW Kimberley coast,
  //     curved SW corner at Cape Leeuwin, flat Great Australian Bight south coast.
  WA: {
    path: [
      'M 336,90',
      'L 308,76 L 270,66 L 232,74 L 198,92',   // NW coast / Kimberley
      'L 172,120 L 144,156 L 112,190',           // Broome → NW Cape
      'L 78,234 L 56,288 L 40,348',              // Shark Bay / Geraldton
      'L 46,416 L 60,454 L 44,494',              // Perth → Cape Leeuwin (SW)
      'L 90,508 L 162,494 L 228,498 L 286,497',  // South coast east
      'L 336,492 Z',                              // Closes via straight 129°E border
    ].join(' '),
    labelX: 168, labelY: 315,
  },

  // NT: rectangular with curved northern coast — Darwin bump at ~131°E, 12.5°S.
  NT: {
    path: 'M 336,90 L 375,52 L 420,30 L 466,42 L 525,92 L 525,330 L 336,330 Z',
    labelX: 430, labelY: 210,
  },

  // QLD: northeastern state. Key features:
  //  – Gulf of Carpentaria coast (west side), creating concave NW
  //  – Cape York peninsula tapering north to tip at ~145.8°E, 10.7°S
  //  – Long east coast from Cairns → Brisbane
  QLD: {
    path: [
      'M 525,92',
      'L 540,135 L 548,156 L 565,142 L 578,120 L 592,96',  // Gulf of Carpentaria shore
      'L 612,74 L 636,54 L 656,30 L 672,12 L 686,18',      // Cape York peninsula → tip
      'L 706,58 L 734,120 L 766,202',                       // East coast: Cape York → Cairns
      'L 800,284 L 842,364',                                 // Townsville → Brisbane
      'L 588,392 L 525,330 Z',                              // Southern border + diagonal SA border
    ].join(' '),
    labelX: 660, labelY: 245,
  },

  // SA: centre-south state. Two bays shown with bezier curves:
  //  – Gulf St Vincent (between Fleurieu Peninsula and Yorke Peninsula)
  //  – Spencer Gulf (between Yorke Peninsula and Eyre Peninsula)
  SA: {
    path: [
      'M 336,330 L 525,330 L 588,392',      // Top border + NE diagonal
      'L 588,500',                           // Eastern border 141°E going south
      // Gulf St Vincent — smooth bay east of Yorke Peninsula
      'L 558,510 C 545,530 530,536 516,516',
      // Yorke Peninsula coast & tip
      'C 502,498 488,532 468,534',
      // Spencer Gulf opening — smooth bay between Yorke & Eyre
      'C 454,536 436,546 420,530',
      // Eyre Peninsula south & Great Australian Bight
      'C 404,514 380,530 355,520',
      'L 336,506 Z',
    ].join(' '),
    labelX: 448, labelY: 418,
  },

  // NSW: eastern state, roughly rectangular.
  NSW: {
    path: [
      'M 588,392 L 842,364',                    // Northern border (29°S)
      'L 856,398 L 848,442 L 822,494',          // East coast heading south
      'L 800,532 L 764,542',                    // Sydney → Bega coast
      'L 716,538 L 684,516 L 648,500',          // NSW/VIC border area
      'L 588,500 Z',                            // Western border 141°E
    ].join(' '),
    labelX: 714, labelY: 460,
  },

  // ACT: tiny territory inside NSW — shown enlarged for visibility.
  ACT: {
    path: 'M 748,498 L 770,498 L 770,520 L 748,520 Z',
    labelX: 759, labelY: 509,
  },

  // VIC: thin southern strip, south coast faces Southern Ocean.
  VIC: {
    path: [
      'M 588,500 L 648,500 L 684,516 L 716,538 L 764,542', // northern edge
      'L 772,562 L 748,578 L 710,582',                      // east + southeast coast
      'L 670,578 L 628,570 L 598,562 L 588,546 Z',         // west coast → SA border
    ].join(' '),
    labelX: 664, labelY: 548,
  },

  // TAS: island south-east of VIC, roughly diamond-shaped.
  TAS: {
    path: [
      'M 664,622 L 710,610 L 750,620 L 758,646',
      'L 744,672 L 718,682 L 690,682 L 664,672',
      'L 648,650 L 654,628 Z',
    ].join(' '),
    labelX: 702, labelY: 648,
  },
}

export function AustraliaGrantMap() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const selectedData = selected ? STATE_DATA[selected] : null
  const hoveredData = hovered ? STATE_DATA[hovered] : null

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <span style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Total grants available
        </span>
        {[
          { label: '$25k+', color: '#BBF7D0' },
          { label: '$35k+', color: '#86EFAC' },
          { label: '$50k+', color: '#22C55E' },
          { label: '$70k+', color: '#16A34A' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: '1px solid rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#444' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Hover info bar */}
      <div style={{
        height: 38,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: hoveredData ? '#F8F9FA' : 'transparent',
        borderRadius: 8,
        border: hoveredData ? '1px solid #EEE' : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}>
        {hoveredData ? (
          <>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, color: '#111' }}>
              {hoveredData.name}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: '#16A34A' }}>
              Up to {formatValue(hoveredData.totalValue)} available
            </span>
          </>
        ) : (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#aaa' }}>
            Hover a state to preview · Click to see full breakdown
          </span>
        )}
      </div>

      {/* Map */}
      <div style={{ background: '#EEF6FF', borderRadius: 16, overflow: 'hidden', border: '1px solid #DDEEFF' }}>
        <svg
          viewBox="0 0 860 700"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="Map of Australia showing grants by state"
        >
          {Object.entries(STATE_PATHS).map(([abbr, { path, labelX, labelY }]) => {
            const isSelected = selected === abbr
            const isHovered = hovered === abbr
            const fill = getColor(abbr, isSelected, isHovered)
            const data = STATE_DATA[abbr]

            return (
              <g
                key={abbr}
                onClick={() => setSelected(isSelected ? null : abbr)}
                onMouseEnter={() => setHovered(abbr)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={path}
                  fill={fill}
                  stroke="#FFFFFF"
                  strokeWidth={abbr === 'ACT' ? 1.5 : 2}
                  strokeLinejoin="round"
                  style={{ transition: 'fill 0.15s ease' }}
                />
                {/* Label: state abbreviation */}
                {abbr !== 'ACT' && (
                  <text
                    x={labelX}
                    y={labelY - 8}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: abbr === 'TAS' ? 11 : 13,
                      fontWeight: 700,
                      fill: isHovered || isSelected ? '#111' : '#1B5E3B',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {abbr}
                  </text>
                )}
                {/* Label: grant value */}
                {abbr !== 'ACT' && data && (
                  <text
                    x={labelX}
                    y={labelY + 8}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: abbr === 'TAS' ? 9 : 11,
                      fontWeight: 600,
                      fill: isHovered || isSelected ? '#333' : '#2D7A4F',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {formatValue(data.totalValue)}
                  </text>
                )}
              </g>
            )
          })}

          {/* ACT callout line + label (outside the tiny box) */}
          <line x1="770" y1="509" x2="810" y2="480" stroke="#666" strokeWidth="1" strokeDasharray="3,2" />
          <text x="815" y="475" style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, fill: '#555', userSelect: 'none' }}>ACT</text>

          {/* Ocean labels */}
          <text x="84" y="605"  textAnchor="middle" style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: '#93C5FD', fontStyle: 'italic', userSelect: 'none' }}>Indian Ocean</text>
          <text x="120" y="670" textAnchor="middle" style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fill: '#93C5FD', fontStyle: 'italic', userSelect: 'none' }}>Southern Ocean</text>
          <text x="798" y="695" textAnchor="middle" style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fill: '#93C5FD', fontStyle: 'italic', userSelect: 'none' }}>Tasman Sea</text>
        </svg>
      </div>

      {/* State detail panel */}
      {selectedData && (
        <div style={{ marginTop: 20, background: '#FFFFFF', border: '1px solid #EEEEEE', borderRadius: 16, padding: '24px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
                {selectedData.abbr} — {selectedData.name}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#16A34A' }}>
                {formatValue(selectedData.totalValue)}
              </div>
              <div style={{ fontSize: 13, color: '#666', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                in available grants &amp; concessions
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: '1px solid #EEE', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'Inter, sans-serif' }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {selectedData.grants.map((g) => (
              <div
                key={g.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: g.federal ? '#F8F9FA' : '#FAFFF5',
                  borderRadius: 10,
                  border: `1px solid ${g.federal ? '#EEEEEE' : '#BBF7D0'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {g.federal && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#111', color: '#F5E642', borderRadius: 9999, padding: '2px 7px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                      Federal
                    </span>
                  )}
                  <span style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#111' }}>{g.name}</span>
                </div>
                <span style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#16A34A' }}>{g.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '12px 16px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A' }}>
            <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#92400E' }}>
              💡 <strong>Stamp duty:</strong> {selectedData.stampDutyNote} · Price cap: {selectedData.propertyPriceCap}
            </span>
          </div>

          <a
            href={`/onboarding?flow=grants&state=${selectedData.abbr}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: '#111111', color: '#F5E642', padding: '12px 24px', borderRadius: 50, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
          >
            Check my eligibility in {selectedData.name} →
          </a>
        </div>
      )}
    </div>
  )
}
