/**
 * Single source of truth for master-data versioning + metadata.
 *
 * Edit `version.json` (version / status) in ONE place — the Excel "Info" sheet
 * and MASTER_DATA_README.md both read from here, so they stay in sync every time
 * the extractor regenerates the workbook.
 */
import versionConfig from './version.json';

export interface VersionConfig {
  version: string;
  status: string; // "Draft" | "Verified" | …
  datasetName: string;
  maintainedBy: string;
  uploadTarget: string;
}

export const VERSION: VersionConfig = versionConfig as VersionConfig;

/** Fixed descriptive metadata (constant across runs). */
export const DATASET_META = {
  purpose:
    'Master data used by FirstNest for Australian First Home Buyer government schemes and grants',
  source: 'Official Australian Government websites only',
  generatedBy: 'Government Data Extraction Engine',
} as const;

/**
 * Auto-generated metadata computed at export time.
 * `totalSchemes`/`totalColumns` are supplied by the exporter.
 */
export function buildMetadata(totalSchemes: number, totalColumns: number) {
  const now = new Date();
  return {
    datasetName: VERSION.datasetName,
    purpose: DATASET_META.purpose,
    source: DATASET_META.source,
    generatedBy: DATASET_META.generatedBy,
    generatedDate: now,
    totalSchemes,
    totalColumns,
    version: VERSION.version,
    status: VERSION.status,
    lastVerified: now,
    maintainedBy: VERSION.maintainedBy,
    uploadTarget: VERSION.uploadTarget,
  };
}

export type Metadata = ReturnType<typeof buildMetadata>;
