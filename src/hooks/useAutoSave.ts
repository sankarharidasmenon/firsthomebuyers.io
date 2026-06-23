'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => void,
  delay = 300
): { showIndicator: boolean } {
  const [showIndicator, setShowIndicator] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef<T>(data)
  const isFirstRender = useRef(true)

  useEffect(() => {
    dataRef.current = data
  })

  const triggerSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

    timerRef.current = setTimeout(() => {
      saveFn(dataRef.current)
      setShowIndicator(true)
      hideTimerRef.current = setTimeout(() => {
        setShowIndicator(false)
      }, 2500)
    }, delay)
  }, [saveFn, delay])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    triggerSave()
  }, [data, triggerSave])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  return { showIndicator }
}
