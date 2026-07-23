# data-extractor

Deterministic web scraper for **Australian Government First Home Buyer grants & schemes**
across **Federal (Australia)**, **New South Wales (NSW)** and **Victoria (VIC)**.

It crawls only official `*.gov.au` sources, extracts structured data with DOM selectors,
JSON-LD, tables and linked PDFs, and produces a professional Excel workbook — **one row per scheme**.

> This is **not** an AI/LLM extraction project. Nothing is inferred or hallucinated.
> If a value is not present on an official page, the cell is left **blank**.

---

## Outputs

| File | Description |
|------|-------------|
| `output/government_schemes.xlsx` | Single worksheet `Government Schemes`, frozen header, auto-filter, wrapped text, auto-fit columns. |
| `output/sources.json` | Every government URL used for extraction, grouped by scheme (pages + PDFs). |
| `logs/scrape.log` | Visited / skipped / broken URLs, PDFs parsed, rows extracted, warnings, errors. |

The workbook follows the **reference schema** in `docs/Aus_Govt_Grants&Schemes_2026.xls`
(65 columns). The first five are exactly, in order:
`S.No` · `UI/UX Include` · `UI/UX Program Type` · `UI/UX Applicable States/Territories` · `UI/UX Scheme Name (official)`

### Scope & approach (Federal · NSW · VIC only)
- **3 federal schemes** — First Home Guarantee, Help to Buy, First Home Super Saver — are each
  ONE row (`All States & Territories`). Their **per-state property price caps are scraped**
  from the official caps pages and written to `State-by-State Value Variations` and
  `Price Cap Variations` (e.g. First Home Guarantee → NSW $1.5M/$800k, VIC $950k/$650k;
  Help to Buy → NSW $1.3M/$800k, VIC $950k/$650k). This is the "federal schemes vary state-wise".
- **State grants/schemes are per-state rows** — NSW ×3 and VIC ×3 — each with that state's own
  grant amount, price cap, duty exemption threshold and concession range.
- All other states/territories (QLD, WA, SA, TAS, NT, ACT) are intentionally out of scope.

---

## Install & run

```bash
cd data-extractor
npm install
npx playwright install chromium   # required for anti-bot / JS-rendered gov pages (ATO, Housing Australia)
npm run scrape                    # full run → writes Excel + sources.json + log
npm run scrape:dry                # discovery + extraction only (no Excel written)
```

Node 18+ recommended.

---

## How it works

```
src/
  index.ts                 orchestrator (discover → extract → merge → validate → export)
  config/
    sources.ts             ALLOWED_DOMAINS + official seed entry points + FHB keywords
    columns.ts             exact ordered Excel columns (5 mandatory first)
  core/
    logger.ts              scrape.log writer + run summary
    httpClient.ts          axios + retries/exponential backoff + polite per-host delay
    robots.ts              robots.txt fetch + Allow/Disallow evaluation + crawl-delay
    browser.ts             shared headless Chromium (Playwright) fallback
    fetchPage.ts           domain gate → robots → HTTP → browser fallback → parse
  discovery/
    domainFilter.ts        hard allow-list of official gov hosts
    classify.ts            FHB detection + Program Type rules (Grant/Scheme only)
    crawler.ts             per-scheme collection + hub discovery of new schemes
  parse/
    htmlParser.ts          cheerio: title, text, links, PDF links, JSON-LD, tables
    pdfParser.ts           PDF download (cached) + pdf-parse text extraction
  extract/
    fields.ts              regex/DOM extractors (amounts, caps, dates, flags, sections)
    schemeRecord.ts        assembles one SchemeRecord (row) from a scheme bundle
  normalize/
    normalizers.ts         currency / date / state / URL / whitespace / dedupe
  merge/
    mergeRecords.ts        merge multi-page + duplicate schemes (no duplicate rows)
  validate/
    validate.ts            enforce mandatory columns, allowed Type/State, no dupes
  output/
    excel.ts               exceljs workbook formatting
    sourcesJson.ts         sources.json provenance
```

### Determinism & safety guarantees
- **Official sources only** — `ALLOWED_DOMAINS` is a hard allow-list; every other host is skipped and logged.
- **Never invents `Program Type`** — only `Grant` or `Scheme`, decided by name rules.
- **Never invents `State`** — only `Australia`, `NSW`, or `Victoria`.
- **Blank when missing** — booleans become `Yes`/`No` only with explicit textual evidence, otherwise blank.
- **robots.txt respected** + retries with exponential backoff + per-host delay.

### Adding a new jurisdiction later
Add its official seed entry points and allowed domains to `src/config/sources.ts`.
No other code changes are required — the pipeline is jurisdiction-agnostic.
