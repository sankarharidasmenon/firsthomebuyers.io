'use client';

/**
 * Set-a-new-password landing page. Reached from the password-recovery email
 * link (via /auth/callback, which establishes a temporary recovery session).
 * Not a login entry point — regular sign-in stays in the modal.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setReady(true);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    toast.success('Password updated. You can now sign in.');
    setTimeout(() => router.push('/'), 1500);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-5 pt-24">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-1 flex items-center justify-center rounded-2xl" style={{ width: 48, height: 48, background: 'var(--primary)' }}>
            <Home size={22} style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
          </div>
          <CardTitle className="text-lg">Set a new password</CardTitle>
          <CardDescription>Choose a new password for your FirstNest account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="size-8 text-[var(--color-green,#22C55E)]" />
              <p className="text-sm text-muted-foreground">Password updated. Redirecting…</p>
            </div>
          ) : !hasSession ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              This reset link is invalid or has expired. Please request a new one from the sign-in screen.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="new-password">New password</label>
              <Input id="new-password" type="password" autoComplete="new-password" required minLength={6}
                className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={pending} className="mt-1">
                {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Updating…</span> : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
