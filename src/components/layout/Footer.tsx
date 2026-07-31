'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, ExternalLink, ChevronDown } from 'lucide-react'
import { Logo } from '@/components/ui/logo/Logo'

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 512 512" width="14" height="14" aria-hidden="true">
      <path fill="#4CAF50" d="M35.6 34.1l235.1 235L35.6 477.9c-8.9-8.8-13.6-21.2-13.6-34.1V68.2c0-12.9 4.7-25.3 13.6-34.1z" />
      <path fill="#FFC107" d="M35.6 34.1l321.4 185.6L270.7 269l-235.1-235z" />
      <path fill="#F44336" d="M35.6 477.9l235.1-235 86.3 49.3L35.6 477.9z" />
      <path fill="#2196F3" d="M357 219.7l115.1 66.5c17.5 10.1 17.5 35.5 0 45.6L357 398.2l-86.3-49.3L357 219.7z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" width="12" height="12" fill="#FFFFFF" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

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

const OFFICIAL = [
  { label: 'First Home Buyers (Gov)', href: 'https://firsthomebuyers.gov.au/' },
  { label: '5% Deposit Scheme', href: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme' },
  { label: 'Help to Buy', href: 'https://firsthomebuyers.gov.au/australian-government-help-buy-scheme' },
  { label: 'ATO – FHSS', href: 'https://firsthomebuyers.gov.au/first-home-super-saver-scheme' },
  { label: 'NSW Revenue', href: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer' },
  { label: 'Victoria SRO', href: 'https://www.sro.vic.gov.au/first-home-buyer' },
]

const LEGAL = [
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Disclaimer', href: '#' },
  { label: 'Cookie Policy', href: '#' },
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

export function Footer() {
  const [legalOpen, setLegalOpen] = useState(false)
  const [selectedLegal, setSelectedLegal] = useState<string | null>(null)

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

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .fn-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
      `}</style>

      {/* ── Main section: Brand + compact links ── */}
      <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12 md:pt-14 pb-10 flex flex-col gap-10">

        {/* Brand */}
        <div className="flex flex-col items-start gap-4">
          <Link href="/" className="no-underline" aria-label="FirstNest home" style={{ color: '#FFFFFF' }}>
            <Logo size="md" showBadge />
          </Link>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 400,
            fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.65, maxWidth: '100%', whiteSpace: 'normal',
          }}>
            Australia&apos;s free first home buyer tool - Know your Eligibility &amp; Government Support
          </p>
        </div>

        {/* Official Sources — pill chips */}
        <div>
          <span style={CAT}>Official Sources</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {OFFICIAL.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="fn-ftr-a"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 500,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 9999,
                  padding: '5px 12px',
                  whiteSpace: 'normal', textAlign: 'center',
                  transition: 'background 150ms, border-color 150ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                }}
              >
                {label}
                <ExternalLink size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="-mb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-5">

          {/* Collapsible legal panel */}
          <div
            style={{
              overflow: 'hidden',
              maxHeight: legalOpen ? 800 : 0,
              transition: 'max-height 350ms ease',
              marginBottom: legalOpen ? 16 : 0,
            }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              marginBottom: 4,
            }}>
              {/* Legal tab buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LEGAL.map(({ label }) => {
                  const active = selectedLegal === label
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedLegal(active ? null : label)}
                      style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 500,
                        background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 9999,
                        padding: '6px 14px',
                        color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'background 150ms, border-color 150ms, color 150ms',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Content — only shown for Disclaimer */}
              {selectedLegal === 'Disclaimer' && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
                    FirstHomeBuyers provides general information only and does not constitute financial, legal or taxation advice.
                    All borrowing estimates and grant eligibility results are indicative only and may not reflect your actual
                    circumstances. Grant values and eligibility criteria change frequently — always verify with the relevant
                    state or federal authority. Consult a licensed financial adviser or mortgage broker before making any
                    property or borrowing decisions.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingTop: 2 }}>
              <svg width="22" height="14" viewBox="0 0 24 16" style={{ borderRadius: 3, overflow: 'hidden', opacity: 0.85 }}>
                <rect width="24" height="8" fill="#111111"/>
                <rect y="8" width="24" height="8" fill="#CC0000"/>
                <circle cx="12" cy="8" r="3.5" fill="#FFCC00"/>
              </svg>
              <svg width="22" height="14" viewBox="0 0 24 16" style={{ borderRadius: 3, overflow: 'hidden', opacity: 0.85 }}>
                <rect width="24" height="16" fill="#006341"/>
                <rect y="4" width="24" height="1.5" fill="#FFFFFF"/>
                <rect y="10.5" width="24" height="1.5" fill="#FFFFFF"/>
                <circle cx="12" cy="8" r="2" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
              FirstNest acknowledges Aboriginal and Torres Strait Islanders as the traditional custodians of country
              throughout Australia and their continuing connection to land, waters and community.
            </p>
          </div> */}

          {/* Bottom row: copyright + store badges + legal toggle */}
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-6">
            
            {/* Left/Center Group: Copyright + Stores + Socials */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10">
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                © 2026 FirstHomeBuyers. All rights reserved.
              </span>
              
              <div className="flex flex-wrap items-center justify-center gap-6">
                {/* Store Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { label: 'Google Play', sublabel: 'Get it on', href: '#', icon: <GooglePlayIcon /> },
                    { label: 'App Store',   sublabel: 'Download on the', href: '#', icon: <AppleIcon /> },
                  ].map(({ label, sublabel, href, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px 4px 7px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 7,
                        textDecoration: 'none',
                        transition: 'background 150ms, border-color 150ms',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                      <span style={{ lineHeight: 1 }}>
                        <span style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400, marginBottom: 1 }}>
                          {sublabel}
                        </span>
                        <span style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                          {label}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>

                {/* Social icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[
                    { label: 'Facebook',    href: '#', color: '#1877F2', svg: FACEBOOK_PATH },
                    { label: 'YouTube',     href: '#', color: '#FF0000', svg: YOUTUBE_PATH },
                    { label: 'X (Twitter)', href: '#', color: '#000000', svg: X_PATH },
                    { label: 'LinkedIn',    href: '#', color: '#0A66C2', svg: LINKEDIN_PATH },
                  ].map(({ label, href, color, svg }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28,
                        background: color,
                        borderRadius: 7,
                        color: '#ffffff',
                        textDecoration: 'none',
                        transition: 'opacity 150ms, transform 150ms',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = '0.85'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d={svg} />
                      </svg>
                    </a>
                  ))}
                  <a
                    href="mailto:hello@firstnest.com.au"
                    aria-label="Email us"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28,
                      background: '#F5E642',
                      borderRadius: 7,
                      color: '#111111',
                      textDecoration: 'none',
                      transition: 'opacity 150ms, transform 150ms',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = '0.85'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Legal Toggle */}
            <div className="flex justify-center md:justify-end">
              <button
                type="button"
                onClick={() => setLegalOpen(o => !o)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                Legal
                <ChevronDown
                  size={13}
                  style={{
                    transition: 'transform 300ms ease',
                    transform: legalOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
            </div>
            
          </div>
     <div className="mt-4 -mb-8" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingTop: 2 }}>
              <svg width="22" height="14" viewBox="0 0 24 16" style={{ borderRadius: 3, overflow: 'hidden', opacity: 0.85 }}>
                <rect width="24" height="8" fill="#111111"/>
                <rect y="8" width="24" height="8" fill="#CC0000"/>
                <circle cx="12" cy="8" r="3.5" fill="#FFCC00"/>
              </svg>
              <svg width="22" height="14" viewBox="0 0 24 16" style={{ borderRadius: 3, overflow: 'hidden', opacity: 0.85 }}>
                <rect width="24" height="16" fill="#006341"/>
                <rect y="4" width="24" height="1.5" fill="#FFFFFF"/>
                <rect y="10.5" width="24" height="1.5" fill="#FFFFFF"/>
                <circle cx="12" cy="8" r="2" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
              FirstHomeBuyers acknowledges Aboriginal and Torres Strait Islanders as the traditional custodians of country
              throughout Australia and their continuing connection to land, waters and community.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
