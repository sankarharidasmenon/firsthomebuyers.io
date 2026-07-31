'use client'

import React, { useEffect, useState } from 'react'
import { MessageSquareText } from 'lucide-react'

interface FeedbackButtonProps {
  onClick: () => void
  /** Controls aria-expanded so assistive tech knows the dialog is already up. */
  expanded: boolean
}

/**
 * Floating launcher for the feedback modal.
 *
 * Sits 24px from the bottom-right on desktop. Below `lg` the BottomNav owns the
 * bottom of the screen, so the button lifts clear of it (68px bar + safe area)
 * and shrinks to an icon-only circle. Kept at z-45: above the draggable social
 * widget (z-40), below the nav bars and the dialog (z-50).
 */
export function FeedbackButton({ onClick, expanded }: FeedbackButtonProps) {
  // Enter animation runs after mount so the button fades/slides in.
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share feedback"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      style={{
        fontFamily: 'Inter, sans-serif',
        background:
          'linear-gradient(135deg, var(--brand-gradient-start) 0%, var(--brand-gradient-end) 100%)',
        color: 'var(--brand-dark-surface)',
        boxShadow: '0 6px 22px rgba(245,230,66,0.45), 0 2px 8px rgba(0,0,0,0.12)',
      }}
      className={[
        'fixed z-45 cursor-pointer select-none rounded-full border-0',
        'right-4 bottom-[calc(env(safe-area-inset-bottom)+84px)]',
        'lg:right-6 lg:bottom-6',
        // Icon-only circle on small screens, pill from sm up.
        'flex h-12 w-12 items-center justify-center sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3.5',
        'text-[0.875rem] font-semibold',
        'transition-[transform,opacity,box-shadow] duration-200 ease-out',
        'hover:-translate-y-0.75 hover:shadow-[0_10px_28px_rgba(245,230,66,0.6)]',
        'active:translate-y-0 active:scale-[0.97]',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      ].join(' ')}
    >
      <MessageSquareText size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  )
}
