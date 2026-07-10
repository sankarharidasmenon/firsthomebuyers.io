# Government Data Extractor — Phases 1, 1.5 & 1.6

Automatically **discovers and collects structured information about Australian
Government First Home Buyer schemes** from official `.gov.au` websites and exports
everything into a single Excel file.

```text
Phase 1    Static URLs        → Crawl → Extract → Excel
Phase 1.5  Authority landings → Discover → Dedupe → Extract → Excel
Phase 1.6  + deterministic First-Home-Buyer domain filter (no AI) + registry check
```

- **Phase 1** — extract from a hand-curated list of scheme URLs (`sources.ts`).
- **Phase 1.5** — a **Discovery Engine** that crawls each government authority's
  landing pages and finds scheme pages automatically (new, renamed, or moved),
  then feeds them through the *same* extractor.
- **Phase 1.6** — a **deterministic, rule-based** First Home Buyer domain filter
  (no AI/LLM). A page is kept only if it belongs to a configured authority **and**
  its URL/title/H1 clearly identifies a first-home-buyer scheme. Everything else
  (payroll/land tax, EV rebates, rental/social housing, pension concessions,
  relationship/estate duty, archived programs, admin/news pages) is **rejected
  with a reason**. Sub-pages are merged so one scheme = one row, and findings are
  checked against an **expected-scheme registry** per authority.

The Excel file is the source of truth the website will later import.

## Quick start

```bash
cd government-data-extractor
npm install

npm run discover         # DISCOVER + extract everything → Excel + reports (primary)
npm run extract          # Phase 1: extract only the curated sources.ts
npm run quality          # Phase 1.7: generate BA validation reports (read-only)
```

### Discovery (Phase 1.5)

```bash
npm run discover                         # crawl all authorities, extract, report
npm run discover:only                    # discovery + reports only (no extraction)
npx ts-node src/discover.ts --only=revenue-nsw,sro-vic   # specific authorities
npx ts-node src/discover.ts --max-depth=4 --max-pages=120 --delay=400
npx ts-node src/discover.ts --no-robots  # ignore robots.txt (default: respect)
```

Discovery flags: `--only=<authId,…>`, `--max-depth` (default 4), `--max-pages`
(per authority, default 80), `--concurrency` (default 2), `--delay=<ms>` (default
400), `--no-robots`, `--discover-only`, `--no-seed` (exclude curated sources).

Discovery outputs, in addition to the Excel:

- `output/discovered_sources.json` — every discovered candidate + confidence + status
- `output/discovery-report.md` — authorities/pages/links crawled, candidates, rejects
- `output/verification-report.md` — per-authority **Found vs Configured**, with
  ⚠ callouts for newly detected schemes (also printed to the console)

> A full crawl of all 9 authorities takes a few minutes (it is deliberately
> throttled to be polite to government servers). Scope it with `--only=` while
> iterating.

### Phase 1 (static) flags

| Command | Effect |
| --- | --- |
| `npm run extract` | Full run: crawl, extract, write Excel + change-state |
| `npm run extract:dry` | Fetch + extract, print a sample record, **no** file writes |
| `npx ts-node src/index.ts --only=vic-first-home-owner-grant` | Single source |
| `npx ts-node src/index.ts --force` | Reprocess even if pages are unchanged |
| `DEBUG=1 npm run discover` | Verbose logging (shows rejects, dupes, scores) |

Build to plain JS if preferred:

```bash
npm run build && npm start
```

## Quality / validation reports (Phase 1.7)

`npm run quality` produces read-only reports to help a Business Analyst verify the
Excel **before** uploading it. It **never modifies the Excel or any pipeline** —
it re-fetches each scheme and re-runs the *unchanged* extractor in HTML-only,
PDF-only and combined modes, then compares the outputs to derive provenance,
conflicts and completeness.

| Report | Answers |
| --- | --- |
| `extraction-completeness-report.md` | How complete is each scheme? Which fields are missing? |
| `source-mapping-report.md` | Which field values came from HTML vs PDF (vs config)? |
| `conflict-report.md` | Where do HTML and PDF disagree? (flagged, never resolved) |
| `missing-schemes-report.md` | Is every expected scheme (registry) present? |
| `pdf-report.md` | Which PDFs were found/downloaded/parsed, and the impact if blocked |
| `data-quality-report.md` | Dashboard: totals, averages, **Field Coverage Summary**, review recommendations |

