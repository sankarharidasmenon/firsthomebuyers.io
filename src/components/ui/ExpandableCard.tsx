'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface ExpandableCardProps {
  children: React.ReactNode
  header: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function ExpandableCard({
  children,
  header,
  defaultOpen = false,
  className = '',
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0)

  useEffect(() => {
    if (!contentRef.current) return
    if (open) {
      const h = contentRef.current.scrollHeight
      setHeight(h)
      const t = setTimeout(() => setHeight('auto'), 200)
      return () => clearTimeout(t)
    } else {
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div
      className={[
        'bg-card rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
        className,
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex-1">{header}</div>
        <ChevronDown
          size={18}
          className="text-muted-foreground transition-transform duration-200 shrink-0 ml-2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: height === 'auto' ? 'none' : `${height}px`,
          overflow: height === 'auto' ? 'visible' : 'hidden',
          transition: 'max-height 200ms ease-in-out',
        }}
      >
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
