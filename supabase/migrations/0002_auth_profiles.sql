-- ============================================================================
-- FirstNest — Phase 3: User Authentication (Supabase Auth) + Saved Scenarios
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Tables:
--   profiles         — one row per auth.users user (name, dob, role).
--   saved_scenarios  — user-owned saved borrowing scenarios / results snapshots.
-- Trigger:
--   handle_new_user() — auto-creates a profiles row when a user signs up, and
--   promotes admin@firstnestai.com to super_admin.
--
-- Roles: 'user' | 'admin' | 'super_admin'.  Only super_admin may reach
-- /admin/master-data. Role is the source of truth in `profiles` (not in auth
-- metadata) so it can be changed without touching authentication.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  dob         date,
  role        text not null default 'user'
                check (role in ('user', 'admin', 'super_admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ── saved_scenarios ─────────────────────────────────────────────────────────
-- `kind` distinguishes the My-Results baseline snapshot ('result') from the
-- "what if" slider explorations ('scenario'), so one table backs both.
create table if not exists public.saved_scenarios (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  scenario_name     text,
  kind              text not null default 'scenario'
                      check (kind in ('result', 'scenario')),
  answers           jsonb not null default '{}'::jsonb,
  borrowing_results jsonb not null default '{}'::jsonb,
  eligible_schemes  jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists saved_scenarios_user_idx
  on public.saved_scenarios (user_id, created_at desc);

-- ── updated_at maintenance ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists saved_scenarios_set_updated_at on public.saved_scenarios;
create trigger saved_scenarios_set_updated_at
  before update on public.saved_scenarios
  for each row execute function public.set_updated_at();

-- ── Auto-provision a profile on sign-up ─────────────────────────────────────
-- Runs as the auth system inserts the user. Reads name/dob from the sign-up
-- metadata (options.data). admin@firstnestai.com becomes super_admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'user';
  v_dob  date := null;
begin
  if new.email = 'admin@firstnestai.com' then
    v_role := 'super_admin';
  end if;

  -- dob may be absent or malformed in metadata; never fail the sign-up over it.
  begin
    v_dob := nullif(new.raw_user_meta_data ->> 'dob', '')::date;
  exception when others then
    v_dob := null;
  end;

  insert into public.profiles (id, email, full_name, dob, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    v_dob,
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- To promote an existing user manually (e.g. if admin@firstnestai.com signed up
-- before this migration ran), run:
--   update public.profiles set role = 'super_admin'
--   where email = 'admin@firstnestai.com';

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.saved_scenarios enable row level security;

-- profiles: a user may read and update ONLY their own row. The `role` column is
-- protected from self-escalation by a WITH CHECK that pins it to its current
-- value; role changes happen only via the service role / SQL.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- saved_scenarios: full owner-only CRUD.
drop policy if exists saved_scenarios_select_own on public.saved_scenarios;
create policy saved_scenarios_select_own
  on public.saved_scenarios for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists saved_scenarios_insert_own on public.saved_scenarios;
create policy saved_scenarios_insert_own
  on public.saved_scenarios for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists saved_scenarios_update_own on public.saved_scenarios;
create policy saved_scenarios_update_own
  on public.saved_scenarios for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists saved_scenarios_delete_own on public.saved_scenarios;
create policy saved_scenarios_delete_own
  on public.saved_scenarios for delete
  to authenticated
  using (auth.uid() = user_id);
