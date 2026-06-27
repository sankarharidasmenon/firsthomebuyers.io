'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearAllData, type ProgressData } from '@/lib/localStorage'

interface SessionResumeBannerProps {
  progress: ProgressData
  onDismiss: () => void
}

export function SessionResumeBanner({ progress, onDismiss }: SessionResumeBannerProps) {
  const router = useRouter()
  const [confirmingFresh, setConfirmingFresh] = useState(false)

  const handleContinue = () => {
    router.push(`/onboarding?flow=${progress.flow}&step=${progress.currentStep}`)
  }

  const handleStartFresh = () => {
    if (!confirmingFresh) {
      setConfirmingFresh(true)
      return
    }
    clearAllData()
    onDismiss()
    setConfirmingFresh(false)
  }

  return (
    <div
      style={{ background: 'var(--brand-yellow-light)', borderBottom: '2px solid var(--brand-yellow)' }}
    >
      {/* Desktop: flex row. Mobile: flex col */}
      <div
        className="max-w-[1100px] mx-auto px-4 py-2 flex flex-row items-center justify-between gap-2"
      >
        <p
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: '#111111' }}
        >
          👋 Welcome back! Step {progress.currentStep} of 4.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleContinue}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: '0.8125rem',
              background: 'var(--primary)',
              color: '#111111',
              border: 'none',
              borderRadius: 9999,
              padding: '7px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Continue →
          </button>
          <button
            type="button"
            onClick={handleStartFresh}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '0.8125rem',
              background: 'transparent',
              color: confirmingFresh ? 'var(--destructive)' : '#444444',
              border: '1px solid rgba(17, 17, 17, 0.2)',
              borderRadius: 9999,
              padding: '7px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {confirmingFresh ? 'Confirm?' : 'Start fresh'}
          </button>
        </div>
      </div>
    </div>
  )
}
