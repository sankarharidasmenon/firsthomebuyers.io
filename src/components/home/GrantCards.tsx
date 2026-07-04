import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

type Scheme = {
  name: string
  abbr: string
  value: string
  unit: string
  desc: string
  pill: string
  pillStyle: string
  cardBg: string
  dark: boolean
}

const schemes: Scheme[] = [
  {
    name: 'First Home Owner Grant',
    abbr: 'FHOG',
    value: '$10,000',
    unit: 'cash grant',
    desc: 'New builds and eligible first-home buyers across most Australian states.',
    pill: 'Widely Eligible',
    pillStyle: 'bg-fn-success-light text-fn-success',
    cardBg: 'bg-gradient-to-br from-[#FBF5E6] to-[#F4ECD6]',
    dark: false,
  },
  {
    name: 'Home Guarantee Scheme',
    abbr: 'HGS',
    value: '5%',
    unit: 'minimum deposit',
    desc: 'Buy with a lower deposit and avoid costly Lenders Mortgage Insurance.',
    pill: 'Income Tested',
    pillStyle: 'bg-white/15 text-white/90 border border-white/20',
    cardBg: 'bg-gradient-to-br from-[#1C3829] to-[#122318]',
    dark: true,
  },
  {
    name: 'First Home Super Saver',
    abbr: 'FHSS',
    value: '$50,000',
    unit: 'from super',
    desc: 'Withdraw eligible super contributions to boost your deposit savings.',
    pill: 'Tax Effective',
    pillStyle: 'bg-fn-info-light text-fn-info',
    cardBg: 'bg-gradient-to-br from-[#EEF0F5] to-[#E4E7F0]',
    dark: false,
  },
  {
    name: 'NSW Buyer Assistance',
    abbr: 'NSW',
    value: '$0',
    unit: 'stamp duty',
    desc: 'Full stamp duty exemption for eligible first-home buyers in New South Wales.',
    pill: 'NSW Only',
    pillStyle: 'bg-white/15 text-white/90 border border-white/20',
    cardBg: 'bg-gradient-to-br from-[#1B2B3A] to-[#0F1E2C]',
    dark: true,
  },
  {
    name: 'Help to Buy',
    abbr: 'HTB',
    value: '40%',
    unit: 'shared equity',
    desc: 'Government co-buys a share of your home, reducing your loan and repayments.',
    pill: 'Income Tested',
    pillStyle: 'bg-fn-warning-light text-fn-warning',
    cardBg: 'bg-gradient-to-br from-[#EAEDE8] to-[#DDE3DA]',
    dark: false,
  },
  {
    name: 'Regional Buyer Support',
    abbr: 'RBS',
    value: 'State-based',
    unit: 'bonus support',
    desc: 'Extra government support available for buyers in selected regional areas.',
    pill: 'Regional Areas',
    pillStyle: 'bg-white/15 text-white/90 border border-white/20',
    cardBg: 'bg-gradient-to-br from-[#1E3530] to-[#132420]',
    dark: true,
  },
]

/* Single scheme card — markup, content and colours are unchanged from the
   original grid. `outer` only controls sizing/spacing for its context. */
function SchemeCard({
  s,
  outer,
  clone = false,
}: {
  s: Scheme
  outer: string
  clone?: boolean
}): ReactNode {
  return (
    <div
      aria-hidden={clone || undefined}
      className={`${s.cardBg} rounded-3xl border ${s.dark ? 'border-white/10' : 'border-gray-100'} shadow-sm p-7 flex flex-col gap-4 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 cursor-default ${outer}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-fn-yellow">{s.abbr}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.pillStyle}`}>{s.pill}</span>
      </div>
      <div>
        <p className={`text-4xl font-extrabold leading-none ${s.dark ? 'text-white' : 'text-fn-navy'}`}>{s.value}</p>
        <p className={`text-xs mt-1.5 font-medium uppercase tracking-wide ${s.dark ? 'text-white/50' : 'text-gray-400'}`}>{s.unit}</p>
      </div>
      <div className="flex-1">
        <h3 className={`font-bold text-base mb-1.5 ${s.dark ? 'text-white' : 'text-fn-navy'}`}>{s.name}</h3>
        <p className={`text-sm leading-relaxed ${s.dark ? 'text-white/60' : 'text-gray-500'}`}>{s.desc}</p>
      </div>
    </div>
  )
}

export const GrantCards = () => {
  return (
    <section id="schemes" className="bg-background pt-2 pb-12 lg:pt-4 lg:pb-16 scroll-mt-24 overflow-x-hidden">
      {/* ── Heading ── */}
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-fn-yellow-light text-fn-navy text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          Grants & Schemes
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Government schemes, simplified by AI
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          See how FirstNest AI explains grants, guarantees, and buyer support programs in plain English.
        </p>
      </div>

      {/* ── Mobile + Tablet: native horizontal scroll with snap ── */}
      <div
        className="lg:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 py-4 scroll-pl-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {schemes.map((s) => (
          <SchemeCard
            key={s.name}
            s={s}
            outer="snap-start shrink-0 w-[78%] sm:w-[55%] md:w-[42%]"
          />
        ))}
      </div>

      {/* ── Desktop: pure-CSS continuous marquee (single row, never wraps) ── */}
      <div className="hidden lg:block fn-marquee-viewport relative w-full overflow-hidden py-6">
        <div className="fn-marquee-track flex w-max">
          {schemes.map((s) => (
            <SchemeCard key={`a-${s.name}`} s={s} outer="fn-marquee-card shrink-0 w-[320px] mr-6" />
          ))}
          {schemes.map((s) => (
            <SchemeCard key={`b-${s.name}`} s={s} outer="fn-marquee-card shrink-0 w-[320px] mr-6" clone />
          ))}
        </div>
      </div>

      <style>{`
        /* Continuous, seamless marquee.
           Each card carries an identical right margin (incl. the last), so a set
           has width = n·(cardWidth + gap). The track holds two identical sets, so
           translateX(-50%) shifts by exactly one set and the loop is invisible. */
        .fn-marquee-track {
          animation: fn-marquee-scroll 42s linear infinite;
          will-change: transform;
        }
        @keyframes fn-marquee-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        /* Pause on hover — only on true hover (pointer) devices; resumes from
           the same position because animation state is preserved. */
        @media (hover: hover) {
          .fn-marquee-viewport:hover .fn-marquee-track {
            animation-play-state: paused;
          }
        }
        /* Soft edge fade so cards ease in/out at the section borders. */
        .fn-marquee-viewport {
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
        }
        /* Reduced motion: stop the marquee and allow manual horizontal scroll. */
        @media (prefers-reduced-motion: reduce) {
          .fn-marquee-track { animation: none; }
          .fn-marquee-viewport {
            overflow-x: auto;
            -webkit-mask-image: none;
                    mask-image: none;
          }
        }
      `}</style>
    </section>
  )
}
