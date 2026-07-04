import Link from 'next/link'
import {
  Search,
  LineChart,
  PiggyBank,
  Route,
  Sparkles,
  Building2,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Feature = {
  title: string
  desc: string
  cta: string
  href: string
  icon: LucideIcon
}

const FEATURES: Feature[] = [
  {
    title: 'Grant & Scheme Finder',
    desc: 'Discover every federal and state scheme you may qualify for, based on your situation.',
    cta: 'Check eligibility',
    href: '/onboarding?flow=grants',
    icon: Search,
  },
  {
    title: 'Borrowing Power Estimator',
    desc: 'Estimate your borrowing capacity using your income, savings and lending rules.',
    cta: 'Estimate now',
    href: '/onboarding?flow=borrowing',
    icon: LineChart,
  },
  {
    title: 'Deposit Planner',
    desc: 'Visualise your deposit goal with grants, savings and realistic timelines.',
    cta: 'Plan your deposit',
    href: '/onboarding?flow=borrowing',
    icon: PiggyBank,
  },
  {
    title: 'Personalised Roadmap',
    desc: 'Receive a tailored step-by-step buying plan from eligibility through settlement.',
    cta: 'View your roadmap',
    href: '/next-steps',
    icon: Route,
  },
  {
    title: 'FirstNest AI Guidance',
    desc: 'Ask questions in plain English and get personalised explanations for grants and buying decisions.',
    cta: 'Ask FirstNest',
    href: '/onboarding',
    icon: Sparkles,
  },
  {
    title: 'Property Insights',
    desc: 'Understand suburbs, affordability, incentives and buying costs before making decisions.',
    cta: 'Explore insights',
    href: '/onboarding',
    icon: Building2,
  },
]

export function FeaturesSection() {
  return (
    <section className="fn-feat">
      
      <style>{`
        /* ── Section shell — light, compact, premium ── */
        .fn-feat {
          position: relative;
          background: #FFFFFF;
          padding: 32px 20px 48px;
        }
        .dark .fn-feat { background: var(--background); }
        @media (min-width: 640px) {
          .fn-feat { padding: 40px 24px 64px; }
        }
        @media (min-width: 1024px) {
          .fn-feat { padding: 56px 24px 88px; }
        }

        .fn-feat-inner {
          position: relative;
          z-index: 1;
          max-width: 1120px;
          margin-left: auto;
          margin-right: auto;
        }

        /* extremely subtle warm radial glow behind the heading */
        .fn-feat-glow {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 640px;
          max-width: 90%;
          height: 320px;
          background: radial-gradient(ellipse at center, rgba(245,230,66,0.10) 0%, rgba(245,230,66,0) 72%);
          pointer-events: none;
          z-index: 0;
        }
        .dark .fn-feat-glow { display: none; }

        /* ── Eyebrow ── */
        .fn-feat-eyebrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .fn-feat-eyebrow span {
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 0.6875rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C9A227;
        }
        .dark .fn-feat-eyebrow span { color: var(--brand-gold); }
        .fn-feat-eyebrow i {
          display: block;
          width: 28px;
          height: 1px;
          background: #C9A227;
          opacity: 0.5;
        }

        /* ── Heading — editorial serif ── */
        .fn-feat-heading {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 800;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          line-height: 1.12;
          letter-spacing: -0.02em;
          color: var(--foreground);
          text-align: center;
        }
        .fn-feat-heading em {
          font-style: italic;
          color: #C9A227;
        }
        .dark .fn-feat-heading em { color: var(--brand-gold); }
        @media (min-width: 1024px) {
          .fn-feat-heading {
            font-family: var(--font-serif), Georgia, serif;
            font-size: 44px;
            font-weight: 700;
            line-height: 1.08;
          }
        }

        .fn-feat-sub {
          font-family: Inter, sans-serif;
          font-weight: 400;
          font-size: 1rem;
          line-height: 1.6;
          color: var(--muted-foreground);
          text-align: center;
          max-width: 560px;
          margin: 14px auto 0;
        }
        @media (min-width: 1024px) {
          .fn-feat-sub { font-size: 17px; max-width: 620px; }
        }

        /* ── Grid: 1 / 2 / 3 columns, equal heights ── */
        .fn-feat-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 40px;
        }
        @media (min-width: 640px) {
          .fn-feat-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (min-width: 1024px) {
          .fn-feat-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        }

        /* ── Card ── */
        .fn-feat-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 26px 24px 22px;
          border-radius: 24px;
          background: var(--card);
          border: 1px solid #E4DFD2;
          box-shadow:
            0 1px 2px rgba(17,17,17,0.03),
            0 8px 24px rgba(17,17,17,0.05);
          text-decoration: none;
          transition:
            transform 180ms ease-out,
            box-shadow 180ms ease-out,
            border-color 180ms ease-out;
        }
        .dark .fn-feat-card {
          border-color: var(--border);
          box-shadow: 0 8px 24px rgba(0,0,0,0.24);
        }

        .fn-feat-card:hover {
          transform: translateY(-4px);
          border-color: #D6CFBB;
          box-shadow:
            0 4px 12px rgba(17,17,17,0.05),
            0 18px 40px rgba(17,17,17,0.08);
        }
        .dark .fn-feat-card:hover {
          border-color: var(--primary);
          box-shadow: 0 18px 40px rgba(0,0,0,0.34);
        }

        /* ── Icon container — cream, subtle gradient, green icon ── */
        .fn-feat-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(155deg, #FFFEFA 0%, #FBF3D9 100%);
          border: 1px solid #EFDCA0;
          color: var(--color-green-text);
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.7),
            0 4px 12px rgba(201,162,39,0.10);
          margin-bottom: 18px;
          transition: background 180ms ease-out, border-color 180ms ease-out, box-shadow 180ms ease-out;
        }
        .dark .fn-feat-icon {
          background: var(--accent);
          border-color: var(--border);
          box-shadow: none;
        }
        .fn-feat-card:hover .fn-feat-icon {
          background: linear-gradient(155deg, #FFFEF6 0%, #FBEFC5 100%);
          border-color: #E9D07E;
        }

        /* ── Text ── */
        .fn-feat-title {
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 600;
          font-size: 1.25rem;
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: var(--foreground);
          margin-bottom: 8px;
        }
        .fn-feat-desc {
          font-family: Inter, sans-serif;
          font-weight: 400;
          font-size: 0.9375rem;
          line-height: 1.55;
          color: var(--muted-foreground);
        }

        /* ── CTA link — pinned to bottom for equal alignment ── */
        .fn-feat-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 20px;
          font-family: Inter, sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-green-text);
        }
        .fn-feat-cta svg {
          transition: transform 180ms ease-out;
        }
        .fn-feat-card:hover .fn-feat-cta svg {
          transform: translateX(4px);
        }
        .fn-feat-spacer { flex: 1 1 auto; }
      `}</style>
      <div className="fn-feat-glow" aria-hidden="true" />

      <div className="fn-feat-inner">
        <div className="flex w-fit mx-auto items-center justify-center gap-2 bg-fn-yellow-light text-fn-navy text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          Features
        </div>

        <h2 className="fn-feat-heading">
          Everything you need for your <em>first home journey</em>
        </h2>

        <p className="fn-feat-sub">
          Discover grants, estimate your borrowing power, plan your deposit and understand
          government schemes — everything to buy your first home with confidence.
        </p>

        <div className="fn-feat-grid">
          {FEATURES.map(({ title, desc, cta, href, icon: Icon }) => (
            <Link key={title} href={href} className="fn-feat-card">
              <span className="fn-feat-icon">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className="fn-feat-title">{title}</h3>
              <p className="fn-feat-desc">{desc}</p>
              <span className="fn-feat-spacer" />
              <span className="fn-feat-cta">
                {cta}
                <ArrowRight size={16} strokeWidth={2} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
