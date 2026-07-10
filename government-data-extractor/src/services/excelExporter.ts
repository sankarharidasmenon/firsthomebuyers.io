/**
 * Excel export using exceljs.
 *
 * Produces output/government_schemes.xlsx as a PURE master-data file: a SINGLE
 * "Schemes" worksheet with EXACTLY the specified columns, in order, one row per
 * scheme, frozen header row, bold headers, auto-fit widths. No metadata/info
 * sheet is embedded — the workbook is ready to upload straight into the admin
 * portal.
 *
 * On every export it also (re)generates the SEPARATE handover document
 * output/MASTER_DATA_README.md. The scheme DATA and column order are never
 * altered here.
 */
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import type { SchemeRecord } from '../types';
import { buildMetadata } from '../config/metadata';
import { writeMasterDataReadme } from './masterDataDoc';
import { runPreExportValidation } from './validation';
import { logger } from '../utils/logger';

/** Column definitions: [Header label, SchemeRecord key]. Order is authoritative. */
const COLUMNS: Array<[string, keyof SchemeRecord]> = [
  ['S.No', 'schemeId'], // S.No uses a dummy key 'schemeId' to satisfy TS. Value injected at runtime.
  ['UI/UX Program Type', 'type'],
  ['Scheme Name (official)', 'schemeName'],
  ['UI/UX Short Description', 'shortDescription'],
  ['UI/UX Long Description', 'detailedDescription'],
  ['UI/UX Reference Link', 'officialUrl'],
  // ['UI/UX Program Type', 'type'],
  ['Scheme ID', 'schemeId'],
  // ['Scheme Name (official)', 'schemeName'],
  // ['Program Type', 'type'], // Program Type uses a dummy key 'type' to satisfy TS. Value injected at runtime.
  ['Acronym', 'acronym'],
  ['Type', 'type'],
  ['Level', 'level'],
  ['Administering Body', 'administeringBody'],
  ['Short Description', 'shortDescription'],
  ['Detailed Description', 'detailedDescription'],
  ['Applicable States/Territories', 'applicableStates'],
  ['Metro vs Regional', 'metroVsRegional'],
  ['Postcode/Region Restrictions', 'postcodeRegionRestrictions'],
  ['Benefit Type', 'benefitType'],
  ['Benefit Value', 'benefitValue'],
  ['Value Unit', 'valueUnit'],
  ['Max Value/Cap', 'maxValueCap'],
  ['State-by-State Value Variations', 'stateByStateValueVariations'],
  ['Regional Bonus Amount', 'regionalBonusAmount'],
  ['Value Calculation Method', 'valueCalculationMethod'],
  ['First Home Buyer Required', 'firstHomeBuyerRequired'],
  ['Owner-Occupier Required', 'ownerOccupierRequired'],
  ['Citizenship/Residency', 'citizenshipResidency'],
  ['Minimum Age', 'minimumAge'],
  ['Income Cap - Single', 'incomeCapSingle'],
  ['Income Cap - Couple', 'incomeCapCouple'],
  ['Income Test Basis', 'incomeTestBasis'],
  ['Property Price Cap', 'propertyPriceCap'],
  ['Price Cap Variations', 'priceCapVariations'],
  ['Eligible Property Types', 'eligiblePropertyTypes'],
  ['New vs Established', 'newVsEstablished'],
  ['Minimum Deposit', 'minimumDeposit'],
  ['Prior Ownership Rules', 'priorOwnershipRules'],
  ['Single Parent Required', 'singleParentRequired'],
  ['Dependent Children Required', 'dependentChildrenRequired'],
  ['Relationship Status', 'relationshipStatus'],
  ['Occupancy Requirement', 'occupancyRequirement'],
  ['Other Conditions', 'otherConditions'],
  ['Full Exemption Threshold', 'fullExemptionThreshold'],
  ['Partial Concession Range', 'partialConcessionRange'],
  ['Concession Calculation Method', 'concessionCalculationMethod'],
  ['Can Be Combined With', 'canBeCombinedWith'],
  ['Mutually Exclusive With', 'mutuallyExclusiveWith'],
  ['Places/Quota', 'placesQuota'],
  ['Status', 'status'],
  ['Start Date', 'startDate'],
  ['End/Closing Date', 'endClosingDate'],
  ['Contract Date Window', 'contractDateWindow'],
  ['Financial Year', 'financialYear'],
  ['Official Government URL', 'officialUrl'],
  ['Legislation/Policy Reference', 'legislationReference'],
  ['Application Method', 'applicationMethod'],
  ['Last Verified Date', 'lastVerifiedDate'],
  ['Source Website', 'sourceWebsite'],
  ['Notes/Caveats', 'notesCaveats'],
  ['Eligibility Tag/Pill', 'eligibilityTag'],
  ['Priority/Ranking', 'priorityRanking'],
  ['Catchy Line/Hook', 'catchyLine'],
];

