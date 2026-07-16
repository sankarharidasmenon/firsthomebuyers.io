'use client'

import { Mail } from 'lucide-react'

const AU_GREEN  = '#111111'
const AU_GOLD   = '#F5E642'
const AU_DARK   = '#111111'

function SvgIcon({ path }: { path: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const LINKEDIN_PATH = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
const X_PATH    = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
const FACEBOOK_PATH = 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'

type Item =
  | { type: 'svg';    path: string;           label: string; href: string }
  | { type: 'lucide'; icon: React.ElementType; label: string; href: string }

const ITEMS: Item[] = [
  { type: 'svg',    path: LINKEDIN_PATH, label: 'LinkedIn', href: '#' },
  { type: 'svg',    path: X_PATH,        label: 'X',        href: '#' },
  { type: 'svg',    path: FACEBOOK_PATH, label: 'Facebook', href: '#' },
  { type: 'lucide', icon: Mail,          label: 'Email',    href: 'mailto:hello@firstnest.com.au' },
]

export function SocialFloatingPanel() {
  return (
    <>
      <style>{`
        .fn-sfp-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: ${AU_GREEN};
          color: #ffffff;
          border-radius: 8px;
          text-decoration: none;
          transition: background 180ms ease, color 180ms ease, transform 180ms ease;
          position: relative;
        }
        .fn-sfp-btn:hover {
          background: ${AU_GOLD};
          color: ${AU_DARK};
          transform: translateX(-3px);
        }
        .fn-sfp-tip {
          position: absolute;
          right: calc(100% + 8px);
          background: ${AU_GREEN};
          color: #ffffff;
          font-family: Inter, sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          padding: 4px 10px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          transform: translateX(4px);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .fn-sfp-tip::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-left-color: ${AU_GREEN};
        }
        .fn-sfp-btn:hover .fn-sfp-tip {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 96,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '6px 0 6px 6px',
          background: 'rgba(245,230,66,0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '10px 0 0 10px',
          border: `1px solid ${AU_GOLD}`,
          borderRight: 'none',
          boxShadow: '-4px 4px 20px rgba(0,0,0,0.12)',
        }}
        aria-label="Follow FirstNest on social media"
      >
        {ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.href.startsWith('mailto') ? undefined : '_blank'}
            rel={item.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
            aria-label={item.label}
            className="fn-sfp-btn"
          >
            <span className="fn-sfp-tip">{item.label}</span>
            {item.type === 'lucide'
              ? <item.icon size={15} />
              : <SvgIcon path={item.path} />}
          </a>
        ))}
      </div>
    </>
  )
}
