/**
 * Generated from the FHB Grants & Schemes Library SQLite database
 * (RulesEngine/Sept'26/fhb_grants_schemes_library.db) by
 * scripts/gen-schemes-library-data.mjs — do not hand-edit.
 *
 * This is a REFERENCE snapshot, not the live eligibility data source. The
 * app's actual eligibility engine reads from Supabase's government_schemes
 * table (src/lib/schemes/repository.ts), which only covers Federal, NSW and
 * VIC schemes verified against ATO/Housing Australia/Revenue NSW/SRO Vic
 * source documents this session. This library covers all 8 states/
 * territories (28 schemes) but was built from a different, less-verified
 * process — several fields are flagged by its own author as needing
 * confirmation (see GAPS_TO_VERIFY below). Treat it as a browsing aid, not
 * an eligibility determination.
 */

export interface LibraryScheme {
  scheme_id: string; scheme_name: string; short_name: string | null; jurisdiction: string;
  scheme_type: string; description: string | null; grant_amount_dollars: number | null;
  grant_amount_notes: string | null; property_type_eligible: string | null; min_age: number | null;
  residency_requirement: string | null; owner_occupier_required: number | null;
  min_occupancy_months: number | null; occupancy_start_months: number | null;
  previous_property_restrictions: string | null; application_method: string | null;
  administering_body: string | null; official_url: string | null; status: string | null;
  effective_from: string | null; effective_to: string | null; last_verified: string | null;
  notes: string | null;
}
export interface LibraryPriceCap { scheme_id: string; location_type: string | null; price_cap_dollars: number | null; price_cap_notes: string | null }
export interface LibraryIncomeCap { scheme_id: string; applicant_type: string | null; income_cap_dollars: number | null; income_cap_notes: string | null; financial_year: string | null }
export interface LibraryEligibility { scheme_id: string; criterion_category: string | null; criterion_description: string; is_mandatory: number }
export interface LibraryDataSource { source_id: string; source_name: string; source_url: string | null; description: string | null; last_updated: string }

export const GAPS_TO_VERIFY = [
  "NT FreshStart Grant — amount and eligibility only mentioned in passing; verify with NT Treasury",
  "NSW Shared Equity — income caps and property caps are sparse; verify current thresholds",
  "QLD FHOG reversion — confirm the drop to $15,000 from 1 July 2026 is enacted",
  "VIC Off-the-Plan concession — verify extension beyond October 2026",
  "All income caps — many are wage-indexed annually; verify FY26/27 thresholds",
] as const;

