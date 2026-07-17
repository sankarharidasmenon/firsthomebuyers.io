'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Share2, X } from 'lucide-react'
import { SOCIAL_LINKS } from './socialLinks'

const STORAGE_KEY = 'firstnest_social_widget_pos'

const LAUNCHER = 56
const EDGE_MARGIN = 16
/** Drag distance (px) past which a pointer gesture counts as a drag, not a tap. */
const DRAG_THRESHOLD = 5
/** BottomNav is 68px tall and only mounts below lg — keep clear of it. */
const BOTTOM_NAV_RESERVE = 80
const NAVBAR_MOBILE = 56
const NAVBAR_DESKTOP = 72
const DESKTOP_BREAKPOINT = 1024

interface Pos {
  x: number
  y: number
}

/** Keeps the launcher fully on screen and out of the navbar / bottom nav bands. */
function clampToViewport(pos: Pos): Pos {
  const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT
  const minX = EDGE_MARGIN
  const maxX = window.innerWidth - LAUNCHER - EDGE_MARGIN
  const minY = (isDesktop ? NAVBAR_DESKTOP : NAVBAR_MOBILE) + EDGE_MARGIN
  const maxY =
    window.innerHeight - LAUNCHER - EDGE_MARGIN - (isDesktop ? 0 : BOTTOM_NAV_RESERVE)

  return {
    x: Math.min(Math.max(pos.x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(pos.y, minY), Math.max(minY, maxY)),
  }
}

function defaultPos(): Pos {
  return clampToViewport({
    x: window.innerWidth - LAUNCHER - EDGE_MARGIN,
    y: window.innerHeight * 0.55 - LAUNCHER / 2,
  })
}

function readStoredPos(): Pos | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed
  } catch {}
  return null
}

export function FloatingSocialWidget() {
  const pathname = usePathname()

  /* null until mounted: the position depends on viewport size and sessionStorage,
     so nothing is rendered server-side and there is no hydration mismatch. */
  const [pos, setPos] = useState<Pos | null>(null)
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [expandUp, setExpandUp] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const posRef = useRef<Pos | null>(null)
  const dragRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)
  /* A drag ends with a synthetic click; swallow it so the panel doesn't toggle. */
  const suppressClickRef = useRef(false)

  useEffect(() => {
    posRef.current = pos
  }, [pos])

  const applyPos = useCallback((next: Pos) => {
    const clamped = clampToViewport(next)
    setPos(clamped)
    setExpandUp(clamped.y + LAUNCHER / 2 > window.innerHeight / 2)
  }, [])

  // Mount: restore this session's position, else fall back to the default anchor.
  useEffect(() => {
    applyPos(readStoredPos() ?? defaultPos())
  }, [applyPos])

  // Keep the launcher on screen across resize / orientation changes.
  useEffect(() => {
    const onResize = () => {
      if (posRef.current) applyPos(posRef.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [applyPos])

  // Collapse on navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Collapse on outside pointer / Escape.
  useEffect(() => {
    if (!open) return

    const onDocPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        launcherRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onDocPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!posRef.current) return
    launcherRef.current?.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - posRef.current.x,
      offsetY: e.clientY - posRef.current.y,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    if (!drag.moved) {
      const travelled = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY)
      if (travelled < DRAG_THRESHOLD) return
      drag.moved = true
      setDragging(true)
      setOpen(false)
    }

    applyPos({ x: e.clientX - drag.offsetX, y: e.clientY - drag.offsetY })
  }

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null

    if (launcherRef.current?.hasPointerCapture(e.pointerId)) {
      launcherRef.current.releasePointerCapture(e.pointerId)
    }

    if (drag.moved) {
      suppressClickRef.current = true
      setDragging(false)
      if (posRef.current) {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current))
        } catch {}
      }
    }
  }

  /* Toggling lives on click (not pointerup) so Enter/Space work identically. */
  const onClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setOpen(o => !o)
  }

  if (!pos) return null

  return (
    <div
      ref={containerRef}
      className="fixed select-none"
      style={{ left: pos.x, top: pos.y, width: LAUNCHER, height: LAUNCHER, zIndex: 40 }}
    >
      {/* Panel — anchored to whichever side has room */}
      <div
        className="absolute left-0 flex w-full justify-center"
        style={
          expandUp
            ? { bottom: '100%', paddingBottom: 12 }
            : { top: '100%', paddingTop: 12 }
        }
      >
        <div
          id="fn-social-panel"
          role="group"
          aria-label="FirstNest social media links"
          className="flex flex-col items-center gap-2 rounded-full border p-2"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-raised)',
            visibility: open ? 'visible' : 'hidden',
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1) translateY(0)' : `scale(0.95) translateY(${expandUp ? 6 : -6}px)`,
            transformOrigin: expandUp ? 'bottom center' : 'top center',
            transition: 'opacity 200ms ease, transform 200ms ease, visibility 200ms',
          }}
        >
          {SOCIAL_LINKS.map(({ label, href, background, foreground, icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              aria-label={label}
              tabIndex={open ? 0 : -1}
              className="flex h-11 w-11 items-center justify-center rounded-full no-underline transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background, color: foreground }}
            >
              {icon}
            </a>
          ))}
        </div>
      </div>

      {/* Launcher */}
      <button
        ref={launcherRef}
        type="button"
        aria-label={open ? 'Close social media links' : 'Open social media links'}
        aria-expanded={open}
        aria-controls="fn-social-panel"
        aria-haspopup="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onClick}
        className="relative flex items-center justify-center rounded-full border-0"
        style={{
          width: LAUNCHER,
          height: LAUNCHER,
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          boxShadow: 'var(--shadow-raised)',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
          transform: dragging ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform 200ms ease',
        }}
      >
        {/* Cross-faded glyphs so the swap doesn't pop */}
        <Share2
          size={22}
          strokeWidth={2}
          aria-hidden="true"
          className="absolute"
          style={{
            opacity: open ? 0 : 1,
            transform: open ? 'scale(0.8) rotate(-45deg)' : 'scale(1) rotate(0deg)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        />
        <X
          size={22}
          strokeWidth={2}
          aria-hidden="true"
          className="absolute"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(45deg)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        />
      </button>
    </div>
  )
}