const OUTPUT_PATH = path.resolve(__dirname, '../../output/government_schemes.xlsx');

export async function exportToExcel(
  records: SchemeRecord[],
  outputPath: string = OUTPUT_PATH
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FirstNest Government Data Extractor';
  workbook.created = new Date();

  // Auto-generated metadata (version/status from config/version.json) — used
  // ONLY for the separate MASTER_DATA_README.md, never embedded in the workbook.
  const meta = buildMetadata(records.length, COLUMNS.length);

  // Single worksheet — the scheme data only (unchanged columns / order / values).
  const sheet = workbook.addWorksheet('Schemes', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // 1. Column headers.
  sheet.columns = COLUMNS.map(([label]) => ({
    header: label,
    key: label,
    width: 25, // default; auto-fit handled later
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF111111' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5E642' }, // FirstNest lemon
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  headerRow.height = 30;

  // 2. Data rows.
  // Sort records: Grants first, then Schemes (maintaining existing relative order).
  const sortedRecords = [...records].sort((a, b) => {
    const aType = a.type === 'Grant' ? 0 : 1;
    const bType = b.type === 'Grant' ? 0 : 1;
    return aType - bType;
  });

  let sNo = 1;
  for (const rec of sortedRecords) {
    const row: Record<string, string | number> = {};
    for (const [label, key] of COLUMNS) {
      if (label === 'S.No') {
        row[label] = sNo++;
      } else if (label === 'UI/UX Program Type') {
        // "Simply use the value that is already available in the backend"
        // The backend determines 'Grant' vs 'Scheme' by checking if `type === 'Grant'`
        row[label] = rec.type === 'Grant' ? 'Grant' : 'Scheme';
      } else if (label === 'UI/UX Short Description') {
        row[label] = rec.shortDescription ?? '';
      } else if (label === 'UI/UX Long Description') {
        row[label] = rec.detailedDescription ?? '';
      } else if (label === 'UI/UX Reference') {
        row[label] = rec.catchyLine ?? '';
      } else {
        row[label] = rec[key] ?? '';
      }
    }
    sheet.addRow(row);
  }

  // Auto-fit widths (capped) based on content length.
  sheet.columns.forEach((col) => {
    let max = String(col.header ?? '').length;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length;
      if (len > max) max = len;
    });
    col.width = Math.min(Math.max(max + 2, 14), 60);
  });

  // Wrap long free-text cells; add borders to the whole used range.
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'top', wrapText: true };
  });

  // Ensure output directory exists.
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Validate the dataset before writing (logs warnings only; never blocks/edits).
  runPreExportValidation(records);

  // Regenerate the handover documentation (always, independent of file lock).
  writeMasterDataReadme(meta);

  try {
    await workbook.xlsx.writeFile(outputPath);
    logger.ok(`Wrote ${records.length} scheme rows → ${outputPath} (single Schemes sheet)`);
    return outputPath;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    // If the workbook is open in Excel (Windows file lock), don't lose the run —
    // write a timestamped copy alongside it and tell the user to close the file.
    if (code === 'EBUSY' || code === 'EPERM' || code === 'EACCES') {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fallback = outputPath.replace(/\.xlsx$/i, `.${stamp}.xlsx`);
      await workbook.xlsx.writeFile(fallback);
      logger.warn(
        `Target Excel is locked (${code}) — it is probably open in Excel. Wrote to fallback: ${fallback}`
      );
      logger.warn('Close government_schemes.xlsx and re-run to update the main file.');
      return fallback;
    }
    throw err;
  }
}

export { OUTPUT_PATH, COLUMNS };
