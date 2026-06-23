'use client'

import React from 'react'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'

interface HideIneligibleToggleProps {
  showIneligible: boolean
  onChange: (show: boolean) => void
}

export function HideIneligibleToggle({ showIneligible, onChange }: HideIneligibleToggleProps) {
  return (
    <div className="flex items-center justify-end px-5 py-2">
      <ToggleSwitch
        checked={showIneligible}
        onCheckedChange={onChange}
        label="Show ineligible schemes"
      />
    </div>
  )
}
