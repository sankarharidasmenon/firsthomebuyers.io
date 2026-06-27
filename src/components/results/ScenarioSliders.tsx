'use client'

import React, { useState, useCallback } from 'react'
import { SliderField } from '@/components/ui/SliderField'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { InputField } from '@/components/ui/InputField'
import { Button } from '@/components/ui/button'
import { calculateBorrowingCapacity, type BorrowingInputs } from '@/lib/calculations'
import { addSavedScenario } from '@/lib/localStorage'

interface ScenarioSlidersProps {
  baseInputs: BorrowingInputs
  baseResult: { min: number; max: number }
  onResultChange: (result: { min: number; max: number }) => void
}

export function ScenarioSliders({ baseInputs, baseResult, onResultChange }: ScenarioSlidersProps) {
  const [extraSavings, setExtraSavings] = useState(0)
  const [incomeIncrease, setIncomeIncrease] = useState(0)
  const [hasPartner, setHasPartner] = useState(false)
  const [partnerIncome, setPartnerIncome] = useState(0)
  const [saved, setSaved] = useState(false)

  const recalculate = useCallback(
    (es: number, ii: number, hp: boolean, pi: number) => {
      const adjusted: BorrowingInputs = {
        ...baseInputs,
        annualIncome: baseInputs.annualIncome + ii,
        partnerIncome: hp ? pi : (baseInputs.partnerIncome || 0),
        depositAmount: baseInputs.depositAmount + es,
      }
      const result = calculateBorrowingCapacity(adjusted)
      onResultChange(result)
      return result
    },
    [baseInputs, onResultChange]
  )

  const handleExtraSavings = (v: number) => { setExtraSavings(v); recalculate(v, incomeIncrease, hasPartner, partnerIncome) }
  const handleIncomeIncrease = (v: number) => { setIncomeIncrease(v); recalculate(extraSavings, v, hasPartner, partnerIncome) }
  const handlePartnerToggle = (v: boolean) => { setHasPartner(v); recalculate(extraSavings, incomeIncrease, v, partnerIncome) }
  const handlePartnerIncome = (v: string) => {
    const num = parseFloat(v) || 0
    setPartnerIncome(num)
    recalculate(extraSavings, incomeIncrease, hasPartner, num)
  }

  const handleReset = () => {
    setExtraSavings(0)
    setIncomeIncrease(0)
    setHasPartner(false)
    setPartnerIncome(0)
    onResultChange(baseResult)
  }

  const handleSave = () => {
    const current = recalculate(extraSavings, incomeIncrease, hasPartner, partnerIncome)
    addSavedScenario({ sliders: { extraSavings, incomeIncrease, hasPartner, partnerIncome }, result: current })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentResult = calculateBorrowingCapacity({
    ...baseInputs,
    annualIncome: baseInputs.annualIncome + incomeIncrease,
    partnerIncome: hasPartner ? partnerIncome : (baseInputs.partnerIncome || 0),
    depositAmount: baseInputs.depositAmount + extraSavings,
  })
  const delta = currentResult.max - baseResult.max

  return (
    <div className="px-5 pt-5 pb-5">
      {/* Section header */}
      <div className="mb-4">
        <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>
          What if I...?
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
          Adjust the sliders to explore different scenarios
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <SliderField
          label="Save an extra"
          value={extraSavings}
          min={0}
          max={100000}
          step={5000}
          onChange={handleExtraSavings}
          deltaValue={delta > 0 && extraSavings > 0 ? delta : undefined}
          deltaLabel={delta > 0 ? `+$${delta.toLocaleString('en-AU')} capacity` : undefined}
        />

        <SliderField
          label="Increase income by"
          value={incomeIncrease}
          min={0}
          max={50000}
          step={2500}
          onChange={handleIncomeIncrease}
          formatValue={v => `$${v.toLocaleString('en-AU')}/yr`}
          deltaValue={delta > 0 && incomeIncrease > 0 ? delta : undefined}
          deltaLabel={delta > 0 ? `+$${delta.toLocaleString('en-AU')} capacity` : undefined}
        />

        <div className="flex flex-col gap-3">
          <ToggleSwitch
            checked={hasPartner}
            onCheckedChange={handlePartnerToggle}
            label="Add a partner"
          />
          {hasPartner && (
            <div className="animate-in slide-in-from-bottom duration-200">
              <InputField
                label="Partner's annual income"
                value={partnerIncome || ''}
                onChange={handlePartnerIncome}
                type="number"
                prefix="$"
                placeholder="0"
                formatOnBlur
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <Button onClick={handleSave} variant="primary" fullWidth size="sm">
          {saved ? '✓ Saved!' : '💾 Save this scenario'}
        </Button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '6px',
          }}
          className="hover:text-foreground transition-colors"
        >
          Reset to original
        </button>
      </div>
    </div>
  )
}
