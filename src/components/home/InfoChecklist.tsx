'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'

const ITEMS = [
  'Your gross annual income (salary or wages)',
  'Monthly expenses (rent, bills, subscriptions)',
  'Current savings or deposit amount',
  'The state you want to buy in',
]

export function InfoChecklist() {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!contentRef.current) return
    if (open) {
      setHeight(contentRef.current.scrollHeight)
    } else {
      setHeight(0)
    }
  }, [open])

  return (
    <div className="px-5 mt-5">
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#111111',
            textDecoration: 'underline dotted',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          ⓘ What information will I need?
        </button>
      </div>

      <div
        style={{
          maxHeight: `${height}px`,
          overflow: 'hidden',
          transition: 'max-height 300ms ease',
          marginTop: open ? 8 : 0,
        }}
      >
        <div ref={contentRef}>
          <div
            className="rounded-[8px] p-4"
            style={{ background: '#F9F9F9', border: '1px solid #EEEEEE' }}
          >
            <ul className="flex flex-col gap-2">
              {ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={14} className="text-[#22C55E] mt-0.5 shrink-0" />
                  <span
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#444444' }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p
              className="mt-3"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8125rem',
                color: '#888888',
                fontStyle: 'italic',
              }}
            >
              This is not a credit check. Your data stays on your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
