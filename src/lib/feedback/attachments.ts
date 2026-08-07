/**
 * Feedback attachment constants + pure validation helpers.
 *
 * Isomorphic (client + server): the modal's uploader runs these checks before
 * a file ever leaves the browser, the presigned-url route re-runs the same
 * checks on the untrusted request, and the feedback route re-checks the
 * shape of the attachment metadata it's asked to persist. No node/browser-only
 * import belongs here — see `@/lib/aws/s3` for the S3-specific (server-only)
 * half of this.
 */

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/** Content-Type -> canonical extension used for the stored S3 key. */
export const ALLOWED_ATTACHMENT_MIME_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Extensions accepted on the client-supplied file name (UX-only check). */
export const ALLOWED_ATTACHMENT_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;

export const ATTACHMENT_ACCEPT_STRING = Object.keys(ALLOWED_ATTACHMENT_MIME_TYPES).join(',');

/** One uploaded attachment as stored in `feedback.attachments` (JSONB). */
export interface FeedbackAttachment {
  key: string;
  fileName: string;
  size: number;
}

export function getFileExtension(fileName: string): string {
  // Strip any directory-like prefix the browser/name might carry, then take
  // the last dot segment — never trust the raw string for path building.
  const base = fileName.split(/[/\\]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot + 1).toLowerCase();
}

export function isAllowedAttachmentMimeType(contentType: string): boolean {
  return Object.prototype.hasOwnProperty.call(ALLOWED_ATTACHMENT_MIME_TYPES, contentType);
}

export function isAllowedAttachmentExtension(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return (ALLOWED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext);
}

/** A file is acceptable only when its declared type AND its name's extension both check out. */
export function isAllowedAttachmentFile(contentType: string, fileName: string): boolean {
  return isAllowedAttachmentMimeType(contentType) && isAllowedAttachmentExtension(fileName);
}

export function isValidAttachmentSize(size: number): boolean {
  return Number.isFinite(size) && size > 0 && size <= MAX_ATTACHMENT_SIZE_BYTES;
}

/** "1.2 MB" / "840 KB" — matches the upload-card display in the spec. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ATTACHMENT_ERROR_MESSAGES = {
  tooMany: `Maximum ${MAX_ATTACHMENTS} attachments.`,
  tooLarge: 'Maximum upload size is 2 MB.',
  badType: 'Only PNG, JPG, JPEG and WEBP are allowed.',
} as const;

/** Loose, allocation-free shape guard for one attachment metadata object. */
export function isPlausibleAttachmentKey(key: unknown): key is string {
  if (typeof key !== 'string' || key.length === 0 || key.length > 512) return false;
  if (key.startsWith('/') || key.includes('..')) return false;
  return /\.(png|jpe?g|webp)$/i.test(key);
}

/**
 * Server-side shape check for the `attachments` array a feedback submission
 * claims to have uploaded. Confirms the metadata LOOKS like something our own
 * presigned-url route would have produced (key pattern, bounded size, at most
 * MAX_ATTACHMENTS) — it does not (and cannot, without a HeadObject round trip)
 * prove the object exists in S3.
 */
export function sanitizeAttachments(value: unknown): FeedbackAttachment[] {
  if (!Array.isArray(value)) return [];
  const out: FeedbackAttachment[] = [];
  for (const item of value.slice(0, MAX_ATTACHMENTS)) {
    if (!item || typeof item !== 'object') continue;
    const key = (item as Record<string, unknown>).key;
    const fileName = (item as Record<string, unknown>).fileName;
    const size = (item as Record<string, unknown>).size;
    if (!isPlausibleAttachmentKey(key)) continue;
    if (typeof fileName !== 'string' || fileName.length === 0 || fileName.length > 255) continue;
    if (typeof size !== 'number' || !isValidAttachmentSize(size)) continue;
    out.push({ key, fileName, size });
  }
  return out;
}
