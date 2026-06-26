'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ResultsTabSwitcher() {
  const pathname = usePathname()
  const isGrants = pathname === '/results/grants'

  return (
    <div className="px-5 py-3 bg-background border-b border-grey-light">
      <div
        role="tablist"
        className="flex rounded-[10px] p-0.75 gap-0.75 bg-[#F5F5F5] dark:bg-surface"
      >
        <Link
          href="/results/grants"
          role="tab"
          aria-selected={isGrants}
          className={[
            'flex-1 text-center py-2 rounded-sm transition-all duration-200 text-[0.875rem] no-underline',
            isGrants
              ? 'bg-white dark:bg-card text-[#111111] dark:text-foreground font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
              : 'bg-transparent text-[var(--muted-foreground)] dark:text-muted-foreground font-normal',
          ].join(' ')}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
           Grants & Schemes {isGrants ? '✓' : ''}
        </Link>
        <Link
          href="/results/borrowing"
          role="tab"
          aria-selected={!isGrants}
          className={[
            'flex-1 text-center py-2 rounded-sm transition-all duration-200 text-[0.875rem] no-underline',
            !isGrants
              ? 'bg-white dark:bg-card text-[#111111] dark:text-foreground font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.10)]'
              : 'bg-transparent text-[var(--muted-foreground)] dark:text-muted-foreground font-normal',
          ].join(' ')}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Borrowing Capacity
        </Link>
      </div>
    </div>
  )
}
