'use client'

import React from 'react'

interface TapCardOption {
  value: string
  label: string
  icon?: string
  description?: string
}

interface TapCardGroupProps {
  options: TapCardOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TapCardGroup({ options, value, onChange, className = '' }: TapCardGroupProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{ fontFamily: 'Inter, sans-serif' }}
          className={[
            'flex items-center gap-2.5 px-4 py-3 rounded-[10px] border transition-all duration-150 cursor-pointer text-left',
            value === opt.value
              ? 'bg-[#F5E642] border-[#D4C400] border-[1.5px]'
              : 'bg-white border-[#E0E0E0] border-[1.5px] hover:border-[#999999]',
          ].join(' ')}
        >
          {opt.icon && (
            <span className="text-[1.125rem] leading-none shrink-0">{opt.icon}</span>
          )}
          <div className="min-w-0">
            <span className="font-semibold text-[0.875rem] text-[#111111] block leading-tight">
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-[0.75rem] text-[#666666] block mt-0.5 leading-tight">
                {opt.description}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export function TapCard({ option, selected, onClick }: {
  option: TapCardOption
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ fontFamily: 'Inter, sans-serif' }}
      className={[
        'flex items-center gap-2.5 px-4 py-3 rounded-[10px] border transition-all duration-150 cursor-pointer text-left w-full',
        selected
          ? 'bg-[#F5E642] border-[#D4C400] border-[1.5px]'
          : 'bg-white border-[#E0E0E0] border-[1.5px] hover:border-[#999999]',
      ].join(' ')}
    >
      {option.icon && (
        <span className="text-[1.125rem] leading-none shrink-0">{option.icon}</span>
      )}
      <div className="min-w-0">
        <span className="font-semibold text-[0.875rem] text-[#111111] block leading-tight">
          {option.label}
        </span>
        {option.description && (
          <span className="text-[0.75rem] text-[#666666] block mt-0.5 leading-tight">
            {option.description}
          </span>
        )}
      </div>
    </button>
  )
}
