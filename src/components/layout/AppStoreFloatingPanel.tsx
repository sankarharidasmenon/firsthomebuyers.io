'use client'

const AU_GREEN = '#111111'
const AU_GOLD  = '#F5E642'
const AU_DARK  = '#111111'

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 512 512" width="16" height="16" aria-hidden="true">
      <path fill="#4CAF50" d="M35.6 34.1l235.1 235L35.6 477.9c-8.9-8.8-13.6-21.2-13.6-34.1V68.2c0-12.9 4.7-25.3 13.6-34.1z" />
      <path fill="#FFC107" d="M35.6 34.1l321.4 185.6L270.7 269l-235.1-235z" />
      <path fill="#F44336" d="M35.6 477.9l235.1-235 86.3 49.3L35.6 477.9z" />
      <path fill="#2196F3" d="M357 219.7l115.1 66.5c17.5 10.1 17.5 35.5 0 45.6L357 398.2l-86.3-49.3L357 219.7z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

const STORES = [
  { label: 'Google Play', sublabel: 'Get it on',       href: '#', icon: <GooglePlayIcon /> },
  { label: 'App Store',   sublabel: 'Download on the', href: '#', icon: <AppleIcon /> },
]

export function AppStoreFloatingPanel() {
  return (
    <>
      <style>{`
        .fn-asp-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 8px 6px 6px;
          background: ${AU_GREEN};
          color: #ffffff;
          border-radius: 8px;
          text-decoration: none;
          transition: background 180ms ease, color 180ms ease, transform 180ms ease;
          position: relative;
          white-space: nowrap;
        }
        .fn-asp-btn:hover {
          background: ${AU_GOLD};
          color: ${AU_DARK};
          transform: translateX(-3px);
        }
        .fn-asp-btn:hover .fn-asp-sublabel { color: rgba(17,17,17,0.6); }
        .fn-asp-btn:hover .fn-asp-label    { color: ${AU_DARK}; }
        .fn-asp-tip {
          position: absolute;
          right: calc(100% + 8px);
          background: ${AU_GREEN};
          color: #ffffff;
          font-family: Inter, sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          white-space: nowrap;
          padding: 4px 10px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          transform: translateX(4px);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .fn-asp-tip::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-left-color: ${AU_GREEN};
        }
        .fn-asp-btn:hover .fn-asp-tip {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 272,
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
        aria-label="Download the FirstNest app"
      >
        {STORES.map(({ label, sublabel, href, icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="fn-asp-btn"
          >
            <span className="fn-asp-tip">{label}</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, flexShrink: 0 }}>
              {icon}
            </span>
            <span style={{ lineHeight: 1 }}>
              <span className="fn-asp-sublabel" style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '0.42rem', color: 'rgba(255,255,255,0.65)', fontWeight: 400, marginBottom: 2 }}>
                {sublabel}
              </span>
              <span className="fn-asp-label" style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '0.62rem', color: '#ffffff', fontWeight: 600, letterSpacing: '-0.01em' }}>
                {label}
              </span>
            </span>
          </a>
        ))}
      </div>
    </>
  )
}
