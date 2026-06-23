'use client'

import { useState, useEffect } from 'react'
import { getProgress, hasExpiredSession, type ProgressData } from '@/lib/localStorage'

export interface FormSessionState {
  hasSession: boolean
  isExpired: boolean
  progress: ProgressData | null
  isLoaded: boolean
}

export function useFormSession(): FormSessionState {
  const [state, setState] = useState<FormSessionState>({
    hasSession: false,
    isExpired: false,
    progress: null,
    isLoaded: false,
  })

  useEffect(() => {
    const expired = hasExpiredSession()
    const progress = getProgress()

    setState({
      hasSession: progress !== null,
      isExpired: expired,
      progress,
      isLoaded: true,
    })
  }, [])

  return state
}