Flags: `--only=<id|jurisdiction,…>`, `--concurrency=<n>`, `--curated-only`.

> The **Field Coverage Summary** shows how often each of the 56 columns is
> populated across all schemes — quickly revealing whether a low fill rate is
> because governments don't publish that field or because the extractor needs work.

Rules honoured: never modifies extracted data · never guesses missing values ·
never overwrites conflicting values · the Excel output is untouched.

## Output

- `output/government_schemes.xlsx` — a **pure master-data file**: a single
  **Schemes** worksheet, one **row per scheme**, exactly the 56 specified columns
  (frozen bold header, auto-fit widths). No metadata sheet is embedded — it uploads
  straight into the admin portal. If the file is open in Excel (locked), a
  timestamped copy is written instead so no run is lost.
- `output/MASTER_DATA_README.md` — separate handover documentation for the Business
  Analyst (purpose, sources, data lifecycle, version control, update process).
  Regenerated on every export. Version/status come from `src/config/version.json`
  (edit in one place).
- `output/discovered_sources.json` — discovery database (candidate + confidence + status).
- `output/discovery-report.md`, `output/verification-report.md` — discovery reports.
- `output/data-quality-report.md` + 5 quality reports — see above (`npm run quality`).
- `output/.change-state.json` — per-URL fingerprints (content hash / Last-Modified
  / ETag) for change detection between runs.
- `logs/extract-<timestamp>.log` — full run log.

## How it works

```text
src/
  config/
    authorities.ts           Phase 1.5: authorities + landing pages to crawl (PRIMARY)
    expectedSchemes.ts       Phase 1.6: expected FHB schemes per authority (registry)
    sources.ts               Phase 1: curated scheme URLs (baseline / safety-net seed)
  discovery/                 ── Discovery Engine ──
    linkCrawler.ts           BFS crawl (depth≤4), internal .gov.au only, robots + throttle
    domainFilter.ts          Phase 1.6: deterministic FHB allow/reject/admin/archive rules
    duplicateDetector.ts     Dedupe by URL / content hash / name similarity (jurisdiction-aware)
    governmentDiscovery.ts   Orchestrates crawl→filter→merge; new/updated/retired status
    robotsTxt.ts             Minimal robots.txt fetch + matcher
  collectors/
    rssCollector.ts          Uses RSS first when a feed exists (freshness signal)
    websiteCollector.ts      HEAD (Last-Modified/ETag) → GET → content hash → PDF links
    pdfCollector.ts          Downloads linked PDFs to temp, parses, then deletes them
  parsers/
    htmlParser.ts            cheerio: strips chrome, pulls text/headings/lists/links
    pdfParser.ts             pdf-parse wrapper
  extractors/                ── UNCHANGED between phases ──
    schemeExtractor.ts       Assembles one SchemeRecord (= one Excel row)
    eligibilityExtractor.ts  Income caps, age, residency, property rules, etc.
    benefitExtractor.ts      Benefit type/value, concession thresholds
  services/
    pageDownloader.ts        axios HTTP layer + allowlist + curl fallback for CDN 403s
    changeDetector.ts        Last-Modified → ETag → SHA-256 hash priority
    excelExporter.ts         exceljs workbook writer (lock-resilient)
    reporter.ts              discovery-report.md + verification report
  pipeline.ts                Shared extract orchestration (used by index.ts & discover.ts)
  index.ts                   Phase 1 entry (static sources)
  discover.ts                Phase 1.5 entry (discovery → extract → Excel → reports)
  utils/                     logger, hash, helpers
```

### Discovery strategy (deterministic — no AI)

1. **Start from authority landing pages** (`authorities.ts`), never individual URLs.
2. **Crawl** breadth-first to depth ≤ 4, staying on the authority's own `.gov.au`
   host(s); bounded by `maxPages` and optional path-prefix allowlists so large
   sites stay tractable. Social/sitemap/asset links are skipped.
