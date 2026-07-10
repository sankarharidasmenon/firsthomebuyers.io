/**
 * POST /api/admin/master-data/upload — Super-Admin only (Supabase role).
 *
 * Receives the master-data Excel (multipart/form-data, field "file"), validates
 * the workbook, and — only if valid — transactionally replaces all scheme data
 * and records an import-history row. On any validation/DB failure the existing
 * database is left untouched and the failure is audited.
 *
 * Authorization is Supabase role-based (profiles.role = 'super_admin'), read
 * from the request's session cookies. The legacy MASTER_DATA_ADMIN_TOKEN is
 * gone.
 */
import { requireSuperAdmin } from '@/lib/auth/session';
import { processMasterDataUpload } from '@/lib/masterData/upload';

export const runtime = 'nodejs'; // exceljs needs Node APIs
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1) Security — Super Admin only (Supabase session + role).
  const admin = await requireSuperAdmin();
  if (!admin) {
    return Response.json(
      { success: false, error: 'Forbidden: super admin access required.' },
      { status: 403 }
    );
  }

  // 2) Read the uploaded file.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json(
      { success: false, error: 'Expected multipart/form-data with a "file" field.' },
      { status: 400 }
    );
  }
  if (!form.get('uploadedBy')) form.set('uploadedBy', admin.email ?? 'super-admin');

  // 3) Parse → validate → transactional import.
  const { status, body } = await processMasterDataUpload(form);
  return Response.json(body, { status });
}
