'use client'

/**
 * Drag & drop / browse uploader for feedback screenshots.
 *
 * Purely presentational — all state (validation, presign requests, upload
 * progress, retry) lives in `useAttachmentUpload`. This component only
 * renders that state and forwards user intent (files picked, remove, retry)
 * back to the caller.
 */
import React, { useCallback, useId, useRef, useState } from 'react'
import { CircleAlert, Image as ImageIcon, RotateCw, UploadCloud, X } from 'lucide-react'
import {
  ATTACHMENT_ACCEPT_STRING,
  MAX_ATTACHMENTS,
  formatFileSize,
} from '@/lib/feedback/attachments'
import type { AttachmentEntry } from '@/hooks/feedback/useAttachmentUpload'

interface AttachmentUploaderProps {
  attachments: AttachmentEntry[]
  validationError: string | null
  onFilesSelected: (files: FileList | File[]) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  disabled?: boolean
}

export function AttachmentUploader({
  attachments,
  validationError,
  onFilesSelected,
  onRemove,
  onRetry,
  disabled = false,
}: AttachmentUploaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const atLimit = attachments.length >= MAX_ATTACHMENTS
  const dropDisabled = disabled || atLimit

  const openBrowser = useCallback(() => {
    if (dropDisabled) return
    inputRef.current?.click()
  }, [dropDisabled])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragActive(false)
      if (dropDisabled) return
      if (event.dataTransfer.files?.length) onFilesSelected(event.dataTransfer.files)
    },
    [dropDisabled, onFilesSelected]
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <span className="text-[0.875rem] font-semibold text-foreground">
          Attachments <span className="font-normal text-muted-foreground">(Optional)</span>
        </span>
        <p className="text-[0.75rem] text-muted-foreground">
          Upload screenshots to help us understand the issue.
        </p>
      </div>

      <div
        role="button"
        tabIndex={dropDisabled ? -1 : 0}
        aria-disabled={dropDisabled}
        onClick={openBrowser}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openBrowser()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!dropDisabled) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={[
          'flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed px-3 py-2.5 text-center transition-colors',
          dropDisabled
            ? 'cursor-not-allowed border-input/60 opacity-60'
            : 'cursor-pointer hover:border-primary/60 hover:bg-accent',
          dragActive ? 'border-primary bg-accent' : 'border-input',
        ].join(' ')}
      >
        <UploadCloud size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-[0.8125rem] text-muted-foreground">
          {atLimit ? (
            `Maximum ${MAX_ATTACHMENTS} attachments reached`
          ) : (
            <>
              Drag &amp; drop images, or{' '}
              <span className="font-semibold text-primary-hover dark:text-primary underline underline-offset-2">
                browse
              </span>
            </>
          )}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT_STRING}
          disabled={dropDisabled}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) onFilesSelected(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {validationError && (
        <p role="alert" className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-destructive">
          <CircleAlert size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
          {validationError}
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onRemove={() => onRemove(attachment.id)}
              onRetry={() => onRetry(attachment.id)}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function AttachmentCard({
  attachment,
  onRemove,
  onRetry,
  disabled,
}: {
  attachment: AttachmentEntry
  onRemove: () => void
  onRetry: () => void
  disabled: boolean
}) {
  const { fileName, size, status, progress, error } = attachment

  return (
    <li className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-input bg-background px-3 py-2">
      <ImageIcon size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.8125rem] font-medium text-foreground">{fileName}</p>
        <div className="flex items-center gap-1.5 text-[0.75rem]">
          <span className="text-muted-foreground">{formatFileSize(size)}</span>
          <span className="text-muted-foreground/50" aria-hidden="true">
            &middot;
          </span>
          <StatusLabel status={status} progress={progress} error={error} />
        </div>
      </div>

      {status === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          disabled={disabled}
          aria-label={`Retry uploading ${fileName}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <RotateCw size={14} strokeWidth={2} />
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${fileName}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </li>
  )
}

function StatusLabel({
  status,
  progress,
  error,
}: {
  status: AttachmentEntry['status']
  progress: number
  error: string | null
}) {
  if (status === 'selected' || status === 'uploaded') {
    return <span className="font-medium text-success">&#10003; Ready</span>
  }
  if (status === 'error') {
    return <span className="font-medium text-destructive">{error || 'Upload failed'}</span>
  }
  if (status === 'uploading') {
    return <span className="text-muted-foreground">Uploading&hellip; {progress}%</span>
  }
  // 'requesting-url'
  return <span className="text-muted-foreground">Preparing&hellip;</span>
}
