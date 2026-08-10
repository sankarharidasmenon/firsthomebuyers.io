'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as Slider from '@radix-ui/react-slider'

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (v: number) => string
  deltaLabel?: string
  deltaValue?: number
  deltaPositive?: boolean
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = v => `$${v.toLocaleString('en-AU')}`,
  deltaLabel,
  deltaValue,
  deltaPositive = true,
}: SliderFieldProps) {
  const [pulse, setPulse] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 100)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          style={{ fontFamily: 'Inter, sans-serif' }}
          className="text-[0.9375rem] font-medium text-card-foreground"
        >
          {label}
        </span>
        <span
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
          className="text-[0.9375rem] font-bold text-foreground"
        >
          {formatValue(value)}
        </span>
      </div>

      <Slider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
        className="relative flex items-center w-full h-6 touch-none select-none"
      >
        <Slider.Track className="relative h-[6px] grow rounded-full bg-border">
          {/* Teal, not lemon: this fill tracks toward a $ figure (borrowing
              capacity), so it uses the "money" colour, not the brand accent. */}
          <Slider.Range className="absolute h-full rounded-full bg-[#00C2A8] dark:bg-[#3DDBBF]" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-6 h-6 rounded-full bg-foreground shadow-[0_2px_8px_rgba(0,0,0,0.2)] cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2A8] focus-visible:ring-offset-2"
          aria-label={label}
          aria-valuetext={formatValue(value)}
        />
      </Slider.Root>

      <div className="flex items-center justify-between text-[0.8125rem] text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
        <span>{formatValue(min)}</span>
        {deltaValue !== undefined && deltaValue !== 0 && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              transform: pulse ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 100ms ease',
              display: 'inline-flex',
            }}
            className={[
              'px-3 py-0.5 rounded-full text-[0.75rem] font-medium',
              deltaPositive ? 'bg-[#00C2A8] dark:bg-[#3DDBBF] text-white dark:text-[#12141C]' : 'bg-surface text-secondary-foreground',
            ].join(' ')}
          >
            {deltaPositive ? '+' : ''}
            {deltaLabel ?? formatValue(deltaValue)}
          </span>
        )}
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}
