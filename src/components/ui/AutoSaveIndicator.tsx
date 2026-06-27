'use client'

import React from 'react'
import { Check } from 'lucide-react'

interface AutoSaveIndicatorProps {
  show: boolean
}

export function AutoSaveIndicator({ show }: AutoSaveIndicatorProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={[
        'fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background rounded-full',
        'text-[0.75rem] font-medium shadow-lg pointer-events-none',
        'transition-opacity duration-300',
        show ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <Check size={12} />
      Progress saved
    </div>
  )
}
