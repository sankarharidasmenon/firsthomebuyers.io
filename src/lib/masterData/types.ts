/** Shared types for the master-data import pipeline. */
import type { SchemeRowInput } from './columns';

export interface ValidationError {
  /** 1-based worksheet row number (or 0 for workbook-level errors). */
  row: number;
  field?: string;
  message: string;
}

export interface ParseResult {
  rows: SchemeRowInput[];
  /** Workbook-structure errors (missing sheet/columns) that abort parsing. */
  errors: ValidationError[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ImportSummary {
  success: boolean;
  schemesImported: number;
  failed: number;
  version: string;
  updatedAt: string;
  durationMs: number;
  importId?: string;
  errors?: ValidationError[];
}
