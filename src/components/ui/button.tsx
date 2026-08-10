'use client'

import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'final'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'min-h-[44px] px-6 text-sm rounded-[20px]',
  md: 'min-h-[56px] px-8 text-sm tracking-[0.05em] uppercase font-semibold rounded-[20px]',
  lg: 'min-h-[56px] px-10 text-sm tracking-[0.05em] uppercase font-semibold rounded-[20px]',
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // "Opal Fintech": ink-navy base, one brass accent. In dark mode the
  // button flips to brass (the general accent), not teal — teal is reserved
  // for money/eligible specifically, not spent on chrome. 'final' stays
  // visually identical to 'primary' — one accent, not two.
  primary: 'bg-[#12141C] text-white dark:bg-[#C9A876] dark:text-[#12141C] active:scale-[0.97] btn-shine',
  secondary: 'bg-transparent border-2 border-foreground text-foreground hover:bg-accent active:scale-[0.97]',
  ghost: 'bg-transparent text-secondary-foreground hover:bg-accent active:scale-[0.97]',
  final: 'bg-[#12141C] text-white dark:bg-[#C9A876] dark:text-[#12141C] active:scale-[0.97]',
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    boxShadow: '0 2px 10px rgba(18,20,28,0.25)',
    transition: 'transform 80ms, box-shadow 120ms, filter 120ms',
  },
  secondary: {},
  ghost: {},
  final: {
    boxShadow: '0 4px 16px rgba(18,20,28,0.3)',
  },
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  size = 'md',
  className = '',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        fontFamily: 'Inter, sans-serif',
        ...VARIANT_STYLES[variant],
        ...style,
      }}
      className={[
        'relative inline-flex items-center justify-center cursor-pointer select-none overflow-hidden',
        VARIANT_CLASSES[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        /* hover: lift + deepen shadow for primary — opal ink / brass glow */
        variant === 'primary' ? 'hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(18,20,28,0.4)] dark:hover:shadow-[0_6px_20px_rgba(201,168,118,0.35)]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
