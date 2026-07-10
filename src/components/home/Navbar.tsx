'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Menu, X, Settings, ChevronDown, Share2, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useAuth } from '@/lib/auth/AuthProvider'

// Primary links shown directly in the desktop bar
const PRIMARY_LINKS = [
  { href: '/', label: 'Discover' },
  // { href: '/my-results', label: 'Outcomes' },
  { href: '/my-results', label: 'Grants' },
  { href: '/next-steps', label: 'Plan' },
  { href: '/#grant-calculator', label: 'Calculator' },
]

// Grouped under the "More" dropdown on desktop
const MORE_LINKS = [
  { href: '/#ai-guidance', label: 'AI Guidance' },
  // { href: '/ads', label: 'Ads' },
  { href: '/articles', label: 'Articles' },
    { href: '/forums', label: 'Forums' },
]

// Full flat list used by the mobile menu
const NAV_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS]

/* ─── Social SVG paths (from Footer) ─────────────────────────────────────── */
function SvgIcon({ path }: { path: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const FACEBOOK_PATH = 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'
const LINKEDIN_PATH = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
const YOUTUBE_PATH = 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z'

function AdsIcon() {
  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      <svg
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: -2,
          right: -6,
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          fontSize: '8px',
          fontWeight: 800,
          padding: '1.5px 3.5px',
          borderRadius: 9999,
          lineHeight: 1,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        AD
      </div>
    </div>
  )
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

const SOCIAL: { path?: string; icon?: React.ElementType; label: string; color: string; ring?: string }[] = [
  { path: FACEBOOK_PATH, label: 'Facebook', color: '#1877F2' },
  { path: LINKEDIN_PATH, label: 'LinkedIn', color: '#0A66C2' },
  { path: X_PATH, label: 'X (Twitter)', color: '#000000', ring: '#fff' },
  { icon: InstagramIcon, label: 'Instagram', color: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)' },
  { path: YOUTUBE_PATH, label: 'YouTube', color: '#FF0000' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [activeHash, setActiveHash] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)

  useEffect(() => {
    setActiveHash(window.location.hash)
    const handleHashChange = () => setActiveHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Close on route change
  useEffect(() => { setMenuOpen(false); setMoreOpen(false); setSocialOpen(false) }, [pathname])

  const moreActive =
    MORE_LINKS.some(l => l.href !== '/#ai-guidance' && pathname.startsWith(l.href)) ||
    (pathname === '/' && activeHash === '#ai-guidance')

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Scroll to an in-page section, offset by the fixed navbar height so the
  // target heading isn't hidden underneath it. Used for all hash anchors.
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const navHeight = document.querySelector('nav')?.getBoundingClientRect().height ?? 72
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // Click handler for any nav link that points to a same-page hash section.
  const handleHashClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setMenuOpen(false)
    setActiveHash(`#${id}`)
    if (pathname === '/') {
      window.history.pushState(null, '', `#${id}`)
      scrollToSection(id)
    } else {
      router.push('/')
      setTimeout(() => scrollToSection(id), 450)
    }
  }

  const handleAIClick = (e: React.MouseEvent) => handleHashClick(e, 'ai-guidance')



  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-background h-14 lg:h-[72px]"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <style>{`
          .fn-icon-btn:hover { background: var(--secondary); }
          .fn-more-item:hover { background: var(--secondary); color: var(--foreground) !important; }
          .fn-ads-link:hover { opacity: 0.85; }
        `}</style>
        <div className="fn-nav max-w-[1150px] mx-auto h-full flex items-center justify-between px-4 lg:px-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="FirstNest home">
            <div
              className="flex items-center justify-center rounded-sm shrink-0"
              style={{ width: 32, height: 32, background: 'var(--primary)' }}
            >
              <Home size={17} style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '1.0625rem', color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
              FirstNest
            </span>
          </Link>

          {/* Desktop centre links */}
          <div className="hidden lg:flex items-center gap-8">
            {PRIMARY_LINKS.map(link => {
              const isAI = link.href === '/#ai-guidance'
              // Any link of the form '/#section' is an in-page hash anchor.
              const hashId = link.href.startsWith('/#') ? link.href.slice(2) : null

              let active = false
              if (isAI) {
                active = pathname === '/' && activeHash === '#ai-guidance'
              } else {
                active = pathname === link.href && activeHash !== '#ai-guidance'
              }

              const handleClick = (e: React.MouseEvent) => {
                if (hashId) {
                  // Intercept hash anchors so we can offset for the fixed navbar.
                  handleHashClick(e, hashId)
                  return
                }
                // Normal route link — clear any hash state.
                setActiveHash('')
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleClick}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.9375rem',
                    color: active ? 'var(--foreground)' : 'var(--secondary-foreground)',
                    textDecoration: 'none',
                    paddingBottom: 2,
                    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'color 150ms, border-color 150ms',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* More dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMoreOpen(o => !o)}
                aria-haspopup="true"
                aria-expanded={moreOpen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: moreActive ? 700 : 500,
                  fontSize: '0.9375rem',
                  color: moreActive ? 'var(--foreground)' : 'var(--secondary-foreground)',
                  paddingBottom: 2,
                  borderBottom: moreActive ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'color 150ms, border-color 150ms',
                }}
              >
                More
                <ChevronDown
                  size={15}
                  strokeWidth={2.2}
                  style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                />
              </button>

              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 10,
                  minWidth: 180,
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                  padding: 6,
                  opacity: moreOpen ? 1 : 0,
                  transform: moreOpen ? 'translateY(0)' : 'translateY(-6px)',
                  pointerEvents: moreOpen ? 'all' : 'none',
                  transition: 'opacity 160ms ease, transform 160ms ease',
                  zIndex: 60,
                }}
              >
                {MORE_LINKS.map(link => {
                  const isAI = link.href === '/#ai-guidance'
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={isAI ? handleAIClick : () => setMoreOpen(false)}
                      className="fn-more-item"
                      style={{
                        display: 'block',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        color: 'var(--secondary-foreground)',
                        textDecoration: 'none',
                        transition: 'background 120ms, color 120ms',
                      }}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right side - Mobile */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2">
            <ThemeToggle />

            <Link
              href="/profile"
              aria-label="Settings"
              className="fn-icon-btn flex items-center justify-center rounded-lg transition-colors duration-150"
              style={{ width: 40, height: 40, color: 'var(--foreground)' }}
            >
              <Settings size={20} strokeWidth={2} />
            </Link>

            <div className="relative" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { setSocialOpen(o => !o); setMenuOpen(false) }}
                aria-label="Follow us on social media"
                aria-expanded={socialOpen}
                className="fn-icon-btn flex items-center justify-center rounded-lg transition-colors duration-150"
                style={{ width: 40, height: 40, color: 'var(--foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Share2 size={18} strokeWidth={2} />
              </button>

              {socialOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    style={{ background: 'transparent' }}
                    onClick={() => setSocialOpen(false)}
                  />
                  <div
                    className="absolute right-0 z-50 rounded-xl overflow-hidden"
                    style={{
                      top: 46,
                      minWidth: 180,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                  >
                    <div style={{ padding: '6px 0' }}>
                      {SOCIAL.map(({ path, icon: Icon, label, color, ring }) => (
                        <a
                          key={label}
                          href="#" // TODO: Replace with official Instagram URL
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          onClick={() => setSocialOpen(false)}
                          className="flex items-center gap-3 transition-colors"
                          style={{
                            padding: '10px 16px',
                            textDecoration: 'none',
                            color: 'var(--foreground)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span
                            className="flex items-center justify-center rounded-full flex-shrink-0"
                            style={{
                              width: 28,
                              height: 28,
                              background: color,
                              color: '#fff',
                              ...(ring ? { border: `1px solid ${ring}` } : {}),
                            }}
                          >
                            {Icon ? <Icon size={14} /> : (path && <SvgIcon path={path} />)}
                          </span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>
                            {label}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="flex items-center justify-center rounded-lg transition-colors duration-150"
              style={{
                width: 40,
                height: 40,
                background: menuOpen ? 'var(--secondary)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--foreground)',
              }}
            >
              {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center h-full gap-5">
            {/* Top Row Aligned Utilities */}
            <div className="flex items-center gap-3">
              <Link
                href="/ads"
                className="fn-ads-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: pathname === '/ads' && activeHash !== '#ai-guidance' ? 700 : 500,
                  fontSize: '0.9375rem',
                  color: pathname === '/ads' && activeHash !== '#ai-guidance' ? 'var(--foreground)' : 'var(--secondary-foreground)',
                  textDecoration: 'none',
                  paddingBottom: 2,
                  borderBottom: pathname === '/ads' && activeHash !== '#ai-guidance' ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'color 150ms, border-color 150ms, opacity 150ms',
                  transform: 'translateX(8px)',
                }}
              >
                <AdsIcon />
              </Link>
              <div style={{ transform: 'translateX(8px)' }}>
                <ThemeToggle />
              </div>
              <Link
                href="/profile"
                aria-label="Settings"
                className="fn-icon-btn flex items-center justify-center rounded-lg transition-colors duration-150"
                style={{ width: 40, height: 40, color: 'var(--foreground)' }}
              >
                <Settings size={20} strokeWidth={2} />
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {/* Social Icons */}
              <div className="flex items-center gap-2">
                {SOCIAL.map(({ path, icon: Icon, label, color, ring }) => (
                  <a
                    key={label}
                    href="#" // TODO: Replace with official Instagram URL
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{
                      width: 24,
                      height: 24,
                      background: color,
                      color: '#fff',
                      ...(ring ? { border: `1px solid ${ring}` } : {})
                    }}
                  >
                    {Icon ? <Icon size={14} /> : (path && <SvgIcon path={path} />)}
                  </a>
                ))}
              </div>

              {/* Login / Logout Pill */}
              {user ? (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center justify-center gap-2"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 9999,
                    padding: '9px 20px',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  <LogOut size={15} strokeWidth={2.2} />
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="flex items-center justify-center btn-shine"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, var(--brand-gradient-start) 0%, var(--brand-gradient-end) 100%)',
                    color: 'var(--brand-dark-surface)',
                    border: 'none',
                    borderRadius: 9999,
                    padding: '10px 24px',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 10px rgba(245,230,66,0.45)',
                  }}
                >
                  Login
                </button>
              )}

              {/* Download Badges — right of the Login button, stacked vertically */}
              <div className="flex flex-col gap-0.5">
                {/* Google Play */}
                <a
                  href="#"
                  aria-label="Get it on Google Play"
                  className="flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{
                    width: 99,
                    background: '#111111',
                    border: '1px solid #FFFFFF',
                    borderRadius: 8,
                    padding: '4px 8px',
                    height: 28,
                    gap: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <svg viewBox="0 0 512 512" style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden="true">
                    <path fill="#4CAF50" d="M35.6 34.1l235.1 235L35.6 477.9c-8.9-8.8-13.6-21.2-13.6-34.1V68.2c0-12.9 4.7-25.3 13.6-34.1z" />
                    <path fill="#FFC107" d="M35.6 34.1l321.4 185.6L270.7 269l-235.1-235z" />
                    <path fill="#F44336" d="M35.6 477.9l235.1-235 86.3 49.3L35.6 477.9z" />
                    <path fill="#2196F3" d="M357 219.7l115.1 66.5c17.5 10.1 17.5 35.5 0 45.6L357 398.2l-86.3-49.3L357 219.7z" />
                  </svg>
                  <div style={{ lineHeight: 1 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.45rem', color: 'rgba(255,255,255,0.65)', fontWeight: 400, marginBottom: 1 }}>Get it on</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: '#ffffff', fontWeight: 600, letterSpacing: '-0.01em' }}>Google Play</div>
                  </div>
                </a>

                {/* App Store */}
                <a
                  href="#"
                  aria-label="Download on the App Store"
                  className="flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{
                    width: 99,
                    background: '#111111',
                    border: '1px solid #FFFFFF',
                    borderRadius: 8,
                    padding: '4px 8px',
                    height: 28,
                    gap: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <svg viewBox="0 0 384 512" style={{ width: 12, height: 12, fill: '#ffffff', flexShrink: 0 }} aria-hidden="true">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                  <div style={{ lineHeight: 1 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.45rem', color: 'rgba(255,255,255,0.65)', fontWeight: 400, marginBottom: 1 }}>Download on the</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', color: '#ffffff', fontWeight: 600, letterSpacing: '-0.01em' }}>App Store</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop â€” dims the page behind the menu */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/40"
        style={{
          top: 56,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'all' : 'none',
          transition: 'opacity 200ms ease',
        }}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile menu panel â€” slides down from navbar */}
      <div
        className="lg:hidden fixed left-0 right-0 z-50 bg-background"
        style={{
          top: 56,
          boxShadow: menuOpen ? '0 8px 32px rgba(0,0,0,0.14)' : 'none',
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateY(0)' : 'translateY(-6px)',
          pointerEvents: menuOpen ? 'all' : 'none',
          transition: 'opacity 220ms ease, transform 220ms ease',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-col px-5 py-3">
          {NAV_LINKS.map(link => {
            const isAI = link.href === '/#ai-guidance'
            const hashId = link.href.startsWith('/#') ? link.href.slice(2) : null
            const active = !isAI && pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={hashId ? (e) => handleHashClick(e, hashId) : () => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: active ? 600 : 500,
                  fontSize: '1rem',
                  color: active ? 'var(--foreground)' : 'var(--secondary-foreground)',
                  textDecoration: 'none',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--secondary)',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                  paddingLeft: 12,
                  transition: 'color 120ms',
                }}
              >
                {link.label}
              </Link>
            )
          })}

          <div className="flex items-center justify-between mt-2 mb-2 px-3">
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: 'var(--secondary-foreground)' }}>
              Theme
            </span>
            <ThemeToggle />
          </div>

          {/* Get Started CTA inside mobile menu */}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); router.push('/onboarding?flow=grants') }}
            style={{
              marginTop: 14,
              marginBottom: 6,
              width: '100%',
              padding: '15px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '0.9375rem',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Get Started →
          </button>

          {/* Login / Logout inside mobile menu */}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); user ? signOut() : router.push('/login') }}
            style={{
              marginTop: 8,
              marginBottom: 6,
              width: '100%',
              padding: '13px',
              background: 'transparent',
              color: 'var(--foreground)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.9375rem',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {user ? (<><LogOut size={16} strokeWidth={2.2} /> Logout</>) : 'Login'}
          </button>
        </div>
      </div>
    </>
  )
}
