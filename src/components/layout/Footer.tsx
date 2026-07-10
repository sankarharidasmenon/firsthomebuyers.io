'use client'

import Link from 'next/link'
import { Home, ExternalLink } from 'lucide-react'

/* ─── Social SVG paths ───────────────────────────────────────────────────── */
function SvgIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const FACEBOOK_PATH = 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'
const LINKEDIN_PATH = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
const YOUTUBE_PATH = 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z'

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

/* Real brand colours — each icon sits on a filled circle in its brand colour. */
const SOCIAL: { path?: string; icon?: React.ElementType; label: string; color: string; ring?: string }[] = [
  { path: FACEBOOK_PATH, label: 'Facebook', color: '#1877F2' },
  { path: LINKEDIN_PATH, label: 'LinkedIn', color: '#0A66C2' },
  { path: X_PATH, label: 'X (Twitter)', color: '#000000', ring: 'rgba(255,255,255,0.7)' },
  { icon: InstagramIcon, label: 'Instagram', color: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)' },
  { path: YOUTUBE_PATH, label: 'YouTube', color: '#FF0000' },
]

const PRODUCT = [
  { label: 'Govt Schemes & Grants', href: '/onboarding?flow=grants' },
  { label: 'Borrowing Capacity', href: '/onboarding?flow=borrowing' },
  { label: 'Grants', href: '/my-results' },
  { label: 'Plan', href: '/next-steps' },
]

const OFFICIAL = [
  { label: 'Housing Australia', href: 'https://www.housingaustralia.gov.au/' },
  { label: 'ATO – FHSS', href: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme' },
  { label: 'NSW Revenue', href: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer' },
  { label: 'Victoria SRO', href: 'https://www.sro.vic.gov.au/first-home-buyer' },
]

const LEGAL = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Disclaimer', href: '#' },
  // { label: 'Accessibility', href: '#' },
  // { label: 'Contact Us', href: '#' },
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
          width: 38px; height: 38px; border-radius: 9999px;
          background: var(--brand);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          color: #ffffff;
          transition: transform 200ms ease, box-shadow 200ms ease, filter 200ms ease;
        }
        .fn-social-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 6px 18px rgba(0,0,0,0.45);
        }
        .fn-ftr-legal { color: rgba(255,255,255,0.45); text-decoration: none; transition: color 120ms; }
        .fn-ftr-legal:hover { color: #ffffff; }
      `}</style>

      {/* ── Main columns: Brand | Product | Official Sources | Legal ── */}
      <div className="max-w-275 mx-auto px-5 lg:px-12 pt-10 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 text-center lg:text-left">

          {/* Col 1: Brand */}
          <div className="flex flex-col items-center lg:items-start gap-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, background: 'var(--primary)', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Home size={17} style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
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
              Australia&apos;s free first home buyer tool grants, borrowing power and your next step.
            </p>

            <div style={{ display: 'flex', gap: 6, marginLeft: '-8px' }}>
              {SOCIAL.map(({ path, icon: Icon, label, color, ring }) => (
                <a
                  key={label}
                  href="#" // TODO: Replace with official Instagram URL
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="fn-social-btn"
                  style={{ '--brand': color, ...(ring ? { borderColor: ring } : {}) } as React.CSSProperties}
                >
                  {Icon ? <Icon size={18} /> : (path && <SvgIcon path={path} />)}
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

          {/* Col 4: Legal */}
          <div>
            <span style={CAT}>Legal</span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {LEGAL.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="fn-ftr-a" style={LINK}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-275 mx-auto px-5 lg:px-12 py-6 flex flex-col gap-4">
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
          }} className="w-full text-left">
            FirstNest provides general information only and does not constitute financial, legal or taxation advice.
            All borrowing estimates and grant eligibility results are indicative only and may not reflect your actual
            circumstances. Grant values and eligibility criteria change frequently — always verify with the relevant
            state or federal authority. Consult a licensed financial adviser or mortgage broker before making any
            property or borrowing decisions.
          </p>

          {/* <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: '12.5px',
            color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '12px',
            flexWrap: 'wrap'
          }}>
            <Link href="#" className="fn-ftr-legal">Privacy Policy</Link>
            <span>&bull;</span>
            <Link href="#" className="fn-ftr-legal">Terms & Conditions</Link>
            <span>&bull;</span>
            <Link href="#" className="fn-ftr-legal">Cookies</Link>
            <span>&bull;</span>
            <Link href="#" className="fn-ftr-legal">Disclaimer</Link>
          </div> */}

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mt-2">
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <span>© 2026 FirstNest AI. All rights reserved.</span>
              <span>Built for Australian first-home buyers.</span>
            </div>

            {/* Acknowledgement of Country */}
            <div className="flex items-start gap-3 max-w-[500px]">
              <div className="flex gap-2 shrink-0 pt-0.5">
                {/* Aboriginal Flag */}
                <svg width="24" height="16" viewBox="0 0 24 16" className="rounded-[3px] overflow-hidden opacity-90">
                  <rect width="24" height="8" fill="#111111"/>
                  <rect y="8" width="24" height="8" fill="#CC0000"/>
                  <circle cx="12" cy="8" r="3.5" fill="#FFCC00"/>
                </svg>
                {/* Torres Strait Islander Flag */}
                <svg width="24" height="16" viewBox="0 0 24 16" className="rounded-[3px] overflow-hidden opacity-90">
                  <rect width="24" height="16" fill="#006341"/>
                  <rect y="4" width="24" height="1.5" fill="#FFFFFF"/>
                  <rect y="10.5" width="24" height="1.5" fill="#FFFFFF"/>
                  <circle cx="12" cy="8" r="2" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
              }}>
                FirstNest acknowledges Aboriginal and Torres Strait Islanders as the traditional custodians of country throughout Australia and their continuing connection to land, waters and community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

