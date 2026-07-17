'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function FinalCTAStrip() {
  const router = useRouter()

  return (
    <section className="fn-final">
      <style>{`
        .fn-final {
          background: #111111;
          padding: 80px 20px 88px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .fn-final::before {
          content: '';
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(245,230,66,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .fn-final-inner {
          position: relative; z-index: 2;
          max-width: 600px;
          margin: 0 auto;
          display: flex; flex-direction: column; align-items: center;
        }

        .fn-final-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 11px; font-weight: 600; color: #F5E642;
          text-transform: uppercase; letter-spacing: 1.5px;
          margin-bottom: 20px;
        }

        .fn-final-heading {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-weight: 500;
          font-size: clamp(32px, 5vw, 56px);
          line-height: 1.08;
          letter-spacing: -1.5px;
          color: #FFFFFF;
          margin-bottom: 18px;
          max-width: 540px;
        }
        .fn-final-heading em {
          font-style: italic;
          color: #F5E642;
        }

        .fn-final-sub {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 15.5px; font-weight: 300;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
          max-width: 420px;
          margin: 0 auto 36px;
        }

        .fn-final-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F5E642; color: #111111;
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 15px; font-weight: 500;
          border: none; border-radius: 50px;
          padding: 16px 32px; cursor: pointer;
          transition: background 0.25s, transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
          margin-bottom: 14px;
        }
        .fn-final-btn:hover {
          background: #D4C400;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(245,230,66,0.4);
        }
        .fn-final-btn:active { transform: scale(0.98); }

        .fn-final-trust {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 12.5px; color: rgba(255,255,255,0.35);
          margin-bottom: 40px;
        }

        .fn-final-divider {
          display: flex; align-items: center; gap: 14px;
          width: 100%; max-width: 200px;
          margin-bottom: 24px;
        }
        .fn-final-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        .fn-final-divider span {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.25);
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        .fn-final-stores { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 16px; }
        .fn-store-btn {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px; padding: 12px 20px;
          cursor: pointer; transition: all 0.2s; text-decoration: none;
        }
        .fn-store-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .fn-store-btn-text small {
          display: block; font-size: 9.5px; color: rgba(255,255,255,0.5);
          font-family: var(--font-body, 'Inter'), sans-serif;
          line-height: 1; margin-bottom: 2px;
        }
        .fn-store-btn-text strong {
          display: block; font-size: 13.5px; color: white; font-weight: 600;
          font-family: var(--font-body, 'Inter'), sans-serif;
          line-height: 1;
        }

        .fn-final-note {
          font-family: var(--font-body, 'Inter'), sans-serif;
          font-size: 11.5px; color: rgba(255,255,255,0.25);
        }
      `}</style>

      <div className="fn-final-inner">
        <span className="fn-final-label">Get started free</span>

        <h2 className="fn-final-heading">
          Your first home is<br /><em>closer than you think</em>
        </h2>

        <p className="fn-final-sub">
          Check your grant eligibility in under 3 minutes. No broker, no jargon, no waiting.
        </p>

        <button type="button" className="fn-final-btn"
          onClick={() => router.push('/onboarding?flow=grants')}>
          Check my grant eligibility →
        </button>

        <p className="fn-final-trust">✓ No credit check &nbsp;·&nbsp; ✓ 100% free &nbsp;</p>

        <div className="fn-final-divider">
          <div className="fn-final-divider-line" />
          <span>OR</span>
          <div className="fn-final-divider-line" />
        </div>

        <div className="fn-final-stores">
          <button className="fn-store-btn">
            <svg viewBox="0 0 384 512" style={{ width: 20, height: 20, fill: 'white' }}>
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            <div className="fn-store-btn-text">
              <small>Download on the</small>
              <strong>App Store</strong>
            </div>
          </button>

          <button className="fn-store-btn">
            <svg viewBox="0 0 512 512" style={{ width: 20, height: 20 }}>
              <path fill="#4CAF50" d="M35.6 34.1l235.1 235L35.6 477.9c-8.9-8.8-13.6-21.2-13.6-34.1V68.2c0-12.9 4.7-25.3 13.6-34.1z" />
              <path fill="#FFC107" d="M35.6 34.1l321.4 185.6L270.7 269l-235.1-235z" />
              <path fill="#F44336" d="M35.6 477.9l235.1-235 86.3 49.3L35.6 477.9z" />
              <path fill="#2196F3" d="M357 219.7l115.1 66.5c17.5 10.1 17.5 35.5 0 45.6L357 398.2l-86.3-49.3L357 219.7z" />
            </svg>
            <div className="fn-store-btn-text">
              <small>Get it on</small>
              <strong>Google Play</strong>
            </div>
          </button>
        </div>

        <p className="fn-final-note">Free to download &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; iOS 15+ &amp; Android 10+</p>
      </div>
    </section>
  )
}
