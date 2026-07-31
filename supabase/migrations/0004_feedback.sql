-- ============================================================================
-- FirstNest — Phase 5: In-app feedback
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Table:
--   feedback — one row per submission from the floating feedback widget.
--              Anonymous (signed-out) submissions are allowed: user_id is null.
--
-- Trust model: the row is written by /api/feedback using the caller's own
-- session (anon or authenticated) — never the service role. Identity columns
-- (user_id / user_name / user_email) are filled from the server-side session,
-- never from the request body, and RLS pins user_id to auth.uid().
--
-- Visibility: submitters cannot read anything back; only 'admin' and
-- 'super_admin' profiles may SELECT. There are no UPDATE/DELETE policies, so
-- those are denied for everyone except the service role.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create table if not exists public.feedback (
  id                uuid primary key default gen_random_uuid(),
  feedback_type     text not null
                      check (feedback_type in ('bug', 'ui', 'feature', 'other')),
  message           text not null
                      check (char_length(message) between 5 and 1000),
  email             text,
  page_url          text,
  user_agent        text,
  screen_resolution text,
  theme             text check (theme in ('light', 'dark')),
  user_id           uuid references auth.users (id) on delete set null,
  user_name         text,
  user_email        text,
  created_at        timestamptz not null default now()
);

-- Admin list view is "newest first", optionally filtered by type.
create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

create index if not exists feedback_type_idx
  on public.feedback (feedback_type, created_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.feedback enable row level security;

-- INSERT: anyone may submit (signed in or not). A signed-in caller can only
-- attribute the row to themselves; a signed-out caller must leave user_id null.
drop policy if exists feedback_insert_any on public.feedback;
create policy feedback_insert_any
  on public.feedback for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- SELECT: admins only. The subquery reads the caller's OWN profiles row, which
-- profiles' own RLS (profiles_select_own) permits.
drop policy if exists feedback_select_admin on public.feedback;
create policy feedback_select_admin
  on public.feedback for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );

-- No UPDATE / DELETE policies: submissions are immutable from the client.
