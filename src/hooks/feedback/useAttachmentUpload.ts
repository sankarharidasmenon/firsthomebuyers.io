'use client'

/**
 * Reusable feedback-attachment hook.
 *
 * Selecting a file is a purely local, in-memory operation: the File object
 * sits in React state and nothing is sent anywhere. Presigning and uploading
 * only happen when the caller explicitly runs `uploadAll()` — which the
 * feedback modal does exactly once, after form validation, when the user
 * presses Send Feedback. That ordering is the whole point: an attachment
 * that's merely "selected" has never touched S3, so removing it, closing the
 * modal, or navigating away all just discard the File — nothing to clean up.
 *
 * Once `uploadAll()` has actually put bytes in the bucket, three more paths
 * exist where an uploaded-but-never-submitted object could be orphaned, and
 * each is handled explicitly: removing a card that already finished
 * uploading, the modal closing (`reset()`), and the tab being closed/
 * refreshed/navigated away from (`pagehide`). All three call the same
 * fire-and-forget `cleanupKeys` helper against /api/uploads/delete. A fourth
 * path — the upload batch succeeds but the subsequent /api/feedback insert
 * fails — is the caller's responsibility via `cleanupUploaded()`, since only
 * the caller knows the insert failed.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ATTACHMENT_ERROR_MESSAGES,
  MAX_ATTACHMENTS,
  isAllowedAttachmentFile,
  isValidAttachmentSize,
  type FeedbackAttachment,
} from '@/lib/feedback/attachments'

export type AttachmentStatus = 'selected' | 'requesting-url' | 'uploading' | 'uploaded' | 'error'

export interface AttachmentEntry {
  id: string
  file: File
  fileName: string
  size: number
  status: AttachmentStatus
  /** 0-100. Only meaningful while status === 'uploading'. */
  progress: number
  key: string | null
  error: string | null
}

interface PresignResponse {
  uploadUrl: string
  key: string
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Fire-and-forget delete of S3 objects that will never be referenced by a
 * feedback row. Prefers `sendBeacon` (survives the page unloading, which is
 * exactly when this matters most) and falls back to a `keepalive` fetch.
 */
function cleanupKeys(keys: string[]): void {
  if (keys.length === 0) return
  const payload = JSON.stringify({ keys })

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' })
    if (navigator.sendBeacon('/api/uploads/delete', blob)) return
  }

  fetch('/api/uploads/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Best-effort — a failed cleanup call leaves an orphaned S3 object, not a
    // broken submission, so there's nothing to surface to the user here.
  })
}

