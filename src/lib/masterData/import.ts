/**
 * Import service — replaces ALL scheme data transactionally and records history.
 *
 * The actual DELETE + INSERT run inside the `import_master_data` Postgres
 * function (one transaction): if any insert fails, everything rolls back and no
 * partial data is left. This module orchestrates the call, times it, records the
 * audit row's duration, and audits failed attempts too.
 */
import { getAdminClient } from '../supabase/server';
import type { SchemeRowInput } from './columns';
import type { ImportSummary, ValidationError } from './types';

export interface ImportMeta {
  version: string;
  filename: string;
  uploadedBy: string;
}

/** Transactionally replace all schemes. Assumes rows are already validated. */
export async function importSchemes(rows: SchemeRowInput[], meta: ImportMeta): Promise<ImportSummary> {
  const admin = getAdminClient();
  const started = Date.now();

  const { data, error } = await admin.rpc('import_master_data', {
    p_schemes: rows,
    p_meta: {
      version: meta.version,
      filename: meta.filename,
      uploaded_by: meta.uploadedBy,
      total_schemes: rows.length,
    },
  });

  const durationMs = Date.now() - started;

  if (error) {
    // The transaction rolled back — existing data is untouched. Audit the failure
    // separately (outside the rolled-back transaction).
    await recordFailedImport(meta, [{ row: 0, message: `Database import failed: ${error.message}` }], durationMs);
    return {
      success: false,
      schemesImported: 0,
      failed: rows.length,
      version: meta.version,
      updatedAt: new Date().toISOString(),
      durationMs,
      errors: [{ row: 0, message: `Database import failed and was rolled back: ${error.message}` }],
    };
  }

  const result = (data ?? {}) as { import_id?: string; count?: number };
  const importId = result.import_id;
  const count = result.count ?? rows.length;

  // Record the true end-to-end duration on the audit row.
  if (importId) {
    await admin.from('master_data_imports').update({ duration_ms: durationMs }).eq('id', importId);
  }

  return {
    success: true,
    schemesImported: count,
    failed: 0,
    version: meta.version,
    updatedAt: new Date().toISOString(),
    durationMs,
    importId,
  };
}

/** Audit a rejected/failed upload without touching scheme data. */
export async function recordFailedImport(
  meta: ImportMeta,
  errors: ValidationError[],
  durationMs: number,
): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin.from('master_data_imports').insert({
      version: meta.version,
      filename: meta.filename,
      uploaded_by: meta.uploadedBy,
      total_schemes: 0,
      status: 'failed',
      duration_ms: durationMs,
      validation_errors: errors,
    });
  } catch {
    // Never let audit logging break the response.
  }
}

/** Most recent import history rows (audit log). */
export async function getImportHistory(limit = 20) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('master_data_imports')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
