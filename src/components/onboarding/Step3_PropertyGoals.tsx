'use client'

import React, { useState } from 'react'
import { InputField } from '@/components/ui/InputField'
import { BadgeChipGroup } from '@/components/ui/BadgeChip'
import { TapCardGroup } from '@/components/ui/TapCard'
import { Button } from '@/components/ui/button'
import type { Step3Data } from '@/lib/localStorage'

const PROPERTY_TYPES = [
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'offplan', label: 'Off-the-plan', icon: '🏗️' },
]

const FHB_OPTIONS = [
  { value: 'true', label: 'No — this is my first', icon: '✨' },
  { value: 'false', label: 'Yes — I have owned before', icon: '🏡' },
]

interface Step3Props {
  data: Step3Data
  onChange: (data: Step3Data) => void
  onNext: () => void
  onBack: () => void
  errors: Partial<Record<string, string>>
}

export function Step3_PropertyGoals({ data, onChange, onNext, onBack, errors }: Step3Props) {
  const [unsureOpen, setUnsureOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h2
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#111111' }}
      >
        Now, let&apos;s talk savings and goals
      </h2>

      {/* Field 1 — Current Savings */}
      <InputField
        label="How much have you saved so far?"
        value={data.depositAmount || ''}
        onChange={v => onChange({ ...data, depositAmount: parseFloat(v) || 0 })}
        type="number"
        prefix="$"
        placeholder="0"
        required
        formatOnBlur
        error={errors.depositAmount}
      />

      {/* Field 2 — Target Property Price */}
      <div className="flex flex-col gap-1">
        <InputField
          label="What's your target property price?"
          value={data.targetPropertyPrice || ''}
          onChange={v => onChange({ ...data, targetPropertyPrice: parseFloat(v) || 0 })}
          type="number"
          prefix="$"
          placeholder="0"
          required
          formatOnBlur
          error={errors.targetPropertyPrice}
          helperText="An estimate is fine — you can adjust this later."
        />
        <button
          type="button"
          onClick={() => setUnsureOpen(v => !v)}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#444444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none', textAlign: 'left', padding: '2px 0' }}
        >
          ⓘ What if I&apos;m unsure?
        </button>
        {unsureOpen && (
          <div
            className="p-3 rounded-[8px]"
            style={{ background: '#F9F9F9', border: '1px solid #EEEEEE' }}
          >
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#444444' }}>
              Check realestate.com.au or Domain for recent sales in your target suburb.
            </p>
          </div>
        )}
      </div>

      {/* Field 3 — Property Type */}
      <div className="flex flex-col gap-2">
        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: '#222222' }}>
          What type of property are you looking at?<span className="text-[#888888] ml-0.5">*</span>
        </label>
        <BadgeChipGroup
          options={PROPERTY_TYPES}
          value={data.propertyType}
          onChange={v => onChange({ ...data, propertyType: v as Step3Data['propertyType'] })}
          className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2"
          chipClassName="w-full sm:w-auto"
        />
        {errors.propertyType && (
          <p role="alert" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#E53E3E' }}>
            {errors.propertyType}
          </p>
        )}
      </div>

      {/* Field 4 — First home buyer (shown as 4th but counts as 3rd visible if unsure collapsed) */}
      <div className="flex flex-col gap-2">
        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: '#222222' }}>
          Have you or your partner ever owned property in Australia?<span className="text-[#888888] ml-0.5">*</span>
        </label>
        <TapCardGroup
          options={FHB_OPTIONS}
          value={data.firstHomeBuyer ? 'true' : 'false'}
          onChange={v => onChange({ ...data, firstHomeBuyer: v === 'true' })}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} fullWidth={false} className="px-6">
          ← Back
        </Button>
        <Button onClick={onNext} variant="primary" fullWidth>
          NEXT →
        </Button>
      </div>
    </div>
  )
}
