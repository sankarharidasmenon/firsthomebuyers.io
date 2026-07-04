'use client'

import { Sparkles } from 'lucide-react';
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
        .fn-hiw { background: #FDF8F0; }
        .dark .fn-hiw { background: var(--background); }

        /* ── Eyebrow ── */
        .fn-hiw-eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .fn-hiw-eyebrow span {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 0.6875rem;
          letter-spacing: 0.16em;
          color: #C9A227;
        }
        .dark .fn-hiw-eyebrow span { color: var(--brand-gold); }
        .fn-hiw-eyebrow i {
          display: block;
          width: 28px;
          height: 1px;
          background: #C9A227;
          opacity: 0.5;
        }

        /* ── Section heading — editorial, tight tracking ── */
        .fn-hiw-heading {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 800;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          line-height: 1.12;
          letter-spacing: -0.02em;
          color: var(--foreground);
          text-align: center;
        }
        .fn-hiw-heading em {
          font-style: italic;
          color: #C9A227;
        }
        .dark .fn-hiw-heading em { color: var(--brand-gold); }
        @media (min-width: 1024px) {
          .fn-hiw-heading {
            font-family: var(--font-serif), Georgia, serif;
            font-size: 44px;
            font-weight: 700;
            line-height: 1.08;
            letter-spacing: -0.02em;
          }
        }

        .fn-hiw-subtitle {
          font-family: Inter, sans-serif;
          font-weight: 400;
          font-size: 1rem;
          color: var(--muted-foreground);
          max-width: 540px;
          line-height: 1.6;
          text-align: center;
          margin-left: auto;
          margin-right: auto;
        }
        @media (min-width: 1024px) {
          .fn-hiw-subtitle { font-size: 17px; max-width: 640px; }
        }

        /* ── Card stack ── */
        .fn-hiw-list {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 920px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Premium floating card ── */
        .fn-hiw-card {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 44px 1fr;
          align-items: center;
          column-gap: 20px;
          padding: 20px 24px;
          min-height: 110px;
          border-radius: 28px;
          background: #FFFFFF;
          border: 1px solid #F1E4C4;
          box-shadow:
            0 1px 2px rgba(76,60,20,0.03),
            0 10px 26px rgba(201,162,39,0.05);
          transition:
            transform 300ms cubic-bezier(0.22,1,0.36,1),
            box-shadow 300ms ease-out,
            border-color 300ms ease-out;
        }
        @media (min-width: 1024px) {
          .fn-hiw-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: 1fr;
            gap: 20px;
            max-width: 1120px;
          }
          /* extremely subtle warm glow behind the grid — only adds warmth */
          .fn-hiw-list::before {
            content: '';
            position: absolute;
            inset: -70px 0;
            background: radial-gradient(ellipse at center, rgba(245,230,66,0.09) 0%, rgba(245,230,66,0) 80%);
            z-index: 0;
            pointer-events: none;
          }
          .dark .fn-hiw-list::before { display: none; }
          .fn-hiw-card {
            display: block;
            position: relative;
            padding: 20px 28px;
            min-height: 150px;
            border-radius: 28px;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.9),
              0 1px 2px rgba(76,60,20,0.03),
              0 12px 30px rgba(201,162,39,0.06);
            transition:
              transform 250ms cubic-bezier(0.22,1,0.36,1),
              box-shadow 250ms cubic-bezier(0.22,1,0.36,1),
              border-color 250ms ease-out;
          }
          .fn-hiw-list .fn-hiw-card:hover {
            transform: translateY(-4px) scale(1.01);
            border-color: #E6C84D;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.9),
              0 6px 16px rgba(201,162,39,0.12),
              0 26px 56px rgba(201,162,39,0.18),
              0 0 0 5px rgba(245,230,66,0.08);
          }
          .fn-hiw-list .fn-hiw-card:hover .fn-hiw-num {
            box-shadow: inset 0 1px 2px rgba(201,162,39,0.14), 0 0 0 4px rgba(245,230,66,0.16);
          }
          .fn-hiw-content { padding-right: 92px; }
        }
        .dark .fn-hiw-card {
          background: var(--card);
          border-color: rgba(245,230,66,0.30);
          box-shadow: 0 10px 26px rgba(0,0,0,0.25), 0 0 0 4px rgba(245,230,66,0.06);
        }

        /* dotted connector — only in the gap between number markers */
        .fn-hiw-card:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 46px;
          top: 100%;
          height: 12px;
          border-left: 2px dotted #E3CE8E;
          z-index: 0;
        }
        @media (min-width: 1024px) {
          .fn-hiw-card:not(:last-child)::after { display: none; }
        }
        .dark .fn-hiw-card:not(:last-child)::after { border-left-color: var(--border); }

        /* Hover — luxurious lift */
        .fn-hiw-card:hover {
          transform: translateY(-3px);
          border-color: #ECD35C;
          box-shadow:
            0 4px 12px rgba(201,162,39,0.10),
            0 22px 48px rgba(201,162,39,0.16),
            0 0 0 4px rgba(245,230,66,0.10);
        }
        .dark .fn-hiw-card:hover {
          border-color: rgba(245,230,66,0.30);
          box-shadow: 0 22px 48px rgba(0,0,0,0.4), 0 0 0 4px rgba(245,230,66,0.06);
        }

        /* ── Number marker ── */
        .fn-hiw-num {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 500;
          font-size: 1.25rem;
          line-height: 1;
          background: #FFFDF7;
          border: 1px solid #E7D6A6;
          color: #2F4A3D;
          transition: border-color 300ms ease-out, box-shadow 300ms ease-out, color 300ms ease-out;
        }
        @media (min-width: 1024px) {
          .fn-hiw-num {
            width: 42px;
            height: 42px;
            font-size: 1.2rem;
            margin-bottom: 10px;
            background: #FDF6E1;
            border-color: #E9D07E;
            box-shadow: inset 0 1px 2px rgba(201,162,39,0.14);
          }
          .dark .fn-hiw-num { background: var(--card); border-color: #E6C84D; box-shadow: 0 0 0 4px rgba(245,230,66,0.14); }
        }
        .dark .fn-hiw-num { background: var(--card); border-color: #E6C84D; color: var(--foreground); box-shadow: 0 0 0 4px rgba(245,230,66,0.14); }
        .fn-hiw-card:hover .fn-hiw-num {
          border-color: #E6C84D;
          box-shadow: 0 0 0 4px rgba(245,230,66,0.14);
        }

        /* ── Content ── */
        .fn-hiw-content { min-width: 0; }
        .fn-hiw-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 600;
          font-size: 1.0625rem;
          line-height: 1.35;
          color: var(--foreground);
          margin-bottom: 5px;
        }
        @media (min-width: 1024px) {
          .fn-hiw-title {
            font-family: var(--font-serif), Georgia, serif;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.25;
            margin-bottom: 8px;
          }
        }
        .fn-hiw-desc {
          font-family: Inter, sans-serif;
          font-weight: 400;
          font-size: 0.9375rem;
          color: var(--muted-foreground);
          line-height: 1.55;
          max-width: 540px;
        }
        @media (min-width: 1024px) {
          .fn-hiw-desc { font-size: 15px; line-height: 1.45; }
        }

        /* ── Illustration — the visual focal point ── */
        .fn-hiw-art {
          display: none;
        }
        @media (min-width: 1024px) {
          .fn-hiw-art {
            position: absolute;
            top: 50px;
            right: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            border-radius: 20px;
            overflow: hidden;
            background: linear-gradient(155deg, #FFFEFA 0%, #FBF2D8 100%);
            border: 1px solid #EFDCA0;
            color: #2F4A3D;
            box-shadow:
              inset 0 1px 1px rgba(255,255,255,0.75),
              inset 0 -2px 5px rgba(201,162,39,0.10),
              0 6px 16px rgba(201,162,39,0.14);
            transition: transform 250ms cubic-bezier(0.22,1,0.36,1), box-shadow 250ms ease-out, border-color 250ms ease-out;
          }
          .fn-hiw-art::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 44px;
            height: 44px;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            background: radial-gradient(circle, rgba(245,230,66,0.22) 0%, rgba(245,230,66,0) 70%);
          }
          .fn-hiw-art svg { position: relative; z-index: 1; }
          .dark .fn-hiw-art {
            background: var(--card);
            border-color: var(--border);
            color: var(--foreground);
          }
          .fn-hiw-card:hover .fn-hiw-art {
            transform: scale(1.03);
            border-color: #ECD35C;
            box-shadow:
              inset 0 1px 1px rgba(255,255,255,0.75),
              0 12px 30px rgba(201,162,39,0.22);
          }
          .fn-hiw-art .fn-hiw-sparkle {
            position: absolute;
            z-index: 1;
            color: #D9BE6F;
            opacity: 0.7;
          }
        }
      `}</style>

      <div className="mx-auto" style={{ maxWidth: 1360 }}>
        {/* ── Eyebrow + heading ── */}
        <div className="flex w-fit mx-auto items-center justify-center gap-2 bg-fn-yellow-light text-fn-navy text-xs font-bold px-4 py-1.5 rounded-full mb-2 mt-3 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          How it works
        </div>
        <h2 className="fn-hiw-heading mb-3 lg:mb-3">
          Four steps to <em>your</em> first home
        </h2>
        <p className="fn-hiw-subtitle mb-6 lg:mb-5">
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
