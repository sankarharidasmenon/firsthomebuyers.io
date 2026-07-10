'use client'

import { useState } from 'react'
import { Navbar } from '@/components/home/Navbar'

/* ─── Placeholder icon for vacant zones ─────────────────────────────────── */
function BillboardIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Zone {
  id: string
  status: 'occupied' | 'vacant'
  size: 'small' | 'medium' | 'large'
  type?: 'image' | 'video'
  advertiser?: string
  tagline?: string
  ctaLabel?: string
  ctaUrl?: string
  price: string
  mediaUrl?: string   // local path: /videos/ad-{id}.mp4 — drop compressed MP4 in public/videos/
  posterUrl?: string  // shown while video loads (or when no video file exists yet)
  desktopOnly?: boolean
  objectFit?: 'cover' | 'contain'
}


/* ─── Zone data — 40 total (30 mobile, 40 desktop) ──────────────────────── */
const ZONES: Zone[] = [
  /* ── 001–024  visible on all screens ──────────────────────────────────── */
  { id: '001', status: 'occupied', size: 'large', type: 'image',
    advertiser: 'Sunrise Realty', tagline: 'Find your perfect home today',
    ctaLabel: 'View Listings', ctaUrl: '#', price: '$399/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop' },
  { id: '002', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'KeyNest Properties', tagline: 'Keys to your dream home',
    ctaLabel: 'Explore Now', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop' },
  { id: '003', status: 'occupied', size: 'medium', type: 'image',
    advertiser: 'Metro Home Loans', tagline: 'Rates that work for you',
    ctaLabel: 'Book a Free Call', ctaUrl: '#', price: '$199/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop' },
  { id: '004', status: 'occupied', size: 'small', type: 'image', advertiser: 'Test Ad Small', tagline: 'Testing small box', ctaLabel: 'Click Here', ctaUrl: '#', price: '$99/mo', mediaUrl: '/ad-image.jpeg', objectFit: 'cover' },
  { id: '005', status: 'occupied', size: 'large', type: 'video',
    advertiser: 'Coastal Real Estate', tagline: 'Coastal living at its finest',
    ctaLabel: 'View Properties', ctaUrl: '#', price: '$399/mo',
    mediaUrl: '/videos/ad-005.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop' },
  { id: '006', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'TrueNorth Conveyancing', tagline: 'Stress-free property transfer',
    ctaLabel: 'Get a Quote', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' },
  { id: '007', status: 'occupied', size: 'medium', type: 'image',
    advertiser: 'OpenDoor Finance', tagline: 'Open the door to ownership',
    ctaLabel: 'Apply Online', ctaUrl: '#', price: '$199/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop' },
  { id: '008', status: 'occupied', size: 'large', type: 'image', advertiser: 'Test Ad Large', tagline: 'Testing large box', ctaLabel: 'Click Here', ctaUrl: '#', price: '$399/mo', mediaUrl: '/ad-image.jpeg', objectFit: 'cover' },
  { id: '009', status: 'occupied', size: 'medium', type: 'video',
    advertiser: 'BlueSky Properties', tagline: 'Your future starts here',
    ctaLabel: 'See All Listings', ctaUrl: '#', price: '$199/mo',
    mediaUrl: '/videos/ad-009.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop' },
  { id: '010', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'Nest & Co.', tagline: 'Building nests, making homes',
    ctaLabel: 'Book Inspection', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop' },
  { id: '011', status: 'occupied', size: 'large', type: 'image',
    advertiser: 'PrimeLocation Agency', tagline: 'Prime locations, prime life',
    ctaLabel: 'Search Suburbs', ctaUrl: '#', price: '$399/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&auto=format&fit=crop' },
  { id: '012', status: 'vacant', size: 'small', price: '$99/mo' },
  { id: '013', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'SmartBuy Brokers', tagline: 'Smart finance, smart future',
    ctaLabel: 'Check Eligibility', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop' },
  { id: '014', status: 'occupied', size: 'medium', type: 'video',
    advertiser: 'First Keys Realty', tagline: 'First keys, first home',
    ctaLabel: 'Find My Home', ctaUrl: '#', price: '$199/mo',
    mediaUrl: '/videos/ad-014.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop' },
  { id: '015', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'Harbour View Real Estate', tagline: 'Harbour views for everyone',
    ctaLabel: 'View Listings', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop' },
  { id: '016', status: 'vacant', size: 'small', price: '$99/mo' },
  { id: '017', status: 'occupied', size: 'large', type: 'video',
    advertiser: 'Atlas Home Loans', tagline: 'Navigate your path home',
    ctaLabel: 'Get Pre-Approval', ctaUrl: '#', price: '$399/mo',
    mediaUrl: '/videos/ad-017.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop' },
  { id: '018', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'Prestige Property Group', tagline: 'Prestige in every street',
    ctaLabel: 'Contact an Agent', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop' },
  { id: '019', status: 'occupied', size: 'medium', type: 'image',
    advertiser: 'CoreLogic Partners', tagline: 'Data-driven property insights',
    ctaLabel: 'Get a Report', ctaUrl: '#', price: '$199/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop' },
  { id: '020', status: 'vacant', size: 'small', price: '$99/mo' },
  { id: '021', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'EasySettle Legal', tagline: 'Easy legal, easy settlement',
    ctaLabel: 'Free Consultation', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' },
  { id: '022', status: 'vacant', size: 'small', price: '$99/mo' },
  { id: '023', status: 'occupied', size: 'medium', type: 'image', advertiser: 'Test Ad Medium', tagline: 'Testing medium box', ctaLabel: 'Click Here', ctaUrl: '#', price: '$199/mo', mediaUrl: '/ad-image.jpeg', objectFit: 'contain' },
  { id: '024', status: 'vacant', size: 'small', price: '$99/mo' },
  /* ── 025–030  still mobile-visible ────────────────────────────────────── */
  { id: '025', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'PropertyNation', tagline: 'Property investment simplified',
    ctaLabel: 'Learn More', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop' },
  { id: '026', status: 'occupied', size: 'medium', type: 'image',
    advertiser: 'LendSmart Finance', tagline: 'Smart lending for smart buyers',
    ctaLabel: 'Apply Today', ctaUrl: '#', price: '$199/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&auto=format&fit=crop' },
  { id: '027', status: 'vacant', size: 'small', price: '$99/mo' },
  { id: '028', status: 'occupied', size: 'large', type: 'video',
    advertiser: 'GreenBuild Homes', tagline: 'Sustainable homes for modern Australia',
    ctaLabel: 'Explore Designs', ctaUrl: '#', price: '$399/mo',
    mediaUrl: '/videos/ad-028.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop' },
  { id: '029', status: 'occupied', size: 'small', type: 'image',
    advertiser: 'SettleSure Legal', tagline: 'Settlement you can trust',
    ctaLabel: 'Get a Quote', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop' },
  { id: '030', status: 'vacant', size: 'medium', price: '$199/mo' },
  /* ── 031–040  desktop-only ─────────────────────────────────────────────── */
  { id: '031', status: 'occupied', size: 'small', type: 'image', desktopOnly: true,
    advertiser: 'HomePath Realty', tagline: 'Your path home starts here',
    ctaLabel: 'Find Listings', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop' },
  { id: '032', status: 'vacant', size: 'small', price: '$99/mo', desktopOnly: true },
  { id: '033', status: 'occupied', size: 'medium', type: 'image', desktopOnly: true,
    advertiser: 'ValueProp Agency', tagline: 'Get more value on every property',
    ctaLabel: 'View Properties', ctaUrl: '#', price: '$199/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=800&auto=format&fit=crop' },
  { id: '034', status: 'occupied', size: 'small', type: 'image', desktopOnly: true,
    advertiser: 'ClearTitle Conveyancing', tagline: 'Clarity from contract to keys',
    ctaLabel: 'Book Now', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&auto=format&fit=crop' },
  { id: '035', status: 'vacant', size: 'small', price: '$99/mo', desktopOnly: true },
  { id: '036', status: 'occupied', size: 'large', type: 'video', desktopOnly: true,
    advertiser: 'NexGen Developments', tagline: "Building tomorrow's homes today",
    ctaLabel: 'View Projects', ctaUrl: '#', price: '$399/mo',
    mediaUrl: '/videos/ad-036.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&auto=format&fit=crop' },
  { id: '037', status: 'occupied', size: 'small', type: 'image', desktopOnly: true,
    advertiser: 'RateHaven Finance', tagline: 'Find your best rate today',
    ctaLabel: 'Compare Rates', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop' },
  { id: '038', status: 'vacant', size: 'small', price: '$99/mo', desktopOnly: true },
  { id: '039', status: 'vacant', size: 'medium', price: '$199/mo', desktopOnly: true },
  { id: '040', status: 'occupied', size: 'small', type: 'image', desktopOnly: true,
    advertiser: 'AusProp Solutions', tagline: 'Australian property expertise',
    ctaLabel: 'Get Started', ctaUrl: '#', price: '$99/mo',
    mediaUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop' },
]

/* ─── Grid size → Tailwind span classes ─────────────────────────────────── */
const GRID_CLASS: Record<Zone['size'], string> = {
  small:  'row-span-1',
  medium: 'row-span-2',
  large:  'row-span-2 sm:col-span-2',
}

/* ─── Zone serial badge ──────────────────────────────────────────────────── */
function SerialBadge({ id, dark = false }: { id: string; dark?: boolean }) {
  return (
    <div className="absolute top-3 left-3 z-20">
      <span 
        className={dark ? '' : 'bg-[#F0F0F0] dark:bg-surface text-[#111111] dark:text-foreground'}
        style={{
        background: dark ? 'rgba(255,255,255,0.92)' : undefined,
        color: dark ? '#111111' : undefined,
        fontFamily: 'monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.06em',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 9999,
        backdropFilter: dark ? 'blur(8px)' : undefined,
        display: 'inline-block',
        boxShadow: dark ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
      }}>
        {id}
      </span>
    </div>
  )
}

/* ─── Page component ────────────────────────────────────────────────────── */
export default function AdsPage() {
  const [modal, setModal] = useState<Zone | null>(null)
  const [copied, setCopied] = useState(false)

  const filtered = ZONES

  const handleCopy = (zoneId: string) => {
    const text = `${zoneId} — ads@firstnest.com.au`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <>
      <Navbar />

      {/* GlobalBackButton injects `main { padding-top: 82px / 90px }` automatically */}
      <main className="min-h-screen bg-[#FAFAFA] dark:bg-background">
        <style>{`
          /* Occupied card hover: lift + deeper shadow */
          .ads-card { transition: transform 200ms ease, box-shadow 200ms ease; }
          .ads-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-raised) !important; }

          /* Vacant card hover */
          .ads-vacant:hover { border-color: var(--color-lemon-dark) !important; }
          .ads-vacant:hover .ads-vacant-btn {
            background: var(--color-lemon) !important;
            color: var(--color-black) !important;
          }

          /* Filter pills */
          .ads-pill-active { background: #FFFFFF !important; color: var(--color-black) !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.12) !important; }
          .dark .ads-pill-active { background: var(--foreground) !important; color: var(--background) !important; box-shadow: none !important; }
          .ads-pill-inactive { color: var(--color-grey-dark); }
          .ads-pill-inactive:hover { color: var(--color-black) !important; }
          .dark .ads-pill-inactive { color: var(--muted-foreground); }
          .dark .ads-pill-inactive:hover { color: var(--foreground) !important; }

          /* CTA buttons */
          .ads-btn-primary { transition: background 150ms, transform 80ms; }
          .ads-btn-primary:hover { background: var(--color-lemon-dark) !important; }
          .ads-btn-primary:active { transform: scale(0.97); }
          .ads-btn-outline { transition: border-color 150ms, background 150ms; }
          .ads-btn-outline:hover { border-color: var(--color-black) !important; background: #FAFAFA !important; }
          .dark .ads-btn-outline:hover { border-color: var(--foreground) !important; background: var(--surface) !important; }

          /* Occupied zone CTA chip */
          .ads-zone-cta { transition: background 150ms; }
          .ads-zone-cta:hover { background: var(--color-lemon-dark) !important; }

          /* Modal close */
          .ads-modal-close:hover { background: var(--color-lemon-dark) !important; }

          /* Copy button */
          .ads-copy:hover { border-color: var(--color-grey-dark) !important; color: var(--color-black) !important; }
          .dark .ads-copy:hover { border-color: var(--foreground) !important; color: var(--foreground) !important; }

          /* Enquiry links */
          .ads-email:hover { text-decoration: underline; }
          .ads-phone:hover { color: var(--color-black) !important; }
          .dark .ads-phone:hover { color: var(--foreground) !important; }

          /* Smooth image scale on card hover */
          .ads-card:hover .ads-media { transform: scale(1.04); }
          .ads-media { transition: transform 500ms ease; }

          /* Stat chips — compact on mobile, full on sm+ */
          .ads-stat-chip { padding: 5px 10px; }
          @media (min-width: 640px) { .ads-stat-chip { padding: 7px 16px; } }

          /* ── Mobile hero — compact spacing overrides ────────────────── */
          .ads-h-title { margin-bottom: 0 !important; }
          .ads-h-desc  { font-size: 0.9375rem !important; line-height: 1.55 !important; margin-bottom: 10px !important; }
          .ads-h-chips { margin-bottom: 10px !important; gap: 6px !important; }
          .ads-h-cta   { gap: 8px !important; }
          .ads-h-btn   { padding: 10px 18px !important; min-height: 44px !important; font-size: 0.875rem !important; }
          @media (min-width: 1024px) {
            .ads-h-title { margin-bottom: 0 !important; }
            .ads-h-desc  { font-size: 1.0625rem !important; line-height: 1.6 !important; margin-bottom: 28px !important; }
            .ads-h-chips { margin-bottom: 32px !important; gap: 8px !important; }
            .ads-h-cta   { gap: 12px !important; }
            .ads-h-btn   { padding: 15px 28px !important; min-height: 52px !important; font-size: 0.9375rem !important; }
          }
        `}</style>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <header
          className="relative overflow-hidden px-4 md:px-8 lg:px-12 pt-3 pb-3 lg:pt-4 lg:pb-4 bg-white dark:bg-card border-b border-[#EEEEEE] dark:border-border"
        >
          {/* Decorative yellow glow — top-right */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: -120, right: -120,
            width: 480, height: 480, borderRadius: '50%',
            background: 'rgba(245,230,66,0.18)',
            filter: 'blur(90px)',
            pointerEvents: 'none',
          }} />
          {/* Second softer glow */}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: -60, left: '30%',
            width: 320, height: 320, borderRadius: '50%',
            background: 'rgba(245,230,66,0.08)',
            filter: 'blur(70px)',
            pointerEvents: 'none',
          }} />

          <div className="relative max-w-3xl">
            {/* Headline */}
            <h1 className="ads-h-title text-[var(--color-black)] dark:text-foreground" style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(1.5rem, 3.6vw, 2.25rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 0,
            }}>
              Welcome your next client.{' '}
              <span style={{ color: '#C8AA00' }}>Secure the space.</span>
            </h1>

          </div>
        </header>

        {/* ── BENTO GRID ─────────────────────────────────────────────────── */}
        <section
          id="billboard-grid"
          className="px-3 sm:px-4 md:px-6 lg:px-8 py-6"
          aria-label="Billboard zones"
        >
          {/*
            Mobile:  2-column grid — bento works on mobile with col-span
            Tablet:  3-column
            Desktop: 4-column with dense auto-flow
          */}
          <div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4"
            style={{ gridAutoRows: '180px', gridAutoFlow: 'dense' }}
          >
            {filtered.map(zone => {
              const visibilityClass = ''

              /* Size → grid span classes (sm for mobile bento, lg for desktop) */
              const spanClass =
                zone.size === 'large'  ? 'col-span-2 row-span-1' :
                zone.size === 'medium' ? 'row-span-2' :
                ''

              return (
                <div
                  key={zone.id}
                  className={`${spanClass} ${visibilityClass} relative rounded-2xl overflow-hidden ${zone.status === 'occupied' ? 'ads-card' : 'ads-vacant border-2 border-dashed border-[#DDDDDD] dark:border-border bg-white dark:bg-card'}`}
                  style={zone.status === 'occupied'
                    ? { background: '#E8E8E8', boxShadow: 'var(--shadow-card)', cursor: 'default' }
                    : { cursor: 'pointer' }
                  }
                >
                  {zone.status === 'occupied' ? (
                    /* ── OCCUPIED CARD ────────────────────────────────────── */
                    <>
                      {/* Background media */}
                      {zone.type === 'video' ? (
                        <video
                          autoPlay muted loop playsInline
                          preload="none"
                          poster={zone.posterUrl}
                          className="ads-media absolute inset-0 w-full h-full object-cover"
                        >
                          {zone.mediaUrl && <source src={zone.mediaUrl} type="video/mp4" />}
                        </video>
                      ) : (
                        <img
                          src={zone.mediaUrl ?? ''}
                          alt={zone.advertiser}
                          loading="lazy"
                          className={`ads-media absolute inset-0 w-full h-full object-${zone.objectFit ?? 'cover'}`}
                        />
                      )}

                      {/* Gradient overlay — soft, image stays visible */}
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 75%)',
                      }} />

                      {/* Zone serial — top-left, frosted */}
                      <SerialBadge id={zone.id} dark />

                      {/* Sponsored badge — top-right */}
                      <div className="absolute top-3 right-3 z-20">
                        <span style={{
                          background: 'rgba(0,0,0,0.45)',
                          backdropFilter: 'blur(4px)',
                          color: 'rgba(255,255,255,0.85)',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.55rem',
                          letterSpacing: '0.1em',
                          padding: '2px 6px',
                          borderRadius: 9999,
                        }}>SPONSORED</span>
                      </div>

                      {/* Content — bottom */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 lg:p-4">
                        <p style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          fontSize: zone.size === 'large' ? '0.9375rem' : '0.8125rem',
                          color: '#FFFFFF',
                          lineHeight: 1.2,
                          marginBottom: 2,
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}>
                          {zone.advertiser}
                        </p>
                        <p style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '0.6875rem',
                          color: 'rgba(255,255,255,0.75)',
                          lineHeight: 1.35,
                          marginBottom: 8,
                        }}>
                          {zone.tagline}
                        </p>
                        <a
                          href={zone.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ads-zone-cta"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: 'var(--color-lemon)',
                            color: 'var(--color-black)',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            padding: '5px 11px',
                            borderRadius: 9999,
                            textDecoration: 'none',
                            minHeight: 26,
                            letterSpacing: '0.01em',
                          }}
                        >
                          {zone.ctaLabel}
                        </a>
                      </div>
                    </>
                  ) : (
                    /* ── VACANT CARD ──────────────────────────────────────── */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <SerialBadge id={zone.id} dark={false} />

                      {/* Billboard icon */}
                      <div className="text-[#CCCCCC] dark:text-muted-foreground/40" style={{ marginBottom: 2 }}>
                        <BillboardIcon />
                      </div>

                      {/* Zone number */}
                      <p className="text-[#BBBBBB] dark:text-muted-foreground/50" style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: zone.size === 'small' ? '1rem' : '1.375rem',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
                      }}>
                        {zone.id}
                      </p>

                      {/* Price */}
                      <p className="text-[var(--color-grey-dark)] dark:text-muted-foreground" style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}>
                        from {zone.price}
                      </p>

                      {/* CTA */}
                      <button
                        onClick={() => setModal(zone)}
                        className="ads-vacant-btn"
                        style={{
                          background: 'var(--color-lemon)',
                          color: 'var(--color-black)',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          padding: '7px 16px',
                          borderRadius: 9999,
                          border: 'none',
                          cursor: 'pointer',
                          minHeight: 32,
                          transition: 'all 150ms',
                          marginTop: 4,
                        }}
                      >
                        Rent this space →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── ENQUIRY STRIP ──────────────────────────────────────────────── */}
        <div
          className="px-4 md:px-8 lg:px-12 py-8 text-center bg-white dark:bg-card"
          style={{ borderTop: '3px solid var(--color-lemon)' }}
        >
          <p className="text-[var(--color-black)] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 6 }}>
            Ready to reach Australia&apos;s first home buyers?
          </p>
          <p className="text-[var(--color-grey-dark)] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', lineHeight: 1.7 }}>
            Email{' '}
            <a
              href="mailto:ads@firstnest.com.au"
              className="ads-email text-[var(--color-black)] dark:text-foreground"
              style={{ fontWeight: 600, textDecoration: 'none' }}
            >
              ads@firstnest.com.au
            </a>
            {' '}or call{' '}
            <a
              href="tel:1800347786"
              className="ads-phone text-[var(--color-grey-mid)] dark:text-muted-foreground"
              style={{ textDecoration: 'none', fontWeight: 500 }}
            >
              1800 FIRST HOME
            </a>
          </p>
          <p className="text-[var(--color-grey-mid)] dark:text-muted-foreground/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', marginTop: 8 }}>
            All bookings confirmed within 1 business day. No automated checkout.
          </p>
        </div>

        {/* ── DISCLAIMER ─────────────────────────────────────────────────── */}
        <div className="px-4 md:px-8 lg:px-12 py-6 bg-[#FAFAFA] dark:bg-background border-t border-[#EEEEEE] dark:border-border text-center">
          <p className="text-[var(--color-grey-mid)] dark:text-muted-foreground/70 text-xs leading-relaxed max-w-5xl mx-auto">
            <strong>Disclaimer:</strong> While every precaution has been taken to establish the accuracy of the material herein, prospective purchasers should not rely solely on this information as a substitute for personal or legal inspection, inquiries, or verification. All information provided has been gathered from sources we consider to be reliable, but we cannot guarantee or give any warranty about the information provided. Measurements, distances, floor plans, and landscaping are approximate and for illustrative purposes only. Interested parties are encouraged to make their own inquiries to satisfy themselves in all respects.
          </p>
        </div>

        {/* ── MODAL ──────────────────────────────────────────────────────── */}
        {modal && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 60 }}
            onClick={() => { setModal(null); setCopied(false) }}
            role="dialog"
            aria-modal="true"
            aria-label={`Reserve ${modal.id}`}
          >
            <div
              className="max-w-sm w-full rounded-2xl p-8 relative bg-white dark:bg-card"
              style={{
                boxShadow: 'var(--shadow-modal)',
                borderTop: '4px solid var(--color-lemon)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Zone number */}
              <p className="text-[#D4D4D4] dark:text-border" style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '5rem',
                lineHeight: 1,
                textAlign: 'center',
                letterSpacing: '0.05em',
                marginBottom: 2,
              }}>
                {modal.id}
              </p>

              <p className="text-[var(--color-black)] dark:text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.125rem', textAlign: 'center', marginBottom: 4 }}>
                Space Selected
              </p>
              <p className="text-[var(--color-grey-mid)] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', textAlign: 'center', marginBottom: 20 }}>
                {modal.price} · {modal.size.charAt(0).toUpperCase() + modal.size.slice(1)} Billboard
              </p>

              {/* Info box */}
              <div className="rounded-xl p-4 mb-5 bg-[#FAFAFA] dark:bg-surface border border-[#EEEEEE] dark:border-border">
                <p className="text-[var(--color-grey-dark)] dark:text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', lineHeight: 1.65, textAlign: 'center' }}>
                  Email{' '}
                  <a href="mailto:ads@firstnest.com.au" className="text-[var(--color-black)] dark:text-foreground" style={{ fontWeight: 600, textDecoration: 'none' }}>
                    ads@firstnest.com.au
                  </a>{' '}
                  with reference <strong>{modal.id}</strong> and we&apos;ll confirm within 1 business day.
                </p>
              </div>

              {/* Copy reference */}
              <button
                onClick={() => handleCopy(modal.id)}
                className={`ads-copy border-[1.5px] border-[#DDDDDD] dark:border-border ${copied ? 'bg-[var(--color-lemon-light)] text-[var(--color-black)]' : 'bg-transparent text-[var(--color-grey-dark)] dark:text-muted-foreground'}`}
                style={{
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  padding: '11px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  marginBottom: 10,
                  transition: 'all 200ms',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy zone reference'}
              </button>

              {/* Close */}
              <button
                onClick={() => { setModal(null); setCopied(false) }}
                className="ads-modal-close"
                style={{
                  width: '100%',
                  background: 'var(--color-lemon)',
                  color: 'var(--color-black)',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  padding: '14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 50,
                  transition: 'background 150ms',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
