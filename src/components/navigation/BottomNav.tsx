'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, BookmarkCheck, Megaphone, Sparkles, BookOpen, UserCircle } from 'lucide-react'

/* ─── Tab definitions ────────────────────────────────────────────────────── */
const TABS = [
  { href: '/',             label: 'Home',       Icon: Home },
  { href: '/my-results',   label: 'My Results', Icon: BookmarkCheck },
    { href: '/#ai-guidance', label: 'AI',         Icon: Sparkles },
  { href: '/articles',     label: 'Articles',   Icon: BookOpen },
   { href: '/ads',          label: 'Ads', Icon: Megaphone },
  { href: '/profile',   label: 'My Profile', Icon: UserCircle },
  // { href: '/ads',          label: 'Ads', Icon: Megaphone },
  // { href: '/#ai-guidance', label: 'AI',         Icon: Sparkles },
] as const

/* ─── Component ─────────────────────────────────────────────────────────── */
export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeHash, setActiveHash] = useState('')
  const [pressed, setPressed] = useState<string | null>(null)

  /* Track URL hash for AI-section detection */
  useEffect(() => {
    setActiveHash(window.location.hash)
    const handler = () => setActiveHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  useEffect(() => {
    if (pathname !== '/') setActiveHash('')
    else setActiveHash(window.location.hash)
  }, [pathname])

  /* Smooth-scroll to the AI section, handling cross-page navigation */
  const handleAIClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveHash('#ai-guidance')
    if (pathname === '/') {
      window.history.pushState(null, '', '#ai-guidance')
      document.getElementById('ai-guidance')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/#ai-guidance')
      setTimeout(
        () => document.getElementById('ai-guidance')?.scrollIntoView({ behavior: 'smooth' }),
        450
      )
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' && activeHash !== '#ai-guidance'
    if (href === '/#ai-guidance') return pathname === '/' && activeHash === '#ai-guidance'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95"
      aria-label="Main navigation"
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '14px 14px 0 0',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -6px 28px rgba(0,0,0,0.09)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div
        role="list"
        style={{
          height: 68,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab.href)
          const isAI = tab.href === '/#ai-guidance'
          const isPressed = pressed === tab.href
          const { Icon } = tab

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="listitem"
              onClick={isAI ? handleAIClick : undefined}
              onPointerDown={() => setPressed(tab.href)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              className="no-underline select-none"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                position: 'relative',
                minHeight: 44,
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
              }}
            >
              {/* Animated top indicator bar */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: active ? 22 : 0,
                  height: 3,
                  background: 'var(--primary)',
                  borderRadius: '0 0 3px 3px',
                  transition: 'width 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />

              {/* Icon — yellow pill background when active, press scale feedback */}
              <div
                aria-hidden="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 28,
                  borderRadius: 14,
                  background: active ? 'var(--primary)' : 'transparent',
                  transform: isPressed ? 'scale(0.88)' : 'scale(1)',
                  transition: 'background 180ms ease, transform 80ms ease',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{
                    color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                    transition: 'color 160ms',
                  }}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.625rem',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                  transition: 'color 160ms',
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
