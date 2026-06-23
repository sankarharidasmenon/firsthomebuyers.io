'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ResultsTabSwitcher() {
  const pathname = usePathname()
  const isGrants = pathname === '/results/grants'

  return (
    <div className="px-5 py-3 bg-white border-b border-grey-light">
      <div
        role="tablist"
        className="flex rounded-[10px] p-0.75 gap-0.75"
        style={{ background: '#F0F0F0' }}
      >
        <Link
          href="/results/grants"
          role="tab"
          aria-selected={isGrants}
          className="flex-1 text-center py-2 rounded-sm transition-all duration-200 text-[0.875rem] no-underline"
          style={
            isGrants
              ? {
                  background: '#FFFFFF',
                  color: '#111111',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                }
              : {
                  background: 'transparent',
                  color: '#888888',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                }
          }
        >
          Govt Schemes {isGrants ? '✓' : ''}
        </Link>
        <Link
          href="/results/borrowing"
          role="tab"
          aria-selected={!isGrants}
          className="flex-1 text-center py-2 rounded-sm transition-all duration-200 text-[0.875rem] no-underline"
          style={
            !isGrants
              ? {
                  background: '#FFFFFF',
                  color: '#111111',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                }
              : {
                  background: 'transparent',
                  color: '#888888',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                }
          }
        >
          Borrowing Capacity
        </Link>
      </div>
    </div>
  )
}
