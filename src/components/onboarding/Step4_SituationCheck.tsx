'use client'

import React from 'react'
import { InputField } from '@/components/ui/InputField'
import { BadgeChipGroup } from '@/components/ui/BadgeChip'
import { TapCardGroup } from '@/components/ui/TapCard'
import { Button } from '@/components/ui/button'
import type { Step1Data, Step4Data } from '@/lib/localStorage'

const EMPLOYMENT_OPTIONS = [
  { value: 'fulltime', label: 'Full-time', icon: '👔' },
  { value: 'parttime', label: 'Part-time', icon: '⏰' },
  { value: 'selfemployed', label: 'Self-employed', icon: '💼' },
  { value: 'casual', label: 'Casual', icon: '📋' },
  { value: 'contract', label: 'Contract', icon: '📌' },
]

const HECS_OPTIONS = [
  { value: 'false', label: 'No', icon: '✓' },
  { value: 'true', label: 'Yes', icon: '📚' },
]

interface Step4Props {
  step1: Step1Data
  data: Step4Data
  onChange: (data: Step4Data) => void
  onSubmit: () => void
  onBack: () => void
  errors: Partial<Record<string, string>>
}

export function Step4_SituationCheck({ step1, data, onChange, onSubmit, onBack, errors }: Step4Props) {
  const firstName = step1.firstName || 'there'

  return (
    <div className="flex flex-col gap-5 pt-4">
      <h2
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#111111' }}
      >
        Almost there, {firstName}! Just a couple more things.
      </h2>

      {/* Field 1 — Employment Type */}
      <div className="flex flex-col gap-2">
        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: '#222222' }}>
          How are you currently employed?<span className="text-grey-mid ml-0.5">*</span>
        </label>
        <BadgeChipGroup
          options={EMPLOYMENT_OPTIONS}
          value={data.employmentType}
          onChange={v => onChange({ ...data, employmentType: v as Step4Data['employmentType'] })}
          className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2"
          chipClassName="w-full sm:w-auto"
        />
        {errors.employmentType && (
          <p role="alert" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#E53E3E' }}>
            {errors.employmentType}
          </p>
        )}
      </div>

      {/* Field 2 — Credit Card Limit */}
      <InputField
        label="What's your total credit card limit? (if any)"
        value={data.creditCardLimit || ''}
        onChange={v => onChange({ ...data, creditCardLimit: parseFloat(v) || 0 })}
        type="number"
        prefix="$"
        placeholder="0 or none"
        tooltip="Banks assess your borrowing power against your total limit, not your balance."
        optional
        formatOnBlur
        error={errors.creditCardLimit}
      />

      {/* Field 3 — HECS/HELP Debt */}
      <div className="flex flex-col gap-2">
        <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.9375rem', color: '#222222' }}>
          Do you have a HECS or HELP debt?<span className="text-grey-mid ml-0.5">*</span>
        </label>
        <TapCardGroup
          options={HECS_OPTIONS}
          value={data.hecsDebt ? 'true' : 'false'}
          onChange={v => onChange({ ...data, hecsDebt: v === 'true' })}
        />
      </div>

      {/* Field 4 is actually "other loans" — we'll show it below HECS but note max 3 per screen.
          The spec shows 4 fields here, but HECS is a tap card (not a text input), so we count
          "employment type", "credit card limit input", and "other loans input" as the 3 inputs. */}
      <InputField
        label="Any other regular loan repayments?"
        value={data.otherLoanRepayments || ''}
        onChange={v => onChange({ ...data, otherLoanRepayments: parseFloat(v) || 0 })}
        type="number"
        prefix="$"
        placeholder="0 (none)"
        optional
        formatOnBlur
        error={errors.otherLoanRepayments}
      />

      {/* Completion nudge */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-sm"
        style={{ background: '#FAFAFA', border: '1px solid #EEEEEE' }}
      >
        <span style={{ fontSize: '1rem' }}>🎉</span>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#444444' }}>
          Great work — your results are ready to calculate!
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} fullWidth={false} className="px-6">
          ← Back
        </Button>
        <Button onClick={onSubmit} variant="final" fullWidth>
          SEE MY RESULTS →
        </Button>
      </div>
    </div>
  )
}
