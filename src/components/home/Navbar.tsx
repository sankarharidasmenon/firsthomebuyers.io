'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Share2, Mail, BookOpen, Newspaper, MessageSquare } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

// Icon-only links shown on the right side of the desktop navbar
const ICON_LINKS = [
  { href: '/schemes',  label: 'Grants/Schemes Directory', Icon: BookOpen },
  { href: '/articles', label: 'Articles',          Icon: Newspaper },
  { href: '/forums',   label: 'Forums',            Icon: MessageSquare },
]

// Full flat list used by the mobile menu
const NAV_LINKS = [...ICON_LINKS]

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

/* Social items shown in the floating dropdown — dark square style matching design reference */
type FloatingSocialItem =
  | { type: 'svg'; path: string; label: string }
  | { type: 'lucide'; icon: React.ElementType; label: string }

const FLOATING_SOCIAL: FloatingSocialItem[] = [
  { type: 'svg', path: LINKEDIN_PATH, label: 'LinkedIn' },
  { type: 'svg', path: X_PATH, label: 'X (Twitter)' },
  { type: 'svg', path: FACEBOOK_PATH, label: 'Facebook' },
  { type: 'lucide', icon: Mail, label: 'Email' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeHash, setActiveHash] = useState('')
  const [socialOpen, setSocialOpen] = useState(false)

  useEffect(() => {
    setActiveHash(window.location.hash)
    const handleHashChange = () => setActiveHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Close on route change
  useEffect(() => { setSocialOpen(false) }, [pathname])

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
  // const handleHashClick = (e: React.MouseEvent, id: string) => {
  //   e.preventDefault()
  //   setMenuOpen(false)
  //   setActiveHash(`#${id}`)
  //   if (pathname === '/') {
  //     window.history.pushState(null, '', `#${id}`)
  //     scrollToSection(id)
  //   } else {
  //     router.push('/')
  //     setTimeout(() => scrollToSection(id), 450)
  //   }
  // }



  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 lg:h-[72px]"
        style={{
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(17,17,17,0.08)',
        }}
      >
        <style>{`
          .fn-icon-btn:hover { background: #FEFCE8; }
          .fn-more-item:hover { background: #FEFCE8; color: #111111 !important; }
          .fn-ads-link:hover { opacity: 0.85; }
          .fn-nav-login { background: #111111; color: #F5E642 !important; transition: background 0.25s, transform 0.2s; }
          .fn-nav-login:hover { background: #222222 !important; transform: translateY(-1px); }
        `}</style>
        <div className="fn-nav max-w-[1150px] mx-auto h-full flex items-center justify-between px-4 lg:px-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="FirstNest home">
            <div
              className="flex items-center justify-center rounded-sm shrink-0"
              style={{ width: 32, height: 32, background: '#F5E642' }}
            >
              <Home size={17} style={{ color: '#111111' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: "var(--font-display, 'Fraunces'), serif", fontWeight: 600, fontSize: '1.0625rem', color: '#111111', letterSpacing: '-0.02em' }}>
              FirstNest
            </span>
          </Link>


          {/* Right side - Mobile */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2">
            <ThemeToggle />

            <div className="relative" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setSocialOpen(o => !o)}
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
                      {FLOATING_SOCIAL.map((item) => (
                        <a
                          key={item.label}
                          href="#"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={item.label}
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
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 30,
                              height: 30,
                              background: '#111111',
                              color: '#fff',
                              borderRadius: 8,
                            }}
                          >
                            {item.type === 'lucide'
                              ? <item.icon size={15} />
                              : <SvgIcon path={item.path} />}
                          </span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>
                            {item.label}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center h-full gap-5">
            {/* Top Row Aligned Utilities */}
            <div className="flex items-center gap-3">
              {ICON_LINKS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="fn-icon-btn flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{
                    width: 36,
                    height: 36,
                    color: pathname === href ? '#111111' : 'var(--secondary-foreground)',
                    background: pathname === href ? 'var(--secondary)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={18} strokeWidth={pathname === href ? 2.5 : 1.8} />
                </Link>
              ))}
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
                  color: pathname === '/ads' && activeHash !== '#ai-guidance' ? '#111111' : 'var(--secondary-foreground)',
                  textDecoration: 'none',
                  paddingBottom: 2,
                  borderBottom: pathname === '/ads' && activeHash !== '#ai-guidance' ? '2px solid #D4C400' : '2px solid transparent',
                  transition: 'color 150ms, border-color 150ms, opacity 150ms',
                  transform: 'translateX(8px)',
                }}
              >
                <AdsIcon />
              </Link>
              <div style={{ transform: 'translateX(8px)' }}>
                <ThemeToggle />
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Social floating panel trigger — desktop */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSocialOpen(o => !o)}
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
                        {FLOATING_SOCIAL.map((item) => (
                          <a
                            key={item.label}
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={item.label}
                            onClick={() => setSocialOpen(false)}
                            className="flex items-center gap-3 transition-colors"
                            style={{ padding: '10px 16px', textDecoration: 'none', color: 'var(--foreground)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span
                              className="flex items-center justify-center flex-shrink-0"
                              style={{ width: 30, height: 30, background: '#111111', color: '#fff', borderRadius: 8 }}
                            >
                              {item.type === 'lucide'
                                ? <item.icon size={15} />
                                : <SvgIcon path={item.path} />}
                            </span>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9rem' }}>
                              {item.label}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </nav>

    </>
  )
}
