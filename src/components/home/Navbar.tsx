'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/my-results', label: 'Outcomes' },
  { href: '/next-steps', label: 'Strategy' },
  { href: '/#ai-guidance', label: 'AI Guidance' },
  { href: '/ads', label: 'Rent Space' },
  { href: '/articles', label: 'Articles' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeHash, setActiveHash] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setActiveHash(window.location.hash)
    const handleHashChange = () => setActiveHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Close on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleAIClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenuOpen(false)
    if (pathname === '/') {
      document.getElementById('ai-guidance')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/#ai-guidance')
      setTimeout(() => {
        document.getElementById('ai-guidance')?.scrollIntoView({ behavior: 'smooth' })
      }, 400)
    }
  }

  // Hide on onboarding — it has its own step-progress header
  if (pathname.startsWith('/onboarding')) return null

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white h-14 lg:h-16"
        style={{ borderBottom: '1px solid #EEEEEE' }}
      >
        <style>{`
          @media (min-width: 1024px) { .fn-nav { height: 64px !important; } }
        `}</style>
        <div className="fn-nav max-w-300 mx-auto h-full flex items-center justify-between px-5 lg:px-12">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="FirstNest home">
            <div
              className="flex items-center justify-center rounded-sm shrink-0"
              style={{ width: 32, height: 32, background: '#F5E642' }}
            >
              <Home size={17} style={{ color: '#111111' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: '1.0625rem', color: '#111111', letterSpacing: '-0.01em' }}>
              FirstNest
            </span>
          </Link>

          {/* Desktop centre links — untouched */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => {
              const isAI = link.href === '/#ai-guidance'

              let active = false
              if (isAI) {
                active = pathname === '/' && activeHash === '#ai-guidance'
              } else {
                active = pathname === link.href && activeHash !== '#ai-guidance'
              }

              const handleClick = (e: React.MouseEvent) => {
                if (!isAI) {
                  // If clicking a normal link, clear the hash state manually
                  setActiveHash('')
                  return
                }

                e.preventDefault()
                setActiveHash('#ai-guidance')

                if (pathname === '/') {
                  window.history.pushState(null, '', '#ai-guidance')
                  document.getElementById('ai-guidance')?.scrollIntoView({ behavior: 'smooth' })
                } else {
                  router.push('/#ai-guidance')
                  setTimeout(() => {
                    document.getElementById('ai-guidance')?.scrollIntoView({ behavior: 'smooth' })
                  }, 400)
                }
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
                    color: active ? '#111111' : '#444444',
                    textDecoration: 'none',
                    paddingBottom: 2,
                    borderBottom: active ? '2px solid #F5E642' : '2px solid transparent',
                    transition: 'color 150ms, border-color 150ms',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mobile: hamburger toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="lg:hidden flex items-center justify-center rounded-lg transition-colors duration-150"
              style={{
                width: 40,
                height: 40,
                background: menuOpen ? '#F5F5F5' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#111111',
              }}
            >
              {menuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>

            {/* Desktop: Get Started pill */}
            <button
              type="button"
              onClick={() => router.push('/onboarding?flow=grants')}
              className="hidden lg:flex items-center justify-center btn-shine"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: 'linear-gradient(135deg, #F5E642 0%, #EDD900 100%)',
                color: '#111111',
                border: 'none',
                borderRadius: 9999,
                padding: '10px 24px',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 2px 10px rgba(245,230,66,0.45)',
              }}
            >
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop — dims the page behind the menu */}
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

      {/* Mobile menu panel — slides down from navbar */}
      <div
        className="lg:hidden fixed left-0 right-0 z-50 bg-white"
        style={{
          top: 56,
          boxShadow: menuOpen ? '0 8px 32px rgba(0,0,0,0.14)' : 'none',
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateY(0)' : 'translateY(-6px)',
          pointerEvents: menuOpen ? 'all' : 'none',
          transition: 'opacity 220ms ease, transform 220ms ease',
          borderBottom: '1px solid #EEEEEE',
        }}
      >
        <div className="flex flex-col px-5 py-3">
          {NAV_LINKS.map(link => {
            const isAI = link.href === '/#ai-guidance'
            const active = !isAI && pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isAI ? handleAIClick : () => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: active ? 600 : 500,
                  fontSize: '1rem',
                  color: active ? '#111111' : '#444444',
                  textDecoration: 'none',
                  padding: '14px 0',
                  borderBottom: '1px solid #F5F5F5',
                  borderLeft: active ? '3px solid #F5E642' : '3px solid transparent',
                  paddingLeft: 12,
                  transition: 'color 120ms',
                }}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Get Started CTA inside mobile menu */}
          <button
            type="button"
            onClick={() => { setMenuOpen(false); router.push('/onboarding?flow=grants') }}
            style={{
              marginTop: 14,
              marginBottom: 6,
              width: '100%',
              padding: '15px',
              background: '#F5E642',
              color: '#111111',
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
        </div>
      </div>
    </>
  )
}
