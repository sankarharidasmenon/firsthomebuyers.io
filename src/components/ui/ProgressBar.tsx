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
      className={`w-full h-[4px] bg-[#EEEEEE] ${className}`}
    >
      <div
        className="h-full bg-[#F5E642] transition-[width] duration-300 ease-in-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
