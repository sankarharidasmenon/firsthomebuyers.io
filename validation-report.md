# FHB Persona Validation Report

**Source:** `docs/FHB_Personas.xlsx` (sheet `TestData_Personas`, 15 personas)
**Validated against:** FirstNest v3, branch `v5`, commit `1ec8ea8`
**Date:** 2026-07-20
**Method:** Live execution — Next dev server on `localhost:3001`, real Supabase data (17 active schemes). Grant eligibility obtained from `GET /api/schemes/eligible`; borrowing capacity by importing and executing the application's own `calculateBorrowingCapacity()` / `calculateDepositGap()` from `src/lib/calculations.ts`.

No application code was modified. No output below is estimated — every figure was produced by running the application.

---

## Executive Summary

| Outcome | Count |
|---|---|
| **Total personas** | **15** |
| ✅ Passed | 1 |
| ❌ Failed | 9 |
| ⚠️ Partial | 3 |
| 🚫 Not testable | 2 |

**Headline finding:** the borrowing-capacity engine is real, deterministic and behaved correctly in every persona where its inputs are supported. Grant eligibility is the problem area — it is driven entirely by the `government_schemes` table, and that table is missing the income caps and property-price caps the personas are designed to test. Combined with one data error affecting couples, 9 of 15 personas produce an eligibility result that differs from expectation.

