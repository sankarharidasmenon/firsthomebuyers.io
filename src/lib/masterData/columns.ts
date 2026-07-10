/**
 * The single source of truth mapping the master-data Excel columns to the
 * Supabase `government_schemes` columns.
 *
 * Order matches the extractor's Excel output exactly (56 columns). Nothing else
 * in the codebase should hardcode this mapping — parser, validator and importer
 * all read from here.
 */

export interface ColumnDef {
  /** Exact Excel header text (must match the "Schemes" worksheet header row). */
  header: string;
  /** Supabase column name (snake_case). */
  column: string;
}

export const COLUMN_MAP: ColumnDef[] = [
  { header: 'UI/UX Short Description', column: 'short_description' },
  { header: 'UI/UX Long Description', column: 'detailed_description' },
  { header: 'UI/UX Reference', column: 'catchy_line' },
  { header: 'Scheme ID', column: 'scheme_id' },
  { header: 'Scheme Name (official)', column: 'scheme_name' },
  { header: 'Acronym', column: 'acronym' },
  { header: 'Type', column: 'type' },
  { header: 'Level', column: 'level' },
  { header: 'Administering Body', column: 'administering_body' },
  { header: 'Applicable States/Territories', column: 'applicable_states' },
  { header: 'Metro vs Regional', column: 'metro_vs_regional' },
  { header: 'Postcode/Region Restrictions', column: 'postcode_region_restrictions' },
  { header: 'Benefit Type', column: 'benefit_type' },
  { header: 'Benefit Value', column: 'benefit_value' },
  { header: 'Value Unit', column: 'value_unit' },
  { header: 'Max Value/Cap', column: 'max_value_cap' },
  { header: 'State-by-State Value Variations', column: 'state_by_state_value_variations' },
  { header: 'Regional Bonus Amount', column: 'regional_bonus_amount' },
  { header: 'Value Calculation Method', column: 'value_calculation_method' },
  { header: 'First Home Buyer Required', column: 'first_home_buyer_required' },
  { header: 'Owner-Occupier Required', column: 'owner_occupier_required' },
  { header: 'Citizenship/Residency', column: 'citizenship_residency' },
  { header: 'Minimum Age', column: 'minimum_age' },
  { header: 'Income Cap - Single', column: 'income_cap_single' },
  { header: 'Income Cap - Couple', column: 'income_cap_couple' },
  { header: 'Income Test Basis', column: 'income_test_basis' },
  { header: 'Property Price Cap', column: 'property_price_cap' },
  { header: 'Price Cap Variations', column: 'price_cap_variations' },
  { header: 'Eligible Property Types', column: 'eligible_property_types' },
  { header: 'New vs Established', column: 'new_vs_established' },
  { header: 'Minimum Deposit', column: 'minimum_deposit' },
  { header: 'Prior Ownership Rules', column: 'prior_ownership_rules' },
  { header: 'Single Parent Required', column: 'single_parent_required' },
  { header: 'Dependent Children Required', column: 'dependent_children_required' },
  { header: 'Relationship Status', column: 'relationship_status' },
  { header: 'Occupancy Requirement', column: 'occupancy_requirement' },
  { header: 'Other Conditions', column: 'other_conditions' },
  { header: 'Full Exemption Threshold', column: 'full_exemption_threshold' },
  { header: 'Partial Concession Range', column: 'partial_concession_range' },
  { header: 'Concession Calculation Method', column: 'concession_calculation_method' },
  { header: 'Can Be Combined With', column: 'can_be_combined_with' },
  { header: 'Mutually Exclusive With', column: 'mutually_exclusive_with' },
  { header: 'Places/Quota', column: 'places_quota' },
  { header: 'Status', column: 'status' },
  { header: 'Start Date', column: 'start_date' },
  { header: 'End/Closing Date', column: 'end_closing_date' },
  { header: 'Contract Date Window', column: 'contract_date_window' },
  { header: 'Financial Year', column: 'financial_year' },
  { header: 'Official Government URL', column: 'official_url' },
  { header: 'Legislation/Policy Reference', column: 'legislation_reference' },
  { header: 'Application Method', column: 'application_method' },
  { header: 'Last Verified Date', column: 'last_verified_date' },
  { header: 'Source Website', column: 'source_website' },
  { header: 'Notes/Caveats', column: 'notes_caveats' },
  { header: 'Eligibility Tag/Pill', column: 'eligibility_tag' },
  { header: 'Priority/Ranking', column: 'priority_ranking' },
];

export const REQUIRED_COLUMN_COUNT = COLUMN_MAP.length; // 56
export const DATA_WORKSHEET = 'Schemes';

/** Ordered list of expected Excel headers. */
export const EXPECTED_HEADERS = COLUMN_MAP.map((c) => c.header);
/** Ordered list of db column names. */
export const DB_COLUMNS = COLUMN_MAP.map((c) => c.column);

/** A parsed scheme row keyed by db column name (all values are strings). */
export type SchemeRowInput = Record<string, string>;
