/**
 * Shared feedback types + the single source of truth for the selectable
 * feedback categories. Imported by the widget (client) and the API route
 * (server), so this module must stay free of browser/node-only imports.
 */

export const FEEDBACK_TYPES = [
  {
    value: 'bug',
    label: 'Bug Report',
    icon: '🐞',
    description: 'Something is broken',
  },
  {
    value: 'ui',
    label: 'UI Issue',
    icon: '🎨',
    description: 'Layout or visual glitch',
  },
  {
    value: 'feature',
    label: 'Feature Request',
    icon: '✨',
    description: 'An idea for us',
  },
  {
    value: 'other',
    label: 'Other',
    icon: '💬',
    description: 'Anything else',
  },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]['value'];

export const FEEDBACK_TYPE_VALUES = FEEDBACK_TYPES.map((t) => t.value) as readonly FeedbackType[];

export type ThemeName = 'light' | 'dark';

/** Request body accepted by POST /api/feedback. */
export interface FeedbackSubmission {
  feedbackType: FeedbackType | '';
  message: string;
  email?: string;
  /** Auto-captured context — collected at submit time, never user-editable. */
  pageUrl?: string;
  userAgent?: string;
  screenResolution?: string;
  theme?: ThemeName;
  submittedAt?: string;
  /**
   * Honeypot. Hidden from real users; bots that fill every field trip it and
   * the submission is dropped.
   */
  website?: string;
}

/** Fields that can carry an inline validation error. */
export type FeedbackField = 'feedbackType' | 'message' | 'email';

export type FeedbackFieldErrors = Partial<Record<FeedbackField, string>>;

export type FeedbackApiResponse =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FeedbackFieldErrors };

/** Shape of a `public.feedback` row (see supabase/migrations/0004_feedback.sql). */
export interface FeedbackRow {
  id: string;
  feedback_type: FeedbackType;
  message: string;
  email: string | null;
  page_url: string | null;
  user_agent: string | null;
  screen_resolution: string | null;
  theme: ThemeName | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

/** Insert payload for `public.feedback` — id/created_at are DB defaults. */
export type FeedbackInsert = Omit<FeedbackRow, 'id' | 'created_at'>;
