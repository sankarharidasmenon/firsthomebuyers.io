# FirstNest — Automated Test Matrix

Coverage of the automated test estate as of **31 July 2026**, branch `v6`.

Three suites are in place. UI/UX automation (Phase 5) is **not yet implemented** —
see [Out of scope across all suites](#out-of-scope-across-all-suites).

---

## 1. Summary

| Suite | Tests | Passing | Skipped | Files | Runtime | CI job | Config |
|---|---|---|---|---|---|---|---|
| **Unit** | 211 | 211 | 0 | 5 | ~1.1 s | `unit-tests` | `vitest.config.mts` |
| **Integration** | 75 | 63 | 12 | 4 | ~6 s | `integration-tests` | `vitest.integration.config.mts` |
| **API** | 136 | 135 | 1 todo | 5 | ~6 s | `api-tests` | `vitest.api.config.mts` |
| **UI/E2E** | — | — | — | — | — | *(Phase 5, not built)* | — |
| **Total** | **422** | **409** | 12 + 1 todo | 14 | ~13 s | | |

All three run on every push and pull request to `main` and `v6`. Any failure fails
the workflow. Framework is **Vitest 4.1.10** throughout, on Node 20.18.3 (`.nvmrc`).

### Coverage at a glance

| Suite | Statements | Branches | Functions | Lines | Thresholds (stmt/branch/func/line) |
|---|---|---|---|---|---|
| Unit | 97.34% | 91.34% | 100% | 98.25% | 90 / 85 / 90 / 90 |
| Integration | 86.59% | 74.59% | 91.30% | 90.13% | 75 / 70 / 75 / 75 |
| API | 96.18% | 92.13% | 92.85% | 97.61% | 85 / 80 / 85 / 85 |

Each suite scopes coverage to the modules it targets, so the percentages answer
"how much of *this* layer is tested" rather than being diluted by unrelated code.
The three numbers are **not** comparable to one another and should never be
averaged.

> **Reporter note:** the v8 text reporter omits files at 100% on every metric. A
> module missing from a terminal coverage table is fully covered, not untested.
> The `lcov`/`html` reports list every file.

---

## 2. Unit Tests

**Location:** `tests/unit/` · **Config:** `vitest.config.mts` · **CI job:** `unit-tests`

### What is tested

Pure business logic — the functions that produce the dollar figures a user acts on.

| File | Tests | Module under test | Focus |
|---|---|---|---|
| `schemes/stampDuty.test.ts` | 56 | `src/lib/schemes/stampDuty.ts` | 7 jurisdictions, standard + first-home duty, per-$100 rounding, cross-state invariants |
| `feedback/validation.test.ts` | 57 | `src/lib/feedback/validation.ts` | validation + sanitisation on both sides of the trust boundary |
| `calculator/grantCalculator.test.ts` | 41 | `src/lib/calculator/grantCalculator.ts` | scheme filtering, classification, totals, purity |
| `schemes/priceCaps.test.ts` | 31 | `src/lib/schemes/priceCaps.ts` | master-data string parsing, BUY/BUILD vs state tables |
| `calculations.test.ts` | 26 | `src/lib/calculations.ts` | borrowing capacity, repayments, deposit gap, formatting |

Where the source cited an official revenue-office worked example, the test asserts
against **that published figure**, not against the implementation — so these verify
the code against the legislation rather than against itself. Two cross-jurisdiction
invariants are enforced for every state at every price: a first-home benefit never
leaves a buyer worse off, and `saving === standard − payable`.

### Intentionally mocked

**Nothing.** These are pure functions with no I/O.

### Real implementations

All of it — the modules under test, plus `Intl` number/currency formatting via the
Node ICU build.

### Out of scope for this suite

- React components and hooks (no DOM environment configured; `environment: 'node'`)
- Anything touching Supabase, the filesystem or the network
- `src/lib/questionnaire/**`, `src/lib/schemes/eligibilityClient.ts`,
  `src/lib/schemes/summary.ts`, `src/lib/schemes/applicantRules.ts` — **untested**
- Static data modules (`forumsData.ts`, `mockArticles.ts`, `postcodes.ts`) — data, not logic

### Coverage

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `calculations.ts` | 100% | 100% | 100% | 100% |
| `feedback/validation.ts` | 100% | 100% | 100% | 100% |
| `schemes/priceCaps.ts` | 97.72% | 95% | 100% | 100% |
| `schemes/stampDuty.ts` | 98% | 100% | 100% | 97.87% |
| `calculator/grantCalculator.ts` | 94.44% | 80.85% | 100% | 96.36% |
| **Total** | **97.34%** | **91.34%** | **100%** | **98.25%** |

### Commands

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage + thresholds
```

---

## 3. Integration Tests

**Location:** `tests/integration/` · **Config:** `vitest.integration.config.mts` · **CI job:** `integration-tests`

Two tiers. Tier 1 runs everywhere with no credentials; Tier 2 needs a real database
and skips itself — loudly — when one is not configured.

### What is tested

| File | Tests | Tier | Focus |
|---|---|---|---|
| `masterData/uploadPipeline.integration.test.ts` | 22 | 1 | `FormData → File → exceljs parse → validation → import RPC → HTTP-shaped response` |
| `auth/authorization.integration.test.ts` | 21 | 1 | session → profiles lookup → role check; Server Action authorization |
| `schemes/repository.integration.test.ts` | 20 | 1 | repository query shape/ordering/errors, then DB-shaped rows through the real calculator |
| `database/rls.realdb.integration.test.ts` | 12 | 2 | **skipped** — Row Level Security on `feedback`, `profiles`, `saved_scenarios`, `government_schemes` |

The decisive assertions are negative: a malformed or invalid workbook must **never
reach the import RPC** (it replaces the entire scheme table), and an unauthorised
caller must trigger **zero** database interactions. Neither can be shown by unit
testing the validator or the role check alone — the short-circuit lives in the caller.

### Intentionally mocked

- **The Supabase driver only** — `@/lib/supabase/server` and `@/lib/supabase/serverAuth`,
  replaced by `tests/integration/helpers/fakeSupabase.ts`, a chainable recording
  double that captures table, operation, filters, ordering and payload.
- `next/navigation`'s `redirect` (imported by the Server Action module at load).

### Real implementations

- **Real `.xlsx` parsing** — fixtures are generated in-memory with `exceljs`, the same
  library the parser uses, so the parser does genuine Excel work.
- Real row validation, real import orchestration and error/audit handling.
- Real `requireSuperAdmin` / `getProfile` / `getSessionUser` composition.
- Real Server Action (`uploadMasterData`).
- Real repository and real grant calculator, fed database-shaped rows.

### Out of scope for this suite

- **Row Level Security is unproven** until Tier 2 is enabled. A mocked driver can
  show *how* the app queries the database; only Postgres can show whether a policy
  holds. This is the single largest gap in the estate.
- No real Postgres, no transactions, no `import_master_data` stored procedure — the
  RPC is mocked, so its rollback behaviour is asserted only at the application's
  interpretation layer.
- No HTTP layer (that is the API suite).
- Migrations are not applied or verified anywhere in CI.

### Coverage

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `masterData/upload.ts` | 100% | 92.85% | 100% | 100% |
| `auth/session.ts` | 100% | 100% | 100% | 100% |
| `schemes/repository.ts` | 95.65% | 94.11% | 100% | 100% |
| `masterData/validate.ts` | 88.88% | 85.29% | 100% | 88.23% |
| `masterData/import.ts` | 76.19% | 53.84% | 66.66% | 80% |
| `masterData/parse.ts` | 75% | 50% | 83.33% | 82.92% |
| **Total** | **86.59%** | **74.59%** | **91.30%** | **90.13%** |

`parse.ts` and `import.ts` sit lowest because their remaining branches are
exceptional paths (corrupt workbook internals, audit-history reads) exercised
indirectly or not at all.

### Enabling Tier 2

1. Create a **dedicated throwaway Supabase project** — these tests insert rows.
   Never point them at staging or production.
2. Apply every migration in `supabase/migrations/`, including the still-unapplied
   `0004_feedback.sql`. Without it the tests fail on a missing relation rather than
   on a policy, which is a meaningfully different failure.
3. Set `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY` and optionally
   `SUPABASE_TEST_SERVICE_ROLE_KEY` — locally in `.env`, and as GitHub secrets.
   The `integration-tests` job already passes them through; no workflow edit needed.

### Commands

```bash
npm run test:integration
npm run test:integration:watch
npm run test:integration:coverage
```

---

## 4. API Tests

**Location:** `tests/api/` · **Config:** `vitest.api.config.mts` · **CI job:** `api-tests`

Route handlers are imported and invoked directly with real `Request` / `FormData`
objects. No server is started and no browser is involved.

### What is tested

All **8** route handlers under `src/app/api/`.

| File | Tests | Endpoints |
|---|---|---|
| `feedback.api.test.ts` | 38 | `POST /api/feedback` |
| `calculators.api.test.ts` | 37 | `POST /api/grant-calculator`, `POST /api/eligibility` |
| `contact.api.test.ts` | 23 (1 todo) | `POST /api/contact` |
| `adminMasterData.api.test.ts` | 20 | `POST /api/admin/master-data/upload` |
| `schemes.api.test.ts` | 18 | `GET /api/schemes`, `/featured`, `/[id]` |

Concerns covered: success responses · validation failures · authentication failures ·
authorization failures · rate limiting · invalid payloads · missing required fields ·
edge cases · error handling · HTTP status codes (200, 201, 400, 403, 404, 422, 429,
500, 503) · response body validation · response headers.

Highest-value assertions: an unauthorised caller triggers zero database calls; a
caller supplying `user_id`/`user_email` in the feedback body cannot forge
attribution; internal database and SMTP error text never reaches the client.

### Intentionally mocked

- **The Supabase driver** (reusing the Phase 3 `fakeSupabase`).
- **nodemailer** — a genuine external service; `sendMail` and `createTransport` are
  spies, so SMTP configuration and delivery attempts are asserted without sending mail.

### Real implementations

Route handlers, request parsing (`req.json()`, `req.formData()`), all validation,
the rate limiter (real module-level state — the suite runs serially and uses a
distinct client IP per test), the honeypot, the real auth/role composition, the real
repository and both calculation engines, and real `Response`/`NextResponse` construction.

### Out of scope for this suite

- No network transport: no real HTTP server, TLS, CORS, compression, or Next.js
  middleware/proxy (`src/proxy.ts` is **untested**).
- No `export const dynamic`/caching semantics — those are runtime behaviours.
- No load, soak or concurrency testing; the rate limiter is verified functionally,
  not under contention.
- Rate-limit **expiry** (the 10-minute window rolling over) is not tested — it would
  require fake timers against module-level state.

### Coverage

| Route | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `admin/master-data/upload/route.ts` | 100% | 100% | 100% | 100% |
| `contact/route.ts` | 100% | 100% | 100% | 100% |
| `eligibility/route.ts` | 100% | 100% | 100% | 100% |
| `grant-calculator/route.ts` | 100% | 100% | 100% | 100% |
| `schemes/route.ts` | 100% | 100% | 100% | 100% |
| `schemes/featured/route.ts` | 100% | 100% | 100% | 100% |
| `schemes/[id]/route.ts` | 100% | 100% | 100% | 100% |
| `feedback/route.ts` | 90.9% | 83.33% | 85.71% | 94.23% |
| **Total** | **96.18%** | **92.13%** | **92.85%** | **97.61%** |

The only uncovered lines are two deliberately unreachable defensive branches in
`feedback/route.ts`: the rate-limit map sweep (fires only above 5,000 distinct
client IPs) and a type re-check that `validateFeedback` already guarantees.

### Known API defects recorded by this suite

1. **HTML injection in the contact email** — `contact/route.ts` interpolates `name`,
   `email` and `reason` into an HTML email body with no escaping. Recorded as
   `it.todo(...)` rather than a passing test, so the eventual fix does not surface
   as a failing test.
2. **Malformed JSON returns 500, not 400** on `/api/contact`, `/api/grant-calculator`
   and `/api/eligibility` — `await req.json()` sits inside the same try/catch as the
   real work. `/api/feedback` handles this correctly.
3. **`/api/schemes/featured?limit=-2` returns 8 schemes** rather than rejecting the
   input; a negative limit reaches `Array.slice(0, -2)`.

### Commands

```bash
npm run test:api
npm run test:api:watch
npm run test:api:coverage
npm run test:all          # unit + integration + api
```

---

## 5. CI responsibility

`.github/workflows/ci.yml` — on push and PR to `main` / `v6`:

| Job | Runs | Artifacts | Secrets |
|---|---|---|---|
| `quality` | `lint:ci` (warning budget 108) + `typecheck` | — | none |
| `unit-tests` | `test:coverage` | `unit-test-coverage` | none |
| `integration-tests` | `test:integration:coverage` | `integration-test-results` (JUnit), `integration-test-coverage` | `SUPABASE_TEST_*` (optional) |
| `api-tests` | `test:api:coverage` | `api-test-results` (JUnit), `api-test-coverage` | none |
| `build` | `next build` | — | placeholder Supabase values |

`.github/workflows/security.yml` — `dependency-audit` (SCA), `secret-scan`
(gitleaks), `semgrep` (SAST, report-only), `sbom`.

There is **no CodeQL workflow**. It was removed, not disabled temporarily: CodeQL
requires GitHub Advanced Security, which is not available on a private repository
under a personal account, so `github/codeql-action/init` fails before it analyses
anything. That is a licensing boundary, not a defect in this codebase — the
workflow itself was correct. Semgrep in `security.yml` is now the only SAST
engine. If this repository ever moves to an organisation with GHAS, or becomes
public, reinstating CodeQL is worthwhile; until then it can only ever report red.

All test artifacts upload with `if: always()`, so a **failing** run still publishes
its report. Any non-zero exit fails the job and the workflow.

---

## Out of scope across all suites

Ordered by risk.

1. **No UI or end-to-end testing.** Nothing renders a component or drives a browser.
   The 4-step onboarding flow, results pages, forms, theme switching and
   accessibility are entirely unverified. **This is Phase 5.**
2. **Row Level Security is unproven** — 12 tests exist and are skipped pending a
   Supabase test project. RLS is the primary access control on user data.
3. **No database migration verification.** Migrations are applied by hand in the
   Supabase SQL editor; `0004_feedback.sql` is written but unapplied. Nothing in CI
   detects schema drift.
4. **Untested application logic:** `src/lib/questionnaire/**`,
   `src/lib/schemes/eligibilityClient.ts` (560 lines), `summary.ts`,
   `applicantRules.ts`, `src/lib/localStorage.ts`, `src/proxy.ts`.
5. **No performance, load or accessibility testing**, and no visual regression.
6. **`scripts/test-master-data.ts`** is a manual harness that writes to a real
   database with the service-role key. It is not wired into CI and must not be.
7. **12 high-severity dependency advisories** remain unremediated by explicit
   decision, including a Next.js proxy-bypass affecting `src/proxy.ts`. The audit
   gate is deliberately set at `critical` until that work is scheduled.

---

*Generated as documentation only. No application code was modified to produce this
matrix; all figures come from live runs of the three suites on 31 July 2026.*