export const SCHEMES: LibraryScheme[] = [
  {
    "scheme_id": "ACT_NO_FHOG",
    "scheme_name": "First Home Owner Grant",
    "short_name": "ACT FHOG",
    "jurisdiction": "ACT",
    "scheme_type": "Grant",
    "description": "The ACT does NOT offer a First Home Owner Grant. Instead, it provides comprehensive stamp duty relief.",
    "grant_amount_dollars": 0,
    "grant_amount_notes": "NOT AVAILABLE. ACT abolished FHOG in favour of stamp duty relief.",
    "property_type_eligible": "N/A",
    "min_age": null,
    "residency_requirement": "N/A",
    "owner_occupier_required": null,
    "min_occupancy_months": null,
    "occupancy_start_months": null,
    "previous_property_restrictions": "N/A",
    "application_method": "N/A",
    "administering_body": "ACT Revenue Office",
    "official_url": "https://www.revenue.act.gov.au/",
    "status": "Closed",
    "effective_from": null,
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "ACT replaced FHOG with stamp duty concessions and now full exemption from 1 July 2026."
  },
  {
    "scheme_id": "ACT_STAMP_DUTY",
    "scheme_name": "First Home Buyer Stamp Duty Exemption",
    "short_name": "ACT Stamp Duty Exemption",
    "jurisdiction": "ACT",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "Full stamp duty exemption for ALL first home buyers in the ACT, regardless of property value or income level. Effective from 1 July 2026.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "100% stamp duty exemption with NO price cap and NO income cap.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer. Must not have owned property in Australia.",
    "application_method": "Via_Conveyancer",
    "administering_body": "ACT Revenue Office",
    "official_url": "https://www.revenue.act.gov.au/",
    "status": "Active",
    "effective_from": "2026-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "From 1 July 2026: blanket exemption for all first home buyers regardless of home value or income. Previously had Home Buyer Concession Scheme with income and price caps. No FHOG available in ACT."
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "scheme_name": "Home Guarantee Scheme - Family Home Guarantee",
    "short_name": "Family Home Guarantee (2% Deposit)",
    "jurisdiction": "Federal",
    "scheme_type": "Deposit_Guarantee",
    "description": "Eligible single parents can purchase a home with as little as a 2% deposit without paying LMI.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Not a cash grant. Government guarantees up to 18% of property value, removing LMI for 2% deposit buyers.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Single legal guardians of at least one dependent. Can be previous home owner.",
    "application_method": "Via_Lender",
    "administering_body": "Housing Australia",
    "official_url": "https://www.housingaustralia.gov.au/home-guarantee-scheme",
    "status": "Active",
    "effective_from": "2021-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "For single legal guardians with at least one dependent. Same price caps as First Home Guarantee."
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "scheme_name": "Home Guarantee Scheme - First Home Guarantee",
    "short_name": "First Home Guarantee (5% Deposit)",
    "jurisdiction": "Federal",
    "scheme_type": "Deposit_Guarantee",
    "description": "Eligible first home buyers can purchase with as little as a 5% deposit without paying Lenders Mortgage Insurance (LMI). The government guarantees up to 15% of the property value.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Not a cash grant. Government guarantees up to 15% of property value, removing LMI requirement for 5% deposit buyers.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer or not have owned property in Australia in last 10 years",
    "application_method": "Via_Lender",
    "administering_body": "Housing Australia",
    "official_url": "https://www.housingaustralia.gov.au/home-guarantee-scheme",
    "status": "Active",
    "effective_from": "2020-01-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Expanded 1 Oct 2025: no annual place caps, no income caps, higher price caps. Must apply through participating lender."
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "scheme_name": "Home Guarantee Scheme - Regional First Home Buyer Guarantee",
    "short_name": "Regional First Home Buyer Guarantee",
    "jurisdiction": "Federal",
    "scheme_type": "Deposit_Guarantee",
    "description": "Eligible first home buyers in regional Australia can purchase with as little as a 5% deposit without LMI.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Not a cash grant. Government guarantees up to 15% of property value.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer or not have owned in last 10 years",
    "application_method": "Via_Lender",
    "administering_body": "Housing Australia",
    "official_url": "https://www.housingaustralia.gov.au/home-guarantee-scheme",
    "status": "Active",
    "effective_from": "2022-10-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Property must be in a regional area (outside capital cities). Same price caps as First Home Guarantee for rest-of-state."
  },
  {
    "scheme_id": "FED_HTB",
    "scheme_name": "Help to Buy Scheme",
    "short_name": "Help to Buy",
    "jurisdiction": "Federal",
    "scheme_type": "Shared_Equity",
    "description": "Australian Government contributes up to 40% equity (new homes) or 30% equity (established homes). Buyer needs only 2% deposit and finances remainder. Government shares in capital gains/losses proportionally.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Not a cash grant. Government equity contribution up to 40% for new builds, 30% for established.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer. Cannot have previously owned residential property in Australia.",
    "application_method": "Direct",
    "administering_body": "Housing Australia",
    "official_url": "https://www.housingaustralia.gov.au/help-buy",
    "status": "Active",
    "effective_from": "2025-01-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "10,000 places per year. Participating states: NSW, VIC, QLD, WA, SA, TAS, ACT, NT. Income caps apply. Wage-indexed annually."
  },
  {
    "scheme_id": "FED_FHSSS",
    "scheme_name": "First Home Super Saver Scheme",
    "short_name": "FHSSS",
    "jurisdiction": "Federal",
    "scheme_type": "Tax_Incentive",
    "description": "Allows first home buyers to make voluntary contributions into their superannuation fund and withdraw them (plus associated earnings) to purchase their first home.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Not a direct grant. Tax savings via concessional super contributions. Max release: $15,000 per financial year, up to $50,000 total per person.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer. Cannot have previously owned property in Australia.",
    "application_method": "Direct",
    "administering_body": "Australian Taxation Office (ATO)",
    "official_url": "https://www.ato.gov.au/individuals/super/in-detail/withdrawals/first-home-super-saver-scheme/",
    "status": "Active",
    "effective_from": "2017-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Voluntary contributions only (concessional and non-concessional). Must request determination from ATO before signing contract. 12-month window to purchase after release request."
  },
  {
    "scheme_id": "NSW_FHOG",
    "scheme_name": "First Home Owner Grant (New Home)",
    "short_name": "NSW FHOG",
    "jurisdiction": "NSW",
    "scheme_type": "Grant",
    "description": "One-off payment of $10,000 for eligible first home buyers purchasing or building a new home or substantially renovated home.",
    "grant_amount_dollars": 10000,
    "grant_amount_notes": "$10,000 one-off payment",
    "property_type_eligible": "New_or_Substantially_Renovated",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia. Must not have received FHOG in any other state.",
    "application_method": "Via_Lender",
    "administering_body": "Revenue NSW",
    "official_url": "https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "For new homes or substantially renovated homes. Contract price must not exceed cap. Can combine with stamp duty concessions."
  },
  {
    "scheme_id": "NSW_SHARED_EQUITY",
    "scheme_name": "NSW Shared Equity Scheme",
    "short_name": "NSW Shared Equity",
    "jurisdiction": "NSW",
    "scheme_type": "Shared_Equity",
    "description": "NSW Government contributes up to 40% equity for new homes or 30% for existing homes. Reduces mortgage size and LMI costs.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Government equity contribution up to 40% (new) or 30% (established).",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer.",
    "application_method": "Direct",
    "administering_body": "NSW Government",
    "official_url": "https://www.nsw.gov.au/housing-and-construction/shared-equity",
    "status": "Active",
    "effective_from": "2023-01-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Income and property price caps apply. Must be key workers or single parents in some streams."
  },
  {
    "scheme_id": "NSW_FHBAS",
    "scheme_name": "First Home Buyers Assistance Scheme",
    "short_name": "NSW Stamp Duty Relief",
    "jurisdiction": "NSW",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "Full stamp duty exemption for first home buyers purchasing new or existing homes up to $800,000. Concessional rate for homes between $800,001 and $1,000,000.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Full exemption up to $800k. Concession on sliding scale $800k-$1m.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned or co-owned residential property in Australia.",
    "application_method": "Via_Conveyancer",
    "administering_body": "Revenue NSW",
    "official_url": "https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer",
    "status": "Active",
    "effective_from": "2017-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Can be combined with FHOG. For vacant land: exemption up to $350k, concession up to $450k. ADF members exempt from occupancy requirement if enrolled to vote in NSW."
  },
  {
    "scheme_id": "NT_FRESHSTART",
    "scheme_name": "FreshStart Grant",
    "short_name": "NT FreshStart",
    "jurisdiction": "NT",
    "scheme_type": "Grant",
    "description": "Additional grant for eligible first home buyers in the Northern Territory. Limited publicly available details.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Amount and eligibility vary. Check with NT Department of Treasury.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer.",
    "application_method": "Direct",
    "administering_body": "NT Department of Treasury and Finance",
    "official_url": "https://nt.gov.au/property/buying-and-selling-property/first-home-owner-grant",
    "status": "Active",
    "effective_from": "2024-10-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Limited public information available. May be targeted at specific buyer segments. Verify current status with NT Treasury."
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "scheme_name": "HomeGrown Territory Grant - Established Home",
    "short_name": "NT HomeGrown (Established)",
    "jurisdiction": "NT",
    "scheme_type": "Grant",
    "description": "$10,000 grant for eligible first home buyers purchasing an established home in the Northern Territory.",
    "grant_amount_dollars": 10000,
    "grant_amount_notes": "$10,000 one-off payment for established homes",
    "property_type_eligible": "Established",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer. Must not have received FHOG in any other state.",
    "application_method": "Direct",
    "administering_body": "NT Department of Treasury and Finance",
    "official_url": "https://nt.gov.au/property/buying-and-selling-property/first-home-owner-grant",
    "status": "Active",
    "effective_from": "2024-10-01",
    "effective_to": "2026-12-30",
    "last_verified": "2026-09-03",
    "notes": "Contract must be signed between 1 Oct 2024 and 30 Dec 2026. No property price limit. No stamp duty concessions available in NT."
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "scheme_name": "HomeGrown Territory Grant - New Home",
    "short_name": "NT HomeGrown (New)",
    "jurisdiction": "NT",
    "scheme_type": "Grant",
    "description": "$50,000 grant for eligible first home buyers purchasing or building a new home in the Northern Territory.",
    "grant_amount_dollars": 50000,
    "grant_amount_notes": "$50,000 one-off payment for new homes",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer. Must not have received FHOG in any other state.",
    "application_method": "Direct",
    "administering_body": "NT Department of Treasury and Finance",
    "official_url": "https://nt.gov.au/property/buying-and-selling-property/first-home-owner-grant",
    "status": "Active",
    "effective_from": "2024-10-01",
    "effective_to": "2026-09-30",
    "last_verified": "2026-09-03",
    "notes": "Contract must be signed between 1 Oct 2024 and 30 Sep 2026. Home must never have been previously lived in or sold as residence. Available for owner-builders and off-the-plan. No property price limit."
  },
  {
    "scheme_id": "QLD_FHOG",
    "scheme_name": "First Home Owner Grant",
    "short_name": "QLD FHOG",
    "jurisdiction": "QLD",
    "scheme_type": "Grant",
    "description": "One-off payment for eligible first home buyers purchasing or building a new home in Queensland. $30,000 until 30 June 2026, reverting to $15,000 from 1 July 2026.",
    "grant_amount_dollars": 30000,
    "grant_amount_notes": "$30,000 until 30 June 2026. Reverts to $15,000 from 1 July 2026.",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia. Must not have received FHOG in any other state.",
    "application_method": "Via_Lender",
    "administering_body": "Queensland Revenue Office",
    "official_url": "https://www.qld.gov.au/housing/buying-owning-home/financial-help-concessions/first-home-owner-grant",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Doubled from $15,000 to $30,000 in Nov 2023. Reverting to $15,000 from 1 July 2026. For new homes valued under $750,000. Can combine with stamp duty concessions."
  },
  {
    "scheme_id": "QLD_RHBBG",
    "scheme_name": "Regional Home Building Boost Grant",
    "short_name": "QLD Regional Boost",
    "jurisdiction": "QLD",
    "scheme_type": "Grant",
    "description": "$5,000 grant for eligible applicants purchasing or building a brand-new house in regional Queensland.",
    "grant_amount_dollars": 5000,
    "grant_amount_notes": "$5,000 one-off payment",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have received this grant before.",
    "application_method": "Direct",
    "administering_body": "Queensland Revenue Office",
    "official_url": "https://www.qld.gov.au/housing/buying-owning-home/financial-help-concessions",
    "status": "Closed",
    "effective_from": "2020-06-04",
    "effective_to": "2021-03-31",
    "last_verified": "2026-09-03",
    "notes": "CLOSED. Contracts had to be dated between 4 June 2020 and 31 March 2021. For regional Queensland only."
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "scheme_name": "First Home Concession - New Builds",
    "short_name": "QLD Stamp Duty (New)",
    "jurisdiction": "QLD",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "Full stamp duty exemption for first home buyers purchasing a new-built home or vacant land to build a new home, regardless of purchase price.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Full exemption regardless of price for new builds and vacant land intended for new build.",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia.",
    "application_method": "Via_Conveyancer",
    "administering_body": "Queensland Revenue Office",
    "official_url": "https://www.qld.gov.au/housing/buying-owning-home/financial-help-concessions/transfer-duty-concessions",
    "status": "Active",
    "effective_from": "2025-05-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "From 1 May 2025: full exemption for new builds regardless of price. For established homes: exemption up to $700k, concession up to $800k. Must sign contract on/after 1 May 2025."
  },
  {
    "scheme_id": "SA_FHOG",
    "scheme_name": "First Home Owner Grant",
    "short_name": "SA FHOG",
    "jurisdiction": "SA",
    "scheme_type": "Grant",
    "description": "$15,000 for eligible first home buyers buying or building a new home in South Australia.",
    "grant_amount_dollars": 15000,
    "grant_amount_notes": "$15,000 one-off payment",
    "property_type_eligible": "New_or_Substantially_Renovated",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia. Must not have received FHOG in any other state.",
    "application_method": "Via_Lender",
    "administering_body": "Revenue SA",
    "official_url": "https://www.revenuesa.sa.gov.au/",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "No property value limit. For new homes that have not been previously lived in (includes substantially renovated homes). Can combine with stamp duty relief on new homes."
  },
  {
    "scheme_id": "SA_STAMP_DUTY",
    "scheme_name": "First Home Buyer Stamp Duty Relief",
    "short_name": "SA Stamp Duty Relief",
    "jurisdiction": "SA",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "No stamp duty for first home buyers purchasing or building a new dwelling. Does not apply to established homes.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Full exemption for new homes and land where new home will be built.",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer.",
    "application_method": "Via_Conveyancer",
    "administering_body": "Revenue SA",
    "official_url": "https://www.revenuesa.sa.gov.au/",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Only applies to new homes or land where a new home will be built. Does NOT apply to established homes. Can combine with FHOG."
  },
  {
    "scheme_id": "TAS_FHOG",
    "scheme_name": "First Home Owner Grant",
    "short_name": "TAS FHOG",
    "jurisdiction": "TAS",
    "scheme_type": "Grant",
    "description": "Base grant of $10,000 with additional payment up to $10,000 for eligible applicants = up to $20,000 total (from 1 July 2026). Previously $30,000.",
    "grant_amount_dollars": 20000,
    "grant_amount_notes": "Base $10,000 + up to $10,000 additional. Total up to $20,000 from 1 July 2026 (was $30,000 prior).",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia. Must not have received FHOG in any other state.",
    "application_method": "Via_Lender",
    "administering_body": "State Revenue Office Tasmania (SRO)",
    "official_url": "https://www.sro.tas.gov.au/",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "No property price limit. From 1 July 2026: base grant $10,000 + up to $10,000 additional (down from $30,000). Can combine with MyHome Shared Equity."
  },
  {
    "scheme_id": "TAS_MYHOME",
    "scheme_name": "MyHome Shared Equity Program",
    "short_name": "TAS MyHome",
    "jurisdiction": "TAS",
    "scheme_type": "Shared_Equity",
    "description": "Tasmanian Government contributes equity share to help eligible buyers purchase a home. Reduces deposit and mortgage required.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Government equity contribution. Amount varies by applicant.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": null,
    "occupancy_start_months": null,
    "previous_property_restrictions": "Must not own other property (except land to build on).",
    "application_method": "Direct",
    "administering_body": "Homes Tasmania",
    "official_url": "https://www.homestasmania.org.au/",
    "status": "Active",
    "effective_from": "2010-01-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "For existing homes: price cap $600,000. Financial assets cap $113,100 (exempt if qualifying for FHOG or stamp duty concession, or Homes Tasmania tenant). Minimum 2% deposit required."
  },
  {
    "scheme_id": "TAS_STAMP_DUTY",
    "scheme_name": "First Home Buyer Stamp Duty Exemption - Established Homes",
    "short_name": "TAS Stamp Duty (Established)",
    "jurisdiction": "TAS",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "100% stamp duty exemption for first home buyers purchasing established homes up to $750,000. ENDING 30 June 2026.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Full exemption for established homes up to $750,000.",
    "property_type_eligible": "Established",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer.",
    "application_method": "Via_Conveyancer",
    "administering_body": "State Revenue Office Tasmania (SRO)",
    "official_url": "https://www.sro.tas.gov.au/",
    "status": "Expiring_Soon",
    "effective_from": "2021-07-01",
    "effective_to": "2026-06-30",
    "last_verified": "2026-09-03",
    "notes": "ENDING 30 June 2026. From 1 July 2026, full stamp duty reinstated on established homes for first home buyers. Previously 50% concession up to $600,000."
  },
  {
    "scheme_id": "VIC_FHOG",
    "scheme_name": "First Home Owner Grant",
    "short_name": "VIC FHOG",
    "jurisdiction": "VIC",
    "scheme_type": "Grant",
    "description": "One-off payment of $10,000 for eligible first home buyers buying or building a new home in Victoria.",
    "grant_amount_dollars": 10000,
    "grant_amount_notes": "$10,000 one-off payment",
    "property_type_eligible": "New_or_Substantially_Renovated",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia. Must not have received FHOG in any other state.",
    "application_method": "Via_Lender",
    "administering_body": "State Revenue Office Victoria (SRO)",
    "official_url": "https://www.sro.vic.gov.au/fhog",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "For new homes or substantially renovated homes. Contract price must not exceed $750,000. Can combine with stamp duty exemption/concession."
  },
  {
    "scheme_id": "VIC_VHF",
    "scheme_name": "Victorian Homebuyer Fund",
    "short_name": "VIC Homebuyer Fund",
    "jurisdiction": "VIC",
    "scheme_type": "Shared_Equity",
    "description": "Victorian Government contributes up to 25% of purchase price. Reduces deposit required and eliminates LMI. Government shares in capital gains/losses.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Government equity contribution up to 25% of purchase price.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be first home buyer or not have owned in last 10 years.",
    "application_method": "Via_Lender",
    "administering_body": "State Revenue Office Victoria (SRO)",
    "official_url": "https://www.sro.vic.gov.au/victorian-homebuyer-fund",
    "status": "Active",
    "effective_from": "2021-10-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Must have minimum 5% deposit. Income and property price caps apply. Aboriginal and Torres Strait Islander buyers may receive up to 35% contribution with 3.5% deposit."
  },
  {
    "scheme_id": "VIC_OFF_PLAN",
    "scheme_name": "Off-the-Plan Stamp Duty Concession",
    "short_name": "VIC Off-the-Plan Concession",
    "jurisdiction": "VIC",
    "scheme_type": "Stamp_Duty_Concession",
    "description": "Stamp duty concession for off-the-plan homes, apartments, townhouses and units (strata subdivisions). Available to ANY buyer, not just first home buyers.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Duty applies only to land component, not construction. Deduction adjusted if construction has begun.",
    "property_type_eligible": "New",
    "min_age": 18,
    "residency_requirement": "Any",
    "owner_occupier_required": 0,
    "min_occupancy_months": null,
    "occupancy_start_months": null,
    "previous_property_restrictions": "None - available to all buyers including investors",
    "application_method": "Via_Conveyancer",
    "administering_body": "State Revenue Office Victoria (SRO)",
    "official_url": "https://www.sro.vic.gov.au/",
    "status": "Active",
    "effective_from": "2024-10-01",
    "effective_to": "2026-10-01",
    "last_verified": "2026-09-03",
    "notes": "Temporary 12-month measure from Oct 2024 - Oct 2026. Available to anyone (not just first home buyers). Foreign buyers subject to different rules."
  },
  {
    "scheme_id": "VIC_STAMP_DUTY",
    "scheme_name": "First Home Buyer Duty Exemption, Concession or Reduction",
    "short_name": "VIC Stamp Duty Relief",
    "jurisdiction": "VIC",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "Full stamp duty exemption for first home buyers on homes up to $600,000. Concessional rate for homes $600,001-$750,000.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Full exemption up to $600k. Concession on sliding scale $600k-$750k.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 12,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must meet FHOG eligibility criteria.",
    "application_method": "Via_Conveyancer",
    "administering_body": "State Revenue Office Victoria (SRO)",
    "official_url": "https://www.sro.vic.gov.au/fhbg",
    "status": "Active",
    "effective_from": "2017-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Available for both new and established homes (unlike FHOG). Can combine with FHOG. Off-the-plan concession also available Oct 2024-Oct 2026 for anyone buying strata subdivisions."
  },
  {
    "scheme_id": "WA_FHOG",
    "scheme_name": "First Home Owner Grant",
    "short_name": "WA FHOG",
    "jurisdiction": "WA",
    "scheme_type": "Grant",
    "description": "Up to $10,000 for eligible first home buyers purchasing or building a new home or substantially renovated home in Western Australia.",
    "grant_amount_dollars": 10000,
    "grant_amount_notes": "Up to $10,000 one-off payment",
    "property_type_eligible": "New_or_Substantially_Renovated",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must not have owned residential property in Australia. Must not have received FHOG in any other state.",
    "application_method": "Via_Lender",
    "administering_body": "WA Department of Finance",
    "official_url": "https://www.wa.gov.au/government/publications/about-the-first-home-owner-grant",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Property value cap depends on location: $800,000 south of 26th parallel (Perth metro), $1,000,000 north of 26th parallel. Can combine with stamp duty concessions."
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "scheme_name": "Shared Home Ownership Arrangement",
    "short_name": "WA Shared Equity (Keystart)",
    "jurisdiction": "WA",
    "scheme_type": "Shared_Equity",
    "description": "WA Housing Authority funds up to 30% of home purchase. Co-owns share of property. Aimed at low-to-moderate income earners, Aboriginal/Torres Strait Islander buyers, sole parents, and public housing tenants.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Government equity contribution up to 30% of purchase price.",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": null,
    "occupancy_start_months": null,
    "previous_property_restrictions": "Targeted at specific groups.",
    "application_method": "Via_Lender",
    "administering_body": "WA Housing Authority / Keystart",
    "official_url": "https://www.keystart.com.au/",
    "status": "Active",
    "effective_from": "2000-01-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Targeted at: singles earning up to $70,000; couples/families up to $90,000; Aboriginal/Torres Strait Islander buyers; sole parents; public housing tenants wishing to buy their home."
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "scheme_name": "First Home Owner Rate of Duty",
    "short_name": "WA Stamp Duty Relief",
    "jurisdiction": "WA",
    "scheme_type": "Stamp_Duty_Exemption",
    "description": "No stamp duty for first home buyers on homes up to $600,000 and vacant land up to $450,000. Concessional rate for homes up to $800,000 and vacant land up to $550,000.",
    "grant_amount_dollars": null,
    "grant_amount_notes": "Full exemption up to $600k (homes) / $450k (land). Concession up to $800k (homes) / $550k (land).",
    "property_type_eligible": "Both",
    "min_age": 18,
    "residency_requirement": "Citizen_or_Permanent_Resident",
    "owner_occupier_required": 1,
    "min_occupancy_months": 6,
    "occupancy_start_months": 12,
    "previous_property_restrictions": "Must be eligible for FHOG.",
    "application_method": "Via_Conveyancer",
    "administering_body": "WA Department of Finance",
    "official_url": "https://www.wa.gov.au/government/publications/about-the-first-home-owner-grant",
    "status": "Active",
    "effective_from": "2000-07-01",
    "effective_to": null,
    "last_verified": "2026-09-03",
    "notes": "Also includes off-the-plan concessions for strata units and townhouses up to $800,000, with scaled concessions up to $900,000."
  }
];

