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
  /* gradient is in VARIANT_STYLES below — keep just structural Tailwind here */
  primary: 'text-[#111111] active:scale-[0.97] btn-shine',
  secondary: 'bg-transparent border-2 border-[#111111] text-[#111111] hover:bg-[#F5F5F5] active:scale-[0.97]',
  ghost: 'bg-transparent text-[#444444] hover:bg-[#F5F5F5] active:scale-[0.97]',
  final: 'text-[#F5E642] active:scale-[0.97]',
}

/* Inline styles for gradient variants — CSS classes can't express dynamic gradients reliably */
const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #F5E642 0%, #EDD900 100%)',
    boxShadow: '0 4px 16px rgba(245,230,66,0.50)',
    transition: 'transform 80ms, box-shadow 120ms, filter 120ms',
  },
  secondary: {},
  ghost: {},
  final: {
    background: '#111111',
    boxShadow: '0 4px 16px rgba(17,17,17,0.25)',
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
        /* hover: lift + deepen shadow for primary */
        variant === 'primary' ? 'hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(245,230,66,0.65)]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
