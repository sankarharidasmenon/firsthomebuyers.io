/**
 * FirstNest Community — mock data.
 *
 * All forum content lives here so the UI can be swapped to a real API/Supabase
 * later without touching components. Shapes mirror what a `forums` table + a
 * `replies` table would return. No backend, no auth — read-only mock.
 */

export type CategoryId = 'all' | 'grants' | 'finance' | 'building' | 'suburbs' | 'success'

/** Lucide icon name keys — resolved to components in `forumIcons`. */
export type IconKey =
  | 'messages' | 'coins' | 'landmark' | 'hammer' | 'mapPin' | 'trophy'
  | 'fileCheck' | 'banknote' | 'building2' | 'handshake' | 'receipt' | 'piggyBank'
  | 'lineChart' | 'home'

export interface Category {
  id: CategoryId
  title: string
  icon: IconKey
}

export interface Author {
  name: string
  initials: string
  location: string // e.g. "Werribee, VIC"
  role?: string // e.g. "First home buyer", "Mortgage broker"
}

export interface Reply {
  id: string
  author: Author
  timeAgo: string
  body: string[] // paragraphs
  likes: number
  isAnswer?: boolean
  replies?: Reply[] // one nesting level only
}

export interface Discussion {
  id: string
  slug: string
  category: Exclude<CategoryId, 'all'>
  title: string
  preview: string
  body: string[] // paragraphs for the detail page
  bullets?: string[] // optional list rendered in the body
  links?: { label: string; href: string }[]
  author: Author
  createdAgo: string
  lastReplyAgo: string
  lastReplyBy: string
  replies: number
  views: number
  likes: number
  solved?: boolean
  pinned?: boolean
  trending?: boolean
  tags: string[]
  thread: Reply[]
}

export interface Topic {
  id: string
  icon: IconKey
  title: string
  description: string
  count: number
  lastActivity: string
}

export interface Contributor {
  name: string
  initials: string
  location: string
  helpfulAnswers: number
  badge: string
}

export const CATEGORY_META: Record<Exclude<CategoryId, 'all'>, { label: string; icon: IconKey }> = {
  grants: { label: 'Grants & Schemes', icon: 'coins' },
  finance: { label: 'Borrowing & Finance', icon: 'landmark' },
  building: { label: 'Building & Construction', icon: 'hammer' },
  suburbs: { label: 'Suburbs & Locations', icon: 'mapPin' },
  success: { label: 'Success Stories', icon: 'trophy' },
}

const BASE_CATEGORIES: Category[] = [
  { id: 'all', title: 'All Discussions', icon: 'messages' },
  { id: 'grants', title: 'Grants & Schemes', icon: 'coins' },
  { id: 'finance', title: 'Borrowing & Finance', icon: 'landmark' },
  { id: 'building', title: 'Building & Construction', icon: 'hammer' },
  { id: 'suburbs', title: 'Suburbs & Locations', icon: 'mapPin' },
  { id: 'success', title: 'Success Stories', icon: 'trophy' },
]

// ── Authors ─────────────────────────────────────────────────────────────────
const A = {
  sarah: { name: 'Sarah Chen', initials: 'SC', location: 'Werribee, VIC', role: 'First home buyer' },
  jack: { name: 'Jack Thompson', initials: 'JT', location: 'Parramatta, NSW', role: 'First home buyer' },
  priya: { name: 'Priya Nair', initials: 'PN', location: 'Brisbane, QLD', role: 'First home buyer' },
  liam: { name: "Liam O'Brien", initials: 'LO', location: 'Adelaide, SA', role: 'First home buyer' },
  mia: { name: 'Mia Nguyen', initials: 'MN', location: 'Perth, WA', role: 'First home buyer' },
  ethan: { name: 'Ethan Walker', initials: 'EW', location: 'Geelong, VIC', role: 'Recently settled' },
  olivia: { name: 'Olivia Brown', initials: 'OB', location: 'Canberra, ACT', role: 'First home buyer' },
  noah: { name: 'Noah Patel', initials: 'NP', location: 'Logan, QLD', role: 'First home buyer' },
  isla: { name: 'Isla Robinson', initials: 'IR', location: 'Newcastle, NSW', role: 'Recently settled' },
  marcus: { name: 'Marcus Lee', initials: 'ML', location: 'Melbourne, VIC', role: 'Mortgage broker' },
  aisha: { name: 'Aisha Khan', initials: 'AK', location: 'Blacktown, NSW', role: 'First home buyer' },
  grace: { name: 'Grace Kim', initials: 'GK', location: 'Sunshine Coast, QLD', role: 'First home buyer' },
  daniel: { name: 'Daniel Rossi', initials: 'DR', location: 'Frankston, VIC', role: 'Buyers advocate' },
  hannah: { name: 'Hannah Wilson', initials: 'HW', location: 'Baldivis, WA', role: 'Recently settled' },
  tom: { name: 'Tom Fitzgerald', initials: 'TF', location: 'Gold Coast, QLD', role: 'First home buyer' },
  chloe: { name: 'Chloe Martin', initials: 'CM', location: 'Ballarat, VIC', role: 'First home buyer' },
} satisfies Record<string, Author>

