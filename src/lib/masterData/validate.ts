/**
 * Row/dataset validation for parsed master data.
 *
 * Rules (spec §3): duplicate Scheme IDs, duplicate Official URLs, missing Scheme
 * Name, missing Scheme ID, invalid URLs, invalid data types. If ANY error is
 * returned the importer must not touch the database.
 */
import type { SchemeRowInput } from './columns';
import type { ValidationError, ValidationResult } from './types';

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateRows(rows: SchemeRowInput[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (rows.length === 0) {
    errors.push({ row: 0, message: 'No scheme rows found in the "Schemes" worksheet.' });
    return { valid: false, errors };
  }

  const idSeen = new Map<string, number>(); // scheme_id → first row
  // Key on url + name: distinct schemes may share one government page (e.g. the
  // three federal guarantees on the Housing Australia hub) — that's valid. Only
  // the SAME url + SAME name is a true duplicate row.
  const urlNameSeen = new Map<string, number>();

  rows.forEach((row, i) => {
    const rowNum = i + 2; // account for header row
    const id = (row.scheme_id || '').trim();
    const name = (row.scheme_name || '').trim();
    const url = (row.official_url || '').trim();

    if (!id) errors.push({ row: rowNum, field: 'Scheme ID', message: 'Scheme ID is required.' });
    if (!name) errors.push({ row: rowNum, field: 'Scheme Name', message: 'Scheme Name is required.' });
    if (!url) {
      errors.push({ row: rowNum, field: 'Official Government URL', message: 'Official URL is required.' });
    } else if (!isValidUrl(url)) {
      errors.push({ row: rowNum, field: 'Official Government URL', message: `Invalid URL: "${url}".` });
    }

    if (id) {
      if (idSeen.has(id)) {
        errors.push({ row: rowNum, field: 'Scheme ID', message: `Duplicate Scheme ID "${id}" (first seen at row ${idSeen.get(id)}).` });
      } else {
        idSeen.set(id, rowNum);
      }
    }
    if (url && name) {
      const key = `${url.toLowerCase()}||${name.toLowerCase()}`;
      if (urlNameSeen.has(key)) {
        errors.push({ row: rowNum, field: 'Official Government URL', message: `Duplicate scheme "${name}" at URL "${url}" (first seen at row ${urlNameSeen.get(key)}).` });
      } else {
        urlNameSeen.set(key, rowNum);
      }
    }

    // Data-type sanity: priority/ranking, if present, should be numeric.
    const priority = (row.priority_ranking || '').trim();
    if (priority && Number.isNaN(Number(priority))) {
      errors.push({ row: rowNum, field: 'Priority/Ranking', message: `Priority/Ranking must be a number, got "${priority}".` });
    }
  });

  return { valid: errors.length === 0, errors };
}
