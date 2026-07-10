/**
 * /admin/master-data — Super-Admin Government Scheme master-data management.
 *
 * Server Component: gates on the session cookie, then reads the current dataset
 * + import history directly from the existing Phase 2A backend (no new APIs) and
 * renders the uploader (client) + dashboard.
 */
import { redirect } from 'next/navigation';
import { Database, History, LogOut, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { getSessionUser, getProfile } from '@/lib/auth/session';
import { getImportHistory } from '@/lib/masterData/import';
import { listSchemes } from '@/lib/schemes/repository';
import { MasterDataUploader } from '@/components/admin/MasterDataUploader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logout } from './actions';

export const dynamic = 'force-dynamic';

function fmtDate(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}

interface ImportRow {
  id: string; version: string | null; filename: string | null; uploaded_by: string | null;
  uploaded_at: string; total_schemes: number; status: string; duration_ms: number | null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-lemon)] text-black">
          <Database className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold leading-tight">Master Data Management</h1>
          <p className="text-sm text-muted-foreground">Government Schemes &amp; Grants</p>
        </div>
      </div>
      {children}
    </main>
  );
}

export default async function MasterDataAdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/admin/login');
  }
  const profile = await getProfile();
  if (!profile || profile.role !== 'super_admin') {
    return (
      <Shell>
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="font-heading text-xl font-semibold">403 — Forbidden</h2>
          <p className="text-sm text-muted-foreground">
            Your account doesn&apos;t have super admin access to master data.
          </p>
          <form action={logout}>
            <Button type="submit" size="sm" variant="ghost" fullWidth={false}>
              <span className="inline-flex items-center gap-2 text-muted-foreground"><LogOut className="size-4" /> Sign out</span>
            </Button>
          </form>
        </div>
      </Shell>
    );
  }

  let history: ImportRow[] = [];
  let totalSchemes = 0;
  let lastVerified = '';
  let dbError = '';
  try {
    history = (await getImportHistory(10)) as unknown as ImportRow[];
  } catch (e) { dbError = (e as Error).message; }
  try {
    const schemes = await listSchemes();
    totalSchemes = schemes.length;
    lastVerified = schemes
      .map((s) => String(s.last_verified_date || ''))
      .filter(Boolean)
      .sort()
      .pop() || '';
  } catch (e) { dbError ||= (e as Error).message; }

  const lastSuccess = history.find((h) => h.status === 'success');
  const dataset: [string, string][] = [
    ['Current Version', lastSuccess?.version || '—'],
    ['Total Schemes', String(totalSchemes)],
    ['Last Upload', fmtDate(lastSuccess?.uploaded_at)],
    ['Last Verified', lastVerified || '—'],
    ['Database Status', dbError ? 'Error' : 'Connected'],
  ];

  return (
    <Shell>
      <div className="mb-4 flex justify-end">
        <form action={logout}>
          <Button type="submit" size="sm" variant="ghost" fullWidth={false}>
            <span className="inline-flex items-center gap-2 text-muted-foreground"><LogOut className="size-4" /> Sign out</span>
          </Button>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Uploader */}
        <div className="lg:col-span-3">
          <MasterDataUploader />
        </div>

        {/* Current dataset */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Current Dataset</CardTitle>
              <CardDescription>Live from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col divide-y divide-foreground/10">
                {dataset.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {label === 'Database Status' ? (
                        <span className={`inline-flex items-center gap-1 ${dbError ? 'text-destructive' : 'text-[var(--color-green-text)]'}`}>
                          {dbError ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />} {value}
                        </span>
                      ) : value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import history */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base"><span className="inline-flex items-center gap-2"><History className="size-4" /> Recent Uploads</span></CardTitle>
          <CardDescription>Last {history.length} import{history.length === 1 ? '' : 's'}</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No uploads yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-foreground/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Version</th>
                    <th className="px-3 py-2 font-medium">Uploaded By</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Schemes</th>
                    <th className="px-3 py-2 text-right font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-foreground/10">
                      <td className="px-3 py-2 font-medium">{h.version || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{h.uploaded_by || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(h.uploaded_at)}</td>
                      <td className="px-3 py-2">
                        <StatusPill status={h.status} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{h.total_schemes}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {h.duration_ms != null ? `${(h.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = status === 'success';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        ok
          ? 'bg-[var(--color-green-bg)] text-[var(--color-green-text)]'
          : 'bg-[var(--color-amber-bg)] text-[var(--color-amber)]'
      }`}
    >
      {ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      {ok ? 'Success' : 'Failed'}
    </span>
  );
}
