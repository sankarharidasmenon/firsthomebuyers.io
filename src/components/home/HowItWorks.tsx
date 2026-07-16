'use client'

import { useRouter } from 'next/navigation'

const STEPS = [
  {
    title: 'Build your financial snapshot',
    desc: "Enter your income, savings and where you're buying — we instantly map the grants and schemes that match.",
    icon: 'house',
  },
  {
    title: "See every grant you're eligible for",
    desc: 'Federal and state grants, explained in plain English with personalised eligibility checks.',
    icon: 'gift',
  },
  {
    title: 'Understand your borrowing power',
    desc: 'Get an estimated borrowing range, repayment outlook and how grants improve your position.',
    icon: 'chart',
  },
  {
    title: 'Follow your personalised roadmap',
    desc: 'Receive practical next steps and guidance to move confidently toward buying your first home.',
    icon: 'clipboard',
  },
] as const

function StepIcon({ name, size = 20 }: { name: (typeof STEPS)[number]['icon']; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'house':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
        </svg>
      )
    case 'gift':
      return (
        <svg {...common}>
          <rect x="3.5" y="9" width="17" height="11" rx="1.2" />
          <path d="M3.5 12.5h17" />
          <path d="M12 9v11" />
          <path d="M12 9C9.5 9 8 7.6 8 6.2 8 5.1 8.8 4.2 10 4.2c1.6 0 2 2 2 4.8Z" />
          <path d="M12 9c2.5 0 4-1.4 4-2.8 0-1.1-.8-2-2-2-1.6 0-2 2-2 4.8Z" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19.5h16" />
          <path d="M6 16.5l4-4.5 3.2 2.8L18.5 8" />
          <path d="M14.5 8h4v4" />
        </svg>
      )
    case 'clipboard':
      return (
        <svg {...common}>
          <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
          <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" />
          <path d="m9 13 2 2 4-4.5" />
        </svg>
      )
  }
}

