'use client'

import React, { useId } from 'react'
import * as Switch from '@radix-ui/react-switch'

interface ToggleSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  id?: string
}

export function ToggleSwitch({ checked, onCheckedChange, label, id }: ToggleSwitchProps) {
  const generatedId = useId()
  const switchId = id ?? generatedId

  return (
    <div className="flex items-center gap-2">
      <Switch.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={[
          'relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12141C] dark:focus-visible:ring-[#C9A876] focus-visible:ring-offset-2',
          // "On" fill matches the primary button's ink/brass flip — a toggle's
          // checked state is a selection, same family as chip/segment selection.
          checked ? 'bg-[#12141C] dark:bg-[#C9A876]' : 'bg-input',
        ].join(' ')}
      >
        <Switch.Thumb
          className={[
            'pointer-events-none block h-5 w-5 rounded-full bg-foreground shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </Switch.Root>
      {label && (
        <label
          htmlFor={switchId}
          style={{ fontFamily: 'Inter, sans-serif' }}
          className="text-[0.875rem] text-secondary-foreground cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  )
}
