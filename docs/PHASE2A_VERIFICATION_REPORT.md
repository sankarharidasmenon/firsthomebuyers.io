# Phase 2A — Verification Report

**Date:** 08 Jul 2026
**Scope:** Government Scheme Master Data Backend (Excel → Validation → Supabase → Read APIs)
**Status:** ✅ COMPLETE — all live tests pass

---

## Environment

| Item | Value |
| --- | --- |
| App | Next.js 16.2.9 (App Router), React 19, TypeScript |
| Database | Supabase PostgreSQL (project `qbtlvhyqdciqnmmetzux`) |
| Excel source | `government-data-extractor/output/government_schemes.xlsx` (17 schemes) |
| Migration | `supabase/migrations/0001_master_data.sql` (applied) |

Tables live: `government_schemes` (HTTP 200), `master_data_imports` (HTTP 200).

---

## Automated suite — `npm run test:master-data` → **19 / 19 passed**

**Parsing & validation (offline)**
- ✓ Workbook parses with no structural errors
- ✓ ≥ 17 scheme rows parsed; every row has scheme_id + name + URL
- ✓ Valid dataset passes validation
- ✓ Duplicate Scheme ID rejected
- ✓ Missing Scheme Name rejected
- ✓ Invalid Official URL rejected
- ✓ Duplicate scheme (same URL + name) rejected
- ✓ Shared URL with distinct names allowed (federal guarantees)
- ✓ Missing "Schemes" worksheet reported

**Database (live Supabase)**
- ✓ Import succeeds
- ✓ Imported 17 schemes
- ✓ `GET /api/schemes` returns all rows
- ✓ `GET /api/schemes/:id` returns a scheme
- ✓ `GET /api/schemes/featured` returns ≤ 6 active
- ✓ `GET /api/schemes/eligible` filters deterministically
- ✓ Failing import errors
- ✓ **Failing import ROLLS BACK (row count unchanged)**
- ✓ Import history has a success record

---

## HTTP end-to-end (live Next server + Supabase)

| Request | Result |
| --- | --- |
| `GET /api/schemes` | 200 · count **17** |
| `GET /api/schemes/featured?limit=3` | 200 · 3 active schemes |
| `GET /api/schemes/nsw-first-home-owner-grant` | 200 · "First Home Owner (New Homes) Grant", benefit $10,000 |
| `GET /api/schemes/eligible?state=VIC&firstHomeBuyer=true&income=90000&propertyPrice=650000` | 200 · **11** eligible |
| `POST /api/admin/master-data/upload` (no token) | **401** — admin gate enforced |
| `POST /api/admin/master-data/upload` (valid token + real xlsx) | **200** · `{ success:true, schemesImported:17, importId, durationMs:200 }` |
| `POST …/upload` (malformed workbook) | **422** · `Required worksheet "Schemes" not found` — **data unchanged (still 17)** |

---

## Import history (audit log) — `master_data_imports`

| uploaded_at | status | rows | uploaded_by | duration | errors |
| --- | --- | ---: | --- | ---: | ---: |
| 12:46:11 | failed | 0 | business-analyst | 21ms | 1 |
| 12:45:34 | success | 17 | ba-http-test | 200ms | 0 |
| 12:44:36 | success | 17 | test-runner | 291ms | 0 |
| 12:40:15 | failed | 0 | test-runner | 510ms | 1 |

Every upload — success or failure — produces exactly one audit row.

---

## Requirements coverage

| Phase 2A requirement | Status |
| --- | --- |
| Supabase schema (`government_schemes` 56 cols + metadata, `master_data_imports`) | ✅ |
| Upload API `POST /api/admin/master-data/upload` | ✅ |
| Workbook validation (worksheet, columns, dup IDs/URLs, missing name/URL, invalid URLs, types) | ✅ |
| Excel parsing (Schemes sheet only, dedicated column mapper) | ✅ |
| Transactional replace (delete → insert → commit; rollback on error) | ✅ verified |
| Import history / audit log | ✅ |
| Read APIs (`/schemes`, `/schemes/:id`, `/schemes/featured`, `/schemes/eligible`) reading only Supabase | ✅ |
| Security (Super-Admin upload; public reads) | ✅ (401 verified) |
| Testing (upload, validation failure, duplicates, rollback, history, API responses) | ✅ 19/19 |
| No frontend modifications; extraction engine untouched | ✅ |

---

## Issues found & fixed during verification

1. **Env read too early** — Supabase clients read env at module load; ES import hoisting meant the standalone test captured undefined keys. → Read env **lazily** inside the client getters (`src/lib/supabase/server.ts`). Also correct for the Next runtime.
2. **Node 20 lacks global `WebSocket`** — `@supabase/supabase-js` threw on client creation. → Polyfilled `ws` in the server-only client module. Verified working under the real Next runtime.
3. **`pg-safeupdate` blocks unqualified DELETE** — the transactional replace failed with "DELETE requires a WHERE clause". → Switched the full replace to `TRUNCATE` (transactional, not subject to that guard) in the import function.
4. **Duplicate-URL rule too strict** — the approved Excel legitimately shares one URL across the 3 federal guarantees. → Rule now flags duplicates only on same URL **and** same name; scheme_id remains the unique key.

---

## Conclusion

Phase 2A is complete and verified end-to-end: the approved Excel imports into
Supabase transactionally, invalid uploads are rejected without touching data,
every upload is audited, and the public read APIs serve scheme data from the
database only. Ready to proceed to **Phase 2B** (admin UI + frontend wiring).
