'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, Search, MapPin, ChevronDown, Check, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { searchSuburbs, type SuburbEntry } from '@/lib/questionnaire/postcodes'
import type { StateCode } from '@/lib/questionnaire/types'

/* Field wrapper: label + optional helper + inline error. */
export function Q({ label, help, error, children }: { label: string; help?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="fhbq-field">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <label className="fhbq-q" style={{ marginBottom: 0 }}>{label} <span className="req">*</span></label>
        {help && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" onClick={(e) => e.preventDefault()}>
                  <Info size={14} />
                  <span className="sr-only">Information about this question</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-[280px] p-3 text-[13px] leading-relaxed">
                {help}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {error && <p className="fhbq-err" role="alert"><AlertCircle size={13} /> {error}</p>}
    </div>
  )
}

/* Chips / pills. */
export function Chips<T extends string>({
  options, value, onChange, disabled,
}: { options: readonly { value: T; label: string }[]; value: T | ''; onChange: (v: T) => void; disabled?: (v: T) => boolean }) {
  return (
    <div className="fhbq-chips" role="radiogroup">
      {options.map((o) => {
        const off = disabled?.(o.value)
        return (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={off}
            className={`fhbq-chip${value === o.value ? ' selected' : ''}${off ? ' disabled' : ''}`}
            onClick={() => !off && onChange(o.value)}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* Segmented control (Yes / No etc.). */
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: readonly { value: T; label: string }[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div className="fhbq-seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={value === o.value ? 'selected' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* Compact selectable rows (citizenship). */
export function Rows<T extends string>({
  options, value, onChange,
}: { options: readonly T[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div className="fhbq-rows" role="radiogroup">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o}
          className={`fhbq-row${value === o ? ' selected' : ''}`} onClick={() => onChange(o)}>
          <span className="fhbq-radio" />
          <span>{o}</span>
        </button>
      ))}
    </div>
  )
}

/* Two medium cards (buying with). */
export function Duo<T extends string>({
  options, value, onChange,
}: { options: readonly { value: T; emoji: string; label: string; desc: string }[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div className="fhbq-duo" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={`fhbq-duo-card${value === o.value ? ' selected' : ''}`} onClick={() => onChange(o.value)}>
          <span className="emoji">{o.emoji}</span>
          <span className="lab">{o.label}</span>
          <span className="desc">{o.desc}</span>
        </button>
      ))}
    </div>
  )
}

/* Currency input with $ prefix and thousands formatting on blur. */
export function Currency({
  value, onChange, placeholder, invalid, id,
}: { value: number | null; onChange: (v: number | null) => void; placeholder?: string; invalid?: boolean; id?: string }) {
  const [focused, setFocused] = useState(false)
  const display = value == null ? '' : focused ? String(value) : value.toLocaleString('en-AU')
  return (
    <div className="fhbq-currency">
      <span>$</span>
      <input id={id} className={`fhbq-input${invalid ? ' invalid' : ''}`} inputMode="numeric" value={display} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChange={(e) => { const d = e.target.value.replace(/[^0-9]/g, ''); onChange(d === '' ? null : Number(d)) }} />
    </div>
  )
}

/* Smoothly-revealed conditional block (children stay mounted for the animation). */
export function Cond({ open, children }: { open: boolean; children: React.ReactNode }) {
  return <div className={`fhbq-cond${open ? ' open' : ''}`} aria-hidden={!open}><div>{children}</div></div>
}

/* Single-input searchable location combobox → suburb + postcode (filtered to state). */
export function LocationCombobox({
  suburb, postcode, stateFilter, onSelect, invalid,
}: {
  suburb: string; postcode: string; stateFilter: StateCode | ''
  onSelect: (v: { suburb: string; postcode: string; state: StateCode }) => void; invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const results: SuburbEntry[] = searchSuburbs(query, 200)
    .filter((s) => !stateFilter || s.state === stateFilter)
    .slice(0, 8)

  const label = suburb && postcode ? `${suburb} (${postcode})` : postcode || ''

  const choose = (s: SuburbEntry) => { onSelect({ suburb: s.suburb, postcode: s.postcode, state: s.state }); setOpen(false); setQuery('') }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) choose(results[active]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="fhbq-combo" ref={ref}>
      <button type="button" className={`fhbq-combo-btn${open ? ' open' : ''}${invalid ? ' invalid' : ''}`} onClick={() => setOpen((v) => !v)}>
        <MapPin size={15} style={{ color: 'var(--q-grey)', flexShrink: 0 }} />
        <span className={`fhbq-combo-val${label ? '' : ' ph'}`}>{label || 'Search your suburb or postcode'}</span>
        {stateFilter && <span className="fhbq-combo-badge">{stateFilter}</span>}
        <ChevronDown size={15} style={{ color: 'var(--q-grey)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div className="fhbq-combo-panel">
          <div className="fhbq-combo-search">
            <Search size={15} style={{ color: 'var(--q-grey)' }} />
            <input autoFocus value={query} placeholder="Type a suburb or 4-digit postcode"
              onChange={(e) => { setQuery(e.target.value); setActive(0) }} onKeyDown={onKey} />
          </div>
          <div className="fhbq-combo-list">
            {results.map((s, i) => {
              const sel = s.suburb === suburb && s.postcode === postcode
              return (
                <button key={`${s.suburb}-${s.postcode}`} type="button"
                  className={`fhbq-combo-opt${active === i ? ' active' : ''}`}
                  onMouseEnter={() => setActive(i)} onClick={() => choose(s)}>
                  <span>{s.suburb} <span className="pc">({s.postcode})</span></span>
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <span className="st">{s.state}</span>{sel && <Check size={14} style={{ color: 'var(--q-yellow-dark)' }} />}
                  </span>
                </button>
              )
            })}
            {results.length === 0 && <div className="fhbq-combo-empty">No match in {stateFilter || 'NSW/VIC'}. Try another suburb or postcode.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
