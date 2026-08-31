'use client'

import { useRef, useState } from 'react'

interface SchemeCard {
  id: string
  rarity: string
  rarityColor: string
  tint1: string
  tint2: string
  name: string
  glyph: React.ReactNode
  stats: { label: string; value: string; pct: number }[]
  move: string
}

const GLYPH_STROKE = 1.5

const CARDS: SchemeCard[] = [
  {
    id: 'fhss',
    rarity: 'Uncommon',
    rarityColor: '#3f6b3f',
    tint1: '#dff3df',
    tint2: '#b9e3b9',
    name: 'First Home Super Saver',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2f5c2f" strokeWidth={GLYPH_STROKE}>
        <path d="M4 20V10l8-6 8 6v10" strokeLinejoin="round" />
        <path d="M9 20v-6h6v6" strokeLinejoin="round" />
      </svg>
    ),
    stats: [
      { label: 'Deposit needed', value: '$50k cap', pct: 50 },
      { label: 'Income limit', value: 'None', pct: 100 },
      { label: 'Solo-friendly', value: 'Yes', pct: 100 },
      { label: 'Speed', value: 'Slow build-up', pct: 30 },
    ],
    move: 'Top up super at 15% tax, withdraw for your deposit. Stacks with any other card in this set.',
  },
  {
    id: 'htb',
    rarity: 'Rare',
    rarityColor: '#8a3d1f',
    tint1: '#ffe3d6',
    tint2: '#ffbfa3',
    name: 'Help to Buy',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a3d1f" strokeWidth={GLYPH_STROKE}>
        <rect x="3" y="11" width="8" height="9" rx="0.5" />
        <rect x="13" y="6" width="8" height="14" rx="0.5" />
      </svg>
    ),
    stats: [
      { label: 'Deposit needed', value: '2%', pct: 90 },
      { label: 'Income limit', value: '$103–165k', pct: 45 },
      { label: 'Solo-friendly', value: 'Yes', pct: 100 },
      { label: 'Places left', value: '10,000 cap', pct: 55 },
    ],
    move: 'Government co-buys up to 40% — no rent, no interest on their share. Citizens only.',
  },
  {
    id: 'deposit5',
    rarity: 'Legendary',
    rarityColor: '#8a6d00',
    tint1: '#fff4cc',
    tint2: '#ffe485',
    name: '5% Deposit Scheme',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a6d00" strokeWidth={GLYPH_STROKE}>
        <rect x="5" y="10" width="14" height="10" rx="1" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
      </svg>
    ),
    stats: [
      { label: 'Deposit needed', value: '5%', pct: 95 },
      { label: 'Income limit', value: 'None', pct: 100 },
      { label: 'Solo-friendly', value: 'Yes', pct: 100 },
      { label: 'Places left', value: 'Unlimited', pct: 100 },
    ],
    move: 'Government guarantees the gap to 20% — your bank skips LMI entirely. No queue.',
  },
  {
    id: 'fhg',
    rarity: 'Mythic',
    rarityColor: '#8a1f5e',
    tint1: '#ffe0f0',
    tint2: '#ffb3da',
    name: 'Family Home Guarantee',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a1f5e" strokeWidth={GLYPH_STROKE}>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      </svg>
    ),
    stats: [
      { label: 'Deposit needed', value: '2%', pct: 98 },
      { label: 'Income limit', value: 'None', pct: 100 },
      { label: 'Solo-friendly', value: 'Required', pct: 60 },
      { label: 'Places left', value: 'Unlimited', pct: 100 },
    ],
    move: 'Single parents & guardians only, applying solo. Lowest deposit in the set.',
  },
]

