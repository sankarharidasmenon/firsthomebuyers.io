'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FeedbackTypeSelector } from './FeedbackTypeSelector'
import { AttachmentUploader } from './AttachmentUploader'
import { useAttachmentUpload } from '@/hooks/feedback/useAttachmentUpload'
import {
  MESSAGE_MAX_LENGTH,
  validateFeedback,
} from '@/lib/feedback/validation'
import type {
  FeedbackApiResponse,
  FeedbackFieldErrors,
  FeedbackType,
} from '@/lib/feedback/types'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Check,
  CircleAlert,
  Loader2,
  Mail,
  MessageSquareText,
  Send,
  Sparkles,
  X,
} from 'lucide-react'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Status = 'idle' | 'submitting' | 'success'

/** Tallest the message box grows to before it starts scrolling internally. */
const TEXTAREA_MAX_HEIGHT = 140
/** How long the success panel stays up before the modal closes itself. */
const AUTO_CLOSE_MS = 2600
/** Delay before wiping state on close, so the exit animation isn't disturbed. */
const RESET_DELAY_MS = 250

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { resolvedTheme } = useTheme()

  const [feedbackType, setFeedbackType] = useState<FeedbackType | ''>('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<FeedbackFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const attachmentUpload = useAttachmentUpload()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const typeGroupRef = useRef<HTMLDivElement>(null)

  const submitting = status === 'submitting'

  /* ── Message box grows with its content, then scrolls ── */
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`
  }, [])

  useEffect(() => {
    if (open && status === 'idle') autoResize()
  }, [open, status, autoResize])

  /* ── Success auto-closes; the user can also close it by hand ── */
  useEffect(() => {
    if (status !== 'success') return
    const timer = window.setTimeout(() => onOpenChange(false), AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [status, onOpenChange])

  /* ── Fresh form every time it reopens ── */
  useEffect(() => {
    if (open) return
    const timer = window.setTimeout(() => {
      setFeedbackType('')
      setMessage('')
      setEmail('')
      setHoneypot('')
      setErrors({})
      setFormError(null)
      setStatus('idle')
      attachmentUpload.reset()
    }, RESET_DELAY_MS)
    return () => window.clearTimeout(timer)
    // attachmentUpload's actions are stable (useCallback with fixed deps); only `open` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const clearError = useCallback((field: keyof FeedbackFieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validateFeedback({ feedbackType, message, email })
    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      // Send focus to the first thing that needs attention.
      if (nextErrors.feedbackType) {
        typeGroupRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
      } else if (nextErrors.message) {
        textareaRef.current?.focus()
      } else {
        emailRef.current?.focus()
      }
      return
    }

    // A lone per-card retry can still be in flight even though the form
    // itself isn't submitting yet — don't start a second, overlapping upload
    // attempt for the same file.
    if (attachmentUpload.isUploading) return

    setStatus('submitting')

    // Step 2+3 — nothing has touched S3 before this point. Attachments were
    // only ever File objects sitting in the uploader's state; the presign +
    // upload happens now, for the first time, concurrently.
    const uploadResult = await attachmentUpload.uploadAll()

    if (!uploadResult.ok) {
      // Step 4 — leave whatever succeeded as 'uploaded' (so a retry doesn't
      // re-upload it) and whatever failed as 'error' with its retry button
      // live. Nothing is submitted.
      const errorMessage = 'One or more attachments failed to upload. Retry or remove them, then send again.'
      setFormError(errorMessage)
      toast.error(errorMessage)
      setStatus('idle')
      return
    }

    try {
      // Step 5 — every attachment is now actually in S3; submit their keys.
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType,
          message,
          email,
          website: honeypot,
          attachments: uploadResult.attachments,
          // Auto-captured context — never shown as editable fields.
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          theme: resolvedTheme === 'dark' ? 'dark' : 'light',
          submittedAt: new Date().toISOString(),
        }),
      })

      const result = (await response.json().catch(() => null)) as FeedbackApiResponse | null

      if (!response.ok || !result?.ok) {
        // Step 6 — the upload succeeded but the row never got written.
        // Delete what was just uploaded so it doesn't outlive the failed
        // submission, and reset those cards so retrying re-uploads fresh keys.
        attachmentUpload.cleanupUploaded(uploadResult.attachments.map((a) => a.key))
        const errorMessage =
          (result && !result.ok && result.error) ||
          'We could not send your feedback. Please try again.'
        if (result && !result.ok && result.fieldErrors) setErrors(result.fieldErrors)
        setFormError(errorMessage)
        toast.error(errorMessage)
        setStatus('idle')
        return
      }

      setStatus('success')
    } catch {
      attachmentUpload.cleanupUploaded(uploadResult.attachments.map((a) => a.key))
      const errorMessage = 'Network error — please check your connection and try again.'
      setFormError(errorMessage)
      toast.error(errorMessage)
      setStatus('idle')
    }
  }

  const counterTone =
    message.length > MESSAGE_MAX_LENGTH * 0.9 ? 'text-warning-foreground' : 'text-muted-foreground'

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // Never yank the dialog away mid-request.
        if (!submitting) onOpenChange(value)
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-sm"
        onEscapeKeyDown={(event) => {
          if (submitting) event.preventDefault()
        }}
        onPointerDownOutside={(event) => {
          if (submitting) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (submitting) event.preventDefault()
        }}
        className="flex flex-col gap-0 p-0 w-full sm:max-w-[520px] max-h-[min(94dvh,780px)] overflow-hidden rounded-[24px] bg-card ring-0 border border-border shadow-[var(--shadow-modal)]"
        /* Radix/tw-animate enter animation: fade + scale 0.96 → 1 */
        style={{ '--tw-enter-scale': 0.96 } as React.CSSProperties}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center gap-2.5 border-b border-border/70 px-4 py-2 pr-12">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-primary-hover dark:text-primary">
            <MessageSquareText size={20} strokeWidth={1.75} aria-hidden="true" />
            <Sparkles
              size={10}
              strokeWidth={2}
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 opacity-80"
            />
          </div>

          <div>
            <DialogTitle className="font-body text-[1.125rem] font-extrabold leading-tight text-foreground">
              Share Your Feedback
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
              Help us improve FirstNest by sharing bugs, ideas or suggestions.
            </DialogDescription>
          </div>

          <DialogClose
            aria-label="Close feedback"
            disabled={submitting}
            className="absolute top-1/2 right-3 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            <X size={18} strokeWidth={2} />
          </DialogClose>
        </div>

        {status === 'success' ? (
          <SuccessPanel onClose={() => onOpenChange(false)} />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-col">
            <div className="flex min-h-0 flex-col gap-2 overflow-y-auto px-4 py-2.5">
              {/* ── Feedback type ── */}
              <div className="flex flex-col gap-1.5" ref={typeGroupRef}>
                <span className="text-[0.875rem] font-semibold text-foreground">
                  What&apos;s this about? <span className="text-destructive">*</span>
                </span>
                <FeedbackTypeSelector
                  value={feedbackType}
                  onChange={(value) => {
                    setFeedbackType(value)
                    clearError('feedbackType')
                  }}
                  disabled={submitting}
                  invalid={Boolean(errors.feedbackType)}
                  errorId="fn-feedback-type-error"
                />
                {errors.feedbackType && (
                  <FieldError id="fn-feedback-type-error">{errors.feedbackType}</FieldError>
                )}
              </div>

              {/* ── Message ── */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fn-feedback-message"
                  className="text-[0.875rem] font-semibold text-foreground"
                >
                  Message <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="fn-feedback-message"
                  ref={textareaRef}
                  value={message}
                  maxLength={MESSAGE_MAX_LENGTH}
                  disabled={submitting}
                  placeholder="Describe your feedback in detail..."
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? 'fn-feedback-message-error fn-feedback-counter' : 'fn-feedback-counter'
                  }
                  onChange={(event) => {
                    setMessage(event.target.value)
                    clearError('message')
                    autoResize()
                  }}
                  className={[
                    'min-h-24 resize-none rounded-xl border-[1.5px] bg-background px-3.5 py-2.5 text-[0.875rem]',
                    'shadow-none transition-colors placeholder:text-muted-foreground/70',
                    'focus-visible:ring-3 focus-visible:ring-primary/25 focus-visible:border-primary',
                    errors.message
                      ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
                      : 'border-input',
                  ].join(' ')}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {errors.message && (
                      <FieldError id="fn-feedback-message-error">{errors.message}</FieldError>
                    )}
                  </div>
                  <span
                    id="fn-feedback-counter"
                    aria-live="polite"
                    className={`shrink-0 text-[0.75rem] font-medium tabular-nums ${counterTone}`}
                  >
                    {message.length} / {MESSAGE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* ── Email (optional) ── */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fn-feedback-email"
                  className="text-[0.875rem] font-semibold text-foreground"
                >
                  Email Address{' '}
                  <span className="font-normal text-muted-foreground">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70">
                    <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <Input
                    id="fn-feedback-email"
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    disabled={submitting}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'fn-feedback-email-error' : undefined}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      clearError('email')
                    }}
                    className={[
                      'h-11 rounded-xl border-[1.5px] bg-background pl-9 text-[0.875rem]',
                      'shadow-none transition-colors placeholder:text-muted-foreground/70',
                      'focus-visible:ring-3 focus-visible:ring-primary/25 focus-visible:border-primary',
                      errors.email
                        ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20'
                        : 'border-input',
                    ].join(' ')}
                  />
                </div>
                {errors.email ? (
                  <FieldError id="fn-feedback-email-error">{errors.email}</FieldError>
                ) : (
                  <p className="text-[0.75rem] text-muted-foreground">
                    Only if you&apos;d like a reply.
                  </p>
                )}
              </div>

              {/* ── Attachments (optional) ── */}
              <AttachmentUploader
                attachments={attachmentUpload.attachments}
                validationError={attachmentUpload.validationError}
                onFilesSelected={attachmentUpload.addFiles}
                onRemove={attachmentUpload.removeAttachment}
                onRetry={attachmentUpload.retryUpload}
                disabled={submitting}
              />

              {/* Honeypot — hidden from people, irresistible to bots. */}
              <div aria-hidden="true" className="hidden">
                <label htmlFor="fn-feedback-website">Website</label>
                <input
                  id="fn-feedback-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-[0.8125rem] text-destructive"
                >
                  <CircleAlert size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-col gap-1.5 border-t border-border/70 px-4 py-2.5">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={submitting || attachmentUpload.isUploading}
                aria-busy={submitting}
              >
                {attachmentUpload.isUploading ? (
                  // Checked before `submitting`: during a submit, uploadAll() runs
                  // first and both flags are true together — this is the phase
                  // that should read "uploading", not "sending". It also covers a
                  // standalone per-card retry outside of a submit.
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" strokeWidth={2} aria-hidden="true" />
                    Uploading attachments…
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" strokeWidth={2} aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Feedback
                    <Send size={16} className="ml-2" strokeWidth={2} aria-hidden="true" />
                  </>
                )}
              </Button>
              <p className="text-center text-[0.75rem] leading-snug text-muted-foreground">
                We attach your current page and device details to help us debug.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="text-[0.8125rem] font-medium text-destructive">
      {children}
    </p>
  )
}

function SuccessPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Halo pulses outward once, the disc pops in behind the tick */}
        <span className="absolute inset-0 animate-ping rounded-full bg-success/25 [animation-iteration-count:2]" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success duration-300 animate-in zoom-in-50 fade-in">
          <Check size={30} strokeWidth={2.5} aria-hidden="true" />
        </span>
      </div>

      <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
        <p className="text-[1rem] font-extrabold text-foreground">Thank you!</p>
        <p
          role="status"
          className="mt-1 max-w-[320px] text-[0.875rem] leading-snug text-muted-foreground"
        >
          Your feedback has been submitted successfully.
        </p>
      </div>

      <Button type="button" variant="secondary" size="sm" fullWidth={false} onClick={onClose}>
        Close
      </Button>
    </div>
  )
}
