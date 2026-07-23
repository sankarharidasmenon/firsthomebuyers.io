/**
 * Ordered Excel columns — matches the reference workbook
 * (docs/Aus_Govt_Grants&Schemes_2026.xls, sheet "Schemes").
 * The first FIVE are the mandatory UI/UX columns, in this exact order.
 */

export const MANDATORY_COLUMNS = [
  'S.No',
  'UI/UX Include',
  'UI/UX Program Type',
  'UI/UX Applicable States/Territories',
  'UI/UX Scheme Name (official)',
] as const;

export const REMAINING_COLUMNS = [
  'UI/UX Short Desc',
  'UI/UX Official Government URL',
  'UI/UX Short Description',
  'UI/UX Long Description',
  'UI/UX Reference Link',
  'Scheme ID',
  'Acronym',
  'Type',
  'Level',
  'Administering Body',
  'Short Description',
  'Detailed Description',
  'Applicable States/Territories',
  'Metro vs Regional',
  'Postcode/Region Restrictions',
  'Benefit Type',
  'Benefit Value',
  'Value Unit',
  'Max Value/Cap',
  'State-by-State Value Variations',
  'Regional Bonus Amount',
  'Value Calculation Method',
  'First Home Buyer Required',
  'Owner-Occupier Required',
  'Citizenship/Residency',
  'Minimum Age',
  'Income Cap - Single',
  'Income Cap - Couple',
  'Income Test Basis',
  'Property Price Cap',
  'Price Cap Variations',
  'Eligible Property Types',
  'New vs Established',
  'Minimum Deposit',
  'Prior Ownership Rules',
  'Single Parent Required',
  'Dependent Children Required',
  'Relationship Status',
  'Occupancy Requirement',
  'Other Conditions',
  'Full Exemption Threshold',
  'Partial Concession Range',
  'Concession Calculation Method',
  'Can Be Combined With',
  'Mutually Exclusive With',
  'Places/Quota',
  'Status',
  'Start Date',
  'End/Closing Date',
  'Contract Date Window',
  'Financial Year',
  'Official Government URL',
  'Legislation/Policy Reference',
  'Application Method',
  'Last Verified Date',
  'Source Website',
  'Notes/Caveats',
  'Eligibility Tag/Pill',
  'Priority/Ranking',
  'Catchy Line/Hook',
] as const;

export const ALL_COLUMNS: string[] = [...MANDATORY_COLUMNS, ...REMAINING_COLUMNS];

/** Build a fully-blank record keyed by every column. */
export function blankRecord(): Record<string, string> {
  const r: Record<string, string> = {};
  for (const c of ALL_COLUMNS) r[c] = '';
  return r;
}
