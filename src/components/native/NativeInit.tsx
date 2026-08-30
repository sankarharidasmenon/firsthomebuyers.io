'use client'

import { useEffect } from 'react'
import { initCapacitor } from '@/lib/native/initCapacitor'

export function NativeInit() {
  useEffect(() => {
    initCapacitor()
  }, [])

  return null
}
