export type ArticleCategory =
  | 'Grants'
  | 'Buying Strategy'
  | 'Property Risk'
  | 'Suburbs'
  | 'Mortgage Readiness'

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; title: string; body: string }
  | { type: 'ai-insight'; heading: string; body: string }
  | { type: 'grant'; name: string; value: string; note: string; status: 'eligible' | 'conditional' }
  | { type: 'list'; ordered?: boolean; items: string[] }

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  readTime: number
  featured?: boolean
  gradientFrom: string
  gradientTo: string
  accentColor: string
  image: string
  content: ContentBlock[]
}

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'first-home-owner-grant-explained',
    title: 'First Home Owner Grant explained for Australian buyers',
    excerpt:
      'The FHOG provides up to $10,000 for eligible first-home buyers purchasing or building a new home. Here is what you need to know about state thresholds, eligibility criteria, and how to apply without the jargon.',
    category: 'Grants',
    readTime: 6,
    featured: true,
    gradientFrom: '#FFF9D6',
    gradientTo: '#FFF0A0',
    accentColor: '#C8973A',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&h=600&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "The First Home Owner Grant is one of the most widely accessed government grants in Australia — yet thousands of eligible buyers miss out each year because they apply at the wrong time, to the wrong scheme, or with an incomplete understanding of the rules. This guide cuts through the confusion.",
      },
      { type: 'heading', level: 2, text: 'What is the First Home Owner Grant?' },
      {
        type: 'paragraph',
        text: "Introduced in 2000 to offset the impact of GST on housing, the FHOG is a one-off cash payment made by each state and territory government to eligible first-home buyers. It is not a loan. It does not need to be repaid. And in most states, it is paid directly to your conveyancer or settlement agent at the time of purchase — meaning you never handle the funds yourself.",
      },
      {
        type: 'grant',
        name: 'First Home Owner Grant (FHOG)',
        value: 'Up to $10,000',
        note: 'One-off cash payment for eligible first-home buyers. State-administered and non-repayable.',
        status: 'eligible',
      },
      { type: 'heading', level: 2, text: 'Who is eligible?' },
      {
        type: 'paragraph',
        text: "Eligibility rules are set independently by each state and territory, but the core criteria are consistent across Australia. You generally need to meet all of the following:",
      },
      {
        type: 'list',
        items: [
          "Be an Australian citizen or permanent resident at the time of application",
          "Be 18 years of age or older",
          "Be a first-home buyer — you must never have owned residential property in Australia before",
          "Intend to live in the property as your principal place of residence for a continuous period of at least 12 months",
          "Purchase or build a new home — most states exclude established homes from FHOG eligibility",
          "Have a property purchase price below the applicable state threshold",
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Permanent residents',
        body: "Permanent residents can apply for the FHOG in most states, but some states treat PRs as conditional or exclude certain visa categories. If your partner is a citizen but you are a PR, you should still be eligible — but verify with your state revenue office.",
      },
      { type: 'heading', level: 2, text: 'State-by-state property price thresholds' },
      {
        type: 'paragraph',
        text: "Each state caps FHOG eligibility at a maximum property value. Purchases above these thresholds are ineligible — regardless of your income, savings, or buyer status. The thresholds apply to the total value of the contract, including any upgrades or inclusions.",
      },
      {
        type: 'list',
        items: [
          "NSW — $600,000 for new builds; $750,000 if building on vacant land",
          "VIC — $750,000 (grant value $10,000; $20,000 in regional areas)",
          "QLD — $750,000 (grant value $30,000 as of 2024 budget changes)",
          "WA — $750,000 for metro; $1,000,000 for regional areas",
          "SA — $650,000 (grant value $15,000)",
          "TAS — $750,000 (grant value $30,000)",
          "ACT — replaced by Home Buyer Concession Scheme; FHOG not available",
          "NT — $650,000 (grant value $10,000)",
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Price thresholds are firm',
        body: "If your purchase price is $1 above the threshold, you lose the entire grant. There is no partial payment or phase-out. Always confirm the current threshold with your state revenue office before signing a contract, as limits can change with budget announcements.",
      },
      { type: 'heading', level: 2, text: 'How to apply — step by step' },
      {
        type: 'list',
        ordered: true,
        items: [
          "Confirm eligibility against your state's criteria — income, residency, property type, and price threshold",
          "Complete the FHOG application form for your state (available via your state revenue office website)",
          "Submit the application through your lender (most banks process it on your behalf at settlement) or directly to the state revenue office",
          "Provide supporting documents — identity, proof of residency, contract of sale or building contract",
          "Grant is paid at settlement or upon completion of construction, directly into the settlement process",
        ],
      },
      {
        type: 'ai-insight',
        heading: 'When to apply',
        body: "Most banks can lodge your FHOG application as part of the loan settlement process, which is the fastest path. If you are building, your grant is typically paid on the first progressive draw — not at contract signing. Applying too early or outside of this window can delay payment.",
      },
      { type: 'heading', level: 2, text: 'What the grant can be used for' },
      {
        type: 'paragraph',
        text: "The FHOG has no restrictions on how you spend it once received. Most buyers use it to cover part of their deposit, offset stamp duty costs, or fund moving expenses. Some buyers combine it with the First Home Guarantee to reduce their deposit to as little as 5% of the purchase price — a powerful combination for buyers who are income-eligible for both schemes.",
      },
      { type: 'heading', level: 2, text: 'Common mistakes to avoid' },
      {
        type: 'quote',
        text: "Most buyers who miss out on the FHOG do so not because they were ineligible, but because they applied for an established home thinking it counted as new — or they exceeded the price threshold by a small margin they did not anticipate.",
        attribution: 'FirstNest AI Grant Analysis',
      },
      {
        type: 'list',
        items: [
          "Buying an established home when your state only covers new builds",
          "Exceeding the state price threshold due to contract inclusions",
          "Failing to intend to live in the property — investors and landlords are not eligible",
          "Co-buyers where one party has previously owned property — this can disqualify the application",
          "Applying through the wrong channel and delaying the grant past settlement",
        ],
      },
    ],
  },

  {
    id: '2',
    slug: 'how-much-deposit-do-you-need',
    title: 'How much deposit do you really need?',
    excerpt:
      "Most buyers assume 20% is mandatory. With the First Home Guarantee, you could buy with as little as 5% — without paying Lenders Mortgage Insurance. We break down every deposit pathway available today.",
    category: 'Mortgage Readiness',
    readTime: 5,
    gradientFrom: '#EEF3FF',
    gradientTo: '#DCE8FF',
    accentColor: '#2563EB',
    image: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "The 20% deposit rule is the most persistent myth in Australian home buying. While 20% avoids Lenders Mortgage Insurance, it is not a requirement — and for first-home buyers in 2025, there are now multiple government-backed pathways to purchase with significantly less.",
      },
      { type: 'heading', level: 2, text: 'The 20% deposit myth' },
      {
        type: 'paragraph',
        text: "Lenders require Lenders Mortgage Insurance (LMI) when your deposit is below 20% of the purchase price. LMI protects the lender — not you — if you default. It is a one-off premium that can range from $5,000 to $30,000+ depending on your loan size and deposit. Most buyers are understandably keen to avoid it. But there is an increasingly common alternative: the government guarantees the gap.",
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'What LMI actually costs',
        body: "On a $700,000 property with a 10% deposit, LMI would typically add $12,000–$18,000 to your loan. With a 5% deposit, this rises to $20,000–$28,000. The First Home Guarantee eliminates this cost entirely for eligible buyers.",
      },
      { type: 'heading', level: 2, text: 'The four deposit pathways' },
      {
        type: 'list',
        items: [
          "20% or more — standard loan, no LMI, full lender choice, no income cap",
          "10–19% — pay LMI premium added to your loan (or pay upfront), no income cap",
          "5% via First Home Guarantee — government guarantees the gap, no LMI, income-tested",
          "2% via Help to Buy — government co-buys up to 40% of the property, strict income limits",
        ],
      },
      {
        type: 'grant',
        name: 'First Home Guarantee (FHBG)',
        value: '5% deposit',
        note: "Buy with a 5% deposit. The government guarantees up to 15% — no LMI required. Income tested: under $125K single, $200K couple.",
        status: 'conditional',
      },
      { type: 'heading', level: 2, text: 'What lenders actually look at' },
      {
        type: 'paragraph',
        text: "Your deposit size is only one factor in a lender's assessment. Beyond the deposit percentage, lenders assess your genuine savings history (typically 3–5% of the purchase price saved over at least 3 months), your income stability and employment type, existing debts and liabilities, and your credit history. A large deposit from a gift or inheritance may not satisfy the genuine savings requirement at some lenders.",
      },
      {
        type: 'list',
        items: [
          "Genuine savings — funds held in your account for at least 3 months",
          "Debt-to-income ratio — total debt obligations as a percentage of gross income",
          "Employment stability — full-time preferred; self-employed assessed differently",
          "Credit score — a clean record strengthens your position significantly",
          "Living expenses — lenders use benchmarks; unusually high spending can reduce borrowing power",
        ],
      },
      {
        type: 'ai-insight',
        heading: 'Your genuine savings calculation',
        body: "FirstNest AI analyses your income, savings balance, and timeframe to calculate how much of your savings would qualify as genuine savings at most lenders — and flags any shortfalls before you apply, so you can address them without a credit enquiry.",
      },
      { type: 'heading', level: 2, text: 'Building your deposit faster' },
      { type: 'heading', level: 3, text: 'First Home Super Saver Scheme (FHSS)' },
      {
        type: 'paragraph',
        text: "The FHSS lets you make voluntary contributions into your superannuation, then withdraw them (plus associated earnings) for a home deposit. Contributions are taxed at 15% going in — far less than your marginal income tax rate. You can withdraw up to $50,000 across all years. For a buyer on $95,000, this can represent a net tax saving of $10,000–$18,000 compared to saving the same amount outside super.",
      },
      {
        type: 'quote',
        text: "The FHSS is the most underused savings strategy in Australia. Most first-home buyers have never heard of it — and those who have often assume it is too complicated. It takes 20 minutes to set up and the tax benefit is immediate.",
        attribution: 'FirstNest AI Strategy Engine',
      },
      { type: 'heading', level: 2, text: 'The deposit timeline reality check' },
      {
        type: 'paragraph',
        text: "At a typical savings rate of 15% of gross income, a single buyer earning $85,000 per year would need roughly 4.5 years to save a 20% deposit on a $650,000 property. With the First Home Guarantee and FHSS, the same buyer can reach the market in under 2 years — saving not just the deposit gap, but avoiding years of rent paid with no equity gained.",
      },
    ],
  },

  {
    id: '3',
    slug: 'first-home-guarantee-scheme',
    title: 'What is the First Home Guarantee Scheme?',
    excerpt:
      "The FHBG lets eligible buyers purchase with a 5% deposit while the government guarantees up to 15% of your loan. No LMI. No catch. We explain who qualifies and how to apply before the annual places run out.",
    category: 'Grants',
    readTime: 7,
    gradientFrom: '#DCFCE7',
    gradientTo: '#BBF7D0',
    accentColor: '#16A34A',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "The First Home Guarantee — formerly the First Home Loan Deposit Scheme — is one of the most valuable tools available to Australian first-home buyers today. It lets you enter the market with a 5% deposit by having the government guarantee the remaining 15%, eliminating the need for Lenders Mortgage Insurance entirely.",
      },
      { type: 'heading', level: 2, text: 'How the FHBG actually works' },
      {
        type: 'paragraph',
        text: "The government does not give you money directly. Instead, Housing Australia acts as guarantor on your loan — meaning if you defaulted, the government would cover the lender's loss up to the guaranteed amount. Because the lender is protected, they waive the LMI requirement. Your loan is still 95% of the purchase price. You still make standard repayments. The guarantee simply removes the insurance cost.",
      },
      {
        type: 'grant',
        name: 'First Home Guarantee (FHBG)',
        value: '5% deposit',
        note: "Government guarantees up to 15% of purchase price. No LMI. 35,000 places per financial year. Must purchase through an approved lender.",
        status: 'conditional',
      },
      {
        type: 'callout',
        variant: 'info',
        title: '35,000 places per financial year',
        body: "The scheme is capped annually. In recent years, places have filled within weeks of the financial year opening in July. If you are income-eligible, applying as early as possible in the financial year is strongly advised.",
      },
      { type: 'heading', level: 2, text: 'Who qualifies in 2025?' },
      {
        type: 'paragraph',
        text: "The income thresholds and property price caps are the two most common disqualifiers. Check all criteria carefully before assuming eligibility:",
      },
      {
        type: 'list',
        items: [
          "Australian citizen or permanent resident aged 18 or over",
          "Single buyer: taxable income under $125,000 per year (based on prior year tax return)",
          "Couple: combined taxable income under $200,000 per year",
          "Must be first-home buyers — no previous residential property ownership in Australia",
          "Must intend to occupy the property as principal place of residence",
          "Property price cap applies: varies by state and major city vs regional",
          "Must purchase through one of the approved participating lenders",
        ],
      },
      { type: 'heading', level: 2, text: 'Annual places and the timing trap' },
      {
        type: 'paragraph',
        text: "The scheme allocates 35,000 places per financial year starting 1 July. In 2023, all metropolitan places were exhausted within six weeks. Buyers who were mid-search when places ran out either missed the window or were forced to pivot to regional properties. The lesson: secure your pre-approval before you find a property, not after.",
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Places can run out mid-search',
        body: "Receiving a pre-approval under the FHBG does not reserve a place. Your place is only secured when you exchange contracts on a property. Buyers who are pre-approved but slow to find a property have lost their place. Act with urgency once approved.",
      },
      {
        type: 'ai-insight',
        heading: 'When to start your FHBG application',
        body: "FirstNest AI recommends beginning your FHBG pre-approval process in May or June — before the new financial year opens. This puts you at the front of the queue when July 1 arrives and places become available. Most approved lenders have a 4–6 week processing window for FHBG applications.",
      },
      { type: 'heading', level: 2, text: 'Applying through an approved lender' },
      {
        type: 'list',
        ordered: true,
        items: [
          "Check the Housing Australia website for the current list of approved lenders",
          "Contact a lender directly or through a mortgage broker who works with FHBG applications",
          "Complete the standard home loan application with your income, savings, and property details",
          "The lender submits your FHBG application to Housing Australia on your behalf",
          "Once approved, you receive a conditional approval valid for 90 days to find a property",
          "Exchange contracts and notify your lender — the place is then secured in your name",
        ],
      },
      { type: 'heading', level: 2, text: 'What happens after settlement?' },
      {
        type: 'paragraph',
        text: "Once you settle, the guarantee remains on your loan until your LVR drops below 80% — at which point it can be discharged. There are no fees for the guarantee while it is active, and there is no obligation to sell or refinance. You build equity, make repayments, and eventually own the full property like any other buyer.",
      },
      {
        type: 'quote',
        text: "The FHBG is not a shortcut — it is a bridge. It gets you into the market years sooner than you could manage alone, and the equity you build in that time is the real prize.",
        attribution: 'FirstNest AI Buyer Education Series',
      },
    ],
  },

  {
    id: '4',
    slug: 'how-to-compare-suburbs',
    title: 'How to compare suburbs before buying',
    excerpt:
      'Choosing the wrong suburb can cost you years of growth. Learn the five data signals experienced investors use — vacancy rates, infrastructure pipelines, school zones, rental yields, and median growth trends.',
    category: 'Suburbs',
    readTime: 8,
    gradientFrom: '#F0EDFF',
    gradientTo: '#E0D9FF',
    accentColor: '#7C3AED',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "Two properties can look identical on paper — same price, same size, same build quality — yet one can outperform the other by 30% in capital growth over five years simply because of the suburb it sits in. Suburb selection is the single most impactful decision a first-home buyer makes, yet it is often the most under-researched.",
      },
      { type: 'heading', level: 2, text: 'Why suburb choice matters more than the property' },
      {
        type: 'paragraph',
        text: "A bad property in a great suburb will always outperform a great property in a declining one. Suburbs with rising demand, improving amenity, and infrastructure investment attract buyers, push rents higher, and compress vacancy rates over time. These fundamentals compound — and the difference between choosing correctly and incorrectly in year one can be worth hundreds of thousands of dollars by year ten.",
      },
      {
        type: 'quote',
        text: "You can renovate a house. You cannot renovate a suburb.",
        attribution: 'Property investment principle',
      },
      { type: 'heading', level: 2, text: 'Signal 1 — Vacancy rates and rental demand' },
      {
        type: 'paragraph',
        text: "Vacancy rate measures the percentage of available rental properties that are currently unoccupied. A low vacancy rate (below 2%) signals high rental demand — meaning tenants compete for available stock, landlords can hold asking rents, and owner-occupiers face fewer distressed sales. A high vacancy rate (above 4%) is an early warning signal of oversupply or population decline.",
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Vacancy rate benchmarks',
        body: "Below 1% — extremely tight, strong buyer competition. 1–2% — healthy rental market, good demand. 2–3% — balanced. Above 3% — oversupply risk, weaker price growth likely. Above 5% — significant risk, investigate before buying.",
      },
      { type: 'heading', level: 2, text: 'Signal 2 — Infrastructure pipeline' },
      {
        type: 'paragraph',
        text: "Government infrastructure spending is one of the most reliable leading indicators of suburb performance. New train stations, motorway extensions, hospital precincts, and university campuses all bring jobs, population, and amenity to an area — before the price growth that follows. Buying into a suburb before infrastructure arrives is the single most reliable way to manufacture above-market returns.",
      },
      {
        type: 'list',
        items: [
          "State and federal infrastructure project announcements (Infrastructure Australia website)",
          "New public transport routes and station locations",
          "Hospital, school, or university expansion projects within 3 km",
          "Large employment centre relocations or business park developments",
          "Urban renewal zones and rezoning activity (check your state planning portal)",
        ],
      },
      { type: 'heading', level: 2, text: 'Signal 3 — Historical median price growth' },
      {
        type: 'paragraph',
        text: "Ten-year median growth rates reveal how a suburb has responded to macro-economic cycles, not just recent boom conditions. Look for suburbs with consistent 5–8% annualised growth rather than those with one exceptional year followed by stagnation. Volatility is a risk signal — stable, compounding growth is what builds wealth.",
      },
      {
        type: 'ai-insight',
        heading: 'AI suburb analysis in FirstNest AI',
        body: "FirstNest AI's property report scores each suburb across growth trend, rental yield, vacancy rate, and infrastructure pipeline — giving you a single suburb scorecard instead of 12 separate data sources to cross-reference. Input any address and receive an AI-generated assessment in seconds.",
      },
      { type: 'heading', level: 2, text: 'Signal 4 — School zone premiums' },
      {
        type: 'paragraph',
        text: "Proximity to high-performing public primary and secondary schools creates a persistent price premium that survives economic cycles. Owner-occupier families pay a sustained premium to be within catchment — typically 5–15% above comparable properties outside the zone. This premium also supports the property during downturns as demand from families remains relatively inelastic.",
      },
      { type: 'heading', level: 2, text: 'Signal 5 — Rental yield vs capital growth trade-off' },
      {
        type: 'paragraph',
        text: "Inner-city and high-demand suburbs typically offer lower rental yields (2.5–3.5%) but stronger capital growth. Regional and outer-suburban areas often deliver higher yields (4–6%) with more modest growth. As a first-home buyer, you should prioritise based on your primary goal: building equity faster (favour growth suburbs) or minimising holding costs (favour higher yields).",
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Regional vs metro considerations',
        body: "Regional markets can offer exceptional yields and affordable entry points — but demand is more volatile and liquidity (the ability to sell quickly) is lower. If purchasing regionally, ensure you have a 5–10 year horizon and are not dependent on being able to sell quickly.",
      },
    ],
  },

  {
    id: '5',
    slug: 'property-risks-first-home-buyers-miss',
    title: 'Common property risks first-home buyers miss',
    excerpt:
      'Strata levies, flood overlays, cladding issues, and easements rarely make it into a listing description. Our AI property report surfaces the risks that catch first-time buyers off guard — before you sign anything.',
    category: 'Property Risk',
    readTime: 6,
    gradientFrom: '#FEE2E2',
    gradientTo: '#FECACA',
    accentColor: '#DC2626',
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "Every property listing is a sales document. It is crafted to attract buyers, not to disclose inconvenient truths. Understanding what is legally required to be disclosed — and what is not — is the difference between a confident purchase and a costly mistake.",
      },
      { type: 'heading', level: 2, text: "What listing photos and descriptions leave out" },
      {
        type: 'paragraph',
        text: "Listing agents are legally required to disclose material defects and certain statutory matters, but the threshold for what constitutes a material defect is often higher than buyers expect. Issues that fall below legal disclosure thresholds — but that significantly affect liveability, cost, or future resale — are routinely omitted from listings.",
      },
      {
        type: 'quote',
        text: "The vendor disclosure form tells you what the agent is required to share. The building and pest report tells you what they didn't.",
        attribution: 'Licensed conveyancer perspective',
      },
      { type: 'heading', level: 2, text: 'Strata and body corporate traps' },
      {
        type: 'paragraph',
        text: "Apartments and townhouses within strata schemes carry shared financial obligations that buyers often underestimate. The strata levy (quarterly or annual fees paid to the body corporate) can range from $800 per quarter for a simple apartment to $5,000+ per quarter for buildings with complex facilities, aging infrastructure, or known defects under remediation.",
      },
      {
        type: 'list',
        items: [
          "Review the strata records — minutes of body corporate meetings reveal disputes, upcoming works, and financial health",
          "Check the sinking fund balance — a depleted sinking fund means special levies are likely",
          "Ask for the most recent strata inspection report (often available for free or low cost)",
          "Identify any outstanding orders or litigation against the building",
          "Confirm whether the building has any combustible cladding, and if so, what remediation is planned",
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Special levies can arrive without warning',
        body: "A special levy is an additional charge raised by the body corporate to cover unexpected or major costs — roof replacement, lift overhaul, waterproofing failure. These can be $5,000 to $50,000 per lot. Always review strata financials and outstanding works orders before purchasing in a strata scheme.",
      },
      { type: 'heading', level: 2, text: 'Environmental overlays: flood, fire, and contamination' },
      {
        type: 'paragraph',
        text: "Environmental overlays are planning restrictions that apply to land in flood-prone, bushfire-prone, or contaminated areas. They are attached to the title and travel with the property. They can affect insurability, development potential, and future resale value — and they are rarely mentioned in listing descriptions.",
      },
      {
        type: 'list',
        items: [
          "Check the flood overlay on your state planning portal before making an offer",
          "Review the Bushfire Attack Level (BAL) rating — higher ratings mean restricted construction and higher insurance",
          "Search the EPA contaminated land register for industrial history on or near the site",
          "Check for heritage overlays that restrict renovation or demolition",
          "Verify easements on the title — sewer, drainage, or powerline easements can restrict what you can build",
        ],
      },
      {
        type: 'ai-insight',
        heading: "How FirstNest AI flags property risks",
        body: "FirstNest AI's property report automatically checks for flood zone indicators, suburb bushfire risk classifications, and known strata risk patterns — and flags any concerns with severity ratings before you invest in further due diligence. Think of it as a first-pass risk filter before your professional inspections.",
      },
      { type: 'heading', level: 2, text: "Building and pest — what inspectors find most" },
      {
        type: 'paragraph',
        text: "A pre-purchase building and pest inspection typically costs $400–$700 and takes 2–3 hours. It is the single best investment a first-home buyer can make before exchanging contracts. Common issues found in Australian properties include:",
      },
      {
        type: 'list',
        items: [
          "Active or past termite activity — treatment can cost $2,000–$15,000 and may not fix structural damage",
          "Rising damp and moisture penetration — especially in older brick homes and bathrooms",
          "Roof defects — broken tiles, deteriorated flashing, blocked gutters — average repair $3,000–$12,000",
          "Inadequate subfloor ventilation and pest-attracting moisture beneath the house",
          "Unauthorised additions or alterations (pergolas, garages, extensions) that lack council approval",
        ],
      },
      { type: 'heading', level: 2, text: 'Your due diligence checklist before exchanging' },
      {
        type: 'list',
        ordered: true,
        items: [
          "Order a building and pest inspection from a licensed, independent inspector (not one recommended by the agent)",
          "Review the Section 32 / vendor disclosure statement with your conveyancer",
          "Check for planning overlays, easements, and encumbrances on the title",
          "Request strata records and financials (for apartments and townhouses)",
          "Verify council rates, water rates, and any outstanding orders",
          "Check the property's flood, bushfire, and contamination status via state planning portals",
          "Confirm the property's insurance history and current insurability — some lenders require this",
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Use professionals — this is the one area not to DIY',
        body: "Your conveyancer reviews the legal title. Your building inspector assesses the physical structure. Your mortgage broker reviews the loan. No single professional covers all risk areas. Engage all three before exchanging contracts on any property.",
      },
    ],
  },

  {
    id: '6',
    slug: 'stamp-duty-concessions-by-state',
    title: 'Stamp duty concessions by state',
    excerpt:
      "Stamp duty varies dramatically across Australia — NSW, VIC, and QLD each have different thresholds, exemptions, and phase-in rules for first-home buyers. Find out exactly what you'll pay (or save) in your state.",
    category: 'Grants',
    readTime: 5,
    gradientFrom: '#FFF9D6',
    gradientTo: '#FFE88A',
    accentColor: '#C8973A',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "Stamp duty — formally called transfer duty in most states — is a state government tax applied to the purchase of real property. For many first-home buyers, it represents the second-largest upfront cost after the deposit. But in most Australian states, first-home buyers receive either a full exemption or a significant concession. The rules, however, are anything but uniform.",
      },
      { type: 'heading', level: 2, text: 'What is stamp duty and how is it calculated?' },
      {
        type: 'paragraph',
        text: "Stamp duty is calculated as a percentage of the purchase price (or the property's market value, whichever is higher). The rate increases progressively with the purchase price — similar to income tax brackets. On a $650,000 property in NSW, a non-first-home buyer would pay approximately $24,505 in stamp duty. A first-home buyer on the same property pays nothing.",
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Stamp duty is a state tax — not federal',
        body: "Every state and territory sets its own stamp duty rates, thresholds, and first-home buyer concessions. There is no national standard. Rules that apply in NSW may be completely different in QLD or WA. Always verify with your state revenue office or a licensed conveyancer before budgeting.",
      },
      { type: 'heading', level: 2, text: 'First-home buyer exemptions and concessions' },
      {
        type: 'paragraph',
        text: "All Australian states and territories offer some form of stamp duty relief for first-home buyers, but the thresholds, structures, and qualifying conditions vary significantly. Some states offer full exemptions below a price threshold; others offer partial concessions that phase out above a certain value. A few states have introduced alternative models entirely.",
      },
      { type: 'heading', level: 2, text: 'NSW — stamp duty or annual property tax?' },
      {
        type: 'paragraph',
        text: "NSW first-home buyers purchasing new or existing properties below $800,000 are exempt from stamp duty entirely. Properties between $800,000 and $1,000,000 receive a partial concession. Above $1,000,000, standard duty applies. NSW also introduced an opt-in annual property tax (First Home Buyer Choice) as an alternative to upfront stamp duty for properties up to $1.5M — allowing buyers to pay annually rather than as a lump sum at purchase.",
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'The NSW annual property tax choice is permanent',
        body: "If you opt into the annual property tax in NSW, that election follows the property — not just your ownership. Future buyers will inherit the property tax regime. Consult a financial adviser before choosing, as the optimal choice depends on your intended holding period and future resale strategy.",
      },
      { type: 'heading', level: 2, text: 'VIC — full exemptions below $600,000' },
      {
        type: 'paragraph',
        text: "Victorian first-home buyers are fully exempt from stamp duty on properties up to $600,000. Between $600,000 and $750,000, a sliding concession applies — buyers pay duty on the amount above $600,000 only. Above $750,000, full duty applies. VIC also offers additional concessions for off-the-plan purchases, which can reduce duty significantly on qualifying developments.",
      },
      { type: 'heading', level: 2, text: 'QLD, SA, WA, TAS, ACT, NT — quick reference' },
      {
        type: 'list',
        items: [
          "QLD — full exemption up to $500,000 for first homes; partial concession $500K–$550K",
          "SA — full exemption on new builds (not established homes) for eligible first-home buyers",
          "WA — full exemption up to $430,000; partial concession $430K–$530K (metro); higher thresholds in regional areas",
          "TAS — full exemption on established homes for first-home buyers (no price cap currently)",
          "ACT — Home Buyer Concession Scheme replaces stamp duty for eligible buyers based on income, not property price",
          "NT — full exemption up to $650,000 for first homes; partial concession $650K–$750K",
        ],
      },
      {
        type: 'ai-insight',
        heading: 'Calculate your exact stamp duty saving',
        body: "FirstNest AI calculates your state-specific stamp duty saving as part of the grant analysis — factoring in your target property price, state, residency status, and first-home buyer status. The result is included in your total estimated benefit alongside FHOG and other schemes.",
      },
      { type: 'heading', level: 2, text: 'Recent changes affecting buyers in 2025' },
      {
        type: 'paragraph',
        text: "Stamp duty thresholds are not static. Several states updated their first-home buyer concession thresholds in 2023 and 2024 in response to rising property prices. QLD raised its concession threshold from $400,000 to $500,000 in mid-2024. NSW introduced inflation-linked threshold adjustments. WA has extended its regional threshold. Always verify current thresholds at the time of purchase — rules can and do change mid-financial year.",
      },
      {
        type: 'quote',
        text: "Stamp duty is one of the most impactful financial levers available to first-home buyers — but only if you understand the rules in your specific state before you sign a contract.",
        attribution: 'FirstNest AI Grants Analysis',
      },
    ],
  },

  {
    id: '7',
    slug: 'when-to-speak-to-mortgage-broker',
    title: 'When should you speak to a mortgage broker?',
    excerpt:
      "A broker can pre-approve you before you find the property, compare 30+ lenders in hours, and structure your loan to maximise grant access. Most first-home buyers wait too long — here is when to make the call.",
    category: 'Buying Strategy',
    readTime: 4,
    gradientFrom: '#E8F4F8',
    gradientTo: '#D0EAF5',
    accentColor: '#0369A1',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "Most first-home buyers contact a mortgage broker after they have found a property they want to buy. This is the wrong order. A broker engaged 3–6 months before you need finance can meaningfully improve your outcome — not just your interest rate, but your grant eligibility, borrowing capacity, and the structure of your loan.",
      },
      { type: 'heading', level: 2, text: 'The case for going early' },
      {
        type: 'paragraph',
        text: "Engaging a broker early gives you time to fix problems before they affect your application. A broker can identify gaps in your genuine savings history, advise on debt reduction that improves your borrowing capacity, confirm your grant eligibility, and pre-position you for schemes like the First Home Guarantee before annual places are allocated.",
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Ideal timing: 3–6 months before you need finance',
        body: "This gives you time to consolidate debts, build genuine savings history, correct any credit file errors, and ensure your income documentation is clean — all of which directly improve your loan terms and borrowing capacity.",
      },
      { type: 'heading', level: 2, text: "What a broker does that your bank won't" },
      {
        type: 'list',
        items: [
          "Access to 30–40+ lenders, including specialist and non-bank lenders your branch cannot offer",
          "Compare loan features, interest rates, offset accounts, and repayment flexibility across the market",
          "Structure the loan to maximise access to FHOG, FHBG, or FHSS in your specific situation",
          "Handle all lender communication, documentation requests, and follow-up",
          "Identify which lenders assess your income most favourably (crucial for self-employed buyers or those with non-standard income)",
          "Provide a credit assessment without a formal credit enquiry — protecting your credit score",
        ],
      },
      {
        type: 'ai-insight',
        heading: 'Broker vs direct lender — what the data shows',
        body: "Buyers who use mortgage brokers consistently report higher approval rates and better loan terms than those who apply directly with their existing bank. The primary reason: brokers know which lenders are actively competing for first-home buyer business at any given time — and bank branches do not.",
      },
      { type: 'heading', level: 2, text: 'Pre-approval vs conditional approval' },
      {
        type: 'paragraph',
        text: "Pre-approval (sometimes called approval in principle or conditional approval) is an assessment by a lender of how much they are prepared to lend you, subject to finding a suitable property. It typically lasts 90 days and is renewable. Having pre-approval when you make an offer strengthens your negotiating position significantly — vendors know you can proceed.",
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Pre-approval validity and credit enquiries',
        body: "Each formal loan application triggers a hard credit enquiry. Multiple enquiries in a short period can affect your credit score. A broker submits one application to one lender on your behalf — rather than you applying to five banks simultaneously. This protects your credit file.",
      },
      { type: 'heading', level: 2, text: 'How to choose the right broker' },
      {
        type: 'list',
        items: [
          "Check they are credit-licensed (AFCA member, ACL holder) — verify on the ASIC Connect register",
          "Ask how many lenders they have on their panel — fewer than 20 limits your options",
          "Confirm they have experience with first-home buyer grants and government schemes",
          "Ask how they are remunerated — most brokers are paid by lenders (trail and upfront commission), not by you",
          "Look for a broker who explains options clearly rather than pushing a single product",
        ],
      },
      { type: 'heading', level: 2, text: 'Questions to ask at your first meeting' },
      {
        type: 'list',
        items: [
          "How much can I borrow based on my current income and savings?",
          "Which grants and schemes am I eligible for, and how do they affect my loan structure?",
          "What do I need to do in the next 90 days to improve my application?",
          "Which lenders on your panel are most competitive for first-home buyers right now?",
          "What does my repayment look like at current variable rates, and what if rates rise 1%?",
          "Do you have experience with the First Home Guarantee scheme, and which of your lenders participate?",
        ],
      },
      {
        type: 'quote',
        text: "The best time to speak to a broker is before you think you need one. The second best time is right now.",
        attribution: 'FirstNest AI Buying Strategy Guide',
      },
    ],
  },

  {
    id: '8',
    slug: 'how-ai-supports-first-home-buying',
    title: 'How AI can support your first-home buying journey',
    excerpt:
      `From grant eligibility to property scoring and suburb analysis, AI removes the guesswork from one of life's biggest decisions. Here is how platforms like FirstNest AI are changing the way Australians buy their first home.`,
    category: 'Buying Strategy',
    readTime: 5,
    gradientFrom: '#1B2B3A',
    gradientTo: '#283D52',
    accentColor: '#FFCC00',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "Buying a first home in Australia involves navigating a complex, fragmented system of government schemes, lender policies, state-specific rules, and property market data. Until recently, this complexity was managed almost entirely by human advisers — mortgage brokers, conveyancers, buyer's agents — at significant cost and with uneven outcomes. AI is changing that.",
      },
      { type: 'heading', level: 2, text: 'The old way — and why it overwhelms buyers' },
      {
        type: 'paragraph',
        text: "The traditional home-buying process requires buyers to self-navigate grant eligibility across 8 state government websites, understand income thresholds that change annually, calculate borrowing capacity manually, research suburb data across multiple platforms, and coordinate 4–5 professional advisers simultaneously. Most first-home buyers are doing this for the first time, under financial stress, while working full-time. The information asymmetry is significant.",
      },
      {
        type: 'quote',
        text: "First-home buyers do not lack motivation. They lack a system that connects all the pieces — grant eligibility, borrowing capacity, suburb analysis, and property risk — into a single, personalised picture.",
        attribution: 'FirstNest AI Product Philosophy',
      },
      { type: 'heading', level: 2, text: 'What AI changes about the buying process' },
      {
        type: 'list',
        items: [
          "Grant eligibility checked instantly across all states and schemes — personalised to your profile",
          "Borrowing capacity calculated with lender-style logic in seconds, not weeks",
          "Suburb data synthesised from multiple sources into a single scorecard",
          "Property risk flags surfaced before you spend on professional due diligence",
          "Plain English explanations of complex financial concepts — on demand, at any hour",
          "Personalised buying timeline and savings strategy based on your actual numbers",
        ],
      },
      {
        type: 'ai-insight',
        heading: 'How FirstNest AI processes your profile',
        body: "When you enter your income, savings, state, and buying goals, FirstNest AI sends your profile to a grant eligibility engine, a borrowing capacity model, and a strategy adviser simultaneously — returning a personalised report within seconds. The same analysis would take 3–4 separate adviser meetings in the traditional process.",
      },
      { type: 'heading', level: 2, text: 'Grant intelligence at scale' },
      {
        type: 'paragraph',
        text: "Australia has 12+ active first-home buyer schemes at any given time — federal, state, and territory-level. Each has different income thresholds, property price caps, residency requirements, and application processes. Manually cross-referencing these against a buyer's profile is time-consuming and error-prone. AI processes all rules simultaneously against your specific profile and returns a ranked, personalised grant list with dollar values and next steps.",
      },
      {
        type: 'grant',
        name: 'Combined grant value — example buyer',
        value: 'Up to $41,800',
        note: "FHOG ($10,000) + stamp duty concession ($20,000) + FHBG LMI saving ($11,800) for an eligible Sydney buyer on $90,000 income purchasing a $620,000 new build.",
        status: 'eligible',
      },
      { type: 'heading', level: 2, text: 'Property scoring and risk flagging' },
      {
        type: 'paragraph',
        text: "FirstNest AI's property report analyses any address or listing description and returns a structured assessment covering fair value estimation, suburb growth trends, rental yield, vacancy rate, known risk factors, and a plain-English buying recommendation. It is not a replacement for a professional building inspection or conveyancer — but it is a powerful first-pass filter that helps buyers decide whether to invest in further due diligence.",
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'What to look for in an AI property tool',
        body: "A useful AI property analysis should be transparent about its assumptions, flag uncertainty where data is limited, and recommend professional verification for high-risk findings. Be cautious of tools that provide scores without explaining the methodology — a number without reasoning is not intelligence.",
      },
      { type: 'heading', level: 2, text: 'The human + AI partnership' },
      {
        type: 'paragraph',
        text: "AI does not replace mortgage brokers, conveyancers, or buyer's agents — it makes each of those professionals more effective. A buyer who arrives at a broker meeting with an AI-generated grant summary, borrowing capacity estimate, and suburb analysis is better prepared, asks better questions, and gets more value from the professional's time. AI handles the information layer; humans handle the judgement and relationship layer.",
      },
      { type: 'heading', level: 2, text: 'What FirstNest AI does differently' },
      {
        type: 'paragraph',
        text: "FirstNest AI is built specifically for Australian first-home buyers aged 25–40 — not for investors, not for the US market, and not as a generic financial calculator. Every grant rule, borrowing model, and property framework is calibrated to the Australian regulatory environment. The result is a tool that feels less like a calculator and more like a knowledgeable guide who has already done all the research.",
      },
    ],
  },

  {
    id: '9',
    slug: 'understanding-your-borrowing-power',
    title: 'Understanding your borrowing power before you start searching',
    excerpt:
      "Most buyers discover their borrowing limit after falling in love with a property — and it's rarely good news. Here is how to calculate your capacity accurately and improve it before your search begins.",
    category: 'Mortgage Readiness',
    readTime: 5,
    gradientFrom: '#EFF6FF',
    gradientTo: '#DBEAFE',
    accentColor: '#1D4ED8',
    image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&h=480&q=80&auto=format&fit=crop',
    content: [
      {
        type: 'paragraph',
        text: "Knowing your borrowing power before you start searching is the single most important piece of preparation a first-home buyer can do. It calibrates your property search, prevents emotional attachment to homes outside your reach, and puts you in a position to move quickly when the right property appears.",
      },
      { type: 'heading', level: 2, text: "Why most buyers get this wrong" },
      {
        type: 'paragraph',
        text: "The most common mistake is relying on online calculators that use simplified formulas. Lenders apply a serviceability stress test at 3% above the current rate — which can reduce your estimated borrowing capacity by $100,000–$200,000 compared to basic calculator estimates. The gap between what a calculator says and what a lender approves can derail a property search that has been running for months.",
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'What a serviceability stress test means for you',
        body: "If today's variable rate is 6.5%, your lender assesses your ability to repay at 9.5%. This protects you from future rate rises — but it also means your real borrowing capacity is often significantly lower than you expect from a basic calculator.",
      },
      { type: 'heading', level: 2, text: 'The key factors lenders assess' },
      {
        type: 'list',
        items: [
          "Gross income — before tax, including salary, bonuses, rental income, and allowances",
          "Existing commitments — HECS-HELP, car loans, personal loans, and credit card limits (not just balances)",
          "Number of dependants — affects the household living expense benchmark lenders apply",
          "Employment type — permanent full-time is assessed most favourably; self-employed requires 2 years of tax returns",
          "Genuine savings — the amount held for at least 3 months, not total savings",
        ],
      },
      { type: 'heading', level: 2, text: 'How to improve your borrowing capacity' },
      {
        type: 'list',
        items: [
          "Cancel unused credit cards — lenders count the full limit, not the outstanding balance",
          "Pay down personal and car loans in the 3–6 months before applying",
          "Avoid large unexplained expenses in the months before application",
          "Delay major purchases — new cars, overseas holidays on credit — until after settlement",
          "If self-employed, ensure your last two tax returns accurately reflect your true income",
        ],
      },
      {
        type: 'ai-insight',
        heading: 'FirstNest AI borrowing estimate',
        body: "FirstNest AI calculates your estimated borrowing capacity using lender-style serviceability logic — including the 3% stress rate buffer and income type adjustments. The result is a realistic range grounded in how lenders actually assess applications, not a theoretical maximum.",
      },
      {
        type: 'quote',
        text: "Borrowing power is not fixed. It responds to your financial behaviour — and the decisions you make in the 12 months before your application matter far more than most buyers realise.",
        attribution: 'FirstNest AI Strategy Engine',
      },
    ],
  },
]

export const ALL_CATEGORIES: ArticleCategory[] = [
  'Grants',
  'Buying Strategy',
  'Property Risk',
  'Suburbs',
  'Mortgage Readiness',
]
