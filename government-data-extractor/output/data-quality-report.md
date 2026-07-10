# Government Scheme Data Quality Report

**Extraction Date:** 08 Jul 2026

| Metric | Value |
| --- | ---: |
| Total Schemes | 3 |
| Successfully Extracted | 3 |
| Average Completeness | 58% |
| PDF Success Rate | 33% (1/3) |
| Conflicts Found | 9 |
| Missing Expected Schemes | 14 |
| Schemes Requiring Review | 3 |

## Top 5 Least Complete Schemes

| Scheme | Jurisdiction | Completion |
| --- | --- | ---: |
| First home owner grant | WA | 46.4% |
| HomeGrown Territory Grant | NT | 58.9% |
| First Home Owner Rate of Duty | WA | 69.6% |

## Field Coverage Summary

How often each column is populated across all schemes. Low coverage may mean
the information isn't published by governments — or that the extractor needs work.

| Field | Populated | Coverage |
| --- | ---: | ---: |
| Scheme ID | 3/3 | ██████████ 100% |
| Scheme Name (official) | 3/3 | ██████████ 100% |
| Acronym | 3/3 | ██████████ 100% |
| Type | 3/3 | ██████████ 100% |
| Level | 3/3 | ██████████ 100% |
| Administering Body | 3/3 | ██████████ 100% |
| Short Description | 3/3 | ██████████ 100% |
| Detailed Description | 3/3 | ██████████ 100% |
| Applicable States/Territories | 3/3 | ██████████ 100% |
| Metro vs Regional | 0/3 | ░░░░░░░░░░ 0% |
| Postcode/Region Restrictions | 0/3 | ░░░░░░░░░░ 0% |
| Benefit Type | 3/3 | ██████████ 100% |
| Benefit Value | 3/3 | ██████████ 100% |
| Value Unit | 3/3 | ██████████ 100% |
| Max Value/Cap | 0/3 | ░░░░░░░░░░ 0% |
| State-by-State Value Variations | 0/3 | ░░░░░░░░░░ 0% |
| Regional Bonus Amount | 0/3 | ░░░░░░░░░░ 0% |
| Value Calculation Method | 3/3 | ██████████ 100% |
| First Home Buyer Required | 3/3 | ██████████ 100% |
| Owner-Occupier Required | 1/3 | ███░░░░░░░ 33% |
| Citizenship/Residency | 2/3 | ███████░░░ 67% |
| Minimum Age | 0/3 | ░░░░░░░░░░ 0% |
| Income Cap - Single | 0/3 | ░░░░░░░░░░ 0% |
| Income Cap - Couple | 0/3 | ░░░░░░░░░░ 0% |
| Income Test Basis | 0/3 | ░░░░░░░░░░ 0% |
| Property Price Cap | 1/3 | ███░░░░░░░ 33% |
| Price Cap Variations | 1/3 | ███░░░░░░░ 33% |
| Eligible Property Types | 3/3 | ██████████ 100% |
| New vs Established | 3/3 | ██████████ 100% |
| Minimum Deposit | 1/3 | ███░░░░░░░ 33% |
| Prior Ownership Rules | 1/3 | ███░░░░░░░ 33% |
| Single Parent Required | 0/3 | ░░░░░░░░░░ 0% |
| Dependent Children Required | 0/3 | ░░░░░░░░░░ 0% |
| Relationship Status | 2/3 | ███████░░░ 67% |
| Occupancy Requirement | 2/3 | ███████░░░ 67% |
| Other Conditions | 2/3 | ███████░░░ 67% |
| Full Exemption Threshold | 1/3 | ███░░░░░░░ 33% |
| Partial Concession Range | 1/3 | ███░░░░░░░ 33% |
| Concession Calculation Method | 1/3 | ███░░░░░░░ 33% |
| Can Be Combined With | 1/3 | ███░░░░░░░ 33% |
| Mutually Exclusive With | 0/3 | ░░░░░░░░░░ 0% |
| Places/Quota | 0/3 | ░░░░░░░░░░ 0% |
| Status | 3/3 | ██████████ 100% |
| Start Date | 2/3 | ███████░░░ 67% |
| End/Closing Date | 2/3 | ███████░░░ 67% |
| Contract Date Window | 2/3 | ███████░░░ 67% |
| Financial Year | 1/3 | ███░░░░░░░ 33% |
| Official Government URL | 3/3 | ██████████ 100% |
| Legislation/Policy Reference | 1/3 | ███░░░░░░░ 33% |
| Application Method | 3/3 | ██████████ 100% |
| Last Verified Date | 3/3 | ██████████ 100% |
| Source Website | 3/3 | ██████████ 100% |
| Notes/Caveats | 1/3 | ███░░░░░░░ 33% |
| Eligibility Tag/Pill | 3/3 | ██████████ 100% |
| Priority/Ranking | 3/3 | ██████████ 100% |
| Catchy Line/Hook | 3/3 | ██████████ 100% |

