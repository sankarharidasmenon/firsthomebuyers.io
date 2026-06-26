'use client'

import Link from 'next/link'
import { Home, ExternalLink } from 'lucide-react'

/* ─── Social SVG paths ───────────────────────────────────────────────────── */
function SvgIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const GITHUB_PATH   = 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z'
const LINKEDIN_PATH = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
const X_PATH        = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
const YOUTUBE_PATH  = 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z'

const SOCIAL = [
  { path: GITHUB_PATH,   label: 'GitHub' },
  { path: LINKEDIN_PATH, label: 'LinkedIn' },
  { path: X_PATH,        label: 'X (Twitter)' },
  { path: YOUTUBE_PATH,  label: 'YouTube' },
]

const PRODUCT = [
  { label: 'Govt Schemes & Grants',  href: '/onboarding?flow=grants' },
  { label: 'Borrowing Capacity',     href: '/onboarding?flow=borrowing' },
  { label: 'Outcomes',               href: '/my-results' },
  { label: 'Strategy',               href: '/next-steps' },
]

const OFFICIAL = [
  { label: 'Housing Australia', href: 'https://www.housingaustralia.gov.au/' },
  { label: 'ATO – FHSS',        href: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme' },
  { label: 'NSW Revenue',       href: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer' },
  { label: 'Victoria SRO',      href: 'https://www.sro.vic.gov.au/first-home-buyer' },
]

const CAT: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.6875rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 18,
  display: 'block',
}

const LINK: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: '0.9375rem',
}

export function Footer() {
  return (
    <footer style={{ background: '#111111' }} className="pb-20 lg:pb-0">
      <style>{`
        .fn-ftr-a { color: rgba(255,255,255,0.82); text-decoration: none; transition: color 120ms; }
        .fn-ftr-a:hover { color: #ffffff; }

        .fn-social-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          background: #F5E642; color: #111111;
          transition: background 130ms, transform 130ms;
        }
        .fn-social-btn:hover { background: #EDD900; transform: translateY(-2px); }
      `}</style>

      {/* ── Main columns: Brand | Product | Official Sources ── */}
      <div className="max-w-275 mx-auto px-5 lg:px-12 pt-14 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 text-center lg:text-left">

          {/* Col 1: Brand */}
          <div className="flex flex-col items-center lg:items-start gap-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, background: '#F5E642', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Home size={17} style={{ color: '#111111' }} strokeWidth={2.5} />
              </div>
              <span style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800, fontSize: '1.0625rem',
                color: '#FFFFFF', letterSpacing: '-0.01em',
              }}>FirstNest</span>
            </div>

            <p style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 400,
              fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.65, maxWidth: 220,
            }}>
              Australia's free first home buyer tool — grants, borrowing power and your next step.
            </p>

            <div style={{ display: 'flex', gap: 6 }}>
              {SOCIAL.map(({ path, label }) => (
                <a key={label} href="#" aria-label={label} className="fn-social-btn">
                  <SvgIcon path={path} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <span style={CAT}>Product</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {PRODUCT.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="fn-ftr-a" style={LINK}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Official Sources */}
          <div>
            <span style={CAT}>Official Sources</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {OFFICIAL.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href} target="_blank" rel="noopener noreferrer"
                    className="fn-ftr-a"
                    style={{ ...LINK, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    {label}
                    <ExternalLink size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-275 mx-auto px-5 lg:px-12 py-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            © 2026 FirstNestAI
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
            maxWidth: 680, textAlign: 'center',
          }} className="lg:text-left">
            FirstNest provides general information only and does not constitute financial, legal or taxation advice.
            All borrowing estimates and grant eligibility results are indicative only and may not reflect your actual
            circumstances. Grant values and eligibility criteria change frequently — always verify with the relevant
            state or federal authority. Consult a licensed financial adviser or mortgage broker before making any
            property or borrowing decisions.
          </p>
        </div>
      </div>
    </footer>
  )
}
