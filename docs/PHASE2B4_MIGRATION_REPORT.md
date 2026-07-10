# Phase 2B-4 — Government Scheme Data Migration Report

**Date:** 08 Jul 2026
**Goal:** Make the entire application use Supabase (via the Phase 2A APIs) as the
single source of truth for Government Schemes. Remove all hardcoded scheme data.

Extraction engine, upload flow, Supabase schema and existing APIs were **not**
modified. No UI redesign.

---

## Files migrated (data source → API)

| File | Change |
| --- | --- |
| `src/app/next-steps/page.tsx` | "Government Support" total now from `fetchEligibility()` (was `evaluateEligibility`) |
| `src/components/home/GrantCalculatorSection.tsx` | Grant Calculator now computes from `fetchEligibility()` (debounced); removed `report.stampDuty` hardcoded calc |
| `src/components/results/GrantCard.tsx` | Type import → `@/lib/schemes/types`; removed hardcoded `SCHEME_BENEFITS` map (uses `grant.benefitLine` from DB) |
| `src/lib/schemes/eligibilityClient.ts` | Type imports → `@/lib/schemes/types` |
| `src/lib/dummyData.ts` | Removed `Grant` type, `GRANTS_DUMMY`, `DUMMY_RESULTS`; kept `DUMMY_USER` (user-answer fallback only) |
| `src/lib/schemes/repository.ts` *(2B-3)* | Eligibility logic on DB columns; fixed state-matching bug |
| `src/app/api/schemes/eligible/route.ts` *(2B-3)* | Parses propertyType / singleParent / deposit |
| `src/app/results/grants/page.tsx` *(2B-3)* | Eligibility results from the API |
| `src/components/home/GrantCards.tsx` *(2B-2)* | Homepage cards from `/api/schemes/featured` |

## Files added

- `src/lib/schemes/types.ts` — shared view-model types (`Grant`, `EvaluatedGrant`, `EligibilityStatus`), decoupled from any hardcoded data.

## Files removed (confirmed zero references first)

| File | Was |
| --- | --- |
| `src/lib/grantEligibility.ts` | Hardcoded eligibility rules + income caps + FHOG/guarantee/shared-equity logic |
| `src/lib/stampDuty.ts` | Hardcoded state-by-state stamp duty tables |
| `src/components/results/StampDutyCard.tsx` | Consumed the stamp-duty calc (unused after 2B-3) |
| `src/components/home/GrantC2.tsx` | Dead homepage variant (used `GRANTS_DUMMY` + stamp duty) |

## Remaining legacy files

**None** related to government scheme data. `src/lib/dummyData.ts` remains but now
contains only `DUMMY_USER` — sample **onboarding answers** used as a fallback when
`localStorage` is empty (user data, not scheme data).

## Remaining hardcoded government scheme data

**None.** Verified by grep across `src/`:
- No `GRANTS_DUMMY`, `DUMMY_RESULTS`, `SCHEME_BENEFITS`, `evaluateEligibility`, `calculateStampDuty`.
- No `schemes.json` / `eligibility.ts` / mock scheme files.
- No imports of the deleted modules.
- Remaining string matches are documentation comments only.

Note: onboarding still lists the 8 state/territory **codes** (NSW/VIC/…) as select
options — these are jurisdictions, not scheme data, and are out of scope.

## Components requested that don't exist in this app

`Search`, `Filters`, `Comparison`, `Grant Details` — there are no such routes/
components in FirstNest, so they are **N/A**. (The read APIs `/api/schemes`,
`/api/schemes/:id`, `/api/schemes/eligible` are in place should they be built.)

---

## Full project audit (live, against Supabase)

| Surface | Source | Status |
| --- | --- | --- |
| ✓ Homepage | — | HTTP 200 |
| ✓ Grant Cards (homepage) | `GET /api/schemes/featured` | 6 cards, live |
| ✓ Grant Calculator | `GET /api/schemes` + `/eligible` (debounced) | computes from DB |
| ✓ Eligibility (results/grants) | `GET /api/schemes` + `/eligible` | 7 eligible (VIC), live |
| ✓ Next Steps | `GET /api/schemes/*` | Government-support total from DB |
| ✓ Details (per-scheme) | `GET /api/schemes/:id` | returns scheme |
| ✓ Search / Filters / Comparison | n/a | not present (APIs ready) |
| ✓ Admin Upload | `POST /api/admin/master-data/upload` | 200, imported 17 |
| ✓ Import History | admin dashboard | live |
| ✓ APIs | Supabase | all 200 |
| ✓ Dynamic updates | upload → featured/eligible re-read live | verified, no redeploy |

Typecheck: **clean**. No runtime errors in the dev log.

**Dynamic-update proof:** uploaded `government_schemes.xlsx` (v2.0, 17 imported)
through the admin API; the read endpoints served the fresh data immediately with
no code change or redeploy (`cache: 'no-store'` + `force-dynamic` routes).

---

## Recommendations

1. **Replace the shared-secret admin gate with Supabase Auth + a role claim**
   before production; the token flow was a POC stand-in.
2. **Per-scheme detail page** — the `/api/schemes/:id` endpoint exists; a
   `/schemes/[id]` page could deep-link the "Official details" CTAs.
3. **Search / filters / comparison** — if added later, build them on the existing
   read APIs (add query params to `/api/schemes` rather than new hardcoded data).
4. **Consider light response caching** (e.g. `revalidate` + on-upload
   revalidation tag) if scheme reads become hot — currently every read hits the DB.
5. **Numeric benefit normalisation** — some benefit values are prose
   ("Government guarantee (avoids LMI)"); a future extractor pass could add a
   separate numeric field to improve calculator/hero totals.

---

## Conclusion

The Government Schemes module is now **fully driven by**:

```
Excel Upload → Supabase → APIs → Frontend
```

with no hardcoded government scheme data anywhere in the application and no code
change or redeployment required when schemes change.
