'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, BookmarkCheck, ArrowRight } from 'lucide-react'
import { getProgress } from '@/lib/localStorage'

const TABS = [
  { href: '/',              icon: Home,          label: 'Home' },
  { href: '/results/grants', icon: BarChart2,     label: 'Results' },
  { href: '/my-results',   icon: BookmarkCheck, label: 'My Results' },
  { href: '/next-steps',   icon: ArrowRight,    label: 'Next Steps' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const progress = getProgress()
    if (progress && progress.completedSteps.includes(4)) {
      setVisible(true)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white"
      style={{
        height: 64,
        borderTop: '1px solid #EEEEEE',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Main navigation"
    >
      <div className="max-w-[480px] mx-auto h-full grid grid-cols-4">
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 no-underline relative"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#F5E642]"
                  aria-hidden="true"
                />
              )}
              <Icon
                size={22}
                style={{ color: active ? '#F5E642' : '#888888' }}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.6875rem',
                  color: active ? '#F5E642' : '#888888',
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
