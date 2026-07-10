'use client';

/**
 * Master-data upload card for Business Analysts.
 *
 * Drag & drop / browse an .xlsx, review file details, confirm the destructive
 * replace, watch staged progress, then see a clean success or validation-error
 * screen. Uploads via the `uploadMasterData` server action → existing Phase 2A
 * API. No raw JSON is shown to the user.
 */
import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2,
  AlertTriangle, RotateCcw, Trash2, Circle,
} from 'lucide-react';
import { uploadMasterData, type UploadActionResult } from '@/app/admin/master-data/actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

type Phase = 'idle' | 'uploading' | 'success' | 'error';

const STAGES = ['Uploading file', 'Validating workbook', 'Importing schemes', 'Updating database'] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatDate(ts?: number | string): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
}

export function MasterDataUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [version, setVersion] = useState('1.0');
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<UploadActionResult | null>(null);

  const pickFile = useCallback((f: File | null) => {
    setFileError('');
    if (!f) return;
    const ok = f.name.toLowerCase().endsWith('.xlsx') ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!ok) {
      setFileError('Please choose an .xlsx file (the approved government_schemes.xlsx).');
      return;
    }
    setFile(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (phase === 'uploading') return;
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const reset = () => {
    setFile(null);
    setFileError('');
    setResult(null);
    setPhase('idle');
    setStage(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  async function doUpload() {
    if (!file || phase === 'uploading') return;
    setConfirmOpen(false);
    setPhase('uploading');
    setStage(0);
    setResult(null);

    // Cosmetic staged progress while the single API call runs.
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 650);

    const fd = new FormData();
    fd.set('file', file);
    fd.set('version', version || '1.0');
    fd.set('uploadedBy', 'business-analyst');

    const res = await uploadMasterData(fd);
    clearInterval(timer);

    if (res.success) {
      setResult(res);
      setStage(STAGES.length);
      setPhase('success');
      router.refresh(); // refresh server-rendered dashboard + history
    } else {
      setResult(res);
      setPhase('error');
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (phase === 'success' && result) {
    const stats: [string, string][] = [
      ['Imported Schemes', String(result.schemesImported ?? 0)],
      ['Version', result.version ?? version],
      ['Import Duration', `${((result.durationMs ?? 0) / 1000).toFixed(1)}s`],
      ['Uploaded At', formatDate(result.updatedAt)],
      ['Import ID', result.importId ?? '—'],
    ];
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-green-bg)] text-[var(--color-green-text)]">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="mt-3 font-heading text-lg font-semibold">Upload Successful</h3>
            <p className="text-sm text-muted-foreground">Government scheme data has been replaced.</p>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-foreground/10 bg-muted/40 p-3">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <Button size="sm" variant="secondary" fullWidth={false} onClick={reset}>
              <span className="inline-flex items-center gap-2"><UploadCloud className="size-4" /> Upload another file</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (phase === 'error' && result) {
    const rows = result.errors ?? [];
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-amber-bg)] text-[var(--color-amber)]">
              <XCircle className="size-6" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Upload Rejected</h3>
              <p className="text-sm text-muted-foreground">
                The existing data was <span className="font-medium">not changed</span>. Fix the issues below and try again.
              </p>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-foreground/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Column</th>
                    <th className="px-3 py-2 font-medium">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((e, i) => (
                    <tr key={i} className="border-t border-foreground/10">
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{e.row || '—'}</td>
                      <td className="px-3 py-2">{e.field || '—'}</td>
                      <td className="px-3 py-2">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-[var(--color-amber-bg)] p-3 text-sm text-foreground">
              {result.error || 'Something went wrong during the upload.'}
            </p>
          )}

          <div className="mt-5">
            <Button size="sm" fullWidth={false} onClick={reset}>
              <span className="inline-flex items-center gap-2"><RotateCcw className="size-4" /> Try again</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Uploading screen ──────────────────────────────────────────────────────
  if (phase === 'uploading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importing master data…</CardTitle>
          <CardDescription>Please keep this tab open until it completes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {STAGES.map((label, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  {done ? (
                    <CheckCircle2 className="size-5 text-[var(--color-green-text)]" />
                  ) : active ? (
                    <Loader2 className="size-5 animate-spin text-[var(--color-lemon-dark)]" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/40" />
                  )}
                  <span className={done || active ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--color-lemon)] transition-all duration-500"
              style={{ width: `${Math.min(((stage + 1) / STAGES.length) * 100, 95)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Idle / file selection ─────────────────────────────────────────────────
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Government Scheme Master Data</CardTitle>
          <CardDescription>Upload the latest approved Government Schemes &amp; Grants Excel file (.xlsx).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Dropzone */}
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
            className={[
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
              dragging ? 'border-[var(--color-lemon-dark)] bg-[var(--color-lemon)]/10' : 'border-foreground/15 hover:border-foreground/30',
            ].join(' ')}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drag &amp; drop your .xlsx here</p>
            <p className="text-xs text-muted-foreground">or click to browse — only .xlsx files are accepted</p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {fileError && (
            <p role="alert" className="text-sm text-destructive">{fileError}</p>
          )}

          {/* File details */}
          {file && (
            <div className="rounded-lg border border-foreground/10 bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-0.5 size-6 text-[var(--color-green-text)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
                    <div><dt className="inline">Size: </dt><dd className="inline text-foreground">{formatSize(file.size)}</dd></div>
                    <div><dt className="inline">Modified: </dt><dd className="inline text-foreground">{formatDate(file.lastModified)}</dd></div>
                    <div className="inline-flex items-center gap-1 text-[var(--color-green-text)]"><CheckCircle2 className="size-3.5" /> Ready to upload</div>
                  </dl>
                </div>
                <button onClick={reset} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remove file">
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:w-40">
                  <label htmlFor="version" className="text-xs font-medium text-muted-foreground">Version</label>
                  <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} className="mt-1 h-9" />
                </div>
                <div className="flex-1">
                  <Button size="sm" fullWidth onClick={() => setConfirmOpen(true)}>Import &amp; replace data</Button>
                </div>
              </div>
            </div>
          )}

          {/* Standing warning */}
          <div className="flex items-start gap-2 rounded-lg bg-[var(--color-amber-bg)] p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-amber)]" />
            <p className="text-foreground">
              Uploading a new Excel will <span className="font-semibold">replace all existing</span> Government Scheme data.
              This action cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace all scheme data?</DialogTitle>
            <DialogDescription>
              This will permanently replace the current Government Scheme data with{' '}
              <span className="font-medium text-foreground">{file?.name}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="ghost" fullWidth={false} onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button size="sm" fullWidth={false} onClick={doUpload}>Yes, replace data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