**The single most impactful defect is [BUG-1](#bug-1--every-couple-is-excluded-from-the-5-deposit-guarantees-and-help-to-buy)** — it alone accounts for the failure of P02, P06, P08 and P13, and masks other defects in those rows.

---

## Field Mapping

| Excel Field | Available in App | Notes |
|---|---|---|
| Persona ID | n/a | Test identifier only |
| Name / profile | ⚠️ Partial | `firstName` only (Step 1) |
| **Age** | ❌ **No** | Not captured anywhere. Blocks P09 |
| **Gender** | ❌ No | Not captured. Not required by any logic |
| Marital status | ⚠️ Partial | Only `buyingWith: 'solo' \| 'partner'`. Cannot express divorced/de facto/single-parent |
| **Dependants** | ❌ **No** | Not captured. HEM floor is a flat $3,200/$4,500 regardless of children |
| Gross annual income | ✅ Yes | `Step2.annualIncome` |
| Partner income | ✅ Yes | `Step2.partnerIncome` |
| Savings | ✅ Yes | `Step3.depositAmount` |
| Monthly expenses | ✅ Yes | `Step2.monthlyExpenses` |
| Credit card limit | ✅ Yes | `Step4.creditCardLimit`, assessed at 3.8%/yr |
| **HECS/HELP balance** | ⚠️ **Boolean only** | `Step4.hecsDebt: boolean`. Balance discarded — $9k and $45k treated identically |
| Existing loan repay | ✅ Yes | `Step4.otherLoanRepayments` |
| State | ✅ Yes | `Step1.state` |
| **Property type** | ⚠️ **Taxonomy mismatch** | App: `house/townhouse/apartment/offplan`. Sheet: `New/Established/New (build)`. **The new-vs-established distinction cannot be expressed** |
| **Regional vs metro** | ❌ **No** | Not captured. Blocks regional caps in P03, P14 |
| **Citizenship / residency** | ❌ **No** | Not captured. Blocks P11 |
| Target price | ✅ Yes | `Step3.targetPropertyPrice` |
| Expected: 5% Deposit Scheme | ⚠️ Partial | Returned by API, but **no price caps exist in the DB** |
| Expected: Help to Buy | ⚠️ Partial | Returned by API, but **no income caps exist in the DB** |
| Expected: FHOG | ✅ Yes | Per-state records exist; several values disagree with the sheet |
| **Expected: Stamp duty** | ❌ **Not implemented** | See [BUG-5](#bug-5--no-stamp-duty-calculation-exists) |
| Expected: borrowing notes | ✅ Yes | `calculateBorrowingCapacity()` |

---

## Persona Validation

Borrowing range is the application's actual output for every row.

| Persona | Borrowing (app output) | Status | Summary |
|---|---|---|---|
| P01 Sydney single | $470,000 – $523,000 | ❌ FAIL | NSW FHOG excluded — DB cap $600k vs $750k target |
| P02 Melbourne couple | $1,586,000 – $1,763,000 | ❌ FAIL | 5% Guarantee wrongly excluded; VIC FHOG wrongly granted on established home |
| P03 Regional QLD | $958,000 – $1,064,000 | ❌ FAIL | 5% Guarantee wrongly excluded; FHOG $30,000 vs expected $15,000 |
| P04 Adelaide single parent | $272,000 – $302,000 | ⚠️ PARTIAL | All three grants match; stamp duty & single-parent flag unsupported |
| P05 Perth FIFO | $864,000 – $960,000 | ❌ FAIL | Help to Buy granted at $140k income; WA FHOG granted on established home |
| P06 Hobart couple | $722,000 – $802,000 | ❌ FAIL | 5% Guarantee + Help to Buy wrongly excluded; TAS FHOG value empty |
| P07 Darwin | $375,000 – $417,000 | ❌ FAIL | HomeGrown $10,000 vs expected $50,000 |
| P08 Canberra couple | $1,305,000 – $1,450,000 | ❌ FAIL | 5% Guarantee wrongly excluded; HBCS income test not evaluated |
| P09 Under-age (17) | $63,000 – $69,000 | 🚫 NOT TESTABLE | No age field; returns 7 eligible schemes incl. $10,000 FHOG |
| P10 Previous owner | $1,654,000 – $1,838,000 | ✅ PASS | Correctly excluded from all FHB schemes; capacity still calculated |
| P11 Temporary visa | $562,000 – $625,000 | 🚫 NOT TESTABLE | No citizenship field; returns 6 eligible schemes |
| P12 Zero income | $0 – $0 | ⚠️ PARTIAL | Capacity correctly $0; grants not linked to serviceability |
| P13 Sydney $1.5M boundary | $2,962,000 – $3,291,000 | ❌ FAIL | 5% Guarantee wrongly excluded; NSW concession has no price cap |
| P14 Regional NSW $800,001 | $419,000 – $465,000 | ❌ FAIL | $1 over cap yet still granted; regional classification unsupported |
| P15 Maximal debt | $14,000 – $15,000 | ⚠️ PARTIAL | Capacity correctly collapses; grants match; HECS balance lost |

---

## Mismatches

Every case where application output differs from the sheet's expected value.

| # | Persona(s) | Expected | Application output | Reason |
|---|---|---|---|---|
| M1 | P02, P06, P08, P13 | 5% Deposit Scheme **eligible** | **Not eligible** | [BUG-1] `single_parent_required = Yes` on the three federal guarantees; couples send `singleParent=false` and are filtered out |
| M2 | P06 | Help to Buy eligible (joint $140k ≤ $165k) | Not eligible | Same as M1 — Help to Buy also carries `single_parent_required = Yes` |
| M3 | P05 | Help to Buy **not** eligible (income $140k > $103k) | **Eligible** | [BUG-2] No income caps stored on any scheme; income test never runs |
| M4 | P14 | Not eligible — other-areas cap $800,000 exceeded by $1 | **Eligible** | [BUG-3] Guarantees have no `property_price_cap`; boundary never tested |
| M5 | P13 | No duty relief above $1M | NSW FHBAS **eligible** | [BUG-3] NSW concession record has no price cap |
| M6 | P01 | NSW FHOG $10,000 eligible | Not eligible | DB cap is $600,000; target $750,000. App is self-consistent — the sheet assumes the house-and-land cap |
| M7 | P03 | QLD FHOG $15,000 (from 1 Jul 2026) | **$30,000** | [BUG-6] DB holds the current $30,000 value |
| M8 | P07 | NT HomeGrown $50,000 | **$10,000** | [BUG-6] DB value disagrees with sheet |
| M9 | P06 | TAS FHOG $20,000 (or $10,000) | **blank** | [BUG-7] `benefit_value` empty on the TAS record |
| M10 | P02, P05 | FHOG **not** eligible (established home) | **Eligible** | [BUG-4] `house` matches the substring `home` in `"New home"`, so established purchases pass a new-build-only test |
| M11 | P01, P03, P04, P05, P06, P12, P15 | Specific stamp-duty amounts | **No figure produced** | [BUG-5] No stamp-duty engine exists |
| M12 | P09 | Ineligible (under 18) | 7 schemes eligible | No age field |
| M13 | P11 | Ineligible (not citizen/PR) | 6 schemes eligible | No citizenship field |

---

## Missing Features

| Missing capability | Affected personas | Impact |
|---|---|---|
| **Age capture + under-18 block** | P09 | Minors receive full eligibility results |
| **Citizenship / residency** | P11 | Temporary visa holders receive full eligibility results |
| **Stamp duty calculation** | P01, P03, P04, P05, P06, P12, P15 | No duty figure anywhere in the app. `docs`-specified `src/lib/stampDuty.ts` **does not exist** |
| **Income caps on schemes** | P02, P03, P05, P08, P13 | Help to Buy / HBCS income tests never execute |
| **Property price caps on guarantees** | P01, P13, P14 | Cap boundaries never enforced |
| **New vs established property** | P02, P05, P06, P03 | Cannot distinguish; new-build-only grants leak to established purchases |
| **Regional vs metro classification** | P03, P14 | Regional caps and the Regional FHB Guarantee cannot be targeted |
| **HECS/HELP balance** | P01, P03, P05, P06, P07, P12, P14, P15 | Boolean only; a $9k and a $45k balance are identical to the engine |
| **Dependants count** | P02, P04, P08, P10 | HEM floor is flat; children do not raise assessed expenses |
| **Single-parent status** | P04 | Not captured; inferred as `undefined` for solo applicants |
| **Serviceability ↔ grant linkage** | P12, P15 | Grants presented as available even when capacity is $0 |

> **Note on `src/lib/grantEligibility.ts` and `src/lib/stampDuty.ts`:** both are specified in `CLAUDE.md` §3.1 but neither exists. Eligibility was re-platformed onto the database (`src/lib/schemes/`); stamp duty was never implemented.

---

## Bugs

### BUG-1 — Every couple is excluded from the 5% deposit guarantees and Help to Buy
**Severity: High** · Affects P02, P06, P08, P13

`src/app/results/grants/page.tsx:73` sends `singleParent: false` for any couple:
```ts
singleParent: s1.buyingWith === 'partner' ? false : undefined,
```
`src/lib/schemes/repository.ts:151` then excludes any scheme requiring a single parent. Four records carry `single_parent_required = "Yes"`:

| Scheme | Correct? |
|---|---|
| `fed-family-home-guarantee` | ✅ Correct — genuinely single-parent targeted |
| `fed-first-home-guarantee` | ❌ **Wrong** — open to all first home buyers |
| `fed-regional-first-home-buyer-guarantee` | ❌ **Wrong** — open to all regional FHBs |
| `fed-help-to-buy` | ❌ **Wrong** — open to all eligible buyers |

Net effect: no couple can ever be shown the First Home Guarantee, Regional Guarantee or Help to Buy. This is a **data defect**, correctable in the `government_schemes` table without a code change.

### BUG-2 — No income caps are stored, so income tests never run
**Severity: High** · Affects P02, P03, P05, P08, P13

Every one of the 17 schemes has empty `income_cap_single` and `income_cap_couple`. The filtering code is present and correct (`repository.ts:132`) but never fires. Demonstrated by **P05**: a single applicant on $140,000 is shown Help to Buy as eligible despite the $103,000 cap.

### BUG-3 — Deposit-guarantee price caps are absent
**Severity: High** · Affects P01, P13, P14

No guarantee scheme carries a `property_price_cap`, so the entire cap structure the personas were built to probe is untested. **P14** ($800,001 against an $800,000 other-areas cap — deliberately $1 over) is returned **eligible**.

### BUG-4 — Property-type matching lets established homes pass new-build-only tests
**Severity: Medium** · Affects P02, P05

`repository.ts:158-172` maps `house` to keywords including `'home'`. A scheme restricted to `"New home"` matches the substring `home`, so an established-home buyer passes. VIC and WA FHOG (both new-build only) are wrongly granted in P02 and P05.

### BUG-5 — No stamp duty calculation exists
**Severity: High** · Affects 7 personas

There is no duty engine anywhere in `src/`. Schemes of type `Stamp Duty Relief` / `Concession` store the **string** `"Duty exemption / concession"` in `benefit_value`. In `eligibilityClient.ts:154`, `parseMoney()` strips non-numerics, yielding `""` → `Number("") = 0` → rejected as not `> 0` → `null`.

**Consequence: `taxSavingsTotal` is always `$0`**, and `TotalSavingsHero` renders "stamp duty reduction" beneath a permanently zero figure.

### BUG-6 — Grant values disagree with the persona sheet
**Severity: Medium** · Affects P03, P07

| Scheme | DB value | Sheet expects |
|---|---|---|
| `qld-first-home-owner-grant` | $30,000 | $15,000 (from 1 Jul 2026) |
| `nt-homegrown-territory-grant` | $10,000 | $50,000 |

Whether these are DB errors or stale sheet expectations needs a business-side decision — I have not assumed which source is authoritative.

### BUG-7 — TAS First Home Owner Grant has no benefit value
**Severity: Medium** · Affects P06

`tas-first-home-owner-grant` has an empty `benefit_value`. The scheme is returned as eligible but renders with no amount, and contributes $0 to the grants total.

### BUG-8 — FHSS is offered to non-first-home-buyers
**Severity: Low** · Affects P10

`fed-first-home-super-saver` has an empty `first_home_buyer_required`, so it survives the FHB filter. In P10 (prior owner) it is the sole remaining eligible scheme. The real FHSS requires first-home-buyer status.

### BUG-9 — Grant eligibility is not linked to serviceability
**Severity: Low** · Affects P12, P15

P12 (zero income, capacity $0) is shown 7 eligible schemes including a $30,000 grant, with no indication the purchase cannot be serviced. A `ShortfallExplanationCard` exists on `/next-steps` but does not gate the grants view.

---

## Verified vs Unverified — summary

**Fully verified by execution**
- Borrowing capacity for all 15 personas (real function, real inputs)
- Deposit gap / LMI threshold for all 15
- Grant eligibility set for all 15 (live API, live DB)
- Prior-owner exclusion (P10) — the one clean pass

**Partially verified**
- P04, P12, P15 — supported fields produced correct output; unsupported fields (stamp duty, HECS balance, single-parent status) could not be exercised

**Not verified — inputs do not exist**
- P09 age gating; P11 citizenship gating
- All stamp-duty amounts across every persona
- All income-cap and price-cap boundary behaviour

---

## Reproduction

```bash
npm run dev                       # serves on :3000, or :3001 if occupied
curl "http://localhost:3001/api/schemes"          # 17 active schemes
curl "http://localhost:3001/api/schemes/eligible?state=WA&firstHomeBuyer=true\
&income=140000&hasPartner=false&propertyPrice=495000&propertyType=house&deposit=45000"
```
The final call reproduces **BUG-2** — Help to Buy is returned for a $140,000 income.