3. **Respect robots.txt** and throttle (limited concurrency + per-request delay).
4. **Domain filter** (`discovery/domainFilter.ts`) — a rule engine decides, for
   each page: *would this help an Australian buy their first home?* A page is kept
   only if **both**:
   - **Rule 1** — it belongs to a configured authority (enforced by the crawler); and
   - **Rule 2** — its URL / title / H1 contains an allowed FHB phrase
     (`first home owner grant`, `home guarantee`, `shared equity`, `help to buy`,
     `first home super saver`, `stamp duty exemption/concession`, `home buyer
     concession`, …), mapping to a **category**.

   It is **rejected with a reason** if it matches a reject list (payroll/land tax,
   business, EV/vehicle/solar, rental/social/public/community housing, pension/
   seniors/disability, relationship/marriage/estate duty, news/budget/speech),
   an **archive marker** (`previous` / `archived` / `former` / `expired` / …), or is
   an **administrative page** (`apply` / `forms` / `payment` / `faq` / `agents` /
   `guidelines` / `calculator` / `objection`) — admin pages are attached to their
   parent scheme instead.
5. **One scheme = one record** — sub-pages (overview / eligibility / apply / FAQ /
   forms / PDFs) are merged into the parent scheme via URL-path hierarchy and
   jurisdiction-scoped name/hash de-duplication; their PDF links are collected.
6. **Detect status**: new / existing / updated / renamed / retired vs the previous
   `discovered_sources.json` and the curated sources.
7. **Registry check** (`config/expectedSchemes.ts`) — findings are compared to the
   expected FHB schemes per authority; the verification report flags an expected
   scheme that vanished and any genuinely new scheme.
8. **Extract** discovered + curated candidates through the unchanged extractor.

#### Allowed categories

`First Home Owner Grants` · `Government Guarantees` · `Shared Equity Programs` ·
`Stamp Duty Assistance` · `Deposit Assistance` · `Government Housing Purchase
Programs` · `First Home Buyer Tax Benefits`

To onboard a new authority, add an entry to `authorities.ts` (and, optionally, its
expected schemes to `expectedSchemes.ts`). No other code changes are required.

### Collection strategy (priority order)

1. **RSS** — if the source defines a feed, check it first.
2. **Last-Modified** — captured via a HEAD request.
3. **ETag** — captured via HEAD/GET.
4. **Content hash** — SHA-256 of normalized visible text; changes trigger reprocessing.
5. **PDF detection** — linked PDFs are downloaded to a temp file, mined, then deleted.

## Reliability & validation (production hardening)

- **Resilient fetching** — government CDNs (Akamai) that block Node's TLS
  fingerprint are recovered via a **curl fallback** that retries with backoff and
  rotates User-Agents, triggered on *any* exhausted failure (not only 403s). Goal:
  every configured scheme extracts unless the site is genuinely down.
- **Clean structured values** — extractors emit the specific value for each column
  (`$10,000`, `Must occupy for 12 months`, `Australian citizen or permanent
  resident`), never raw paragraphs. HTML tags, navigation/boilerplate, PDF page
  numbers and stray reference numbers are stripped; descriptions are short
  de-duplicated summaries.
- **Correct numbers** — penalties/fees/repayments are excluded from money fields;
  amounts are sanity-capped; comma-, space- and nbsp-separated thousands
  (`$750 000`) are all parsed.
- **Pre-export validation** (`services/validation.ts`, logs only — never edits):
  per-row mandatory fields by benefit type (grant amount / concession threshold /
  guarantee deposit %), plus dataset checks — full curated count present, no
  duplicate Scheme IDs, no accidental duplicate URL+name, no empty name/URL, no
  cell > 1000 chars, no HTML tags, no navigation text. Issues are warned for BA
  review; missing values are left blank, never guessed.

## Guarantees / rules

- **Only official `.gov.au` hosts** are fetched; anything else is refused.
- **Never invents data** — a value that cannot be found is left blank.
- **One row = one scheme** — schemes are never merged.
- **Prefers HTML over PDF** when both contain the same fact.
- **Fault-tolerant** — one failing site is logged and skipped; the run continues.

## Extraction accuracy

Extraction in Phase 1 is **heuristic / rule-based** (regex + keyword matching over
the page and PDF text). It captures the high-confidence structured facts and leaves
uncertain fields blank rather than guessing. Government pages vary widely in layout,
so treat the Excel output as a strong first pass to be spot-checked, not a
legally authoritative record. A later phase can add AI-assisted summarisation and
scheduled weekly sync (the code is structured so those modules plug in cleanly).

## Future scalability

The module boundaries were chosen so the following can be added without rewrites:
scheduled weekly sync, Supabase storage (swap `changeDetector` persistence),
a website importer that reads the Excel, and AI summaries in the extractor layer.
