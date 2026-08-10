'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/results/grants', label: 'Grants & Schemes' },
  { href: '/results/borrowing', label: 'Borrowing Capacity' },
] as const

export function ResultsTabSwitcher() {
  const pathname = usePathname()

  return (
    <div className="px-5 py-3 bg-background border-b border-grey-light dark:border-border">
      <div role="tablist" className="flex rounded-lg p-1 gap-1 bg-[#F5F5F5] dark:bg-surface">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={[
                'flex-1 text-center py-2 rounded-md transition-colors duration-150 text-[0.8125rem] no-underline',
                active
                  ? 'bg-white dark:bg-card text-[#111111] dark:text-foreground font-semibold border border-[rgba(0,0,0,0.06)] dark:border-border'
                  : 'bg-transparent text-[var(--muted-foreground)] dark:text-muted-foreground font-medium',
              ].join(' ')}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
