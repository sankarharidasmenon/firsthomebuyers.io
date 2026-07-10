'use client';

/**
 * Standalone user login page (premium card, matches /admin/login styling).
 * Coexists with the AuthModal: the modal handles in-place save-gating, this
 * page is the navbar / direct-visit entry point. Honors a `next` return URL.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Lock, Loader2, Mail } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function readNext(): string {
  if (typeof window === 'undefined') return '/';
  return new URLSearchParams(window.location.search).get('next') || '/';
}

function resetRedirectUrl(): string {
  if (typeof window === 'undefined') return '';
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', '/auth/reset-password');
  return url.toString();
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [view, setView] = useState<'signin' | 'forgot' | 'forgot-sent'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, don't show the form — bounce to the return URL.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(readNext());
    });
  }, [supabase, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setPending(false);
      setError(error.message);
      return;
    }
    // AuthProvider runs guest-data migration on SIGNED_IN; send the user back.
    router.push(readNext());
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl(),
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setView('forgot-sent');
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-5 py-24">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-1 flex items-center justify-center rounded-2xl" style={{ width: 48, height: 48, background: 'var(--primary)' }}>
            <Home size={22} style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
          </div>
          <CardTitle className="text-lg" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800 }}>
            {view === 'signin' ? 'Welcome back' : 'Reset your password'}
          </CardTitle>
          <CardDescription>
            {view === 'signin'
              ? 'Sign in to save and revisit your borrowing scenarios and grants.'
              : 'We’ll email you a link to set a new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === 'forgot-sent' ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <Mail className="size-8 text-muted-foreground" />
              <p className="text-sm text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                If an account exists for <strong>{email}</strong>, we’ve sent a reset link.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setView('signin')}>Back to sign in</Button>
            </div>
          ) : view === 'forgot' ? (
            <form onSubmit={handleForgot} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="login-forgot-email">Email</label>
              <Input id="login-forgot-email" type="email" autoComplete="email" required className="h-11"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={pending} className="mt-1">
                {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Sending…</span> : 'Send reset link'}
              </Button>
              <button type="button" onClick={() => { setError(null); setView('signin'); }} className="text-sm text-muted-foreground hover:text-foreground mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="login-email">Email</label>
              <Input id="login-email" type="email" autoComplete="email" required className="h-11"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              <label className="text-sm font-medium text-foreground" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="login-password" type="password" autoComplete="current-password" required className="h-11 pl-9"
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={pending} className="mt-1">
                {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Signing in…</span> : 'Sign in'}
              </Button>
              <button type="button" onClick={() => { setError(null); setView('forgot'); }} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 mx-auto mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Forgot password?
              </button>
              <div className="mt-1 text-center text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                New here?{' '}
                <Link href="/signup" className="font-semibold text-foreground underline underline-offset-2">Create an account</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
