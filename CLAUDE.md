@AGENTS.md
# FirstNest — Frontend POC
## CLAUDE.md Specification Document
### Version 3.0 | June 2026 | Mobile-First Web Application

---

## 1. PROJECT OVERVIEW

**Product:** FirstNest — Australian First Home Buyer App  
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS  
**Tagline:** "Know your budget. Know your grants. Know your next step."  
**Secondary Tagline (hero subtext):** "Your first home, made easier — in about 3 minutes."

**Purpose:** A mobile-first web app that guides Australian first home buyers through:
1. Government grant & scheme eligibility (PRIMARY FLOW — shown first)
2. Borrowing capacity estimation (SECONDARY FLOW)

**POC Scope:** Frontend only. No backend. All data stored in `localStorage`. All calculations use dummy/formula logic. No auth required.

---

## 2. DESIGN SYSTEM

### 2.1 Colour Palette

```
--color-lemon:        #F5E642   /* Primary CTA, highlights, accents */
--color-lemon-light:  #FBF6A8   /* Hover states, soft backgrounds */
--color-lemon-dark:   #D4C400   /* Active/pressed states */
--color-black:        #111111   /* Primary text, navbar */
--color-charcoal:     #222222   /* Body text */
--color-grey-dark:    #444444   /* Secondary text, labels */
--color-grey-mid:     #888888   /* Placeholder text, hints */
--color-grey-light:   #F0F0F0   /* Input backgrounds, dividers */
--color-white:        #FFFFFF   /* Page backgrounds, cards */
--color-green:        #22C55E   /* Eligible / success */
--color-amber:        #F59E0B   /* Check required / warning */
--color-red-soft:     #FCA5A5   /* Inline errors (no harsh red) */
--color-overlay:      rgba(0,0,0,0.55) /* Video hero overlay */
```

### 2.2 Typography

```
Font Stack:
  Display:  'Plus Jakarta Sans', sans-serif   (weights: 700, 800)
  Body:     'Inter', sans-serif               (weights: 400, 500, 600)
  Mono:     'JetBrains Mono', monospace       (dollar figures only)

Import via Google Fonts:
  https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600&display=swap

Type Scale (mobile-first):
  --text-hero:    2rem / 2.4rem line-height    (Plus Jakarta Sans 800)
  --text-h1:      1.625rem / 2rem              (Plus Jakarta Sans 700)
  --text-h2:      1.25rem / 1.75rem            (Plus Jakarta Sans 700)
  --text-h3:      1.0625rem / 1.5rem           (Inter 600)
  --text-body:    0.9375rem / 1.5rem           (Inter 400)
  --text-small:   0.8125rem / 1.25rem          (Inter 400)
  --text-money:   2rem / 1                     (JetBrains Mono 700, lemon accent)
```

### 2.3 Spacing & Layout

```
--space-xs:   4px
--space-sm:   8px
--space-md:   16px
--space-lg:   24px
--space-xl:   32px
--space-2xl:  48px
--space-3xl:  64px

Max content width:   480px (mobile-first)
Desktop max-width:   1200px
Page horizontal pad: 20px (mobile), 24px (tablet+)

Border radius:
  --radius-sm:   8px   (inputs, small chips)
  --radius-md:   12px  (cards)
  --radius-lg:   20px  (CTA buttons, modals)
  --radius-full: 9999px (pill buttons, badges)
```

### 2.4 Shadows

```
--shadow-card:   0 2px 12px rgba(0,0,0,0.08)
--shadow-raised: 0 4px 24px rgba(0,0,0,0.12)
--shadow-modal:  0 8px 40px rgba(0,0,0,0.18)
```

### 2.5 Component Tokens

```
/* CTA Button — Primary */
background: var(--color-lemon)
color: var(--color-black)
font: Inter 600, uppercase, letter-spacing 0.05em
padding: 18px 32px
border-radius: var(--radius-lg)
min-height: 56px  /* thumb-friendly */
width: 100%       /* full-width on mobile */
transition: transform 80ms, box-shadow 120ms

/* CTA Button — Secondary (outline) */
background: transparent
border: 2px solid var(--color-black)
color: var(--color-black)

/* Input Field — Aussie.com.au style */
height: 56px
background: var(--color-white)
border: 1.5px solid #DDDDDD
border-radius: var(--radius-sm)
padding: 0 16px
font: Inter 400 0.9375rem
color: var(--color-charcoal)
transition: border-color 150ms

/* Input Focus */
border-color: var(--color-black)
outline: none
box-shadow: 0 0 0 3px rgba(245,230,66,0.35)

/* Input Error */
border-color: #E53E3E
box-shadow: 0 0 0 3px rgba(252,165,165,0.3)

/* Input Prefix ($ symbol) */
color: var(--color-grey-mid)
font: Inter 500 0.9375rem
position: absolute, left 16px, vertically centred
```

---

## 3. APP ARCHITECTURE & ROUTING

### 3.1 File Structure

