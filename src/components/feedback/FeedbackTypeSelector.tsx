'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { FEEDBACK_TYPES, type FeedbackType } from '@/lib/feedback/types'

interface FeedbackTypeSelectorProps {
  value: FeedbackType | ''
  onChange: (value: FeedbackType) => void
  disabled?: boolean
  /** id of the inline error message, wired up for screen readers */
  errorId?: string
  invalid?: boolean
}

/**
 * Feedback category picker.
 *
 * Built on a real radio group (visually hidden inputs inside labels) so arrow
 * keys, single-selection semantics and screen-reader announcements come from
 * the platform rather than hand-rolled ARIA.
 */
export function FeedbackTypeSelector({
  value,
  onChange,
  disabled = false,
  errorId,
  invalid = false,
}: FeedbackTypeSelectorProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      role="radiogroup"
      aria-label="Feedback type"
      aria-describedby={invalid ? errorId : undefined}
    >
      {FEEDBACK_TYPES.map((option) => {
        const selected = value === option.value

        return (
          <label
            key={option.value}
            className={[
              'relative block',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            <input
              type="radio"
              name="fn-feedback-type"
              value={option.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={[
                /* min-h keeps the tap target comfortable at the reduced padding */
                'flex min-h-11.5 items-center gap-2.5 rounded-[14px] border-[1.5px] px-3 py-1.5 pr-8',
                'transition-[transform,background-color,border-color,box-shadow] duration-150',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                'peer-focus-visible:ring-offset-card',
                selected
                  ? 'bg-primary border-primary-hover shadow-[0_4px_14px_rgba(245,230,66,0.35)]'
                  : 'bg-card border-border hover:border-primary/60 hover:bg-accent',
                !disabled ? 'hover:-translate-y-[2px]' : '',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-[1.125rem] leading-none shrink-0">
                {option.icon}
              </span>

              <span className="min-w-0">
                <span
                  className={[
                    'block text-[0.875rem] font-semibold leading-tight',
                    selected ? 'text-primary-foreground' : 'text-foreground',
                  ].join(' ')}
                >
                  {option.label}
                </span>
                <span
                  className={[
                    'block text-[0.75rem] leading-tight',
                    selected ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {option.description}
                </span>
              </span>

              {/* Selection tick — scales in so the state change is felt, not just seen */}
              <span
                aria-hidden="true"
                className={[
                  'absolute top-1/2 right-3 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full',
                  'bg-primary-foreground text-primary transition-all duration-150',
                  selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                ].join(' ')}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
