import type { ReactNode } from 'react'

/* Icon set + links for the floating social widget.
 *
 * These mirror the icons rendered in the site footer (src/components/layout/Footer.tsx),
 * which keeps its own private copies of the same paths. The footer is intentionally
 * left untouched, so the two are duplicated for now — update both together, or have
 * the footer import from here once it is safe to edit.
 */

const FACEBOOK_PATH = 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'
const LINKEDIN_PATH = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
const YOUTUBE_PATH = 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z'

function FillIcon({ path }: { path: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export interface SocialLink {
  label: string
  href: string
  /** Chip fill. Network brand colours are literal — they are fixed marks, not theme colours. */
  background: string
  /** Glyph colour. */
  foreground: string
  icon: ReactNode
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Facebook', href: '#', background: '#1877F2', foreground: '#FFFFFF', icon: <FillIcon path={FACEBOOK_PATH} /> },
  { label: 'YouTube', href: '#', background: '#FF0000', foreground: '#FFFFFF', icon: <FillIcon path={YOUTUBE_PATH} /> },
  /* X's mark inverts with the theme: near-black chip on light (as in the footer),
     light chip on dark — a pure #000 chip would vanish against the dark surface. */
  { label: 'X (Twitter)', href: '#', background: 'var(--foreground)', foreground: 'var(--background)', icon: <FillIcon path={X_PATH} /> },
  { label: 'LinkedIn', href: '#', background: '#0A66C2', foreground: '#FFFFFF', icon: <FillIcon path={LINKEDIN_PATH} /> },
  { label: 'Email us', href: 'mailto:hello@firstnest.com.au', background: 'var(--primary)', foreground: 'var(--primary-foreground)', icon: <MailIcon /> },
]