// ── Discussions ─────────────────────────────────────────────────────────────
export const DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    slug: 'combine-fhog-with-home-guarantee-scheme',
    category: 'grants',
    title: 'Can I combine the FHOG with the Home Guarantee Scheme?',
    preview:
      "We're buying a new build in VIC and I'm trying to work out whether the $10k First Home Owner Grant can be stacked with the 5% deposit First Home Guarantee. Has anyone actually done both together?",
    body: [
      "We're about to sign on a new townhouse in Melbourne's west (around $620k) and I'm getting conflicting answers from everyone I talk to. Our broker says the two are separate programs and we can use both, but a mate reckons the grant counts as part of your deposit and messes up the guarantee.",
      "My understanding so far: the First Home Owner Grant (FHOG) is a $10,000 one-off payment for new builds in VIC, and the First Home Guarantee lets you buy with a 5% deposit without paying LMI. They're run by completely different bodies — the state revenue office vs Housing Australia — so on paper they shouldn't clash.",
      "Has anyone here genuinely used both on the same purchase? Keen to hear how it worked at settlement and whether the grant landed before or after.",
    ],
    bullets: [
      'FHOG (VIC): $10,000 for new or substantially renovated homes',
      'First Home Guarantee: 5% deposit, no Lenders Mortgage Insurance',
      'Property must be under the relevant price cap',
    ],
    links: [
      { label: 'FirstNest grants calculator', href: '/onboarding' },
      { label: 'Government schemes overview', href: '/results/grants' },
    ],
    author: A.sarah,
    createdAgo: '6h ago',
    lastReplyAgo: '22m ago',
    lastReplyBy: 'Marcus Lee',
    replies: 34,
    views: 4120,
    likes: 96,
    pinned: true,
    trending: true,
    tags: ['FHOG', 'First Home Guarantee', 'VIC', 'New build'],
    thread: [
      {
        id: 'd1r1',
        author: A.marcus,
        timeAgo: '4h ago',
        isAnswer: true,
        likes: 61,
        body: [
          "Broker here — yes, you can absolutely use both together, and I've settled dozens of these. They're independent programs with independent eligibility, so one doesn't disqualify the other.",
          "A couple of practical notes from experience:",
          "The grant is usually paid at settlement when you buy through an approved lender, or shortly after if you apply directly. The guarantee just means the government guarantees the portion of your loan above your 5% deposit so you skip LMI — it doesn't touch the grant at all.",
          "The one thing to watch is the price cap for the guarantee in your area. Get your lender to confirm the current cap for your postcode before you sign, because they do change.",
        ],
        replies: [
          {
            id: 'd1r1a',
            author: A.sarah,
            timeAgo: '3h ago',
            likes: 12,
            body: [
              "This is exactly what I needed, thank you Marcus. Our place is $620k and the cap for our area is well above that, so we should be fine. Did your clients get the grant applied straight off the loan or as a separate payment?",
            ],
          },
          {
            id: 'd1r1b',
            author: A.marcus,
            timeAgo: '2h ago',
            likes: 9,
            body: [
              "Most had it credited at settlement via the lender — one less thing to chase. Just make sure the FHOG application form is lodged with your lender a few weeks before your settlement date so it's processed in time.",
            ],
          },
        ],
      },
      {
        id: 'd1r2',
        author: A.ethan,
        timeAgo: '3h ago',
        likes: 18,
        body: [
          "We did both last year in Geelong for a house and land package. FHOG + First Home Guarantee, no dramas at all. The grant came through about a week after settlement because we applied directly rather than through the bank.",
          "Honestly the bigger headache was getting our genuine savings evidence sorted, not the grants.",
        ],
      },
      {
        id: 'd1r3',
        author: A.olivia,
        timeAgo: '1h ago',
        likes: 5,
        body: [
          "Just flagging for anyone in the ACT reading this — the ACT doesn't have a FHOG anymore, it's the Home Buyer Concession Scheme instead. Still stackable with the guarantee though.",
        ],
      },
    ],
  },
  {
    id: 'd2',
    slug: 'bought-in-werribee-recently',
    category: 'suburbs',
    title: 'Has anyone bought in Werribee recently? Worth it?',
    preview:
      "Looking at Werribee and Tarneit for our first home under $650k. Great value on paper but I keep hearing mixed things about commute times and new estates. Locals — is it a yes?",
    body: [
      "We're a young couple priced out of the inner west and Werribee keeps coming up as the sweet spot for value. You can still get a 4-bedroom in a new estate for what a 2-bed unit costs closer in.",
      "My worries are the commute to the CBD (we both work in town 3 days a week) and whether the newer estates end up feeling a bit soulless. Would love honest takes from people who actually live there.",
    ],
    author: A.jack,
    createdAgo: '1d ago',
    lastReplyAgo: '2h ago',
    lastReplyBy: 'Chloe Martin',
    replies: 41,
    views: 5230,
    likes: 74,
    trending: true,
    tags: ['Werribee', 'VIC', 'Suburbs', 'Commute'],
    thread: [
      {
        id: 'd2r1',
        author: A.chloe,
        timeAgo: '5h ago',
        likes: 22,
        body: [
          "We moved to Werribee two years ago from Footscray and honestly have no regrets. The train from Werribee station is about 35–40 minutes to Southern Cross and runs often. If you're near the station it's very doable.",
          "The newer estates (Riverwalk, Harpley) are lovely but yes, they can feel a little new. Older Werribee has heaps of established trees and character if that's more your thing.",
        ],
      },
      {
        id: 'd2r2',
        author: A.daniel,
        timeAgo: '4h ago',
        likes: 14,
        body: [
          "Buyers advocate here — Werribee and Tarneit have been strong for first home buyers because of the value, but do your homework on the specific estate. Some have better amenity (shops, schools, parks already built) than others where you're waiting years.",
          "Tip: walk the estate on a weekday evening, not just a Saturday open. It tells you a lot.",
        ],
      },
    ],
  },
  {
    id: 'd3',
    slug: 'broker-vs-bank-which-did-you-go-with',
    category: 'finance',
    title: 'Broker vs going direct to the bank — what did you actually do?',
    preview:
      "First-timer here. Is a mortgage broker genuinely worth it or should I just walk into my own bank? Trying to understand if brokers really get you a better rate or if it's overhyped.",
    body: [
      "I bank with one of the big four and they've pre-approved me, but everyone keeps telling me to see a broker. I don't totally get the value — don't they just send you to the same banks anyway?",
      "For those who used a broker: did you feel you got a materially better deal, or was it more about them handling the paperwork? And for those who went direct — any regrets?",
    ],
    author: A.priya,
    createdAgo: '2d ago',
    lastReplyAgo: '5h ago',
    lastReplyBy: 'Marcus Lee',
    replies: 58,
    views: 7890,
    likes: 132,
    trending: true,
    tags: ['Brokers', 'Banks', 'Pre-approval'],
    thread: [
      {
        id: 'd3r1',
        author: A.marcus,
        timeAgo: '1d ago',
        isAnswer: true,
        likes: 47,
        body: [
          "I'm a broker so take this with a grain of salt, but here's the honest version. A good broker adds value in three ways: access to 30+ lenders (not just one), knowing which lenders are lenient on your specific situation (casual income, HECS, small deposit), and doing the legwork.",
          "The rate difference is real but usually modest. Where brokers earn their keep for first home buyers is policy — one bank might decline you for a tiny thing another bank doesn't care about. That's the difference between buying and not buying.",
          "If your situation is very clean (PAYE, big deposit, no debts) going direct is totally fine. If it's at all complex, a broker is worth it.",
        ],
      },
      {
        id: 'd3r2',
        author: A.hannah,
        timeAgo: '20h ago',
        likes: 19,
        body: [
          "Went with a broker in WA and so glad we did. Our income was a bit messy (I'm a contractor) and our own bank basically said no. The broker found a lender who was fine with it and we settled in Baldivis. Cost us nothing — they get paid by the lender.",
        ],
      },
      {
        id: 'd3r3',
        author: A.tom,
        timeAgo: '8h ago',
        likes: 6,
        body: [
          "Counterpoint — I went direct with my bank and it was smooth. But I had a 20% deposit and a boring PAYE job, so I was an easy yes. Horses for courses.",
        ],
      },
    ],
  },
  {
    id: 'd4',
    slug: 'best-suburbs-under-700k-melbourne',
    category: 'suburbs',
    title: 'Best suburbs under $700k within ~45 min of Melbourne CBD?',
    preview:
      "Budget is $700k for a house (not unit). Want somewhere with a train line, decent schools and a bit of a community feel. Where are people finding value right now?",
    body: [
      "We've been to about 20 opens and everything nice is $800k+. Trying to find that pocket that hasn't fully blown up yet but still has good transport and amenity.",
      "Not fussed about a brand new house — happy with an older 3-bedroom we can slowly do up. Where would you look?",
    ],
    author: A.chloe,
    createdAgo: '2d ago',
    lastReplyAgo: '7h ago',
    lastReplyBy: 'Daniel Rossi',
    replies: 37,
    views: 6100,
    likes: 88,
    tags: ['Melbourne', 'VIC', 'Under $700k', 'Suburbs'],
    thread: [
      {
        id: 'd4r1',
        author: A.daniel,
        timeAgo: '1d ago',
        likes: 25,
        body: [
          "For a house under $700k with a train line, look at Melton South, Deer Park, St Albans, Frankston North, and parts of Broadmeadows/Craigieburn. Each has trade-offs but all have upside.",
          "St Albans in particular has good bones — established, on the line, and gentrifying. Frankston is a longer commute but the beach lifestyle is a genuine drawcard.",
        ],
      },
      {
        id: 'd4r2',
        author: A.ethan,
        timeAgo: '10h ago',
        likes: 8,
        body: [
          "We landed in Geelong instead of chasing Melbourne fringe suburbs and love it. Slightly further out but the lifestyle and value were unbeatable, and the VLine gets you in.",
        ],
      },
    ],
  },
  {
    id: 'd5',
    slug: 'unexpected-settlement-costs',
    category: 'finance',
    title: 'Unexpected settlement costs — what caught you out?',
    preview:
      "Budgeted for stamp duty and the deposit but got blindsided by a bunch of smaller costs at settlement. What should first-timers actually set aside beyond the obvious?",
    body: [
      "We settled last month and while it went fine, the little costs added up more than I expected. I'd budgeted deposit + stamp duty and thought I was sorted.",
      "Sharing what got us so others can plan for it — and keen to hear what caught others out.",
    ],
    bullets: [
      'Conveyancing / legal fees (~$1,200–$2,000)',
      'Building & pest inspection (~$500)',
      'Loan application / settlement fees',
      'Council & water rate adjustments',
      'Moving costs and immediate repairs',
    ],
    author: A.isla,
    createdAgo: '1mo ago',
    lastReplyAgo: '1d ago',
    lastReplyBy: 'Aisha Khan',
    replies: 46,
    views: 8300,
    likes: 154,
    solved: true,
    tags: ['Settlement', 'Costs', 'Conveyancing'],
    thread: [
      {
        id: 'd5r1',
        author: A.aisha,
        timeAgo: '1d ago',
        isAnswer: true,
        likes: 33,
        body: [
          "The rate adjustments got us too. The previous owner had paid council and water rates in advance, so at settlement we had to reimburse them their portion. Only a few hundred dollars but a total surprise.",
          "My rule now: on top of stamp duty, keep at least $5k aside for 'everything else'. You rarely use all of it but you'll be glad it's there.",
        ],
      },
      {
        id: 'd5r2',
        author: A.marcus,
        timeAgo: '18h ago',
        likes: 15,
        body: [
          "Good thread. Also don't forget the first council/water/strata bills that arrive right after you move in, plus connecting utilities. First-home buyers often forget these because renting bundled a lot of it.",
        ],
      },
    ],
  },
  {
    id: 'd6',
    slug: 'fhss-experiences-was-it-worth-it',
    category: 'grants',
    title: 'FHSS experiences — was the First Home Super Saver actually worth it?',
    preview:
      "Thinking of salary sacrificing into super to save my deposit via the FHSS scheme. The tax savings look good on paper but the withdrawal process seems fiddly. Anyone done it?",
    body: [
      "I earn a decent salary so the tax advantages of the First Home Super Saver (FHSS) scheme are appealing — save into super at a lower tax rate, then withdraw for a deposit.",
      "But I've read the withdrawal can take weeks and the ATO calculates the releasable amount in a way that's not always intuitive. Would love to hear from people who've actually pulled money out for a purchase.",
    ],
    author: A.olivia,
    createdAgo: '3d ago',
    lastReplyAgo: '12h ago',
    lastReplyBy: 'Grace Kim',
    replies: 29,
    views: 4400,
    likes: 71,
    tags: ['FHSS', 'Super', 'Deposit', 'Tax'],
    thread: [
      {
        id: 'd6r1',
        author: A.grace,
        timeAgo: '1d ago',
        likes: 21,
        body: [
          "Did it and would do it again. The tax saving on my voluntary contributions was genuinely worth a few thousand dollars over two years.",
          "Two tips: request your FHSS determination from the ATO well before you plan to buy (the release takes 15–20 business days), and don't sign a contract until the money is actually in your account. Timing is the only tricky part.",
        ],
      },
      {
        id: 'd6r2',
        author: A.priya,
        timeAgo: '16h ago',
        likes: 7,
        body: [
          "The only thing that annoyed me was you can only withdraw voluntary contributions, not your employer's compulsory super. So plan the salary sacrifice early to build up a meaningful amount.",
        ],
      },
    ],
  },
  {
    id: 'd7',
    slug: 'shared-equity-help-to-buy-opinions',
    category: 'grants',
    title: 'Shared Equity (Help to Buy) — worth it or a trap?',
    preview:
      "The government co-buying up to 40% of your home sounds amazing for getting in sooner, but you give up equity. For those who've looked into Help to Buy — would you do it?",
    body: [
      "On one hand, Help to Buy could get us into a home years earlier with a smaller deposit and loan. On the other, the government owns a share and takes a cut of any capital growth when you sell or buy them out.",
      "I keep going back and forth. Is 'own less of a home now' better than 'own all of a home later'? Curious how others have thought about it.",
    ],
    author: A.noah,
    createdAgo: '4d ago',
    lastReplyAgo: '1d ago',
    lastReplyBy: 'Daniel Rossi',
    replies: 33,
    views: 5010,
    likes: 63,
    tags: ['Shared Equity', 'Help to Buy', 'Deposit'],
    thread: [
      {
        id: 'd7r1',
        author: A.daniel,
        timeAgo: '2d ago',
        likes: 18,
        body: [
          "The way I frame it for clients: shared equity is a tool to solve a timing problem, not a wealth-building strategy. If it gets you into a stable home now and out of a rising rental market, it can be very worth it.",
          "The catch is you're sharing capital growth, and you can usually buy back the government's share over time. Run the numbers on buying them out in 5–10 years — for a lot of people it stacks up.",
        ],
      },
      {
        id: 'd7r2',
        author: A.mia,
        timeAgo: '1d ago',
        likes: 9,
        body: [
          "We considered it in WA but ended up going with the 5% guarantee instead because we wanted to own 100% from day one. No wrong answer, just depends how much the deposit gap is holding you back.",
        ],
      },
    ],
  },
  {
    id: 'd8',
    slug: 'builder-recommendations-melbourne-west',
    category: 'building',
    title: "Builder recommendations for Melbourne's west?",
    preview:
      "About to sign a build contract for a house and land package near Tarneit. Would love recommendations (and warnings) on volume builders. Quality and communication matter more than the cheapest price.",
    body: [
      "We've got the land sorted and are comparing three volume builders. The display homes all look great but I know that's not always what you get.",
      "What I really care about: build quality, sticking to timelines, and actually answering the phone during the build. Who's been good, and who should we avoid?",
    ],
    author: A.sarah,
    createdAgo: '5d ago',
    lastReplyAgo: '2d ago',
    lastReplyBy: 'Ethan Walker',
    replies: 52,
    views: 6700,
    likes: 79,
    tags: ['Builders', 'House and land', 'VIC', 'Tarneit'],
    thread: [
      {
        id: 'd8r1',
        author: A.ethan,
        timeAgo: '3d ago',
        likes: 24,
        body: [
          "General advice from our build: whoever you pick, read the contract line by line and understand what's 'standard' vs an upgrade. The base price is rarely what you actually pay.",
          "Also get everything in writing, take dated photos at each stage, and consider an independent building inspector at frame and lock-up. Best money we spent.",
        ],
      },
      {
        id: 'd8r2',
        author: A.hannah,
        timeAgo: '2d ago',
        likes: 11,
        body: [
          "We built in WA — different builders over there — but the same lesson applies: communication is everything. Ask for the site supervisor's name and how often they update you. If they're vague at sales stage, it won't improve.",
        ],
      },
    ],
  },
  {
    id: 'd9',
    slug: 'first-home-sydney-under-800k',
    category: 'suburbs',
    title: 'First home in Sydney under $800k — is it actually possible?',
    preview:
      "Everyone says you can't buy in Sydney under $800k but surely there are pockets? Open to apartments and townhouses, need to be within ~50 min of the city by train. Where should we look?",
    body: [
      "We're a couple on a combined income around $150k with a 10% deposit. Sydney feels impossible but I refuse to believe there's nothing.",
      "Happy with an apartment or townhouse. Just need decent transport and not a two-hour commute. Realistic suggestions welcome — where are people actually buying?",
    ],
    author: A.aisha,
    createdAgo: '6d ago',
    lastReplyAgo: '3d ago',
    lastReplyBy: 'Jack Thompson',
    replies: 44,
    views: 7200,
    likes: 91,
    tags: ['Sydney', 'NSW', 'Under $800k', 'Apartments'],
    thread: [
      {
        id: 'd9r1',
        author: A.jack,
        timeAgo: '4d ago',
        likes: 20,
        body: [
          "It's tight but doable for apartments and townhouses. Look west and south-west: Blacktown, Mount Druitt, Liverpool, Campbelltown, and along the T1/T8 lines. Parramatta apartments occasionally sneak under with a bit of luck.",
          "We bought a townhouse near Blacktown and the train to the city is around 45 minutes. Not glamorous but it's ours.",
        ],
      },
      {
        id: 'd9r2',
        author: A.marcus,
        timeAgo: '3d ago',
        likes: 8,
        body: [
          "If you're open to apartments, watch strata reports carefully — some older blocks have big upcoming levies. A cheap apartment with a broken building fund isn't cheap.",
        ],
      },
    ],
  },
  {
    id: 'd10',
    slug: 'first-home-guarantee-5-percent-process',
    category: 'finance',
    title: 'First Home Guarantee with 5% deposit — how was the process?',
    preview:
      "Approved for the 5% deposit guarantee and about to start looking. For those who've been through it — how different is it to a normal loan, and were there any gotchas?",
    body: [
      "We qualified for the First Home Guarantee and can buy with 5% deposit and no LMI, which is huge for us. But I want to understand what's actually different day to day.",
      "Do sellers/agents treat you differently? Is the approval more conditional? Any surprises at the pointy end?",
    ],
    author: A.tom,
    createdAgo: '1w ago',
    lastReplyAgo: '4d ago',
    lastReplyBy: 'Hannah Wilson',
    replies: 27,
    views: 3900,
    likes: 58,
    solved: true,
    tags: ['First Home Guarantee', '5% deposit', 'LMI'],
    thread: [
      {
        id: 'd10r1',
        author: A.hannah,
        timeAgo: '5d ago',
        isAnswer: true,
        likes: 26,
        body: [
          "Honestly it felt like a completely normal loan once we were approved. Agents didn't treat us any differently — a 5% guarantee buyer's finance is just as valid as anyone else's.",
          "The main thing is places are limited and the property has to be under the price cap for your area, so line up your lender early and confirm the cap before you make offers.",
        ],
      },
    ],
  },
  {
    id: 'd11',
    slug: 'fixed-vs-variable-rate-first-home',
    category: 'finance',
    title: 'Fixed vs variable for our first home — what would you do right now?',
    preview:
      "Settling in a couple of months and trying to decide between fixing part of the loan or going full variable. I know no one has a crystal ball but keen to hear how people are thinking about it.",
    body: [
      "This is our first mortgage and the fixed vs variable decision is stressing me out more than it probably should. Fixed gives certainty for budgeting; variable gives flexibility and offset benefits.",
      "How did you decide? Did anyone split the loan and do a bit of both?",
    ],
    author: A.liam,
    createdAgo: '1w ago',
    lastReplyAgo: '5d ago',
    lastReplyBy: 'Marcus Lee',
    replies: 39,
    views: 5600,
    likes: 67,
    tags: ['Interest rates', 'Fixed', 'Variable', 'Offset'],
    thread: [
      {
        id: 'd11r1',
        author: A.marcus,
        timeAgo: '6d ago',
        likes: 22,
        body: [
          "For first home buyers I often suggest thinking about it in terms of what helps you sleep at night, not just chasing the lowest number. If a rate rise would genuinely hurt your budget, certainty has value.",
          "A split loan (part fixed, part variable with an offset) is a popular middle ground — budget certainty on one part, flexibility and offset benefits on the other.",
        ],
      },
    ],
  },
  {
    id: 'd12',
    slug: 'off-the-plan-apartment-pros-cons',
    category: 'building',
    title: 'Off-the-plan apartment — pros, cons and regrets?',
    preview:
      "Considering an off-the-plan apartment to lock in today's price and get the stamp duty savings. But the horror stories about delays and 'not as advertised' scare me. Worth it?",
    body: [
      "The appeal of off-the-plan is buying at today's price, potential stamp duty concessions on the dutiable value, and a brand new place. The risks are delays, developer quality, and the finished product not matching the render.",
      "For anyone who's bought off-the-plan — knowing what you know now, would you do it again?",
    ],
    author: A.grace,
    createdAgo: '1w ago',
    lastReplyAgo: '6d ago',
    lastReplyBy: 'Daniel Rossi',
    replies: 31,
    views: 4700,
    likes: 54,
    tags: ['Off-the-plan', 'Apartments', 'Stamp duty'],
    thread: [
      {
        id: 'd12r1',
        author: A.daniel,
        timeAgo: '6d ago',
        likes: 17,
        body: [
          "Off-the-plan can be great value but developer selection is everything. Research their completed projects, walk through one if you can, and read the contract's sunset clause carefully.",
          "Also budget for the possibility of a valuation coming in below your contract price at completion — that's the classic off-the-plan trap for first home buyers with small deposits.",
        ],
      },
    ],
  },
  {
    id: 'd13',
    slug: 'conveyancer-vs-solicitor',
    category: 'finance',
    title: 'Conveyancer vs solicitor — who did you use and why?',
    preview:
      "Do first home buyers need a solicitor or is a conveyancer enough? Trying to understand the difference and whether it's worth paying more for a lawyer.",
    body: [
      "Getting quotes and the conveyancers are noticeably cheaper than solicitors. For a straightforward established house purchase, is a conveyancer fine, or are there situations where you really want a lawyer?",
    ],
    author: A.mia,
    createdAgo: '2w ago',
    lastReplyAgo: '1w ago',
    lastReplyBy: 'Isla Robinson',
    replies: 22,
    views: 3300,
    likes: 41,
    tags: ['Conveyancing', 'Legal', 'Settlement'],
    thread: [
      {
        id: 'd13r1',
        author: A.isla,
        timeAgo: '1w ago',
        likes: 14,
        body: [
          "For a normal established purchase, a good conveyancer is completely fine — that's exactly what they do all day. We used one and it was smooth.",
          "You'd lean towards a solicitor if there's anything unusual: a deceased estate, a tricky contract, off-the-plan with complex terms, or a dispute. For a standard house, save the money.",
        ],
      },
    ],
  },
  {
    id: 'd14',
    slug: 'pre-approval-expired-now-what',
    category: 'finance',
    title: 'Pre-approval expired before we found a place — now what?',
    preview:
      "Took us longer than expected to find the right home and our pre-approval lapsed. Do we just renew it? Does re-applying hurt anything? Feeling a bit deflated.",
    body: [
      "We got pre-approved, then spent months getting outbid and overwhelmed. Now the pre-approval has expired and I'm worried we've lost momentum (and maybe hurt our credit re-applying).",
      "Is renewing straightforward? Anything we should do differently the second time around?",
    ],
    author: A.noah,
    createdAgo: '2w ago',
    lastReplyAgo: '1w ago',
    lastReplyBy: 'Marcus Lee',
    replies: 19,
    views: 2800,
    likes: 36,
    tags: ['Pre-approval', 'Finance', 'Credit'],
    thread: [
      {
        id: 'd14r1',
        author: A.marcus,
        timeAgo: '1w ago',
        likes: 15,
        body: [
          "Totally normal — pre-approvals usually last around 3 months and expiring is common. Renewing is generally straightforward; your broker or bank refreshes your payslips and re-runs it.",
          "It's usually a soft check to renew with the same lender, so don't panic about your credit. Just keep your savings ticking over and avoid taking on any new debts in the meantime.",
        ],
      },
    ],
  },
  {
    id: 'd15',
    slug: 'qld-30k-fhog-new-builds-only',
    category: 'grants',
    title: 'QLD $30k FHOG — new builds only, right?',
    preview:
      "Confirming my understanding of the Queensland First Home Owner Grant — it's $30k but only for new builds or substantial renos, not established homes? Want to make sure before we shift our search.",
    body: [
      "We're in Brisbane and the $30k QLD grant is a big deal for us, but I want to be certain it only applies to new homes. We've been looking at established places and might need to pivot.",
    ],
    author: A.priya,
    createdAgo: '2w ago',
    lastReplyAgo: '1w ago',
    lastReplyBy: 'Tom Fitzgerald',
    replies: 24,
    views: 3600,
    likes: 48,
    solved: true,
    tags: ['FHOG', 'QLD', 'New build', 'Brisbane'],
    thread: [
      {
        id: 'd15r1',
        author: A.tom,
        timeAgo: '1w ago',
        isAnswer: true,
        likes: 19,
        body: [
          "Correct — the QLD First Home Owner Grant is for buying or building a new home, not established. A new build, off-the-plan, or a substantially renovated home can qualify.",
          "If you're set on an established place, you'd miss the grant but you might still be eligible for a transfer duty concession, so it's worth checking both before you rule anything out.",
        ],
      },
    ],
  },
  {
    id: 'd16',
    slug: 'stamp-duty-exemption-vic-under-600k',
    category: 'grants',
    title: 'VIC stamp duty exemption — the under $600k threshold',
    preview:
      "In Victoria a first home under $600k is exempt from stamp duty, with a concession up to $750k. We're right on the border at $605k — is it worth negotiating under $600k for the saving?",
    body: [
      "We've found a place listed at $605k. If we could get it under $600k, we'd pay zero stamp duty as first home buyers. Above that it's a sliding concession up to $750k.",
      "Is the saving big enough to push hard on price, or am I overthinking a few thousand dollars of duty?",
    ],
    author: A.chloe,
    createdAgo: '3w ago',
    lastReplyAgo: '2w ago',
    lastReplyBy: 'Daniel Rossi',
    replies: 26,
    views: 4200,
    likes: 59,
    tags: ['Stamp duty', 'VIC', 'Concession', 'Negotiation'],
    thread: [
      {
        id: 'd16r1',
        author: A.daniel,
        timeAgo: '2w ago',
        likes: 20,
        body: [
          "The full exemption under $600k vs the concession just above it can be worth a fair chunk — often more than the few thousand dollars of price difference. Run the exact duty figure both ways.",
          "It's a very reasonable thing to raise in negotiation. Agents understand the $600k threshold well, so framing your offer around it isn't unusual at all.",
        ],
      },
    ],
  },
  {
    id: 'd17',
    slug: 'building-inspection-worth-it-new-build',
    category: 'building',
    title: 'Independent building inspection — worth it on a brand new build?',
    preview:
      "Volume builder keeps telling us their own quality checks are enough and an independent inspector is a waste of money. Everything in me says get one anyway. Am I being paranoid?",
    body: [
      "It's our first build and the builder is a bit dismissive about us bringing in an independent inspector at frame and handover. They say it's covered by their own supervisors and council checks.",
      "Instinct says spend the money for peace of mind, but keen to hear from people who've built — did an independent inspection actually catch anything?",
    ],
    author: A.hannah,
    createdAgo: '3w ago',
    lastReplyAgo: '2w ago',
    lastReplyBy: 'Ethan Walker',
    replies: 33,
    views: 4900,
    likes: 72,
    tags: ['Building inspection', 'New build', 'Quality'],
    thread: [
      {
        id: 'd17r1',
        author: A.ethan,
        timeAgo: '2w ago',
        likes: 28,
        body: [
          "Get the inspection. Ours caught several issues at frame and lock-up that got fixed before they were hidden behind plaster. A builder discouraging an independent check is a slight red flag in itself.",
          "It's a small cost relative to the build and it gives you documented leverage if something's not right. No regrets at all.",
        ],
      },
    ],
  },
  {
    id: 'd18',
    slug: 'we-settled-last-week-our-first-home',
    category: 'success',
    title: 'We settled last week — sharing our whole first home journey 🎉',
    preview:
      "Three years of saving, one FHSS withdrawal, a 5% deposit guarantee and a lot of rejected offers later — we got the keys. Writing this up in case it helps someone earlier in the process.",
    body: [
      "I remember reading threads like this when we started and feeling like it would never be us. Well, last Friday we picked up the keys to our first home in Geelong, and I wanted to give back by sharing the whole thing honestly.",
      "The short version: we combined the First Home Super Saver scheme to boost our deposit with the First Home Guarantee so we only needed 5% and avoided LMI. We got outbid four times before this one.",
      "The biggest lesson? Get your finance and grants sorted early so you can move fast when the right place comes up. The buyers who win aren't always the ones with the most money — they're the ones who are ready.",
    ],
    bullets: [
      'Saved for ~3 years, boosted the last stretch with FHSS',
      'Used the First Home Guarantee (5% deposit, no LMI)',
      'Outbid 4 times before winning the 5th',
      'Kept an extra $6k aside for settlement extras',
    ],
    author: A.ethan,
    createdAgo: '5d ago',
    lastReplyAgo: '3h ago',
    lastReplyBy: 'Sarah Chen',
    replies: 63,
    views: 9100,
    likes: 214,
    trending: true,
    tags: ['Success story', 'FHSS', 'First Home Guarantee', 'Geelong'],
    thread: [
      {
        id: 'd18r1',
        author: A.sarah,
        timeAgo: '4h ago',
        likes: 31,
        body: [
          "Congratulations! This is so encouraging to read while we're mid-search. The 'be ready to move fast' advice really resonates — we lost one because our finance wasn't quite lined up.",
        ],
      },
      {
        id: 'd18r2',
        author: A.liam,
        timeAgo: '2h ago',
        likes: 12,
        body: [
          "Massive congrats. Four rejected offers is brutal — thanks for being honest about that part. It's easy to feel like you're the only one getting knocked back.",
        ],
      },
    ],
  },
  {
    id: 'd19',
    slug: 'renting-to-owning-adelaide-our-story',
    category: 'success',
    title: 'From renting to owning in Adelaide — how we finally did it',
    preview:
      "Adelaide gets overlooked but it's where we made it work. Single income, modest deposit, first home in the north-east suburbs. Here's what actually moved the needle for us.",
    body: [
      "We'd been renting for eight years and had almost given up. Adelaide's relative affordability is what finally made it possible on a single income.",
      "We qualified for the SA First Home Owner Grant on a new build and used a broker who found a lender comfortable with our situation. It wasn't glamorous but it worked.",
      "If you're in a smaller capital feeling priced out of Sydney/Melbourne — don't discount your own city. Sometimes the answer is closer than you think.",
    ],
    author: A.liam,
    createdAgo: '1w ago',
    lastReplyAgo: '2d ago',
    lastReplyBy: 'Priya Nair',
    replies: 28,
    views: 4300,
    likes: 97,
    tags: ['Success story', 'SA', 'Adelaide', 'FHOG'],
    thread: [
      {
        id: 'd19r1',
        author: A.priya,
        timeAgo: '2d ago',
        likes: 11,
        body: [
          "Love this. We're doing the same maths in Brisbane — sometimes the 'unfashionable' capital is exactly where a first home buyer can actually win. Congrats!",
        ],
      },
    ],
  },
  {
    id: 'd20',
    slug: 'regional-first-home-buyer-guarantee',
    category: 'grants',
    title: 'Regional First Home Buyer Guarantee — anyone actually used it?',
    preview:
      "Buying in a regional area and looking at the regional version of the guarantee. Is it meaningfully different to the standard First Home Guarantee, and how did you find the process?",
    body: [
      "We're buying in regional Victoria and the regional guarantee looks like a strong fit — 5% deposit, no LMI, aimed at regional buyers. But I'm not clear on how it differs from the standard guarantee in practice.",
      "Anyone been through it recently? Any differences at application or settlement?",
    ],
    author: A.chloe,
    createdAgo: '1w ago',
    lastReplyAgo: '3d ago',
    lastReplyBy: 'Marcus Lee',
    replies: 17,
    views: 2600,
    likes: 33,
    tags: ['Regional', 'First Home Guarantee', 'VIC'],
    thread: [
      {
        id: 'd20r1',
        author: A.marcus,
        timeAgo: '3d ago',
        likes: 12,
        body: [
          "In practice it works much like the standard guarantee — 5% deposit, no LMI — but it's targeted at regional buyers and regional property with its own price caps and eligibility around living in the region.",
          "The programs have been evolving, so the key move is to get your lender to confirm the current version and caps for your specific area before you commit.",
        ],
      },
    ],
  },
  {
    id: 'd21',
    slug: 'deposit-gap-how-did-you-bridge-it',
    category: 'finance',
    title: 'Deposit gap — how did you actually bridge it?',
    preview:
      "So close but our deposit is still short of where we want it. For those who closed the gap — was it family help, a guarantor, FHSS, a low-deposit scheme, or just grinding it out? No judgement, genuinely curious.",
    body: [
      "We can service a loan comfortably but the deposit is the wall. We're weighing up a few options and I'd love to hear what people actually did rather than the theory.",
      "Guarantor loans, low-deposit guarantees, FHSS, a gift from family, or just more time saving — what worked for you and what would you do differently?",
    ],
    author: A.aisha,
    createdAgo: '2w ago',
    lastReplyAgo: '4d ago',
    lastReplyBy: 'Hannah Wilson',
    replies: 45,
    views: 6800,
    likes: 103,
    tags: ['Deposit', 'Guarantor', 'FHSS', 'LMI'],
    thread: [
      {
        id: 'd21r1',
        author: A.hannah,
        timeAgo: '4d ago',
        likes: 22,
        body: [
          "For us it was the 5% guarantee that bridged it — we simply couldn't save a 20% deposit fast enough while renting. It got us in years earlier.",
          "A friend went the guarantor route with her parents' equity instead. Both work; it comes down to whether family can/wants to be involved and how you feel about a low-deposit loan.",
        ],
      },
    ],
  },
  {
    id: 'd22',
    slug: 'best-banks-for-first-home-buyers-2026',
    category: 'finance',
    title: 'Best banks for first home buyers in 2026?',
    preview:
      "Not asking for the absolute lowest rate — asking who was genuinely good to deal with as a first home buyer. Clear communication, sensible policies, decent app. Who impressed you?",
    body: [
      "Rate matters but as a first-timer the experience matters just as much. I want a lender that explains things clearly, doesn't disappear during the process, and has a decent offset/app.",
      "Who did people have a genuinely good experience with — big four, or one of the smaller lenders?",
    ],
    author: A.jack,
    createdAgo: '2w ago',
    lastReplyAgo: '5d ago',
    lastReplyBy: 'Marcus Lee',
    replies: 38,
    views: 5900,
    likes: 61,
    tags: ['Banks', 'Lenders', 'Offset'],
    thread: [
      {
        id: 'd22r1',
        author: A.marcus,
        timeAgo: '5d ago',
        likes: 16,
        body: [
          "Honestly the 'best' bank varies a lot by your situation, because it's their credit policy that decides whether you're an easy approval. A great rate you can't get approved for is useless.",
          "As a general tip: the big four have the polished apps and offsets, but smaller lenders and credit unions are often more flexible on policy and service. A broker can match you to whoever fits your profile best.",
        ],
      },
    ],
  },
  {
    id: 'd23',
    slug: 'perth-market-buy-now-or-wait',
    category: 'suburbs',
    title: 'Perth market heating up — buy now or wait?',
    preview:
      "Perth prices have run hard and I'm nervous about buying near a peak, but rents are brutal and waiting has burned people before. WA buyers — what's the vibe on the ground right now?",
    body: [
      "We're in Perth and every open is packed. Prices feel like they've jumped a lot in a short time. Part of me wants to wait for things to cool, part of me is sick of paying someone else's mortgage.",
      "For locals actually buying right now — are you finding value, or is it FOMO?",
    ],
    author: A.mia,
    createdAgo: '1w ago',
    lastReplyAgo: '4d ago',
    lastReplyBy: 'Hannah Wilson',
    replies: 36,
    views: 5400,
    likes: 57,
    tags: ['Perth', 'WA', 'Market', 'Timing'],
    thread: [
      {
        id: 'd23r1',
        author: A.hannah,
        timeAgo: '4d ago',
        likes: 15,
        body: [
          "We bought in Baldivis a few months ago after agonising over exactly this. My take: trying to time the bottom is how a lot of people end up renting forever.",
          "If it's a home you'll hold for 7–10 years and you can service it comfortably, short-term timing matters far less than people fear. Buy the home, not the market.",
        ],
      },
    ],
  },
  {
    id: 'd24',
    slug: 'house-and-land-vs-established',
    category: 'building',
    title: 'House and land vs established — what did you choose and why?',
    preview:
      "Torn between a shiny new house and land package (with grants) or an established home closer to the city (no grant, but character and location). How did you weigh it up?",
    body: [
      "The house and land package unlocks the FHOG and a brand new home, but it's further out and we'd be waiting to build. The established home is move-in ready and closer in, but pricier and no grant.",
      "For those who faced this exact choice — what did you pick and are you happy with it?",
    ],
    author: A.grace,
    createdAgo: '2w ago',
    lastReplyAgo: '6d ago',
    lastReplyBy: 'Ethan Walker',
    replies: 30,
    views: 4500,
    likes: 52,
    tags: ['House and land', 'Established', 'FHOG'],
    thread: [
      {
        id: 'd24r1',
        author: A.ethan,
        timeAgo: '6d ago',
        likes: 18,
        body: [
          "We went house and land for the grant and the new-home warranty, but be honest with yourself about the wait and the temporary costs (renting while you build, landscaping, fencing that isn't included).",
          "If location and being able to move in now matter more to you than a new build and the grant, established can absolutely be the smarter call. Neither is wrong — it's about your priorities.",
        ],
      },
    ],
  },
  {
    id: 'd25',
    slug: 'genuine-savings-how-strict-are-lenders',
    category: 'finance',
    title: 'Genuine savings — how strict are lenders really?',
    preview:
      "Keep reading that lenders want '5% genuine savings' held for 3+ months. What actually counts, and how strict are they if some of your deposit is a gift or from selling a car?",
    body: [
      "Our deposit is a mix — some saved, some a gift from parents, some from selling a car. I keep seeing 'genuine savings' as a requirement and I'm not sure how much of ours qualifies.",
      "What actually counts as genuine savings, and do the low-deposit schemes change the rules here?",
    ],
    author: A.noah,
    createdAgo: '3w ago',
    lastReplyAgo: '1w ago',
    lastReplyBy: 'Marcus Lee',
    replies: 21,
    views: 3100,
    likes: 39,
    tags: ['Genuine savings', 'Deposit', 'Gifts'],
    thread: [
      {
        id: 'd25r1',
        author: A.marcus,
        timeAgo: '1w ago',
        likes: 17,
        body: [
          "Genuine savings usually means funds you've accumulated/held over time — regular savings, or money sitting in an account for 3+ months. A gift can often count if it's been parked in your account long enough, and rent history can sometimes substitute.",
          "A one-off like selling a car may not count as 'genuine' on its own, but policies vary by lender — which is exactly the kind of thing a broker or your banker can confirm for your specific deposit mix.",
        ],
      },
    ],
  },
]

