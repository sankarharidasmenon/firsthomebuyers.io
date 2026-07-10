'use client';

/**
 * Premium email/password auth modal (no separate login page for regular users).
 * Views: sign in · sign up (name/email/DOB/password) · forgot password.
 *
 * The modal only initiates Supabase auth calls; post-login side-effects
 * (guest-data migration, pending action, redirect) are handled centrally by
 * AuthProvider's onAuthStateChange listener. With email confirmation disabled
 * (current POC), sign-up returns a session immediately and the provider closes
 * the modal; the confirmation ("check your inbox") path is retained for when
 * confirmation is re-enabled.
 */
import React, { useEffect, useState } from 'react';
import { Home, Loader2, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBrowserClient } from '@/lib/supabase/client';

type View = 'signin' | 'signup' | 'forgot' | 'forgot-sent' | 'check-email';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: '0.8125rem',
  color: 'var(--foreground)',
  marginBottom: 6,
  display: 'block',
};

function callbackUrl(next?: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL('/auth/callback', window.location.origin);
  if (next) url.searchParams.set('next', next);
  return url.toString();
}

export function AuthModal({ open, onOpenChange, reason }: AuthModalProps) {
  const supabase = getBrowserClient();
  const [view, setView] = useState<View>('signin');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reset transient state whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setView('signin');
      setError(null);
      setPending(false);
    }
  }, [open]);

  const title =
    view === 'signup'
      ? 'Create your account'
      : view === 'forgot' || view === 'forgot-sent'
        ? 'Reset your password'
        : view === 'check-email'
          ? 'Confirm your email'
          : 'Save Your Progress';

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    // AuthProvider reacts to SIGNED_IN and closes the modal.
  }

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
    // Confirmation disabled → session present → provider handles the rest.
    // Confirmation enabled → no session yet → ask the user to check their email.
    if (!data.session) setView('check-email');
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl('/auth/reset-password'),
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setView('forgot-sent');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="items-center text-center">
          <div
            className="mx-auto mb-1 flex items-center justify-center rounded-2xl"
            style={{ width: 48, height: 48, background: 'var(--primary)' }}
          >
            <Home size={22} style={{ color: 'var(--primary-foreground)' }} strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-lg" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800 }}>
            {title}
          </DialogTitle>
          {(view === 'signin' || view === 'signup') && (
            <DialogDescription className="max-w-xs">
              {reason ??
                'Sign in to securely save your borrowing scenarios and government scheme eligibility.'}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Check email (post sign-up when confirmation is enabled) ── */}
        {view === 'check-email' && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <Mail className="size-8 text-muted-foreground" />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: 'var(--foreground)' }}>
              We&apos;ve sent a confirmation link to <strong>{email}</strong>. Open it to
              activate your account — your saved work will be waiting.
            </p>
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
        )}

        {/* ── Forgot password sent ── */}
        {view === 'forgot-sent' && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <Mail className="size-8 text-muted-foreground" />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: 'var(--foreground)' }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to
              reset your password.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setView('signin')}>
              Back to sign in
            </Button>
          </div>
        )}

        {/* ── Sign in ── */}
        {view === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <div>
              <label style={labelStyle} htmlFor="auth-email">Email</label>
              <Input id="auth-email" type="email" autoComplete="email" required
                className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="auth-password">Password</label>
              <Input id="auth-password" type="password" autoComplete="current-password" required
                className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={pending} className="mt-1">
              {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Signing in…</span> : 'Continue with Email'}
            </Button>
            <button type="button" onClick={() => { setError(null); setView('forgot'); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 mx-auto mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Forgot password?
            </button>
            <div className="mt-1 text-center text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              New here?{' '}
              <button type="button" onClick={() => { setError(null); setView('signup'); }} className="font-semibold text-foreground underline underline-offset-2">
                Create an account
              </button>
            </div>
            <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-muted-foreground hover:text-foreground mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Not now
            </button>
          </form>
        )}

        {/* ── Sign up ── */}
        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <div>
              <label style={labelStyle} htmlFor="auth-name">Full name</label>
              <Input id="auth-name" type="text" autoComplete="name" required
                className="h-11" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Chen" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="auth-dob">Date of birth</label>
              <Input id="auth-dob" type="date" required
                className="h-11" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="auth-email-2">Email</label>
              <Input id="auth-email-2" type="email" autoComplete="email" required
                className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="auth-password-2">Password</label>
              <Input id="auth-password-2" type="password" autoComplete="new-password" required minLength={6}
                className="h-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={pending} className="mt-1">
              {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Creating account…</span> : 'Create account'}
            </Button>
            <div className="mt-1 text-center text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => { setError(null); setView('signin'); }} className="font-semibold text-foreground underline underline-offset-2">
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* ── Forgot password ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div>
              <label style={labelStyle} htmlFor="auth-forgot-email">Email</label>
              <Input id="auth-forgot-email" type="email" autoComplete="email" required
                className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={pending} className="mt-1">
              {pending ? <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Sending…</span> : 'Send reset link'}
            </Button>
            <button type="button" onClick={() => { setError(null); setView('signin'); }} className="text-sm text-muted-foreground hover:text-foreground mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Back to sign in
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
