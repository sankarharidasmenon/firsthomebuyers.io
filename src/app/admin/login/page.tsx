'use client';

/**
 * Super Admin login (dedicated page — the only login page in the app; regular
 * users authenticate through the modal). Email + password via Supabase. On
 * success, the role is checked: super_admin → /admin/master-data, otherwise a
 * 403 message is shown and the session is signed back out.
 */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, Loader2, ShieldAlert } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setForbidden(false);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setPending(false);
      setError(signInError.message);
      return;
    }

    // Verify super_admin role.
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single();

    if (profile?.role === 'super_admin') {
      router.push('/admin/master-data');
      router.refresh();
    } else {
      await supabase.auth.signOut();
      setPending(false);
      setForbidden(true);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-5 pt-24">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--color-lemon)]/20 text-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-lg">Super Admin Access</CardTitle>
          <CardDescription>Sign in to manage Government Scheme master data.</CardDescription>
        </CardHeader>
        <CardContent>
          {forbidden ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="size-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">403 — Forbidden.</strong> This account is not a
                super admin.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setForbidden(false)}>
                Try another account
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="admin-email">Email</label>
              <Input id="admin-email" type="email" autoComplete="email" required className="h-11"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@firstnestai.com" />
              <label className="text-sm font-medium text-foreground" htmlFor="admin-password">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="admin-password" type="password" autoComplete="current-password" required
                  className="h-11 pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={pending} className="mt-1">
                {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Signing in…</span> : 'Sign in'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
