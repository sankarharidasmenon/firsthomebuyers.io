'use client'

import React, { useState, useRef } from 'react'
import { Info } from 'lucide-react'

interface InputFieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'tel'
  placeholder?: string
  prefix?: string
  tooltip?: string
  error?: string
  required?: boolean
  optional?: boolean
  helperText?: string
  formatOnBlur?: boolean
  className?: string
  autoFocus?: boolean
}

function formatCurrencyDisplay(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return ''
  return num.toLocaleString('en-AU')
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  prefix,
  tooltip,
  error,
  required,
  optional,
  helperText,
  formatOnBlur = false,
  className = '',
  autoFocus,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({})
  const [displayValue, setDisplayValue] = useState(
    value ? (formatOnBlur ? formatCurrencyDisplay(String(value)) : String(value)) : ''
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const TOOLTIP_W = 220

  const handleTooltipClick = () => {
    if (showTooltip) {
      setShowTooltip(false)
      return
    }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      // Centre tooltip on trigger, clamped within viewport with 10px margin
      let left = rect.left + rect.width / 2 - TOOLTIP_W / 2
      left = Math.max(10, Math.min(left, vw - TOOLTIP_W - 10))
      // Position above trigger; if no room, position below
      const above = rect.top > 80
      setTooltipPos(
        above
          ? { top: rect.top - 10, left, transform: 'translateY(-100%)' }
          : { top: rect.bottom + 10, left }
      )
    }
    setShowTooltip(true)
  }

  const handleFocus = () => {
    setFocused(true)
    if (formatOnBlur && displayValue) {
      const raw = displayValue.replace(/[^0-9.]/g, '')
      setDisplayValue(raw)
    }
  }

  const handleBlur = () => {
    setFocused(false)
    if (formatOnBlur && displayValue) {
      const formatted = formatCurrencyDisplay(displayValue)
      setDisplayValue(formatted)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDisplayValue(raw)
    const numericRaw = raw.replace(/[^0-9.]/g, '')
    onChange(numericRaw || raw)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <label
          style={{ fontFamily: 'Inter, sans-serif' }}
          className="text-[0.9375rem] font-medium text-card-foreground"
        >
          {label}
          {required && <span className="text-muted-foreground ml-0.5">*</span>}
          {optional && (
            <span className="text-muted-foreground font-normal ml-1 text-[0.8125rem]">(optional)</span>
          )}
        </label>
        {tooltip && (
          <>
            <button
              ref={btnRef}
              type="button"
              onClick={handleTooltipClick}
              onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
              className="text-muted-foreground hover:text-secondary-foreground transition-colors shrink-0"
              aria-label="More information"
              aria-expanded={showTooltip}
            >
              <Info size={14} />
            </button>
            {showTooltip && (
              <div
                role="tooltip"
                style={{
                  position: 'fixed',
                  ...tooltipPos,
                  zIndex: 9999,
                  width: TOOLTIP_W,
                  fontFamily: 'Inter, sans-serif',
                }}
                className="bg-foreground text-background text-[0.75rem] leading-relaxed rounded-[10px] px-3.5 py-2.5 shadow-xl"
              >
                {tooltip}
              </div>
            )}
          </>
        )}
      </div>

      <div className="relative">
        {prefix && (
          <span
            style={{ fontFamily: 'Inter, sans-serif' }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[0.9375rem] font-medium pointer-events-none z-10 select-none"
          >
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type={type === 'number' ? 'text' : type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          value={focused ? (formatOnBlur ? displayValue : String(value || '')) : displayValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
          }}
          className={[
            'w-full h-[52px] bg-background text-foreground rounded-[10px] transition-all duration-150 outline-none',
            prefix ? 'pl-8' : 'pl-4',
            'pr-4',
            'border-[1.5px]',
            error
              ? 'border-destructive shadow-[0_0_0_3px_rgba(252,165,165,0.3)]'
              : focused
              ? 'border-foreground shadow-[0_0_0_3px_rgba(245,230,66,0.3)]'
              : 'border-border hover:border-muted-foreground',
            'placeholder:text-muted-foreground',
          ].join(' ')}
        />
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          style={{ fontFamily: 'Inter, sans-serif' }}
          className="text-[0.8125rem] text-destructive"
        >
          {error}
        </p>
      )}

      {helperText && !error && (
        <p
          style={{ fontFamily: 'Inter, sans-serif' }}
          className="text-[0.8125rem] text-muted-foreground"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
