'use client'

import React from 'react'

interface BadgeChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  icon?: string
  className?: string
}

export function BadgeChip({ label, selected = false, onClick, icon, className = '' }: BadgeChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontFamily: 'Inter, sans-serif' }}
      className={[
        'inline-flex justify-center items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all duration-150 cursor-pointer select-none',
        'text-[0.8125rem] font-medium',
        selected
          ? 'bg-[#111111] text-white border-[#111111]'
          : 'bg-white text-grey-dark border-[#E0E0E0] hover:border-[#999999] hover:text-[#111111]',
        className
      ].filter(Boolean).join(' ')}
    >
      {icon && <span className="text-[0.875rem] leading-none">{icon}</span>}
      {label}
    </button>
  )
}

interface BadgeChipGroupProps {
  options: Array<{ value: string; label: string; icon?: string }>
  value: string | string[]
  onChange: (value: string) => void
  multi?: boolean
  className?: string
  chipClassName?: string
}

export function BadgeChipGroup({
  options,
  value,
  onChange,
  multi = false,
  className = '',
  chipClassName = '',
}: BadgeChipGroupProps) {
  const selectedValues = Array.isArray(value) ? value : [value]

  return (
    <div className={className || 'flex flex-wrap gap-2'}>
      {options.map(opt => (
        <BadgeChip
          key={opt.value}
          label={opt.label}
          icon={opt.icon}
          selected={selectedValues.includes(opt.value)}
          onClick={() => onChange(opt.value)}
          className={chipClassName}
        />
      ))}
    </div>
  )
}
