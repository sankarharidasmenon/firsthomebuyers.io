-- ============================================================================
-- FirstNest — Phase 2A: Government Scheme Master Data schema
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Tables:
--   government_schemes   — one row per scheme (the 56 Excel columns + metadata)
--   master_data_imports  — audit log, one row per upload
-- Function:
--   import_master_data(jsonb, jsonb) — transactionally REPLACE all schemes and
--   record the import; rolls back automatically on any error.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── government_schemes ──────────────────────────────────────────────────────
create table if not exists public.government_schemes (
  id            uuid primary key default gen_random_uuid(),
  -- The 56 master-data columns (stored as text to preserve exact Excel values).
  scheme_id                        text not null,
  scheme_name                      text not null,
  acronym                          text,
  type                             text,
  level                            text,
  administering_body               text,
  short_description                text,
  detailed_description             text,
  applicable_states                text,
  metro_vs_regional                text,
  postcode_region_restrictions     text,
  benefit_type                     text,
  benefit_value                    text,
  value_unit                       text,
  max_value_cap                    text,
  state_by_state_value_variations  text,
  regional_bonus_amount            text,
  value_calculation_method         text,
  first_home_buyer_required        text,
  owner_occupier_required          text,
  citizenship_residency            text,
  minimum_age                      text,
  income_cap_single                text,
  income_cap_couple                text,
  income_test_basis                text,
  property_price_cap               text,
  price_cap_variations             text,
  eligible_property_types          text,
  new_vs_established               text,
  minimum_deposit                  text,
  prior_ownership_rules            text,
  single_parent_required           text,
  dependent_children_required      text,
  relationship_status              text,
  occupancy_requirement            text,
  other_conditions                 text,
  full_exemption_threshold         text,
  partial_concession_range         text,
  concession_calculation_method    text,
  can_be_combined_with             text,
  mutually_exclusive_with          text,
  places_quota                     text,
  status                           text,
  start_date                       text,
  end_closing_date                 text,
  contract_date_window             text,
  financial_year                   text,
  official_url                     text not null,
  legislation_reference            text,
  application_method               text,
  last_verified_date               text,
  source_website                   text,
  notes_caveats                    text,
  eligibility_tag                  text,
  priority_ranking                 text,
  catchy_line                      text,
  -- Metadata.
  import_version   text,
  uploaded_by      text,
  source_filename  text,
  imported_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists government_schemes_scheme_id_idx on public.government_schemes (scheme_id);
create index if not exists government_schemes_type_idx on public.government_schemes (type);
create index if not exists government_schemes_states_idx on public.government_schemes (applicable_states);

-- ── master_data_imports (audit log) ─────────────────────────────────────────
create table if not exists public.master_data_imports (
  id                uuid primary key default gen_random_uuid(),
  version           text,
  filename          text,
  uploaded_by       text,
  uploaded_at       timestamptz not null default now(),
  total_schemes     integer not null default 0,
  status            text not null default 'pending', -- 'success' | 'failed'
  duration_ms       integer,
  validation_errors jsonb not null default '[]'::jsonb
);

create index if not exists master_data_imports_uploaded_at_idx on public.master_data_imports (uploaded_at desc);

-- ── Transactional replace + history in a single function (one transaction) ──
-- Everything inside a plpgsql function runs in one transaction: if any insert
-- fails, the DELETE and the history row are rolled back — never partial data.
create or replace function public.import_master_data(p_schemes jsonb, p_meta jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import_id uuid;
  v_count integer;
begin
  -- Audit record (rolls back with everything else if a later step fails).
  insert into public.master_data_imports
    (version, filename, uploaded_by, total_schemes, status, duration_ms, validation_errors)
  values
    (p_meta->>'version', p_meta->>'filename', p_meta->>'uploaded_by',
     coalesce((p_meta->>'total_schemes')::int, 0), 'success',
     (p_meta->>'duration_ms')::int, '[]'::jsonb)
  returning id into v_import_id;

  -- Full replace. TRUNCATE is transactional (rolls back with everything else)
  -- and is not subject to the pg-safeupdate "DELETE requires a WHERE clause"
  -- guard that some Supabase projects enable.
  truncate table public.government_schemes;

  insert into public.government_schemes (
    scheme_id, scheme_name, acronym, type, level, administering_body,
    short_description, detailed_description, applicable_states, metro_vs_regional,
    postcode_region_restrictions, benefit_type, benefit_value, value_unit,
    max_value_cap, state_by_state_value_variations, regional_bonus_amount,
    value_calculation_method, first_home_buyer_required, owner_occupier_required,
    citizenship_residency, minimum_age, income_cap_single, income_cap_couple,
    income_test_basis, property_price_cap, price_cap_variations,
    eligible_property_types, new_vs_established, minimum_deposit,
    prior_ownership_rules, single_parent_required, dependent_children_required,
    relationship_status, occupancy_requirement, other_conditions,
    full_exemption_threshold, partial_concession_range, concession_calculation_method,
    can_be_combined_with, mutually_exclusive_with, places_quota, status,
    start_date, end_closing_date, contract_date_window, financial_year,
    official_url, legislation_reference, application_method, last_verified_date,
    source_website, notes_caveats, eligibility_tag, priority_ranking, catchy_line,
    import_version, uploaded_by, source_filename, imported_at
  )
  select
    s.scheme_id, s.scheme_name, s.acronym, s.type, s.level, s.administering_body,
    s.short_description, s.detailed_description, s.applicable_states, s.metro_vs_regional,
    s.postcode_region_restrictions, s.benefit_type, s.benefit_value, s.value_unit,
    s.max_value_cap, s.state_by_state_value_variations, s.regional_bonus_amount,
    s.value_calculation_method, s.first_home_buyer_required, s.owner_occupier_required,
    s.citizenship_residency, s.minimum_age, s.income_cap_single, s.income_cap_couple,
    s.income_test_basis, s.property_price_cap, s.price_cap_variations,
    s.eligible_property_types, s.new_vs_established, s.minimum_deposit,
    s.prior_ownership_rules, s.single_parent_required, s.dependent_children_required,
    s.relationship_status, s.occupancy_requirement, s.other_conditions,
    s.full_exemption_threshold, s.partial_concession_range, s.concession_calculation_method,
    s.can_be_combined_with, s.mutually_exclusive_with, s.places_quota, s.status,
    s.start_date, s.end_closing_date, s.contract_date_window, s.financial_year,
    s.official_url, s.legislation_reference, s.application_method, s.last_verified_date,
    s.source_website, s.notes_caveats, s.eligibility_tag, s.priority_ranking, s.catchy_line,
    p_meta->>'version', p_meta->>'uploaded_by', p_meta->>'filename', now()
  from jsonb_populate_recordset(null::public.government_schemes, p_schemes) s;

  get diagnostics v_count = row_count;

  update public.master_data_imports set total_schemes = v_count where id = v_import_id;

  return jsonb_build_object('import_id', v_import_id, 'count', v_count);
end;
$$;

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Public (anon) may READ schemes. Writes happen only via the service-role key
-- (which bypasses RLS) inside the upload API. Import history is not public.
alter table public.government_schemes enable row level security;
alter table public.master_data_imports enable row level security;

drop policy if exists government_schemes_read on public.government_schemes;
create policy government_schemes_read
  on public.government_schemes for select
  to anon, authenticated
  using (true);

-- No anon policies on master_data_imports → only service_role can read/write it.

-- Allow anon/authenticated to execute the read side; the import function is only
-- ever called with the service-role key from the server.
revoke all on function public.import_master_data(jsonb, jsonb) from anon, authenticated;
