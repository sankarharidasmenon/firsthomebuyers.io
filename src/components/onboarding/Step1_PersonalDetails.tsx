'use client'

import React, { useState, useEffect } from 'react'
import { InputField } from '@/components/ui/InputField'
import { BadgeChipGroup } from '@/components/ui/BadgeChip'
import { TapCardGroup } from '@/components/ui/TapCard'
import { Button } from '@/components/ui/button'
import type { Step1Data } from '@/lib/localStorage'
import type { Flow } from '@/lib/localStorage'

const STATE_OPTIONS = [
  { value: 'NSW', label: 'NSW' },
  { value: 'VIC', label: 'VIC' },
  { value: 'QLD', label: 'QLD' },
  { value: 'SA', label: 'SA' },
  { value: 'WA', label: 'WA' },
  { value: 'TAS', label: 'TAS' },
  { value: 'ACT', label: 'ACT' },
  { value: 'NT', label: 'NT' },
]

const BUYING_OPTIONS = [
  { value: 'solo', label: 'Just me', icon: '👤' },
  { value: 'partner', label: 'With a partner', icon: '👥' },
]

interface Step1Props {
  flow: Flow
  data: Step1Data
  onChange: (data: Step1Data) => void
  onNext: () => void
  errors: Partial<Record<keyof Step1Data, string>>
}

export function Step1_PersonalDetails({ flow, data, onChange, onNext, errors }: Step1Props) {
  const [greeting, setGreeting] = useState(false)

  const greetingText =
    flow === 'grants'
      ? "Let's find every grant you qualify for 🏛️"
      : "Let's figure out how much you can borrow 💰"

  useEffect(() => {
    if (data.firstName.length >= 2 && !greeting) {
      const t = setTimeout(() => setGreeting(true), 400)
      return () => clearTimeout(t)
    }
    if (data.firstName.length < 2) setGreeting(false)
  }, [data.firstName, greeting])

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#111111' }}>
          {greetingText}
        </h2>
      </div>

      {/* Field 1 — First Name */}
      <div className="flex flex-col gap-2">
        <InputField
          label="What's your name?"
          value={data.firstName}
          onChange={v => onChange({ ...data, firstName: v })}
          type="text"
          placeholder="e.g. Sarah"
          tooltip="We'll use this to personalise your results — nothing is shared."
          required
          error={errors.firstName}
        />
        {greeting && (
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#444444',
              opacity: 1,
              transition: 'opacity 300ms ease',
            }}
          >
            Nice to meet you, {data.firstName}! 👋 This takes about 3 minutes.
          </p>
        )}
      </div>

      {/* Field 2 — State */}
      <div className="flex flex-col gap-2">
        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: '#222222' }}>
          Which state or territory are you buying in?<span className="text-[#888888] ml-0.5">*</span>
        </label>
        <BadgeChipGroup
          options={STATE_OPTIONS}
          value={data.state}
          onChange={v => onChange({ ...data, state: v })}
        />
        {errors.state && (
          <p role="alert" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#E53E3E' }}>
            {errors.state}
          </p>
        )}
      </div>

      {/* Field 3 — Buying situation */}
      <div className="flex flex-col gap-2">
        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: '#222222' }}>
          Are you buying alone or with someone?<span className="text-[#888888] ml-0.5">*</span>
        </label>
        <TapCardGroup
          options={BUYING_OPTIONS}
          value={data.buyingWith}
          onChange={v => onChange({ ...data, buyingWith: v as Step1Data['buyingWith'] })}
        />
        {errors.buyingWith && (
          <p role="alert" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#E53E3E' }}>
            {errors.buyingWith}
          </p>
        )}
      </div>

      <Button onClick={onNext} variant="primary" fullWidth>
        NEXT →
      </Button>
    </div>
  )
}
