'use client';

/**
 * Standalone user sign-up page (premium card, matches /login styling).
 * Collects full name, email, date of birth and password. Honors a `next`
 * return URL. With email confirmation disabled (current POC) a session is
 * created immediately and we redirect; the "check your inbox" state is retained
 * for when confirmation is re-enabled.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Loader2, Mail } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function readNext(): string {
  if (typeof window === 'undefined') return '/';
  return new URLSearchParams(window.location.search).get('next') || '/';
}

function callbackUrl(): string {
  if (typeof window === 'undefined') return '';
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', readNext());
  return url.toString();
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(readNext());
    });
  }, [supabase, router]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, dob: dob || null },
        emailRedirectTo: callbackUrl(),
      },
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push(readNext());
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-5 py-24">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-1 flex items-center justify-center rounded-2xl" style={{ width: 48, height: 48, background: 'var(--primary)' }}>
            <Home size={22} style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
          </div>
          <CardTitle className="text-lg" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800 }}>
            Create your account
          </CardTitle>
          <CardDescription>Save your borrowing scenarios and grant eligibility securely.</CardDescription>
        </CardHeader>
        <CardContent>
          {checkEmail ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <Mail className="size-8 text-muted-foreground" />
              <p className="text-sm text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                We’ve sent a confirmation link to <strong>{email}</strong>. Open it to activate
                your account — your saved work will be waiting.
              </p>
              <Link href="/login"><Button variant="secondary" size="sm">Go to sign in</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-foreground" htmlFor="signup-name">Full name</label>
              <Input id="signup-name" type="text" autoComplete="name" required className="h-11"
                value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Chen" />
              <label className="text-sm font-medium text-foreground" htmlFor="signup-dob">Date of birth</label>
              <Input id="signup-dob" type="date" required className="h-11"
                value={dob} onChange={(e) => setDob(e.target.value)} />
              <label className="text-sm font-medium text-foreground" htmlFor="signup-email">Email</label>
              <Input id="signup-email" type="email" autoComplete="email" required className="h-11"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              <label className="text-sm font-medium text-foreground" htmlFor="signup-password">Password</label>
              <Input id="signup-password" type="password" autoComplete="new-password" required minLength={6} className="h-11"
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={pending} className="mt-1">
                {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Creating account…</span> : 'Create account'}
              </Button>
              <div className="mt-1 text-center text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-foreground underline underline-offset-2">Sign in</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
