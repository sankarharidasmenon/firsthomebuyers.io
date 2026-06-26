'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function QuickAccessCards() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 gap-3 pt-5 pb-3">
      {/* Card 1 — Government Schemes (PRIMARY) */}
      <button
        type="button"
        onClick={() => router.push('/onboarding?flow=grants')}
        className="card-lift flex flex-col gap-2.5 p-5 rounded-[14px] cursor-pointer text-left"
        style={{
          background: 'var(--background)',
          border: '1.5px solid var(--border)',
          borderTop: '3px solid var(--brand-yellow)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          minHeight: 140,
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🏛️</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--foreground)',
            lineHeight: 1.3,
          }}>
            Government Schemes
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            marginTop: 3,
            lineHeight: 1.4,
          }}>
            See grants you qualify for
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <span style={{
            background: 'var(--brand-dark-surface)',
            color: 'var(--brand-yellow)',
            fontSize: '0.625rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            borderRadius: 9999,
            padding: '3px 9px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'inline-block',
          }}>
            Most Popular
          </span>
        </div>
      </button>

      {/* Card 2 — Borrowing Capacity */}
      <button
        type="button"
        onClick={() => router.push('/onboarding?flow=borrowing')}
        className="card-lift flex flex-col gap-2.5 p-5 rounded-[14px] cursor-pointer text-left"
        style={{
          background: 'var(--background)',
          border: '1.5px solid var(--border)',
          borderTop: '3px solid var(--muted-foreground)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
          minHeight: 140,
        }}
      >
        <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>💰</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--foreground)',
            lineHeight: 1.3,
          }}>
            Borrowing Capacity
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '0.8125rem',
            color: 'var(--muted-foreground)',
            marginTop: 3,
            lineHeight: 1.4,
          }}>
            See how much you can borrow
          </p>
        </div>
      </button>
    </div>
  )
}