```
/app
  /page.tsx                        → Home (landing page)
  /onboarding
    /page.tsx                      → Onboarding multi-step form
  /results
    /grants/page.tsx               → Grant Eligibility Results (PRIMARY)
    /borrowing/page.tsx            → Borrowing Capacity Results (SECONDARY)
  /next-steps/page.tsx             → Decision & Next Steps
  /my-results/page.tsx             → Saved Results tab
  /layout.tsx                      → Root layout (nav + persistent state)

/components
  /ui
    Button.tsx
    InputField.tsx
    SliderField.tsx
    ProgressBar.tsx
    ToggleSwitch.tsx
    Tooltip.tsx
    AutoSaveIndicator.tsx
    ExpandableCard.tsx
    BadgeChip.tsx
  /home
    HeroVideo.tsx
    QuickAccessCards.tsx           → 2 cards: Govt Schemes + Borrowing Capacity
    InfoChecklist.tsx              → "What information will I need?" panel
  /onboarding
    StepWrapper.tsx
    Step1_PersonalDetails.tsx
    Step2_FinancialDetails.tsx
    Step3_PropertyGoals.tsx
    Step4_SituationCheck.tsx
  /results
    GrantCard.tsx
    StampDutyCard.tsx
    BorrowingRangeDisplay.tsx
    ScenarioSliders.tsx
    DepositGapIndicator.tsx
    TotalSavingsHero.tsx
  /next-steps
    BrokerCard.tsx
    PropertyPortalButton.tsx
    ShareResultsPanel.tsx

/lib
  /localStorage.ts                 → All localStorage read/write helpers
  /calculations.ts                 → Borrowing capacity formula (dummy)
  /grantEligibility.ts             → Eligibility rule engine (dummy data)
  /stampDuty.ts                    → State-by-state stamp duty tables
  /dummyData.ts                    → Seed data for development

/hooks
  useAutoSave.ts                   → Debounced localStorage auto-save hook
  useFormSession.ts                → Session resume logic
  useProgress.ts                   → Step progress tracking
```

### 3.2 Navigation Flow

```
HOME (/)
  ├── [Card 1] "See Your Grants"           → /onboarding?flow=grants
  ├── [Card 2] "Check Borrowing Capacity"  → /onboarding?flow=borrowing
  └── [CTA] "Show My Borrowing Capacity"  → /onboarding?flow=borrowing

ONBOARDING (/onboarding)
  Step 1 → Step 2 → Step 3 → Step 4
  ↓ (after Step 4)
  IF flow=grants  → /results/grants
  IF flow=borrowing → /results/borrowing
  (Both results are always calculated; flow param just controls which shows FIRST)

RESULTS — GRANTS (/results/grants)
  └── Tab/link to → /results/borrowing

RESULTS — BORROWING (/results/borrowing)
  └── Tab/link to → /results/grants

BOTH RESULTS → /next-steps

PERSISTENT NAV TAB: "My Results" → /my-results
```

---

## 4. PAGE SPECIFICATIONS

---

### PAGE 1: HOME (`/`)

#### 4.1 Navbar
```
Layout: Fixed top, height 56px, white background, z-index 50
Left:   Logo — house icon (🏠 emoji or SVG) + "FirstNest" in Plus Jakarta Sans 700, black
Right:  "My Results" text link (black, Inter 500)
Border: 1px solid #EEEEEE bottom
```

#### 4.2 Hero Section — YouTube Video Background

**CRITICAL REQUIREMENT: Compact hero, NOT full-screen. Mirror realestate.com.au's minimal-height hero.**

```
Layout:
  position: relative
  height: 240px (mobile) / 320px (tablet) / 400px (desktop)
  overflow: hidden
  background: #111111 (fallback)

YouTube Embed (muted autoplay loop):
  Video ID: dQw4w9WgXcQ  ← REPLACE WITH CLIENT'S VIDEO
  URL: https://www.youtube.com/embed/{VIDEO_ID}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&playlist={VIDEO_ID}&playsinline=1
  iframe styles:
    position: absolute
    top: 50%, left: 50%
    transform: translate(-50%, -50%)
    min-width: 100%, min-height: 100%
    width: auto, height: auto
    pointer-events: none

Dark overlay:
  position: absolute, inset 0
  background: rgba(0,0,0,0.50)

Hero Content (centred over video):
  position: absolute, inset 0
  display: flex, flex-direction: column, align-items: center, justify-content: center
  padding: 0 20px, text-align: center

  Headline:
    "Know your budget. Know your grants. Know your next step."
    font: Plus Jakarta Sans 800, 1.5rem (mobile) / 2rem (tablet)
    color: white
    max-width: 360px
    text-shadow: 0 1px 4px rgba(0,0,0,0.4)

  Sub-tagline:
    "Australia's smartest first home buyer tool — free, fast, no login needed."
    font: Inter 400, 0.875rem
    color: rgba(255,255,255,0.85)
    margin-top: 8px

  Time badge (below subtagline):
    "⏱ Takes about 3 minutes"
    background: rgba(255,255,255,0.15)
    backdrop-filter: blur(4px)
    border: 1px solid rgba(255,255,255,0.25)
    border-radius: 9999px
    padding: 4px 14px
    font: Inter 500, 0.8125rem
    color: white
    margin-top: 12px
```

#### 4.3 Two Quick-Access Cards

```
Layout:
  Placed DIRECTLY BELOW the hero (not inside it)
  Padding: 20px horizontal, 20px top, 12px bottom
  Display: grid, 2 columns, gap 12px

CARD 1 — Government Schemes (PRIMARY — slightly more prominent)
  background: var(--color-lemon)
  border-radius: var(--radius-md)
  padding: 20px
  box-shadow: var(--shadow-card)
  border: none
  
  Icon: 🏛️ (32px emoji or SVG, top left)
  Title: "Government Schemes"  — Plus Jakarta Sans 700, 1rem, black
  Subtitle: "See grants you qualify for"  — Inter 400, 0.8125rem, #444444
  Badge: "Most Popular →" — tiny pill, black bg, white text, bottom right
  onClick → /onboarding?flow=grants

CARD 2 — Borrowing Capacity
  background: var(--color-white)
  border: 1.5px solid #EEEEEE
  border-radius: var(--radius-md)
  padding: 20px
  box-shadow: var(--shadow-card)
  
  Icon: 💰 (32px)
  Title: "Borrowing Capacity"  — Plus Jakarta Sans 700, 1rem, black
  Subtitle: "See how much you can borrow"  — Inter 400, 0.8125rem, #444444
  onClick → /onboarding?flow=borrowing
```

