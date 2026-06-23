'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InputField } from '@/components/ui/InputField'
import { Button } from '@/components/ui/button'
import type { Step1Data, Step2Data } from '@/lib/localStorage'

interface Step2Props {
  step1: Step1Data
  data: Step2Data
  onChange: (data: Step2Data) => void
  onNext: () => void
  onBack: () => void
  errors: Partial<Record<keyof Step2Data, string>>
}

export function Step2_FinancialDetails({ step1, data, onChange, onNext, onBack, errors }: Step2Props) {
  const isPartner = step1.buyingWith === 'partner'
  const firstName = step1.firstName || 'you'

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h2
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#111111' }}
      >
        {firstName.charAt(0).toUpperCase() + firstName.slice(1)}, tell us about your income
      </h2>

      {/* Field 1 — Annual Income */}
      <InputField
        label="Your gross annual income"
        value={data.annualIncome || ''}
        onChange={v => onChange({ ...data, annualIncome: parseFloat(v) || 0 })}
        type="number"
        prefix="$"
        placeholder="0"
        tooltip="Enter your annual salary before tax (PAYG or self-employed average)"
        required
        formatOnBlur
        error={errors.annualIncome}
      />

      {/* Field 2 — Partner Income (conditional) */}
      <AnimatePresence>
        {isPartner && (
          <motion.div
            key="partner-income"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <InputField
              label="Your partner's gross annual income"
              value={data.partnerIncome || ''}
              onChange={v => onChange({ ...data, partnerIncome: parseFloat(v) || 0 })}
              type="number"
              prefix="$"
              placeholder="0"
              tooltip="Enter your partner's annual salary before tax"
              required
              formatOnBlur
              error={errors.partnerIncome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Field 3 — Monthly Expenses */}
      <div>
        <InputField
          label="Your regular monthly expenses"
          value={data.monthlyExpenses || ''}
          onChange={v => onChange({ ...data, monthlyExpenses: parseFloat(v) || 0 })}
          type="number"
          prefix="$"
          placeholder="0"
          tooltip="Include rent, bills, phone, subscriptions, loan repayments — not groceries or discretionary spend"
          required
          formatOnBlur
          error={errors.monthlyExpenses}
          helperText="💡 Most Australians spend $2,500–$4,500/month on essentials."
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
