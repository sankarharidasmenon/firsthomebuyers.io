'use client';

/**
 * App-wide auth context. Mounted once in the root layout. Owns:
 *  - the current user + profile (kept in sync via onAuthStateChange),
 *  - the premium AuthModal (open state, reason copy),
 *  - the "pending action" pattern: requireAuth(fn) runs fn now if signed in,
 *    otherwise opens the modal and runs fn automatically after sign-in,
 *  - first-login guest→Supabase migration,
 *  - onboarding hydration: `onboardingReady` is false until Supabase answers
 *    are written into localStorage, preventing a race where results pages read
 *    empty localStorage before hydration completes,
 *  - a `next` return URL (from proxy redirects) to send the user back to the
 *    exact page they were trying to reach.
 *
 * Toasts use Sonner (mounted here).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/auth/session';
import { migrateGuestDataIfAny } from '@/lib/scenarios/migrateGuest';
import { resolveOnboardingAnswers } from '@/lib/onboardingPersistence';
import { AuthModal } from '@/components/auth/AuthModal';

type PendingAction = () => void | Promise<void>;

interface OpenAuthOpts {
  reason?: string;
  next?: string;
  pendingAction?: PendingAction;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /**
   * True once onboarding answers are guaranteed to be in localStorage.
   *
   * - Guest users: true immediately (localStorage is the only store).
   * - Authenticated users: false until resolveOnboardingAnswers() completes,
   *   preventing results pages from reading empty localStorage before hydration.
   */
  onboardingReady: boolean;
  signOut: () => Promise<void>;
  openAuth: (opts?: OpenAuthOpts) => void;
  closeAuth: () => void;
  requireAuth: (action: PendingAction, opts?: { reason?: string }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

const DEFAULT_REASON =
  'Sign in to securely save your borrowing scenarios and government scheme eligibility.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * Tracks whether onboarding answers have been written into localStorage.
   * Starts as false; set to true once resolveOnboardingAnswers resolves (or
   * immediately for guests).  Results pages must wait for this before reading
   * localStorage.
   */
  const [onboardingReady, setOnboardingReady] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState(DEFAULT_REASON);

  const pendingActionRef = useRef<PendingAction | null>(null);
  const nextUrlRef = useRef<string | null>(null);
  const wasSignedInRef = useRef(false);

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, dob, role')
        .eq('id', uid)
        .single();
      setProfile((data as Profile) ?? null);
    },
    [supabase]
  );

  // React to a real sign-in transition: migrate guest data, hydrate
  // localStorage from Supabase, run any pending action, then navigate.
  const handleSignedIn = useCallback(async (nextUser: User) => {
    setModalOpen(false);
    setOnboardingReady(false); // block results pages during hydration

    try {
      await migrateGuestDataIfAny(nextUser.id);
    } catch {
      /* migration is best-effort */
    }

    try {
      await resolveOnboardingAnswers(nextUser);
    } catch {
      /* hydration is best-effort */
    }

    // localStorage is now populated — results pages may read.
    setOnboardingReady(true);

    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      try {
        await action();
      } catch {
        toast.error('Signed in, but that action could not be completed.');
      }
    }

    const next = nextUrlRef.current;
    nextUrlRef.current = null;
    if (next) router.push(next);
  }, [router]);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      const authUser = data.user ?? null;
      setUser(authUser);
      wasSignedInRef.current = Boolean(authUser);

      if (authUser) {
        loadProfile(authUser.id);
        // Authenticated on load — hydrate localStorage before signalling ready.
        try {
          await resolveOnboardingAnswers(authUser);
        } catch {
          /* best-effort */
        }
      }

      // Safe to set both flags together: if no user, onboardingReady = true
      // immediately (nothing to fetch); if user, we've already hydrated above.
      if (active) {
        setOnboardingReady(true);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        loadProfile(nextUser.id);
      } else {
        setProfile(null);
        // Signed out — no Supabase to hydrate; localStorage is the store again.
        setOnboardingReady(true);
      }

      const wasSignedIn = wasSignedInRef.current;
      wasSignedInRef.current = Boolean(nextUser);

      // Only fire post-login side-effects on a genuine signed-out → signed-in
      // transition (not on initial hydration or token refresh).
      if (nextUser && !wasSignedIn && event === 'SIGNED_IN') {
        handleSignedIn(nextUser);
      }
    });

    // If something linked to the home page with ?next=..., open the modal to
    // sign in. Dedicated auth pages (/login, /signup, /admin/login) handle their
    // own ?next redirect, so only auto-open the modal on the home route.
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) {
        nextUrlRef.current = next;
        supabase.auth.getUser().then(({ data }) => {
          if (active && !data.user) setModalOpen(true);
        });
      }
    }

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile, handleSignedIn]);

  const openAuth = useCallback((opts?: OpenAuthOpts) => {
    if (opts?.reason) setReason(opts.reason);
    else setReason(DEFAULT_REASON);
    if (opts?.next) nextUrlRef.current = opts.next;
    if (opts?.pendingAction) pendingActionRef.current = opts.pendingAction;
    setModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setModalOpen(false);
    pendingActionRef.current = null;
  }, []);

  const requireAuth = useCallback(
    (action: PendingAction, opts?: { reason?: string }) => {
      if (user) {
        void action();
        return;
      }
      pendingActionRef.current = action;
      setReason(opts?.reason ?? DEFAULT_REASON);
      setModalOpen(true);
    },
    [user]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    wasSignedInRef.current = false;
    toast.success('Signed out.');
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, onboardingReady, signOut, openAuth, closeAuth, requireAuth }}
    >
      {children}
      <AuthModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        reason={reason}
      />
    </AuthContext.Provider>
  );
}
