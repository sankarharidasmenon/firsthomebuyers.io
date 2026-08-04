'use client'

import { useEffect, useState } from 'react'

/**
 * Bridges the web app to the native iOS Capacitor shell. Every call in here
 * is a no-op on the web: `Capacitor.isNativePlatform()` is false in any
 * normal browser, so this component renders nothing and does nothing outside
 * the native WebView. Desktop/web behaviour is unaffected by design.
 *
 * Lives in the production Next.js app (not the native `mobile/www` shell)
 * because `capacitor.config.ts` sets `server.url` — the real, deployed page
 * IS what the WebView loads, so this is the only place native lifecycle
 * hooks (splash screen, status bar, keyboard, connectivity) can run.
 */
export function CapacitorBridge() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Handles from each plugin's addListener(), released on unmount.
    const cleanups: Array<() => void> = []

    async function init() {
      const { Capacitor } = await import('@capacitor/core')
      if (!Capacitor.isNativePlatform() || cancelled) return

      document.documentElement.classList.add('capacitor-ios')

      const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }, { Network }] = await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/keyboard'),
        import('@capacitor/network'),
      ])
      if (cancelled) return

      // Dark icons/text on the light lemon brand background (see the note
      // in capacitor.config.ts on why this is Style.Light, not Style.Dark).
      StatusBar.setStyle({ style: Style.Light }).catch(() => {})

      // The native splash stays up (launchAutoHide: false in
      // capacitor.config.ts) until this point — i.e. until the production
      // page has actually mounted in the WebView — rather than hiding after
      // a guessed timeout.
      requestAnimationFrame(() => {
        SplashScreen.hide().catch(() => {})
      })

      const keyboardShow = Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('capacitor-keyboard-open')
      })
      const keyboardHide = Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('capacitor-keyboard-open')
      })
      cleanups.push(() => {
        keyboardShow.then((h) => h.remove())
        keyboardHide.then((h) => h.remove())
      })

      const status = await Network.getStatus()
      if (!cancelled) setOffline(!status.connected)
      const networkListener = Network.addListener('networkStatusChange', (s) => {
        setOffline(!s.connected)
      })
      cleanups.push(() => {
        networkListener.then((h) => h.remove())
      })
    }

    init()

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
      document.documentElement.classList.remove('capacitor-ios')
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top)',
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#111111',
        color: '#FFFFFF',
        textAlign: 'center',
        padding: '8px 16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 500,
      }}
    >
      You&apos;re offline — check your connection
    </div>
  )
}
