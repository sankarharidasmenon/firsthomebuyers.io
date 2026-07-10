/**
 * Types for the quality/validation layer (read-only — never mutates extracted
 * data). Everything here is derived by RE-RUNNING the unchanged extractor in
 * HTML-only, PDF-only and combined modes and comparing the outputs.
 */
import type { SchemeRecord } from '../types';

/** Where a populated field's value came from. */
export type FieldSourceKind = 'HTML' | 'PDF' | 'Both' | 'Config/Derived' | 'Conflict' | 'none';

export interface FieldSource {
  key: keyof SchemeRecord;
  label: string;
  value: string;
  source: FieldSourceKind;
  htmlValue: string;
  pdfValue: string;
}

/** An HTML-vs-PDF disagreement for one field (reported, never resolved). */
export interface Conflict {
  schemeName: string;
  jurisdiction: string;
  field: string;
  htmlValue: string;
  pdfValue: string;
}

export interface Completeness {
  filled: number;
  total: number;
  pct: number;
  missing: string[]; // labels of empty columns
  reviewRequired: boolean; // pct < 90
}

/** Outcome of attempting one PDF linked from a scheme page. */
export interface PdfResult {
  url: string;
  downloaded: boolean;
  parsed: boolean;
  pages: number;
  reason?: string; // failure reason, e.g. "HTTP 403"
}

/** Full quality picture for one scheme. */
export interface SchemeQuality {
  schemeId: string;
  schemeName: string;
  jurisdiction: string;
  programName: string; // curated/source program name (for registry matching)
  url: string;
  extracted: boolean;
  record: SchemeRecord;
  completeness: Completeness;
  fieldSources: FieldSource[];
  conflicts: Conflict[];
  pdfFound: boolean;
  pdfResults: PdfResult[];
}
