'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { FeedbackButton } from './FeedbackButton'

/**
 * The modal (and everything it pulls in — Radix Dialog, form state, validation)
 * is only fetched the first time someone actually opens it, so the launcher
 * costs almost nothing on first load.
 */
const FeedbackModal = dynamic(
  () => import('./FeedbackModal').then((mod) => mod.FeedbackModal),
  { ssr: false }
)

/** Routes that get no launcher: the admin console has its own tooling. */
const HIDDEN_PREFIXES = ['/admin']

export function FeedbackWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  /* Once opened, keep the modal mounted so its exit animation can play and a
     second open is instant. Before that it is never rendered at all. */
  const [mounted, setMounted] = useState(false)

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null
  }

  return (
    <>
      <FeedbackButton
        expanded={open}
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
      />
      {mounted && <FeedbackModal open={open} onOpenChange={setOpen} />}
    </>
  )
}