export const PRICE_CAPS: LibraryPriceCap[] = [
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Capital_City_NSW",
    "price_cap_dollars": 1500000,
    "price_cap_notes": "Sydney and regional centres (Newcastle, Lake Macquarie, Illawarra)"
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Capital_City_QLD",
    "price_cap_dollars": 1000000,
    "price_cap_notes": "Brisbane, Gold Coast, Sunshine Coast"
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Statewide_ACT",
    "price_cap_dollars": 1000000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Capital_City_VIC",
    "price_cap_dollars": 950000,
    "price_cap_notes": "Melbourne and Geelong"
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Capital_City_SA",
    "price_cap_dollars": 900000,
    "price_cap_notes": "Adelaide"
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Capital_City_WA",
    "price_cap_dollars": 850000,
    "price_cap_notes": "Perth"
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Rest_of_State_NSW",
    "price_cap_dollars": 800000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Rest_of_State_QLD",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Statewide_TAS",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Rest_of_State_VIC",
    "price_cap_dollars": 650000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Rest_of_State_WA",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Statewide_NT",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Rest_of_State_TAS",
    "price_cap_dollars": 550000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "location_type": "Rest_of_State_SA",
    "price_cap_dollars": 500000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Capital_City_NSW",
    "price_cap_dollars": 1500000,
    "price_cap_notes": "Sydney and regional centres"
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Capital_City_QLD",
    "price_cap_dollars": 1000000,
    "price_cap_notes": "Brisbane, Gold Coast, Sunshine Coast"
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Statewide_ACT",
    "price_cap_dollars": 1000000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Capital_City_VIC",
    "price_cap_dollars": 950000,
    "price_cap_notes": "Melbourne and Geelong"
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Capital_City_SA",
    "price_cap_dollars": 900000,
    "price_cap_notes": "Adelaide"
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Capital_City_WA",
    "price_cap_dollars": 850000,
    "price_cap_notes": "Perth"
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Rest_of_State_NSW",
    "price_cap_dollars": 800000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Rest_of_State_QLD",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Statewide_TAS",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Rest_of_State_VIC",
    "price_cap_dollars": 650000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Rest_of_State_WA",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Statewide_NT",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Rest_of_State_TAS",
    "price_cap_dollars": 550000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "location_type": "Rest_of_State_SA",
    "price_cap_dollars": 500000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Statewide_ACT",
    "price_cap_dollars": 1000000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Rest_of_State_NSW",
    "price_cap_dollars": 800000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Rest_of_State_QLD",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Rest_of_State_VIC",
    "price_cap_dollars": 650000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Rest_of_State_WA",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Statewide_NT",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Rest_of_State_TAS",
    "price_cap_dollars": 550000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "location_type": "Rest_of_State_SA",
    "price_cap_dollars": 500000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Capital_City_NSW",
    "price_cap_dollars": 1300000,
    "price_cap_notes": "Sydney"
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Capital_City_QLD",
    "price_cap_dollars": 1000000,
    "price_cap_notes": "Brisbane"
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Statewide_ACT",
    "price_cap_dollars": 1000000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Capital_City_VIC",
    "price_cap_dollars": 950000,
    "price_cap_notes": "Melbourne"
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Capital_City_SA",
    "price_cap_dollars": 900000,
    "price_cap_notes": "Adelaide"
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Capital_City_WA",
    "price_cap_dollars": 850000,
    "price_cap_notes": "Perth"
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Rest_of_State_NSW",
    "price_cap_dollars": 800000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Rest_of_State_QLD",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Statewide_TAS",
    "price_cap_dollars": 700000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Rest_of_State_VIC",
    "price_cap_dollars": 650000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Rest_of_State_WA",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Statewide_NT",
    "price_cap_dollars": 600000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Rest_of_State_TAS",
    "price_cap_dollars": 550000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Jervis_Bay_Norfolk",
    "price_cap_dollars": 550000,
    "price_cap_notes": "Jervis Bay Territory & Norfolk Island"
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Rest_of_State_SA",
    "price_cap_dollars": 500000,
    "price_cap_notes": null
  },
  {
    "scheme_id": "FED_HTB",
    "location_type": "Christmas_Cocos",
    "price_cap_dollars": 400000,
    "price_cap_notes": "Christmas Island & Cocos (Keeling) Islands"
  },
  {
    "scheme_id": "NSW_FHBAS",
    "location_type": "Statewide_NSW_Concession",
    "price_cap_dollars": 1000000,
    "price_cap_notes": "Concessional stamp duty rate for homes up to $1m"
  },
  {
    "scheme_id": "NSW_FHBAS",
    "location_type": "Statewide_NSW_Exemption",
    "price_cap_dollars": 800000,
    "price_cap_notes": "Full stamp duty exemption for new or existing homes"
  },
  {
    "scheme_id": "NSW_FHBAS",
    "location_type": "Vacant_Land_Concession",
    "price_cap_dollars": 450000,
    "price_cap_notes": "Concessional rate for vacant land"
  },
  {
    "scheme_id": "NSW_FHBAS",
    "location_type": "Vacant_Land_Exemption",
    "price_cap_dollars": 350000,
    "price_cap_notes": "Full exemption for vacant land"
  },
  {
    "scheme_id": "NSW_FHOG",
    "location_type": "Statewide_NSW_House_Land",
    "price_cap_dollars": 750000,
    "price_cap_notes": "For house and land packages / building contracts"
  },
  {
    "scheme_id": "NSW_FHOG",
    "location_type": "Statewide_NSW",
    "price_cap_dollars": 600000,
    "price_cap_notes": "For new home purchases"
  },
  {
    "scheme_id": "QLD_FHOG",
    "location_type": "Statewide_QLD",
    "price_cap_dollars": 750000,
    "price_cap_notes": "Total value including land and contract variations"
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "location_type": "Established_Concession",
    "price_cap_dollars": 800000,
    "price_cap_notes": "Concessional rate for established homes"
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "location_type": "Established_Exemption",
    "price_cap_dollars": 700000,
    "price_cap_notes": "For established homes"
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "location_type": "Vacant_Land_Concession",
    "price_cap_dollars": 500000,
    "price_cap_notes": "For vacant land (older rules)"
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "location_type": "Vacant_Land_Exemption",
    "price_cap_dollars": 350000,
    "price_cap_notes": "For vacant land (older rules)"
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "location_type": "New_Build_Statewide",
    "price_cap_dollars": null,
    "price_cap_notes": "No price limit for new builds and vacant land"
  },
  {
    "scheme_id": "TAS_MYHOME",
    "location_type": "Existing_Home",
    "price_cap_dollars": 600000,
    "price_cap_notes": "For existing homes"
  },
  {
    "scheme_id": "TAS_STAMP_DUTY",
    "location_type": "Statewide_TAS",
    "price_cap_dollars": 750000,
    "price_cap_notes": "Established homes up to $750,000"
  },
  {
    "scheme_id": "VIC_FHOG",
    "location_type": "Statewide_VIC",
    "price_cap_dollars": 750000,
    "price_cap_notes": "Contract price must not exceed $750,000"
  },
  {
    "scheme_id": "VIC_STAMP_DUTY",
    "location_type": "Statewide_VIC_Concession",
    "price_cap_dollars": 750000,
    "price_cap_notes": "Concessional rate on sliding scale"
  },
  {
    "scheme_id": "VIC_STAMP_DUTY",
    "location_type": "Statewide_VIC_Exemption",
    "price_cap_dollars": 600000,
    "price_cap_notes": "Full exemption"
  },
  {
    "scheme_id": "VIC_VHF",
    "location_type": "Metro_Melbourne",
    "price_cap_dollars": 950000,
    "price_cap_notes": "Metropolitan Melbourne and Geelong"
  },
  {
    "scheme_id": "VIC_VHF",
    "location_type": "Regional_VIC",
    "price_cap_dollars": 700000,
    "price_cap_notes": "Regional Victoria"
  },
  {
    "scheme_id": "WA_FHOG",
    "location_type": "North_of_26th_Parallel",
    "price_cap_dollars": 1000000,
    "price_cap_notes": "North of 26th parallel"
  },
  {
    "scheme_id": "WA_FHOG",
    "location_type": "South_of_26th_Parallel",
    "price_cap_dollars": 800000,
    "price_cap_notes": "Perth metropolitan area and south of 26th parallel"
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "location_type": "Off_Plan_Strata_Concession",
    "price_cap_dollars": 900000,
    "price_cap_notes": "Off-the-plan scaled concession"
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "location_type": "Home_Concession",
    "price_cap_dollars": 800000,
    "price_cap_notes": "Concessional rate on homes up to $800,000"
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "location_type": "Off_Plan_Strata",
    "price_cap_dollars": 800000,
    "price_cap_notes": "Off-the-plan strata units/townhouses exemption"
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "location_type": "Home_Exemption",
    "price_cap_dollars": 600000,
    "price_cap_notes": "No stamp duty on homes up to $600,000"
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "location_type": "Vacant_Land_Concession",
    "price_cap_dollars": 550000,
    "price_cap_notes": "Concessional rate on vacant land up to $550,000"
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "location_type": "Vacant_Land_Exemption",
    "price_cap_dollars": 450000,
    "price_cap_notes": "No stamp duty on vacant land up to $450,000"
  }
];