#### 4.4 Main CTA Button

```
Below the two cards, full-width, margin-top 8px:
  Text: "SHOW MY BORROWING CAPACITY"
  Style: Primary CTA (lemon, black text, full-width, 56px height, uppercase)
  Sub-note beneath: "No sign-up · No credit check · 100% free"
                     font: Inter 400 0.75rem, color: #888888, text-center
  onClick → /onboarding?flow=borrowing
```

#### 4.5 "What Information Will I Need?" Collapsible

```
Trigger: Text link with ⓘ icon — "What information will I need?"
         font: Inter 500, 0.875rem, color: var(--color-black), underline dotted
         margin-top: 20px, centered

Expanded panel (inline below trigger, animated):
  background: #F9F9F9
  border: 1px solid #EEEEEE
  border-radius: var(--radius-sm)
  padding: 16px
  margin-top: 8px

  Content (4 items, each with ✓ icon):
    ✓ Your gross annual income (salary or wages)
    ✓ Monthly expenses (rent, bills, subscriptions)
    ✓ Current savings or deposit amount
    ✓ The state you want to buy in
  
  Footer note (italic):
    "This is not a credit check. Your data stays on your device."
    font: Inter 400 0.8125rem, color: #888888
```

#### 4.6 Session Resume Banner

```
Shown ONLY if localStorage key 'firstnest_progress' exists:
  Appears at TOP of page, below navbar (not a modal)
  background: var(--color-lemon-light)
  border-bottom: 2px solid var(--color-lemon)
  padding: 12px 20px
  
  Left: "👋 Welcome back! You were on Step {N} of 4."
        font: Inter 600, 0.875rem, black
  Right: Two buttons side by side:
    [Continue →]    — small lemon pill button
    [Start fresh]   — grey ghost button (clears localStorage on tap, confirm via inline prompt not modal)
```

---

### PAGE 2: ONBOARDING (`/onboarding`)

#### 4.7 Onboarding Shell

```
Full-height page, white background.
Top: Fixed progress bar row
  height: 56px
  Left: Back chevron (←), tappable, navigates to prev step (no data loss)
  Centre: "Step {N} of 4" — Inter 500, 0.875rem, #444444
  Right: [Save & Exit] — ghost link, Inter 500, 0.875rem

Progress Bar (below the row):
  Full-width strip, height 4px
  Background: #EEEEEE
  Fill: var(--color-lemon), width = (step/4 * 100)%
  Transition: width 300ms ease

Auto-save Indicator:
  Appears bottom-centre of screen, floating
  "✓ Progress saved" — small pill
  background: #111111, color: white, font: Inter 500 0.75rem
  border-radius: 9999px, padding: 6px 16px
  Fades in on any keystroke, fades out after 2.5s
  Triggered by useAutoSave hook (300ms debounce → localStorage write)
```

#### 4.8 Step 1 — Who Are You? (Personal Details)

```
Personalisation note: Greet user based on flow param:
  flow=grants:     "Let's find every grant you qualify for 🏛️"
  flow=borrowing:  "Let's figure out how much you can borrow 💰"

Fields (max 3 on this screen):

1. First Name *
   Label: "What's your first name?"
   Type: text, placeholder: "e.g. Sarah"
   Tooltip: "We'll use this to personalise your results — nothing is shared."
   Auto-save: yes

2. State / Territory *
   Label: "Which state or territory are you buying in?"
   Type: custom select (styled pill chips — NOT a native <select>)
   
   Pill chips layout (wrap):
     [NSW]  [VIC]  [QLD]  [SA]  [WA]  [TAS]  [ACT]  [NT]
   
   Chip style (unselected):
     background: white, border: 1.5px solid #DDDDDD
     border-radius: 9999px, padding: 10px 18px
     font: Inter 500 0.875rem, color: #444444
   
   Chip style (selected):
     background: #111111, color: white
     border-color: #111111
   
   Auto-save: yes

3. Buying situation *
   Label: "Are you buying alone or with someone?"
   Type: two large tap cards (NOT radio buttons)
   
   Card A: "👤 Just me"
   Card B: "👥 With a partner"
   
   Card style (unselected): white, border 1.5px #DDDDDD, radius 12px, padding 16px
   Card style (selected):   lemon background, border 2px black

Inline personalisation message (appears AFTER name is typed, 400ms delay):
  "Nice to meet you, {firstName}! 👋 This takes about 3 minutes."
  font: Inter 500, 0.875rem, colour: #444444
  Appears below the name field as a subtle animated fade-in
  ONLY shows if firstName.length >= 2

CTA: [NEXT →] — full-width lemon button
```

#### 4.9 Step 2 — Your Money (Financial Details)

```
Contextual header (uses firstName from Step 1):
  "{firstName}, tell us about your income"
  font: Plus Jakarta Sans 700, 1.25rem

Fields:

1. Annual Income (before tax) *
   Label: "Your gross annual income"
   Type: number with $ prefix (Aussie.com.au style)
   Placeholder: "$0"
   Prefix: "$" fixed left icon, grey
   Tooltip: "Enter your annual salary before tax (PAYG or self-employed average)"
   Formatter: auto-formats to $XX,XXX on blur
   Auto-save: yes

2. Partner Income (conditional — only shows if Step 1 = "With a partner")
   Label: "Your partner's gross annual income"
   Same style as above
   
   Appearance animation: slide-in from below, smooth

3. Monthly Expenses *
   Label: "Your regular monthly expenses"
   Type: number with $ prefix
   Placeholder: "$0"
   Tooltip: "Include rent, bills, phone, subscriptions, loan repayments — not groceries or discretionary spend"
   Auto-save: yes

Helper text (below expenses field):
  "💡 Most Australians spend $2,500–$4,500/month on essentials."
  font: Inter 400 0.8125rem, colour: #888888

CTA: [NEXT →] + back chevron
```

