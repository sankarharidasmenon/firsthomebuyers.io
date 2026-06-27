'use client'

import React from 'react'
import * as Switch from '@radix-ui/react-switch'

interface ToggleSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  id?: string
}

export function ToggleSwitch({ checked, onCheckedChange, label, id }: ToggleSwitchProps) {
  const switchId = id ?? `toggle-${Math.random().toString(36).slice(2, 7)}`

  return (
    <div className="flex items-center gap-2">
      <Switch.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={[
          'relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-input',
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
