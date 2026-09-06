// One-off generator: reads the SQLite reference library and writes it out as
// a typed TS data module for src/components/schemes/SchemeLibraryBrowser.tsx.
// Not part of the build/runtime pipeline — rerun manually if the source .db
// file is updated with corrections (see the "gaps to verify" list on the
// /schemes/library page).
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';

const DB_PATH = "D:/AI_StartUps/FHB/RulesEngine/Sept'26/fhb_grants_schemes_library.db";
const db = new DatabaseSync(DB_PATH, { readOnly: true });

function all(sql) {
  return db.prepare(sql).all();
}

const data = {
  schemes: all('SELECT * FROM schemes ORDER BY jurisdiction, scheme_type, scheme_name'),
  priceCaps: all('SELECT * FROM scheme_price_caps ORDER BY scheme_id, price_cap_dollars DESC'),
  incomeCaps: all('SELECT * FROM scheme_income_caps ORDER BY scheme_id'),
  eligibility: all('SELECT * FROM scheme_eligibility ORDER BY scheme_id, is_mandatory DESC'),
  dataSources: all('SELECT * FROM data_sources'),
};

const header = `/**
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

`;

const body =
  'export interface LibraryScheme {\n' +
  '  scheme_id: string; scheme_name: string; short_name: string | null; jurisdiction: string;\n' +
  '  scheme_type: string; description: string | null; grant_amount_dollars: number | null;\n' +
  '  grant_amount_notes: string | null; property_type_eligible: string | null; min_age: number | null;\n' +
  '  residency_requirement: string | null; owner_occupier_required: number | null;\n' +
  '  min_occupancy_months: number | null; occupancy_start_months: number | null;\n' +
  '  previous_property_restrictions: string | null; application_method: string | null;\n' +
  '  administering_body: string | null; official_url: string | null; status: string | null;\n' +
  '  effective_from: string | null; effective_to: string | null; last_verified: string | null;\n' +
  '  notes: string | null;\n' +
  '}\n' +
  'export interface LibraryPriceCap { scheme_id: string; location_type: string | null; price_cap_dollars: number | null; price_cap_notes: string | null }\n' +
  'export interface LibraryIncomeCap { scheme_id: string; applicant_type: string | null; income_cap_dollars: number | null; income_cap_notes: string | null; financial_year: string | null }\n' +
  'export interface LibraryEligibility { scheme_id: string; criterion_category: string | null; criterion_description: string; is_mandatory: number }\n' +
  'export interface LibraryDataSource { source_id: string; source_name: string; source_url: string | null; description: string | null; last_updated: string }\n\n' +
  'export const GAPS_TO_VERIFY = [\n' +
  '  "NT FreshStart Grant \u2014 amount and eligibility only mentioned in passing; verify with NT Treasury",\n' +
  '  "NSW Shared Equity \u2014 income caps and property caps are sparse; verify current thresholds",\n' +
  '  "QLD FHOG reversion \u2014 confirm the drop to $15,000 from 1 July 2026 is enacted",\n' +
  '  "VIC Off-the-Plan concession \u2014 verify extension beyond October 2026",\n' +
  '  "All income caps \u2014 many are wage-indexed annually; verify FY26/27 thresholds",\n' +
  '] as const;\n\n' +
  'export const SCHEMES: LibraryScheme[] = ' + JSON.stringify(data.schemes, null, 2) + ';\n\n' +
  'export const PRICE_CAPS: LibraryPriceCap[] = ' + JSON.stringify(data.priceCaps, null, 2) + ';\n\n' +
  'export const INCOME_CAPS: LibraryIncomeCap[] = ' + JSON.stringify(data.incomeCaps, null, 2) + ';\n\n' +
  'export const ELIGIBILITY: LibraryEligibility[] = ' + JSON.stringify(data.eligibility, null, 2) + ';\n\n' +
  'export const DATA_SOURCES: LibraryDataSource[] = ' + JSON.stringify(data.dataSources, null, 2) + ';\n';

writeFileSync('src/lib/schemesLibrary/data.ts', header + body);
console.log('Wrote src/lib/schemesLibrary/data.ts —', data.schemes.length, 'schemes,', data.priceCaps.length, 'price caps,', data.incomeCaps.length, 'income caps,', data.eligibility.length, 'eligibility rules.');