#### 4.10 Step 3 — Your Savings & Property Goals

```
Contextual header:
  "Now, let's talk savings and goals"

Fields:

1. Current Savings / Deposit *
   Label: "How much have you saved so far?"
   Type: number with $ prefix
   Auto-save: yes

2. Target Property Price *
   Label: "What's your target property price?"
   Type: number with $ prefix
   Helper text: "An estimate is fine — you can adjust this later."
   Link below: "ⓘ What if I'm unsure?" — expands inline:
     "Check realestate.com.au or Domain for recent sales in your target suburb."
   Auto-save: yes

3. Property Type *
   Label: "What type of property are you looking at?"
   Type: pill chips (same style as state chips)
   Options: [🏠 House]  [🏘️ Townhouse]  [🏢 Apartment]  [🏗️ Off-the-plan]

4. First home buyer status *
   Label: "Have you or your partner ever owned property in Australia?"
   Type: two tap cards
   Card A: "No — this is my first" (pre-selected)
   Card B: "Yes — I have owned before"

CTA: [NEXT →] + back
```

#### 4.11 Step 4 — Quick Situation Check

```
Contextual header (uses firstName):
  "Almost there, {firstName}! Just a couple more things."

Emotional tone: Light, encouraging. User is 75% done — show that in progress bar.

Fields:

1. Employment Type *
   Label: "How are you currently employed?"
   Type: pill chips
   Options: [👔 Full-time]  [⏰ Part-time]  [💼 Self-employed]  [📋 Casual]  [📌 Contract]

2. Credit Card Limit (combined)
   Label: "What's your total credit card limit? (if any)"
   Type: number with $ prefix
   Placeholder: "$0"
   Tooltip: "Banks assess your borrowing power against your total limit, not your balance."
   Required: no (shows "0 or none" as ghost option)
   Auto-save: yes

3. HECS/HELP Debt
   Label: "Do you have a HECS or HELP debt?"
   Type: two tap cards
   Card A: "No"
   Card B: "Yes"

4. Other Loans / Debts
   Label: "Any other regular loan repayments?"
   Type: number with $ prefix (monthly amount)
   Placeholder: "$0 (none)"
   Auto-save: yes

Completion nudge (bottom of form, above CTA):
  Yellow micro-banner:
    "🎉 Great work — your results are ready to calculate!"
    background: var(--color-lemon-light), border-radius 8px, padding 12px 16px

CTA: [SEE MY RESULTS →]
  background: black, color: lemon (reverse of usual — stands out as final action)
  Triggers calculation, navigates to /results/grants (always grants first)
```

#### 4.12 Onboarding — General UX Rules

```
VALIDATION:
  - Validate on "Next" tap, not on blur
  - Error messages appear INLINE below the field (NOT toast, NOT modal)
  - Error style: Inter 400, 0.8125rem, colour #E53E3E
  - Required fields marked with subtle * (not loud red asterisks)

BACK NAVIGATION:
  - Back button NEVER clears data
  - Back always restores previous step's field values from localStorage

AUTO-SAVE (useAutoSave hook):
  - Debounce: 300ms after any input change
  - Writes to localStorage key: 'firstnest_step_{N}'
  - Master progress key: 'firstnest_progress' = { currentStep, flow, completedSteps[] }
  - Auto-save indicator: floating pill bottom-centre, fades in/out

DATA RETENTION:
  - localStorage TTL: 7 days (store timestamp, check on resume)
  - If expired: show "Your previous session has expired. Start fresh?" inline banner

PERSONALISATION MICRO-MOMENTS:
  - Use {firstName} in all step headers from Step 2 onwards
  - Match emoji tone to step content (don't overdo — max 1 per screen)
  - Progress bar colour fill: lemon yellow (feels warm, not clinical)
  - Step completion: subtle ✓ animation on progress dot when step completed
```

---

### PAGE 3: GRANT ELIGIBILITY RESULTS (`/results/grants`)

**This is the PRIMARY results screen — shown first after onboarding.**

#### 4.13 Hero Number — Total Savings

```
Background: white
Padding-top: 24px

Label (small, uppercase):
  "YOUR ESTIMATED SAVINGS"
  font: Inter 600, 0.6875rem, letter-spacing 0.1em, colour #888888

Dollar amount (hero):
  e.g. "$32,500"
  font: JetBrains Mono 700, 2.5rem, colour var(--color-lemon) (yellow)
  Rendered as animated count-up (0 → final value, 800ms, ease-out)

Sub-label:
  "from grants & stamp duty concessions"
  font: Inter 400, 0.875rem, colour #444444
  
Eligibility badge:
  "✓ {N} schemes found for you in {STATE}"
  background: #F0FDF4 (soft green), border 1px #BBF7D0
  border-radius: 9999px, padding 6px 14px
  font: Inter 600, 0.8125rem, colour #16A34A
  margin-top: 8px

Tab switcher (below hero):
  Two tabs: [Govt Schemes ✓] [Borrowing Capacity]
  Active tab: black underline, Plus Jakarta Sans 700
  Inactive tab: grey, Inter 400
  Switches between /results/grants and /results/borrowing
```

#### 4.14 Grant Eligibility Cards

**One card per scheme. Expandable. Colour-coded by status.**