export const INCOME_CAPS: LibraryIncomeCap[] = [
  {
    "scheme_id": "FED_HTB",
    "applicant_type": "Single",
    "income_cap_dollars": 103000,
    "income_cap_notes": "FY25/26 threshold, effective 1 July 2026",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "FED_HTB",
    "applicant_type": "Single_Parent",
    "income_cap_dollars": 165000,
    "income_cap_notes": "FY25/26 threshold, effective 1 July 2026",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "FED_HTB",
    "applicant_type": "Joint",
    "income_cap_dollars": 165000,
    "income_cap_notes": "FY25/26 threshold, effective 1 July 2026",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "TAS_MYHOME",
    "applicant_type": "Single",
    "income_cap_dollars": null,
    "income_cap_notes": "Income must meet cost of purchasing and owning home",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "TAS_MYHOME",
    "applicant_type": "Joint",
    "income_cap_dollars": null,
    "income_cap_notes": "Income must meet cost of purchasing and owning home",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "VIC_VHF",
    "applicant_type": "Single",
    "income_cap_dollars": 130000,
    "income_cap_notes": "Approximate - verify current thresholds",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "VIC_VHF",
    "applicant_type": "Joint",
    "income_cap_dollars": 208000,
    "income_cap_notes": "Approximate - verify current thresholds",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "applicant_type": "Single",
    "income_cap_dollars": 70000,
    "income_cap_notes": "Maximum annual income for singles",
    "financial_year": "2025-26"
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "applicant_type": "Joint",
    "income_cap_dollars": 90000,
    "income_cap_notes": "Maximum combined annual income for couples/families",
    "financial_year": "2025-26"
  }
];