export function HowItWorks() {
  const router = useRouter()

  return (
    <section className="fn-hiw px-4 py-10 lg:px-8 lg:pt-3 lg:pb-8">
      <style>{`
        .fn-hiw { background: #FFFFFF; }
        .dark .fn-hiw { background: var(--background); }

        /* ── Section label — FirstKey style ── */
        .fn-hiw-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-size: 11px; font-weight: 600; color: #C4A000;
          text-transform: uppercase; letter-spacing: 1.5px;
          margin-bottom: 14px;
        }
        .fn-hiw-label::before {
          content: ''; width: 24px; height: 2px;
          background: #D4C400; border-radius: 2px;
          display: block;
        }

        /* ── Section heading ── */
        .fn-hiw-heading {
          font-family: var(--font-display, 'Fraunces'), serif;
          font-weight: 500;
          font-size: clamp(28px, 4vw, 48px);
          line-height: 1.1;
          letter-spacing: -1px;
          color: #111111;
          text-align: center;
          max-width: 560px;
          margin-left: auto; margin-right: auto;
        }
        .fn-hiw-heading em {
          font-style: italic;
          color: #C4A000;
        }

        .fn-hiw-subtitle {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-weight: 300;
          font-size: 16px;
          color: #444444;
          max-width: 520px;
          line-height: 1.65;
          text-align: center;
          margin-left: auto; margin-right: auto;
        }

        /* ── Card list ── */
        .fn-hiw-list {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 760px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 1024px) {
          .fn-hiw-list { max-width: 1100px; }
        }

        /* ── Step item — FirstKey pattern ── */
        .fn-hiw-card {
          display: flex;
          gap: 24px;
          padding: 28px 0;
          border-bottom: 1px solid rgba(17,17,17,0.08);
          cursor: default;
          transition: all 0.2s;
          position: relative;
          z-index: 1;
        }
        .fn-hiw-card:last-child { border-bottom: none; }
        @media (min-width: 1024px) {
          .fn-hiw-card { padding: 32px 0; }
        }
        .fn-hiw-card:hover .fn-hiw-num {
          background: #F5E642;
          color: #111111;
          border-color: #F5E642;
        }

        /* ── Number marker — sage circle ── */
        .fn-hiw-num {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 1.5px solid #D4C400;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display, 'Fraunces'), serif;
          font-size: 18px; font-weight: 700; color: #C4A000;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .dark .fn-hiw-num { border-color: #F5E642; color: #F5E642; }

        /* ── Content ── */
        .fn-hiw-content { min-width: 0; padding-top: 2px; }
        .fn-hiw-title {
          font-family: var(--font-display, 'Fraunces'), serif;
          font-weight: 500;
          font-size: 19px;
          color: #111111;
          margin-bottom: 6px;
          line-height: 1.25;
        }
        .dark .fn-hiw-title { color: var(--foreground); }

        .fn-hiw-desc {
          font-family: var(--font-sans, 'DM Sans'), sans-serif;
          font-weight: 300;
          font-size: 14.5px;
          color: #444444;
          line-height: 1.65;
          max-width: 540px;
        }
        .dark .fn-hiw-desc { color: var(--muted-foreground); }

        /* ── Art icon (desktop) ── */
        .fn-hiw-art { display: none; }
        @media (min-width: 1024px) {
          .fn-hiw-art {
            display: flex; align-items: center; justify-content: center;
            width: 52px; height: 52px;
            border-radius: 14px;
            background: #FBF6A8;
            border: 1px solid rgba(212,196,0,0.4);
            color: #111111;
            flex-shrink: 0;
            margin-top: 2px;
            transition: background 0.2s;
          }
          .fn-hiw-card:hover .fn-hiw-art { background: #F5E642; color: #111111; }
        }
      `}</style>

      <div className="mx-auto" style={{ maxWidth: 1100 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="fn-hiw-label">How it works</span>
        </div>
        <h2 className="fn-hiw-heading mb-3">
          Four steps to <em>your</em> first home
        </h2>
        <p className="fn-hiw-subtitle mb-8 lg:mb-10">
          A clear, personalised roadmap from today to owning your first home.
        </p>

        {/* ── Cards ── */}
        <div className="fn-hiw-list">
          {STEPS.map((step, i) => (
            <div className="fn-hiw-card" key={step.title}>
              <div className="fn-hiw-num">{i + 1}</div>
              <div className="fn-hiw-content">
                <h3 className="fn-hiw-title">{step.title}</h3>
                <p className="fn-hiw-desc">{step.desc}</p>
              </div>
              <div className="fn-hiw-art">
                <StepIcon name={step.icon} size={28} />
                <svg className="fn-hiw-sparkle" style={{ top: 12, right: 14, width: 9, height: 9 }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2 10 10 2-10 2-2 10-2-10L0 12l10-2z" /></svg>
                <svg className="fn-hiw-sparkle" style={{ bottom: 12, left: 14, width: 7, height: 7 }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2 10 10 2-10 2-2 10-2-10L0 12l10-2z" /></svg>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        {/* <div className="mt-8 lg:mt-5" style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => router.push('/onboarding?flow=grants')}
            className="hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(245,230,66,0.55)] transition-all duration-150"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, var(--brand-gradient-start) 0%, var(--brand-gradient-end) 100%)',
              color: 'var(--brand-dark-surface)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '0.9375rem',
              letterSpacing: '0.01em',
              border: 'none',
              borderRadius: 9999,
              padding: '18px 32px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,230,66,0.40)',
            }}
          >
            Start My Personalised Plan →
          </button>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              color: 'var(--muted-foreground)',
              marginTop: 10,
            }}
          >
            ✓ Free &nbsp;·&nbsp; ✓ Takes around 3 minutes &nbsp;·&nbsp; ✓ No credit check
          </p>
        </div> */}
      </div>
    </section>
  )
}