```
Card base style:
  background: white
  border-radius: var(--radius-md)
  box-shadow: var(--shadow-card)
  border-left: 4px solid {status-colour}
  margin-bottom: 12px
  padding: 16px

STATUS COLOURS:
  Eligible:        border-left: #22C55E (green)
  Check Required:  border-left: #F59E0B (amber)
  Ineligible:      border-left: #D1D5DB (grey — NOT red)

COLLAPSED STATE:
  Row 1: [Status Badge]  [Scheme Name]  [Value]  [Chevron ▼]
  
  Status Badge (left):
    Eligible:        "✓ Eligible"    — green pill
    Check Required:  "~ Check"       — amber pill
    Ineligible:      "✗ Not eligible"— grey pill
    
    Pill style: border-radius 9999px, padding 4px 10px, font Inter 600 0.75rem
  
  Scheme Name:
    font: Inter 600, 0.9375rem, black
  
  Value:
    font: JetBrains Mono 700, 0.9375rem
    Eligible: colour #16A34A (green)
    Ineligible: colour #9CA3AF (grey)
  
  Chevron: right-aligned, colour #888888, rotates 180° when expanded

EXPANDED STATE (tap card or chevron to toggle):
  Reveals below the collapsed row:
  
  Divider: 1px solid #F0F0F0, margin 12px 0
  
  Criteria list (plain English, no jargon):
    Each criterion as a row: [✓ or ✗ icon] [text]
    font: Inter 400, 0.875rem, colour #444444
  
  For Ineligible cards:
    Reason block:
      background: #FFFBEB
      border-radius: 8px, padding 12px
      "Why you don't qualify:" (Inter 600, small) + reason text
    
    Alternative suggestion (if applicable):
      "💡 You may still qualify for: [scheme name]" — lemon tint block
  
  External link (bottom of expanded card):
    "Verify on the official government website →"
    font: Inter 500, 0.8125rem, colour #444444, underline

HIDE INELIGIBLE TOGGLE:
  Above card list:
    Toggle switch (custom, not native checkbox):
      Label: "Show ineligible schemes"
      Default: ON (showing all)
      When toggled OFF: ineligible cards fade out (200ms opacity transition)
```

#### 4.15 Dummy Grant Data (hard-coded in `/lib/dummyData.ts`)

```typescript
// Use this dummy data — eligibility logic in /lib/grantEligibility.ts
// evaluates based on onboarding answers stored in localStorage

const GRANTS_DUMMY = [
  {
    id: 'fhog',
    name: 'First Home Owner Grant (FHOG)',
    description: 'One-off cash payment for first home buyers of new or substantially renovated homes.',
    value: 10000,  // varies by state — see stampDuty.ts
    stateValues: { NSW: 10000, VIC: 10000, QLD: 30000, SA: 15000, WA: 10000, TAS: 20000, ACT: 0, NT: 10000 },
    eligibilityRules: ['firstHomeBuyer', 'newOrSubstantiallyRenovated', 'ownerOccupier'],
    category: 'grant',
    officialUrl: 'https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer',
  },
  {
    id: 'stamp-duty-concession',
    name: 'Stamp Duty Concession',
    description: 'Reduced or waived stamp duty for eligible first home buyers.',
    value: 'calculated', // dynamic — see stampDuty.ts
    category: 'concession',
    officialUrl: 'https://www.sro.vic.gov.au/first-home-buyer',
  },
  {
    id: 'fhss',
    name: 'First Home Super Saver (FHSS)',
    description: 'Withdraw voluntary super contributions (up to $50,000) to use as a home deposit.',
    value: 50000,
    category: 'federal',
    officialUrl: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme',
  },
  {
    id: 'fhbg',
    name: 'First Home Guarantee (FHBG)',
    description: 'Buy with just 5% deposit and no Lenders Mortgage Insurance — government guarantees the rest.',
    value: 'LMI waived',
    category: 'federal',
    officialUrl: 'https://www.nhfic.gov.au/what-we-do/support-to-buy',
  },
  {
    id: 'shared-equity',
    name: 'Help to Buy (Shared Equity)',
    description: 'Government co-buys up to 40% of your home — you own more over time.',
    value: 'Up to 40% co-contribution',
    category: 'federal',
    officialUrl: 'https://www.nhfic.gov.au',
  },
]
```

#### 4.16 Stamp Duty Card (Inline — part of grant cards list)

```
Card: "Stamp Duty — First Home Buyer Concession"
Status: Eligible / Ineligible (based on property price vs state threshold)

Expanded state shows:
  Two-column comparison:
    Column A: "Standard Stamp Duty"  → $XX,XXX (grey text)
    Column B: "With FHB Concession"  → $XX,XXX (black text)
  
  Saving row (full width):
    "You save:" + dollar amount
    font: JetBrains Mono 700, 1.25rem, colour: #16A34A (green)
    background: #F0FDF4 (soft green tint), rounded, padding 10px 14px
  
  If exceeds threshold:
    Amber info block: "Your property price of ${X} exceeds the {STATE} concession 
    threshold of ${threshold}. Standard stamp duty applies."
  
  Disclaimer link:
    "Verify at {State} Revenue Office →" — Inter 400, 0.8125rem, grey

Stamp duty tables (in /lib/stampDuty.ts):
  NSW: full concession < $650k, partial $650k–$800k
  VIC: full concession < $600k, partial $600k–$750k
  QLD: full concession < $500k, partial $500k–$550k
  SA:  full concession < $650k
  WA:  full concession < $430k
  TAS: concession varies
  ACT: land tax concession scheme (different)
  NT:  full concession < $500k
```

---

### PAGE 4: BORROWING CAPACITY RESULTS (`/results/borrowing`)

#### 4.17 Borrowing Range Display

