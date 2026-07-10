/**
 * Shared master-data upload pipeline (parse → validate → transactional import).
 *
 * Extracted so both the public API route (POST /api/admin/master-data/upload)
 * and the admin server action can run the exact same logic AFTER each has
 * independently enforced Supabase super_admin authorization. Contains no auth
 * itself — callers must authorize first.
 */
import { parseWorkbook } from '@/lib/masterData/parse';
import { validateRows } from '@/lib/masterData/validate';
import { importSchemes, recordFailedImport, type ImportMeta } from '@/lib/masterData/import';

export interface UploadOutcome {
  status: number;
  body: Record<string, unknown>;
}

export async function processMasterDataUpload(form: FormData): Promise<UploadOutcome> {
  const t0 = Date.now();

  const file = form.get('file') as File | null;
  const version = (form.get('version') as string) || '1.0';
  const uploadedBy = (form.get('uploadedBy') as string) || 'business-analyst';

  if (!file) {
    return { status: 400, body: { success: false, error: 'No file provided (field "file").' } };
  }

  const meta: ImportMeta = { version, filename: file.name || 'government_schemes.xlsx', uploadedBy };
  const buffer = Buffer.from(await file.arrayBuffer());

  // Parse — never touches the DB.
  const parsed = await parseWorkbook(buffer);
  if (parsed.errors.length) {
    await recordFailedImport(meta, parsed.errors, Date.now() - t0);
    return { status: 422, body: { success: false, errors: parsed.errors } };
  }

  // Validate — never touches the DB.
  const validation = validateRows(parsed.rows);
  if (!validation.valid) {
    await recordFailedImport(meta, validation.errors, Date.now() - t0);
    return { status: 422, body: { success: false, errors: validation.errors } };
  }

  // Transactional replace + history.
  try {
    const summary = await importSchemes(parsed.rows, meta);
    if (!summary.success) {
      return { status: 500, body: { success: false, errors: summary.errors } };
    }
    return {
      status: 200,
      body: {
        success: true,
        schemesImported: summary.schemesImported,
        failed: summary.failed,
        updatedAt: summary.updatedAt,
        version: summary.version,
        durationMs: summary.durationMs,
        importId: summary.importId,
      },
    };
  } catch (err) {
    await recordFailedImport(meta, [{ row: 0, message: (err as Error).message }], Date.now() - t0);
    return { status: 500, body: { success: false, error: (err as Error).message } };
  }
}
