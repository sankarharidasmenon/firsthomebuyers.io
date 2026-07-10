'use server';

/**
 * Server actions for the master-data admin page.
 *
 *  - logout: Supabase sign-out, then back to /admin/login.
 *  - uploadMasterData: authorize the caller as super_admin (Supabase role) and
 *    run the shared upload pipeline directly (no internal HTTP hop, no token).
 */
import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth/session';
import { getServerAuthClient } from '@/lib/supabase/serverAuth';
import { processMasterDataUpload } from '@/lib/masterData/upload';

export async function logout(): Promise<void> {
  const supabase = await getServerAuthClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export interface UploadActionResult {
  success: boolean;
  httpStatus?: number;
  schemesImported?: number;
  failed?: number;
  version?: string;
  updatedAt?: string;
  durationMs?: number;
  importId?: string;
  error?: string;
  errors?: { row: number; field?: string; message: string }[];
}

export async function uploadMasterData(formData: FormData): Promise<UploadActionResult> {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return { success: false, httpStatus: 403, error: 'Forbidden: super admin access required.' };
  }

  if (!formData.get('uploadedBy')) formData.set('uploadedBy', admin.email ?? 'super-admin');

  const { status, body } = await processMasterDataUpload(formData);
  return { httpStatus: status, ...(body as Omit<UploadActionResult, 'httpStatus'>) };
}