```
Background: white
Tab switcher same as grants page (second tab now active)

Hero section:
  Label: "YOUR BORROWING CAPACITY"
           Inter 600, 0.6875rem, uppercase, grey
  
  Range display:
    "$520,000 — $580,000"
    font: JetBrains Mono 700, 2rem
    colour: var(--color-black)
    Animated: count-up both numbers simultaneously
  
  Sub-label: "estimated range at current rates"
             Inter 400, 0.8125rem, #888888
  
  Copy framing (CRITICAL — no clinical language):
    "Here's what you could borrow, {firstName} 🏡"
    font: Plus Jakarta Sans 700, 1rem, black
    Note: NEVER use "approved", "rejected", or "maximum limit"
  
  Recommended property price:
    Label: "Recommended property search range"
    Value: "$XXXXXX – $XXXXXX" (borrowing + deposit)
    font: Inter 600, 0.9375rem, #444444

Repayment estimates block (card):
  Title: "Estimated repayments"
  Two columns:
    [Monthly: $X,XXX] [Fortnightly: $X,XXX]
  Sub-label: "at 6.5% p.a. (current avg variable rate)"
  font: JetBrains Mono 700 for amounts; Inter 400 for labels

Disclaimer (1 line):
  "Includes 3% serviceability buffer as required by APRA. This is an estimate only."
  font: Inter 400, 0.75rem, #888888
```

#### 4.18 Borrowing Calculation Logic (`/lib/calculations.ts`)

```typescript
// Dummy formula — replace with real bank serviceability model

export function calculateBorrowingCapacity(inputs: {
  annualIncome: number
  partnerIncome: number
  monthlyExpenses: number
  creditCardLimit: number
  otherLoanRepayments: number
  hecsDebt: boolean
  depositAmount: number
  employmentType: string
}): { min: number; max: number } {
  const totalIncome = inputs.annualIncome + inputs.partnerIncome
  const monthlyIncome = totalIncome / 12
  
  // APRA 3% serviceability buffer — assess at rate + 3%
  const assessmentRate = 0.065 + 0.03  // 9.5%
  
  // HEM-based expense floor
  const hemFloor = 3200  // dummy HEM for single person
  const effectiveExpenses = Math.max(inputs.monthlyExpenses, hemFloor)
  
  // Credit card assessment: banks use 3.8% of limit as monthly commitment
  const ccRepayment = inputs.creditCardLimit * 0.038 / 12
  
  // HECS reduction
  const hecsReduction = inputs.hecsDebt ? monthlyIncome * 0.07 : 0
  
  const netMonthlyIncome = monthlyIncome - effectiveExpenses - ccRepayment 
                           - inputs.otherLoanRepayments - hecsReduction
  
  const borrowingCapacity = (netMonthlyIncome / assessmentRate) * 12
  
  return {
    min: Math.round(borrowingCapacity * 0.9 / 1000) * 1000,
    max: Math.round(borrowingCapacity / 1000) * 1000,
  }
}
```

#### 4.19 Deposit Gap Indicator

```
ONLY shown if: userDeposit < (targetPropertyPrice * 0.20)

Card (below repayment estimates):
  border-left: 4px solid var(--color-amber)
  background: #FFFBEB
  border-radius: var(--radius-sm)
  padding: 16px

  Title: "💡 Deposit Gap"
         Inter 600, 0.9375rem

  Content:
    "To avoid Lenders Mortgage Insurance (LMI), you'd need an extra:
    ${depositGap}"
    
    ${depositGap} styled: JetBrains Mono 700, 1.25rem, amber colour
  
  LMI explanation (1 sentence):
    "LMI is a one-off fee charged when your deposit is below 20% of the 
    property price — it protects the lender, not you."
    font: Inter 400, 0.8125rem, #444444
  
  Link: "Learn more about LMI →" — amber underline, Inter 500, 0.8125rem

IF deposit >= 20%:
  Show green success block instead:
    "✓ No LMI required — your deposit covers 20%+ of the property price."
    background: #F0FDF4, border-left: 4px solid #22C55E
```

#### 4.20 Scenario Testing Sliders

```
Section title: "What if I...?" — Plus Jakarta Sans 700, 1.125rem
Sub-label: "Adjust the sliders to explore different scenarios"

Three sliders:

1. Extra Savings
   Label: "Save an extra"
   Range: $0 – $100,000, step $5,000
   Default: $0
   Delta label: "+$XX,XXX borrowing capacity" (appears right of slider, lemon bg pill)

2. Income Increase
   Label: "Increase income by"
   Range: $0 – $50,000/year, step $2,500
   Default: $0
   Delta label: "+$XX,XXX borrowing capacity"

3. Joint Application Toggle
   Label: "Add a partner"
   Type: toggle switch (ON/OFF)
   When ON: shows partner income field (number input, $ prefix)
   Delta label: "+$XX,XXX borrowing capacity"

Slider component style:
  Track: height 6px, background #EEEEEE, border-radius 3px
  Fill: var(--color-lemon), left portion
  Thumb: 24px circle, background black, box-shadow 0 2px 8px rgba(0,0,0,0.2)
  
  Real-time update: recalculate on every slider movement (no debounce)
  Borrowing range updates with smooth number transition

Reset button:
  "Reset to original" — ghost button, small, centered below sliders
  On tap: all sliders → 0/default, borrowing range → original

Save to My Results:
  "💾 Save this scenario" — lemon pill button, below reset
  Saves current slider values + result to localStorage key 'firstnest_saved_scenarios'
```

---

### PAGE 5: DECISION & NEXT STEPS (`/next-steps`)

#### 4.21 Summary Banner

```
Top of page:
  background: var(--color-lemon-light)
  border-radius: var(--radius-md)
  padding: 20px
  margin: 20px
  
  "{firstName}, here's your home-buying snapshot 🏡"
  font: Plus Jakarta Sans 700, 1rem
  
  Three data points (row of 3 mini-cards):
    [Borrowing: $XXX–$XXX] [Grants: $XX,XXX] [Deposit gap: $XX,XXX or "✓ None"]
    font: JetBrains Mono 700, 0.875rem for values
    font: Inter 400, 0.75rem for labels
```

