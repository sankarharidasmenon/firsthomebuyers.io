-- ============================================================================
-- FirstNest — Phase 5b: Feedback attachments
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Adds `attachments` to public.feedback: a JSONB array of S3 OBJECT KEYS
-- (never signed or public URLs — see /api/uploads/presigned-url and the PUT
-- flow in AttachmentUploader). Bucket stays private; keys are resolved to
-- short-lived signed GET URLs only when an admin views a submission.
--
-- Shape of each element:
--   { "key": "feedback-screenshot/<uuid>.<ext>", "fileName": "<original>", "size": <bytes> }
-- ============================================================================

alter table public.feedback
  add column if not exists attachments jsonb;

-- Defence in depth alongside the app-level sanitisation in
-- lib/feedback/attachments.ts: never more than 5 entries, and always an
-- array (or null) rather than some other JSON shape.
alter table public.feedback
  drop constraint if exists feedback_attachments_shape;
alter table public.feedback
  add constraint feedback_attachments_shape
    check (
      attachments is null
      or (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5)
    );