export const ELIGIBILITY: LibraryEligibility[] = [
  {
    "scheme_id": "ACT_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "ACT_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "ACT_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "ACT_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must not have previously received stamp duty exemption or concession",
    "is_mandatory": 1
  },
  {
    "scheme_id": "ACT_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must live in property for one continuous year after settlement",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years old",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Personal",
    "criterion_description": "Have never owned property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Personal",
    "criterion_description": "Have not previously requested a FHSS release",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Personal",
    "criterion_description": "Intend to live in the premises as soon as practicable and for at least 6 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Financial",
    "criterion_description": "Maximum voluntary contributions: $15,000 per FY, $50,000 total per person",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Application",
    "criterion_description": "Must request a determination from ATO before signing contract",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_FHSSS",
    "criterion_category": "Application",
    "criterion_description": "Must purchase within 12 months of release (or request extension)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Personal",
    "criterion_description": "Apply as individual or two joint applicants (max 2)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Property",
    "criterion_description": "Property must be within applicable price cap for location",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Personal",
    "criterion_description": "Must be first home buyer or not have owned residential property in Australia in last 10 years",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Personal",
    "criterion_description": "Intend to live in the property as principal place of residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Financial",
    "criterion_description": "Minimum 5% genuine savings deposit required",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG",
    "criterion_category": "Application",
    "criterion_description": "Must apply through a participating lender",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "criterion_category": "Personal",
    "criterion_description": "Single legal guardian of at least one dependent",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "criterion_category": "Property",
    "criterion_description": "Property within applicable price cap",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "criterion_category": "Personal",
    "criterion_description": "Intend to live in property as principal place of residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_FHG_FAMILY",
    "criterion_category": "Financial",
    "criterion_description": "Minimum 2% genuine savings deposit",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "criterion_category": "Property",
    "criterion_description": "Property must be in a designated regional area",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HGS_RFHBG",
    "criterion_category": "Personal",
    "criterion_description": "Must have lived in the regional area for preceding 12 months (or 12 months in aggregate over past 5 years)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Personal",
    "criterion_description": "Australian citizen aged 18+",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Personal",
    "criterion_description": "Must not currently own or have previously owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Personal",
    "criterion_description": "Will occupy the property as main residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Financial",
    "criterion_description": "Taxable income at or below the cap",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Property",
    "criterion_description": "Property within relevant state price cap",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Property",
    "criterion_description": "Must be a residential dwelling (apartment, townhouse, house)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Financial",
    "criterion_description": "Minimum 2% deposit required",
    "is_mandatory": 1
  },
  {
    "scheme_id": "FED_HTB",
    "criterion_category": "Financial",
    "criterion_description": "Home improvement minimum spend $21,000 (FY25/26)",
    "is_mandatory": 0
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Personal",
    "criterion_description": "Be an individual (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned or co-owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Personal",
    "criterion_description": "Must not have previously received stamp duty exemption or concession",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Property",
    "criterion_description": "Maximum property price $1,000,000 for concession",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHBAS",
    "criterion_category": "Personal",
    "criterion_description": "Must live in property within 12 months and continuously for 12 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be a natural person (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Property must be new or substantially renovated",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Contract price must not exceed applicable cap",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have received FHOG in any other state or territory",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NSW_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence for 12 continuous months within 12 months of purchase",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Personal",
    "criterion_description": "Be permanent resident or Australian citizen (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Personal",
    "criterion_description": "Be a natural person (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Personal",
    "criterion_description": "Be a first-home buyer (not have owned a home before)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Personal",
    "criterion_description": "Have never received a grant under the First Home Owner Grant Act in any state",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Property",
    "criterion_description": "Contract to buy between 1 Oct 2024 and 30 Dec 2026",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_EST",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence for 6 continuous months within 12 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Be permanent resident or Australian citizen (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Be a natural person (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Be a first-home buyer (not have owned a home before)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Have never received a grant under the First Home Owner Grant Act in any state",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Property",
    "criterion_description": "Contract to buy or build between 1 Oct 2024 and 30 Sep 2026",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Property",
    "criterion_description": "Home must never have been previously lived in or sold as place of residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "NT_HGTG_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence for 6 continuous months within 12 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be a natural person (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Must be buying or building a new home valued less than $750,000",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have received FHOG in any other state or territory",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned property in Australia (on/after 1 July 2000 that was lived in, or before 1 July 2000)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence within 12 months and continuously for at least 6 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years old",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Never have owned residential property in Australia or overseas",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Sign purchase contract on or after 1 May 2025",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Move into property as primary residence within 12 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "criterion_category": "Personal",
    "criterion_description": "Live in property continuously for at least one year",
    "is_mandatory": 1
  },
  {
    "scheme_id": "QLD_STAMP_NEW",
    "criterion_category": "Property",
    "criterion_description": "For vacant land buyers, construction must generally begin within two years",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Must be buying or building a new home",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have received FHOG in any other state",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence within 12 months and continuously for 6 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must be first home buyer",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_STAMP_DUTY",
    "criterion_category": "Property",
    "criterion_description": "Must be purchasing or building a new dwelling",
    "is_mandatory": 1
  },
  {
    "scheme_id": "SA_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Must be purchasing or building a new home",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have received FHOG in any other state",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence within 12 months and continuously for 6 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Live in Tasmania",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Be Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years old",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Be an individual (not business or organisation)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Financial",
    "criterion_description": "Have minimum deposit of 2% of purchase price",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Not own or have interest in any other property (can own land to build on)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Not be undischarged bankrupt or discharged within 3 years",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Not owe money to Homes Tasmania",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Personal",
    "criterion_description": "Not have previously received help under HomeShare, Streets Ahead or HOAP",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_MYHOME",
    "criterion_category": "Financial",
    "criterion_description": "Financial assets no more than $113,100 (exemptions apply)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must be first home buyer",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_STAMP_DUTY",
    "criterion_category": "Property",
    "criterion_description": "Established home valued up to $750,000",
    "is_mandatory": 1
  },
  {
    "scheme_id": "TAS_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age at settlement or completion",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident (at least one applicant)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be a natural person (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Property must be new or substantially renovated",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Contract price must not exceed $750,000",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned residential property in Australia before 1 July 2000 or occupied for 6+ months on/after 1 July 2000",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have received FHOG in any other state or territory",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence for 12 continuous months within 12 months of transaction",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must meet standard FHOG eligibility criteria",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "At least one purchaser must be Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_STAMP_DUTY",
    "criterion_category": "Property",
    "criterion_description": "Dutiable value up to $750,000 for concession",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_VHF",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years old",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_VHF",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_VHF",
    "criterion_category": "Personal",
    "criterion_description": "Be a natural person (not company or trust)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_VHF",
    "criterion_category": "Financial",
    "criterion_description": "Have minimum 5% deposit (3.5% for Aboriginal/Torres Strait Islander applicants)",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_VHF",
    "criterion_category": "Personal",
    "criterion_description": "Must not currently own land or property",
    "is_mandatory": 1
  },
  {
    "scheme_id": "VIC_VHF",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be at least 18 years of age",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Be an Australian citizen or permanent resident",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Property must be new or substantially renovated",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Property",
    "criterion_description": "Combined cost of land and building within applicable cap",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have owned residential property in Australia",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must not have received FHOG in any other state",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_FHOG",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence within 12 months and continuously for 6 months",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "criterion_category": "Personal",
    "criterion_description": "Singles earning up to $70,000 per year",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "criterion_category": "Personal",
    "criterion_description": "Couples and families with combined income up to $90,000",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "criterion_category": "Personal",
    "criterion_description": "Aboriginal or Torres Strait Islander descent",
    "is_mandatory": 0
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "criterion_category": "Personal",
    "criterion_description": "Sole parents wanting to keep family home after relationship breakdown",
    "is_mandatory": 0
  },
  {
    "scheme_id": "WA_SHARED_EQUITY",
    "criterion_category": "Personal",
    "criterion_description": "Public housing tenants wishing to buy their home",
    "is_mandatory": 0
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must be eligible for FHOG",
    "is_mandatory": 1
  },
  {
    "scheme_id": "WA_STAMP_DUTY",
    "criterion_category": "Personal",
    "criterion_description": "Must occupy as principal place of residence",
    "is_mandatory": 1
  }
];

export const DATA_SOURCES: LibraryDataSource[] = [
  {
    "source_id": "FHB_LIBRARY_v1",
    "source_name": "First Home Buyer Grants & Schemes Library",
    "source_url": "Multiple - ABS, ATO, State Revenue Offices, Housing Australia",
    "description": "Comprehensive catalog of federal and state/territory grants, schemes, stamp duty concessions and shared equity programs for first home buyers in Australia.",
    "last_updated": "2026-09-04 01:12:30.150544"
  }
];