#### 4.22 Broker Connection Card

```
Card style:
  white, border-radius 12px, box-shadow var(--shadow-card)
  padding: 20px
  border-top: 3px solid var(--color-lemon)

Copy (non-sales, informational):
  "A mortgage broker can match you to lenders most likely to work with 
  your situation — and it's completely free."
  font: Inter 400, 0.875rem, #444444

Broker profile (dummy data):
  Photo: placeholder circular avatar (initials fallback)
  Name: "Sarah Chen" — Inter 600, 0.9375rem
  Credentials: "MFAA Accredited Mortgage Broker — 9 years experience"
               Inter 400, 0.8125rem, #888888
  Badge: "No obligation" — grey pill, small

Three action buttons:
  [📞 Request a Callback]  — primary lemon, full-width
  [💬 Send a Message]      — outline black, full-width
  [📅 Book a Time]         — outline black, full-width

All three → open inline mini-form (slide up):
  "Callback" form: Name (pre-filled from localStorage), Phone, Preferred time (chip select: Morning / Afternoon / Evening)
  Submit → confirmation state: "✓ Request sent! Sarah will contact you within 1 business day."

CRITICAL: No urgency language. No "Act now." No "Limited spots."
Consent note (below buttons):
  "Your data will only be shared with a broker once you submit a request."
  font: Inter 400, 0.75rem, #888888
```

#### 4.23 Save & Share Results

```
Section: "Your results, saved"

Save to My Results:
  "💾 Save to My Results" — lemon button
  Saves snapshot to localStorage key 'firstnest_my_results'

Share via Link:
  "🔗 Copy shareable link" — outline button
  On tap: copies dummy URL to clipboard: "firstnest.com.au/r/{hash}"
  Toast (bottom of screen): "Link copied to clipboard ✓"
  Toast style: black pill, white text, 2.5s auto-dismiss

PDF Download:
  "⬇️ Download as PDF" — outline button
  For POC: generates basic browser print view (window.print()) with
  @media print CSS styling the results cleanly
  Shows: borrowing range, grants list, repayment estimates, next steps

Shared link note:
  "Links expire after 30 days."
  font: Inter 400, 0.75rem, #888888
```

#### 4.24 Property Portal Deep-Link

```
Button:
  "🏠 See properties in your range"
  Style: full-width, outline black, 56px height
  
  On tap: opens in new tab:
    https://www.realestate.com.au/buy/price-{minPrice}-{maxPrice}/in-{state}/list-1
  
  Sub-label beneath button:
    "Opens realestate.com.au pre-filtered to your price range in {STATE}"
    font: Inter 400, 0.75rem, #888888
```

---

### PAGE 6: MY RESULTS (`/my-results`)

```
Accessible from persistent bottom nav tab (if on mobile) or nav link.

Header: "My Results" — Plus Jakarta Sans 700, 1.25rem

If no saved results:
  Empty state:
    Illustration: simple house SVG (monochrome)
    "Nothing saved yet."
    "Complete the journey to see your results here."
    CTA: [Get started →] — lemon button

If results exist:
  Last saved card:
    Shows timestamp: "Saved {date}"
    Mini summary: borrowing range, grants total, state
    [View full results] → loads saved data back into results pages
    [Delete] — small red ghost button

Saved scenarios list:
  Each scenario from sliders: mini card showing changed variable + new borrowing range
```

---

## 5. NAVIGATION COMPONENTS

### 5.1 Bottom Navigation (Mobile) — Persistent

```
Fixed bottom bar, height 64px, white background, border-top 1px #EEEEEE
Safe area padding for iPhone home indicator

Four tabs:
  🏠 Home        → /
  📊 Results     → /results/grants
  💾 My Results  → /my-results
  ℹ️ Next Steps  → /next-steps

Active tab: icon + label in lemon, small dot indicator above icon
Inactive tab: grey icon, grey label, Inter 400, 0.6875rem

Note: Bottom nav only visible after onboarding is completed
      (check localStorage 'firstnest_progress'.completedSteps includes step 4)
```

### 5.2 Desktop Navigation

```
Sticky top navbar for desktop (≥768px):
  Logo left + "FirstNest"
  Centre links: Home · My Results · Next Steps
  Right: "Get Started" lemon pill button
```

---

## 6. LOCALSTORAGE SCHEMA

```typescript
// Key: 'firstnest_progress'
{
  currentStep: number              // 1–4
  flow: 'grants' | 'borrowing'
  completedSteps: number[]
  lastSaved: string                // ISO timestamp
  expiresAt: string                // +7 days from lastSaved
}

// Key: 'firstnest_step_1'
{
  firstName: string
  state: string                    // 'NSW' | 'VIC' etc.
  buyingWith: 'solo' | 'partner'
}

// Key: 'firstnest_step_2'
{
  annualIncome: number
  partnerIncome: number            // 0 if solo
  monthlyExpenses: number
}

// Key: 'firstnest_step_3'
{
  depositAmount: number
  targetPropertyPrice: number
  propertyType: 'house' | 'townhouse' | 'apartment' | 'offplan'
  firstHomeBuyer: boolean
}

// Key: 'firstnest_step_4'
{
  employmentType: 'fulltime' | 'parttime' | 'selfemployed' | 'casual' | 'contract'
  creditCardLimit: number
  hecsDebt: boolean
  otherLoanRepayments: number
}

// Key: 'firstnest_my_results'
{
  savedAt: string
  expiresAt: string
  borrowing: { min: number; max: number }
  grantsTotal: number
  eligibleGrants: string[]
  state: string
  firstName: string
}

// Key: 'firstnest_saved_scenarios'
[
  {
    id: string
    savedAt: string
    sliders: { extraSavings: number; incomeIncrease: number; hasPartner: boolean; partnerIncome: number }
    result: { min: number; max: number }
  }
]
```

