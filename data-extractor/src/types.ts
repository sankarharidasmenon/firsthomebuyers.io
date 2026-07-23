/**
 * Shared type definitions for the FHB government scheme extractor.
 * All fields default to empty string ("") — never null/undefined in output —
 * so that "no data found" is represented as a blank cell, never invented.
 */

export type ProgramType = 'Grant' | 'Scheme';
export type StateValue = 'Australia' | 'NSW' | 'Victoria';

/** A single fetched + parsed page belonging to a scheme. */
export interface FetchedPage {
  url: string;
  finalUrl: string;
  title: string;
  statusCode: number;
  html: string;
  text: string;
  /** absolute links found on the page */
  links: string[];
  /** absolute PDF links found on the page */
  pdfLinks: string[];
  jsonLd: any[];
  /** rendered via Playwright (true) or plain HTTP (false) */
  rendered: boolean;
  fetchedAt: string;
}

/** Parsed content of a linked PDF. */
export interface FetchedPdf {
  url: string;
  text: string;
  pages: number;
}

/**
 * The canonical scheme record. Keys are the exact Excel column headers.
 * Every value is a string ("" when unknown). This makes export/validation trivial
 * and guarantees "blank when missing".
 */
export type SchemeRecord = Record<string, string>;

/** Grouping of the source material for one scheme before extraction. */
export interface SchemeBundle {
  /** stable slug id */
  id: string;
  jurisdiction: StateValue;
  governmentLevel: string; // "Federal" | "State"
  /** the primary/official landing URL */
  primaryUrl: string;
  /** all pages that belong to this scheme (overview, eligibility, etc.) */
  pages: FetchedPage[];
  /** all parsed PDFs that belong to this scheme */
  pdfs: FetchedPdf[];
  /** seed hint: expected scheme name and known program type (from source config) */
  seedName: string;
  seedProgramType: ProgramType;
  detailedType: string;
  acronym: string;
  department: string;
  agency: string;
  /** raw text of the official per-state price-cap page (federal schemes), if any */
  capsUrl: string;
  capsText: string;
  capsHtml: string;
}