function Card({ card, opened, delayMs }: { card: SchemeCard; opened: boolean; delayMs: number }) {
  const [flipped, setFlipped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <div style={{ aspectRatio: '5 / 7.4' }}>
      <div
        ref={ref}
        onClick={() => opened && setFlipped((f) => !f)}
        onPointerMove={onPointerMove}
        role="button"
        tabIndex={0}
        aria-label={`${card.name} card, tap to flip`}
        onKeyDown={(e) => {
          if (opened && (e.key === 'Enter' || e.key === ' ')) { setFlipped((f) => !f); e.preventDefault() }
        }}
        className="fn-card"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: opened ? 'pointer' : 'default',
          transformStyle: 'preserve-3d',
          transition: `transform 700ms cubic-bezier(0.2,0.9,0.25,1), opacity 480ms ease ${delayMs}ms, translate 480ms cubic-bezier(0.2,0.9,0.25,1) ${delayMs}ms`,
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          opacity: opened ? 1 : 0,
          translate: opened ? '0 0' : '0 22px',
        }}
      >
        {/* Front */}
        <div
          className="fn-card-face"
          style={{
            background: `repeating-linear-gradient(135deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 14px), linear-gradient(160deg, ${card.tint1}, ${card.tint2})`,
            padding: 16,
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              alignSelf: 'flex-start',
              fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              padding: '4px 9px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.55)',
              color: card.rarityColor,
              border: `1px solid ${card.rarityColor}`,
            }}
          >
            {card.rarity}
          </span>
          <div style={{ width: '42%', margin: '0 auto', aspectRatio: '1' }}>{card.glyph}</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.02rem', lineHeight: 1.1, textAlign: 'center', color: '#1a1a1a' }}>
            {card.name}
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }}>
            tap to flip
          </div>
          <div className="fn-holo" />
        </div>

        {/* Back */}
        <div className="fn-card-face fn-card-back">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: card.tint1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14 }}>{card.glyph}</div>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 12.5, lineHeight: 1.15, color: '#fff' }}>{card.name}</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {card.stats.map((s) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace', fontSize: 9.5, color: '#a9a4b8', marginBottom: 3 }}>
                  <span>{s.label}</span>
                  <b style={{ color: '#fff' }}>{s.value}</b>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      width: flipped ? `${s.pct}%` : '0%',
                      background: card.tint2,
                      transition: 'width 900ms cubic-bezier(0.16,1,0.3,1) 150ms',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', fontSize: 10.5, lineHeight: 1.5, color: '#a9a4b8', borderTop: '1px dashed rgba(255,255,255,0.16)', paddingTop: 9 }}>
            <b style={{ color: '#fff', fontFamily: 'ui-monospace, monospace', fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
              Special move
            </b>
            {card.move}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SchemeCardPack() {
  const [opened, setOpened] = useState(false)

  return (
    <div>
      <style>{`
        .fn-card-face {
          position: absolute; inset: 0; backface-visibility: hidden; border-radius: 16px;
          display: flex; flex-direction: column; overflow: hidden;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 14px 30px -16px rgba(0,0,0,0.28);
        }
        .fn-card-back { transform: rotateY(180deg); background: linear-gradient(180deg, #232030, #16141d); padding: 16px 16px 14px; }
        .fn-holo {
          position: absolute; inset: 0; pointer-events: none; opacity: 0; mix-blend-mode: color-dodge;
          background: linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.8) 36%, rgba(0,255,255,0.55) 44%, rgba(255,0,200,0.55) 52%, transparent 68%);
          background-size: 220% 220%;
          background-position: var(--mx, 50%) var(--my, 50%);
          transition: opacity 200ms ease;
        }
        .fn-card:hover .fn-holo { opacity: 0.5; }
        .fn-pack-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 26px -10px rgba(245,230,66,0.6); }
        .fn-pack-btn:active { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) {
          .fn-card, .fn-card-face div[style*="transition"] { transition: none !important; }
        }
      `}</style>

      {!opened && (
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <button
            type="button"
            onClick={() => setOpened(true)}
            className="fn-pack-btn"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.02em',
              color: '#111111',
              background: '#F5E642',
              border: 'none',
              borderRadius: 999,
              padding: '14px 28px',
              cursor: 'pointer',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
          >
            Open the pack
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 20,
          perspective: 1400,
        }}
      >
        {CARDS.map((card, i) => (
          <Card key={card.id} card={card} opened={opened} delayMs={i * 110} />
        ))}
      </div>

      <p
        style={{
          marginTop: 40,
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 11.5,
          color: '#777',
          borderTop: '1px solid #eee',
          paddingTop: 22,
        }}
      >
        Can&apos;t be played together: <b style={{ color: '#8a3d1f' }}>Help to Buy</b> +{' '}
        <b style={{ color: '#8a6d00' }}>5% Deposit Scheme</b> on the same purchase. Everything else stacks.
      </p>
    </div>
  )
}