---

## 7. ANIMATIONS & MICRO-INTERACTIONS

```
Page transitions:
  Route change: fade + slide up (200ms, ease-out)
  Use Framer Motion or CSS: opacity 0→1 + translateY 12px→0

Form step transitions:
  Next: slide left (current step exits left, new step enters from right)
  Back: slide right (reverse)
  Duration: 250ms, ease-in-out

Number count-up:
  Applied to: borrowing range, grants total, stamp duty savings
  Duration: 800ms, ease-out
  Use requestAnimationFrame loop

Expandable cards:
  max-height: 0 → auto (use max-height transition with overflow hidden)
  Chevron rotation: 0° → 180° (200ms)

Auto-save indicator:
  Fade in (150ms) → visible 2.5s → fade out (300ms)
  Float: position fixed, bottom: 80px (above bottom nav), left: 50%, transform: translateX(-50%)

Slider delta labels:
  On value change: scale 1 → 1.15 → 1 (100ms pulse)
  Colour: lemon bg, black text, border-radius 9999px

Progress bar fill:
  width transition: 300ms ease (step advancement)

Button tap feedback:
  transform: scale(0.97), 80ms
  No custom colours on tap — keep lemon

Toast notification:
  Slide up from bottom (150ms) → visible 2.5s → slide down (150ms)
  Position: fixed bottom 80px, centred
  Style: black pill, white text

Input focus:
  Border colour transition 150ms + yellow glow ring (box-shadow)
```

---

## 8. RESPONSIVE BREAKPOINTS

```css
/* Mobile first — base styles target 375px+ */
/* Tablet */
@media (min-width: 640px) {
  max-width: 480px; margin: 0 auto;
  Two-column card grids become comfortable
}

/* Desktop */  
@media (min-width: 1024px) {
  max-width: 1200px layout with sidebar
  Onboarding: centred 480px card
  Results: main column 640px + sidebar 320px (scenario sliders)
  Bottom nav hidden; top nav shown
}
```

---

## 9. ACCESSIBILITY

```
- All interactive elements: minimum 44×44px touch target
- Focus-visible outline: 2px solid var(--color-lemon-dark)
- Colour contrast: all text on white meets WCAG AA (4.5:1+)
  Exception: lemon bg (#F5E642) with black text = 8.5:1 — excellent
- Form labels: always visible (no label-as-placeholder)
- Error messages: role="alert", aria-live="polite"
- Progress bar: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
- Sliders: proper input[type=range] with aria-label and aria-valuetext
- YouTube embed: title="FirstNest intro video", no keyboard trap
- Skip to main content link (visually hidden, visible on focus)
- prefers-reduced-motion: disable count-up, slide transitions, auto-play video
```

---

## 10. PERFORMANCE REQUIREMENTS

```
- Lighthouse mobile score target: ≥85
- LCP: < 2.5s on 4G
- YouTube iframe: load with loading="lazy", only above fold hero eager
- Images: WebP format, explicit width/height to prevent CLS
- Fonts: display=swap, preconnect to fonts.googleapis.com
- localStorage: sync reads/writes (no async needed for this POC)
- No external analytics or tracking (POC only)
```

---

## 11. DUMMY DATA SUMMARY FOR POC

```
All dummy values to use when no real user data exists:
  firstName: "Sarah"
  state: "VIC"
  annualIncome: 85000
  partnerIncome: 0
  monthlyExpenses: 3200
  depositAmount: 65000
  targetPropertyPrice: 650000
  propertyType: "house"
  firstHomeBuyer: true
  employmentType: "fulltime"
  creditCardLimit: 5000
  hecsDebt: true
  otherLoanRepayments: 0

Expected dummy results:
  Borrowing capacity: ~$480,000 – $535,000
  Recommended property range: $545,000 – $600,000
  FHOG (VIC): $10,000 — Eligible
  Stamp Duty Concession (VIC, $650k): ~$12,870 saving — Check required (borderline)
  FHSS: $50,000 — Eligible
  First Home Guarantee: — Eligible (deposit 10%)
  Total estimated savings: $22,870
  Deposit gap to 20%: $65,000 (current) vs $130,000 needed → gap $65,000
```

---

## 12. KEY UX PRINCIPLES (NON-NEGOTIABLE)

```
1. NEVER show full-screen hero on home page — compact video strip like realestate.com.au
2. NEVER use "approved", "rejected", "maximum limit" on borrowing results
3. NEVER use red for ineligible grants — use grey/amber only
4. NEVER show a modal for errors — inline only
5. NEVER lose data on Back navigation
6. ALWAYS show firstName in result headers from Step 2 onwards
7. ALWAYS show grants results BEFORE borrowing results
8. ALWAYS auto-save on every keystroke (debounced 300ms)
9. ALWAYS provide "Start fresh" option alongside session resume
10. ALWAYS keep broker CTA copy informational, never sales-pressure
11. Form steps: max 3 fields per step — no exceptions
12. Grant cards: expandable, never open by default (mobile space)
13. YouTube video: muted, autoplay, looped, no controls visible on mobile hero
14. CTA buttons: minimum 56px height, full-width on mobile, thumb-friendly
15. Progress bar: lemon yellow fill — warm, not clinical blue or grey
```

---

*End of CLAUDE.md — FirstNest Frontend POC Specification*  
*Document Version: 3.0 | Prepared for Claude Code implementation*