## Review Recommendations

### First home owner grant [WA] — Needs Review

- Income Cap - Single unavailable.
- Income Cap - Couple unavailable.
- Property Price Cap unavailable.
- Citizenship/Residency unavailable.

### First Home Owner Rate of Duty [WA] — Needs Review

- Income Cap - Single unavailable.
- Income Cap - Couple unavailable.
- Minimum Deposit unavailable.
- Occupancy Requirement unavailable.
- Conflicting Citizenship/Residency: HTML "If there is more than one purchaser, foreign transfer duty will apply to the dutiable value of the foreign person’s interest in the property.See the ‘Foreign Transfer Duty’ fact sheet for more information.ExampleKate, an Australian citizen…" vs PDF "Example Kate, an Australian citizen, and her partner Simon, a foreign person, are first home buyers.".
- Conflicting Price Cap Variations: HTML "Cap amounts for the grantThe amount varies depending on where the home is located.LocationValue of land and buildingSouth of the 26th parallel of South latitude.This includes all…; Contact us for rates that applied to transactions entered into before 2 July 2014.Home and landTransaction dateUnencumbered value of the home and landbefore 9 May 2024Must not exc…; If the transaction involves the purchase of a partial or further interest from the Housing Authority or the repurchase of a partial interest by the Housing Authority, the transact…" vs PDF "Home and land Transaction date Unencumbered value of the home and land before 9 May 2024 • Must not exceed $530,000. • No duty is payable if the dutiable value does not exceed $43…; Tim and Noelle, together with the Housing Authority, enter into a contract to purchase a home in the Metropolitan region for $420,000.; Joe and Mary, together with the Housing Authority, enter into a contract to purchase a home in the Metropolitan region for $600,000.".
- Conflicting Other Conditions: HTML "Value thresholds Show more To be assessed at the FHOR, the transaction must not exceed:the cap amount for the grant andthe dutiable value thresholds.; Cap amounts for the grantThe amount varies depending on where the home is located.LocationValue of land and buildingSouth of the 26th parallel of South latitude.This includes all Perth metropolitan a…; North of the 26th parallel of South latitude.Must not exceed $1,000,000See information about the value of the home in relation to eligibility for the grant." vs PDF "Value thresholds To be assessed at the FHOR, the transaction must not exceed: • the cap amount for the grant and • the dutiable value thresholds.; Must not exceed $750,000.; Must not exceed $1,000,000 See information about the value of the home in relation to eligibility for the grant.".
- Conflicting Can Be Combined With: HTML "How to apply Show more Lodge Form F-FHOG1 ‘FHOG Application and/or Pre-approval for the First Home Owner Rate of Duty’ with an approved financial institution or RevenueWA.If you meet the criteria, Re…; Submit the transaction record (e.g. contract for sale and/or transfer of land) together with the completed Form FDA7 'First Home Owner Rate of Duty' and Form FDA41 ‘Foreign Transfer Duty Declaration’…" vs PDF "Submit the transaction record (e.g. contract for sale and/or transfer of land) together with the completed Form FDA7 'First Home Owner Rate of Duty' and Form FDA41 ‘Foreign Transfer Duty Declaration’…".
- Conflicting Start Date: HTML "2 July 2014" vs PDF "9 May 2024".
- Conflicting End/Closing Date: HTML "9 May 2024" vs PDF "2 July 2014".
- Conflicting Contract Date Window: HTML "Contact us for rates that applied to transactions entered into before 2 July 2014.Home and landTransaction dateUnencumbered value of the home and landbefore 9 May 2024Must not exceed $530,000.No duty…" vs PDF "00817495 Page 1 of 6 First Home Owner Rate of Duty Sections 141 – 146 of the Duties Act 2008 As at 17 July 2025 The first home owner rate (FHOR) is a concessional rate of duty applied to certain tran…".
- Conflicting Legislation/Policy Reference: HTML "First Home Owner Grant Act 2000; Taxation Administration Act 2003" vs PDF "Duties Act 2008; First Home Owner Grant Act 2000; Taxation Administration Act 2003".
- Conflicting Notes/Caveats: HTML "Last updated: 18 June 2026 Upcoming changes to the first home owner rate of duty eligibilityLegislation has been introduced to: increase the first home owner rate of duty thresholds andremove the lin…" vs PDF "Note: This fact sheet provides guidance only.".

### HomeGrown Territory Grant [NT] — Needs Review

- Income Cap - Single unavailable.
- Income Cap - Couple unavailable.
- Property Price Cap unavailable.
- Minimum Deposit unavailable.
- Government PDF blocked (HTTP 403 downloading PDF) — some fields may be incomplete.