// ── Categories with live counts ─────────────────────────────────────────────
export const CATEGORIES: (Category & { count: number })[] = BASE_CATEGORIES.map((c) => ({
  ...c,
  count: c.id === 'all' ? DISCUSSIONS.length : DISCUSSIONS.filter((d) => d.category === c.id).length,
}))

// ── Popular topics ──────────────────────────────────────────────────────────
export const TOPICS: Topic[] = [
  { id: 't1', icon: 'fileCheck', title: 'Grant Eligibility', description: 'Who qualifies for what, and how to check before you buy.', count: 128, lastActivity: '22m ago' },
  { id: 't2', icon: 'coins', title: 'FHOG', description: 'First Home Owner Grant amounts and rules by state.', count: 96, lastActivity: '1h ago' },
  { id: 't3', icon: 'landmark', title: 'Borrowing', description: 'Serviceability, deposits and getting approved.', count: 152, lastActivity: '35m ago' },
  { id: 't4', icon: 'banknote', title: 'Banks & Lenders', description: 'Who to bank with and what to expect.', count: 87, lastActivity: '2h ago' },
  { id: 't5', icon: 'hammer', title: 'Builders', description: 'Recommendations, contracts and build quality.', count: 74, lastActivity: '3h ago' },
  { id: 't6', icon: 'mapPin', title: 'Suburbs', description: 'Where to buy for value, transport and lifestyle.', count: 141, lastActivity: '48m ago' },
  { id: 't7', icon: 'handshake', title: 'Settlement', description: 'Conveyancing, costs and the final stretch.', count: 63, lastActivity: '5h ago' },
  { id: 't8', icon: 'receipt', title: 'Stamp Duty', description: 'Exemptions, concessions and thresholds.', count: 58, lastActivity: '2h ago' },
  { id: 't9', icon: 'piggyBank', title: 'FHSS', description: 'Saving your deposit through super.', count: 44, lastActivity: '12h ago' },
  { id: 't10', icon: 'lineChart', title: 'Property Market', description: 'Timing, trends and buy-now-or-wait debates.', count: 112, lastActivity: '1h ago' },
]

