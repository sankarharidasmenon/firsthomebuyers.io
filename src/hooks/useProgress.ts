'use client'

import { useState, useCallback } from 'react'
import { setProgress, clearProgress, type Flow } from '@/lib/localStorage'

export interface ProgressState {
  currentStep: number
  completedSteps: number[]
  flow: Flow
}

export function useProgress(initialFlow: Flow = 'grants') {
  const [state, setState] = useState<ProgressState>({
    currentStep: 1,
    completedSteps: [],
    flow: initialFlow,
  })

  const goToStep = useCallback((step: number) => {
    setState(prev => {
      const next = { ...prev, currentStep: step }
      setProgress(next)
      return next
    })
  }, [])

  const completeStep = useCallback((step: number) => {
    setState(prev => {
      const completedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step]
      const next = { ...prev, completedSteps, currentStep: step + 1 }
      setProgress(next)
      return next
    })
  }, [])

  const setFlow = useCallback((flow: Flow) => {
    setState(prev => {
      const next = { ...prev, flow }
      setProgress(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    clearProgress()
    setState({ currentStep: 1, completedSteps: [], flow: initialFlow })
  }, [initialFlow])

  return { ...state, goToStep, completeStep, setFlow, reset }
}
