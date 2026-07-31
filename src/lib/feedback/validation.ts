/**
 * Feedback validation + sanitisation.
 *
 * Deliberately isomorphic: the modal runs these for inline errors before it
 * ever hits the network, and the route handler runs the exact same functions on
 * the untrusted body. Client-side checks are UX only — the server repeats them.
 */
import {
  FEEDBACK_TYPE_VALUES,
  type FeedbackFieldErrors,
  type FeedbackSubmission,
  type FeedbackType,
} from './types';

export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGE_MIN_LENGTH = 5;
export const EMAIL_MAX_LENGTH = 254;

/** Matches the pattern already used by the Contact Us form. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longest value we keep for the auto-captured context columns. */
const METADATA_MAX_LENGTH = 500;

/** C0/C1 control characters, excluding tab and newline. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/**
 * Strips control characters (except tab/newline), normalises line endings and
 * collapses runs of blank lines, then trims and hard-caps the length.
 *
 * Feedback is stored as plain text and only ever rendered through React (which
 * escapes), so markup is left intact rather than mangling legitimate content
 * like "a < b".
 */
export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** Sanitises one of the auto-captured metadata values; '' becomes null. */
export function sanitizeMetadata(value: unknown): string | null {
  const cleaned = sanitizeText(value, METADATA_MAX_LENGTH).replace(/\n/g, ' ');
  return cleaned || null;
}

export function isFeedbackType(value: unknown): value is FeedbackType {
  return typeof value === 'string' && (FEEDBACK_TYPE_VALUES as readonly string[]).includes(value);
}

/**
 * Validates a submission and returns per-field messages. An empty object means
 * the submission is good to send.
 */
export function validateFeedback(input: Partial<FeedbackSubmission>): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {};

  if (!isFeedbackType(input.feedbackType)) {
    errors.feedbackType = 'Please choose a feedback type';
  }

  const message = sanitizeText(input.message, MESSAGE_MAX_LENGTH);
  if (!message) {
    errors.message = 'Please tell us a little about your feedback';
  } else if (message.length < MESSAGE_MIN_LENGTH) {
    errors.message = `Please use at least ${MESSAGE_MIN_LENGTH} characters`;
  } else if (typeof input.message === 'string' && input.message.trim().length > MESSAGE_MAX_LENGTH) {
    errors.message = `Please keep it under ${MESSAGE_MAX_LENGTH} characters`;
  }

  // Email is optional — only validated when the user actually typed something.
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (email) {
    if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  return errors;
}
