'use client'

import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

export function ProgressBar({ value, max = 100, className = '' }: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={`${Math.round(percent)}% complete`}
      className={`w-full h-[4px] bg-border ${className}`}
    >
      <div
        className="h-full bg-primary transition-[width] duration-300 ease-in-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