export function useAttachmentUpload() {
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  // Live XHRs, keyed by entry id, so a remove/reset can abort an in-flight upload.
  const xhrs = useRef<Map<string, XMLHttpRequest>>(new Map())
  // Mirrors `attachments` for the unload handler and the submit-time batch
  // upload, both of which need the LATEST list without forcing every
  // callback that touches them to be re-created on every keystroke-of-state.
  // Written from an effect, never during render (a ref write mid-render is
  // unsafe under concurrent rendering).
  const attachmentsRef = useRef<AttachmentEntry[]>([])
  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  const patch = useCallback((id: string, changes: Partial<AttachmentEntry>) => {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)))
  }, [])

  // Covers the tab being closed, refreshed, or navigated away from while an
  // upload has already succeeded but the form was never submitted.
  useEffect(() => {
    const handleUnload = () => {
      const orphaned = attachmentsRef.current
        .filter((a) => a.status === 'uploaded' && a.key)
        .map((a) => a.key as string)
      cleanupKeys(orphaned)
    }
    window.addEventListener('pagehide', handleUnload)
    return () => window.removeEventListener('pagehide', handleUnload)
  }, [])

  /** Presign + PUT one file. Never called on selection — only from uploadAll/retryUpload. */
  const uploadOne = useCallback(async (id: string, file: File): Promise<FeedbackAttachment | null> => {
    patch(id, { status: 'requesting-url', progress: 0, error: null })

    let presigned: PresignResponse
    try {
      const res = await fetch('/api/uploads/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.uploadUrl || !body?.key) {
        throw new Error(body?.error || 'Could not prepare the upload.')
      }
      presigned = body as PresignResponse
    } catch (err) {
      patch(id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed.' })
      return null
    }

    patch(id, { status: 'uploading', progress: 0 })

    const succeeded = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhrs.current.set(id, xhr)

      xhr.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable) return
        patch(id, { progress: Math.round((event.loaded / event.total) * 100) })
      })

      xhr.addEventListener('load', () => {
        xhrs.current.delete(id)
        resolve(xhr.status >= 200 && xhr.status < 300)
      })

      const onFailure = () => {
        xhrs.current.delete(id)
        resolve(false)
      }
      xhr.addEventListener('error', onFailure)
      xhr.addEventListener('abort', onFailure)

      xhr.open('PUT', presigned.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    if (!succeeded) {
      patch(id, { status: 'error', error: 'Upload failed. Please retry.' })
      return null
    }

    patch(id, { status: 'uploaded', progress: 100, key: presigned.key, error: null })
    return { key: presigned.key, fileName: file.name, size: file.size }
  }, [patch])

  /**
   * Selection only — validates and stores File objects in state. No network
   * call of any kind happens here; that's the fix for the orphan-file bug.
   */
  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files)
    if (incoming.length === 0) return

    setValidationError(null)

    const room = MAX_ATTACHMENTS - attachments.length
    if (room <= 0) {
      setValidationError(ATTACHMENT_ERROR_MESSAGES.tooMany)
      return
    }

    const accepted: AttachmentEntry[] = []
    let rejected: string | null = null

    for (const file of incoming) {
      if (accepted.length >= room) {
        rejected = ATTACHMENT_ERROR_MESSAGES.tooMany
        break
      }
      if (!isAllowedAttachmentFile(file.type, file.name)) {
        rejected = ATTACHMENT_ERROR_MESSAGES.badType
        continue
      }
      if (!isValidAttachmentSize(file.size)) {
        rejected = ATTACHMENT_ERROR_MESSAGES.tooLarge
        continue
      }
      accepted.push({
        id: newId(),
        file,
        fileName: file.name,
        size: file.size,
        status: 'selected',
        progress: 0,
        key: null,
        error: null,
      })
    }

    if (rejected) setValidationError(rejected)
    if (accepted.length === 0) return

    setAttachments((prev) => [...prev, ...accepted])
  }, [attachments.length])

  const removeAttachment = useCallback((id: string) => {
    const entry = attachments.find((a) => a.id === id)
    xhrs.current.get(id)?.abort()
    xhrs.current.delete(id)
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    // Already in S3 but about to be un-selected — it will never be submitted,
    // so delete it now instead of waiting for the modal-close/unload sweep.
    if (entry?.status === 'uploaded' && entry.key) cleanupKeys([entry.key])
  }, [attachments])

  /** Manual per-card retry — re-attempts just this one file, independent of a form submit. */
  const retryUpload = useCallback((id: string) => {
    const entry = attachments.find((a) => a.id === id)
    if (entry) void uploadOne(entry.id, entry.file)
  }, [attachments, uploadOne])

  const reset = useCallback(() => {
    for (const xhr of xhrs.current.values()) xhr.abort()
    xhrs.current.clear()
    const orphaned = attachmentsRef.current
      .filter((a) => a.status === 'uploaded' && a.key)
      .map((a) => a.key as string)
    cleanupKeys(orphaned)
    setAttachments([])
    setValidationError(null)
  }, [])

  /**
   * Step 2+3 of the submit flow: presign + upload every not-yet-uploaded
   * attachment concurrently (Promise.allSettled — one failure doesn't cancel
   * the others). Entries already 'uploaded' from an earlier attempt (e.g. 2
   * of 3 succeeded, the user fixed the third and hit Send again) are left
   * alone rather than re-uploaded.
   */
  const uploadAll = useCallback(async (): Promise<{ ok: boolean; attachments: FeedbackAttachment[] }> => {
    const current = attachmentsRef.current
    const alreadyUploaded = current
      .filter((a): a is AttachmentEntry & { key: string } => a.status === 'uploaded' && a.key !== null)
      .map((a) => ({ key: a.key, fileName: a.fileName, size: a.size }))
    const pending = current.filter((a) => a.status !== 'uploaded')

    if (pending.length === 0) return { ok: true, attachments: alreadyUploaded }

    const results = await Promise.allSettled(pending.map((entry) => uploadOne(entry.id, entry.file)))

    const uploaded: FeedbackAttachment[] = [...alreadyUploaded]
    let anyFailed = false
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) uploaded.push(result.value)
      else anyFailed = true
    }

    return { ok: !anyFailed, attachments: uploaded }
  }, [uploadOne])

  /**
   * Step 6: the upload batch succeeded but the caller's subsequent write
   * (the /api/feedback insert) failed. Deletes the now-orphaned objects and
   * resets those entries back to 'selected' (clearing their key) so the next
   * Send Feedback attempt uploads fresh objects rather than referencing keys
   * that no longer exist.
   */
  const cleanupUploaded = useCallback((keys: string[]) => {
    cleanupKeys(keys)
    setAttachments((prev) =>
      prev.map((a) => (a.key && keys.includes(a.key) ? { ...a, status: 'selected', key: null, progress: 0, error: null } : a))
    )
  }, [])

  const isUploading = attachments.some((a) => a.status === 'uploading' || a.status === 'requesting-url')
  const hasErrors = attachments.some((a) => a.status === 'error')

  return {
    attachments,
    validationError,
    addFiles,
    removeAttachment,
    retryUpload,
    reset,
    uploadAll,
    cleanupUploaded,
    isUploading,
    hasErrors,
  }
}

export type UseAttachmentUpload = ReturnType<typeof useAttachmentUpload>