// ── Top contributors ────────────────────────────────────────────────────────
export const CONTRIBUTORS: Contributor[] = [
  { name: 'Marcus Lee', initials: 'ML', location: 'Melbourne, VIC', helpfulAnswers: 214, badge: 'Broker' },
  { name: 'Daniel Rossi', initials: 'DR', location: 'Frankston, VIC', helpfulAnswers: 168, badge: 'Buyers advocate' },
  { name: 'Hannah Wilson', initials: 'HW', location: 'Baldivis, WA', helpfulAnswers: 132, badge: 'Recently settled' },
  { name: 'Ethan Walker', initials: 'EW', location: 'Geelong, VIC', helpfulAnswers: 121, badge: 'Recently settled' },
  { name: 'Isla Robinson', initials: 'IR', location: 'Newcastle, NSW', helpfulAnswers: 98, badge: 'Community helper' },
]

// ── Community guidelines ────────────────────────────────────────────────────
export const GUIDELINES: string[] = [
  'Be kind and assume good faith — everyone starts somewhere.',
  'Share real experiences, not financial advice.',
  'No spam, referral links or self-promotion.',
  'Respect privacy — never share personal details.',
]

// ── Recent activity feed ────────────────────────────────────────────────────
export interface Activity {
  id: string
  who: string
  action: string
  target: string
  slug: string
  timeAgo: string
}
export const RECENT_ACTIVITY: Activity[] = [
  { id: 'a1', who: 'Marcus Lee', action: 'replied to', target: 'Can I combine the FHOG…', slug: 'combine-fhog-with-home-guarantee-scheme', timeAgo: '22m ago' },
  { id: 'a2', who: 'Chloe Martin', action: 'replied to', target: 'Has anyone bought in Werribee…', slug: 'bought-in-werribee-recently', timeAgo: '2h ago' },
  { id: 'a3', who: 'Sarah Chen', action: 'replied to', target: 'We settled last week…', slug: 'we-settled-last-week-our-first-home', timeAgo: '3h ago' },
  { id: 'a4', who: 'Tom Fitzgerald', action: 'marked solved', target: 'QLD $30k FHOG…', slug: 'qld-30k-fhog-new-builds-only', timeAgo: '6h ago' },
  { id: 'a5', who: 'Grace Kim', action: 'replied to', target: 'FHSS experiences…', slug: 'fhss-experiences-was-it-worth-it', timeAgo: '12h ago' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
export function getFeaturedDiscussion(): Discussion {
  return DISCUSSIONS.find((d) => d.pinned) ?? DISCUSSIONS[0]
}

export function getDiscussions(category: CategoryId): Discussion[] {
  const list = category === 'all' ? DISCUSSIONS : DISCUSSIONS.filter((d) => d.category === category)
  // Feed excludes the pinned/featured item (shown separately).
  return list.filter((d) => !d.pinned)
}

export function getDiscussionBySlug(slug: string): Discussion | undefined {
  return DISCUSSIONS.find((d) => d.slug === slug)
}

export function getTrending(limit = 4): Discussion[] {
  return [...DISCUSSIONS].sort((a, b) => b.views - a.views).slice(0, limit)
}

export function getMostHelpful(limit = 3): Discussion[] {
  return [...DISCUSSIONS].sort((a, b) => b.likes - a.likes).slice(0, limit)
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}
