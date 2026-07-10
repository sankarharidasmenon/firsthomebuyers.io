# Phase 2A — Government Scheme Master Data Backend

Backend foundation that imports the approved `government_schemes.xlsx` into
Supabase and serves scheme data to the app. **No frontend changes**; the
extraction engine is untouched. Supabase is the runtime source of truth — Excel
is only the approved import mechanism.

## One-time setup

1. **Env** (`.env`) — already present:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `MASTER_DATA_ADMIN_TOKEN` — the Super-Admin secret for uploads (change it).

2. **Apply the database schema** — open the Supabase SQL editor and run
   [`supabase/migrations/0001_master_data.sql`](../supabase/migrations/0001_master_data.sql).
   It creates `government_schemes`, `master_data_imports`, the transactional
   `import_master_data()` function, and RLS (public read, service-role write).

3. **Verify** — `npm run test:master-data` runs offline validation tests always,
   and the full DB suite (import, reads, rollback, history) once the schema exists.

## Architecture (reuses the existing `src/lib` structure)

```
src/lib/
  masterData/
    columns.ts    56 Excel headers ↔ db columns (single source of truth)
    parse.ts      reads ONLY the "Schemes" worksheet; ignores extra sheets/columns
    validate.ts   duplicate ids/urls, missing name/id, invalid URLs, data types
    import.ts     calls the transactional RPC + records import history
    types.ts
  schemes/
    repository.ts the ONLY place scheme data is read (public/anon client)
  supabase/
    server.ts     publicClient (anon, RLS) + adminClient (service-role)
  auth/
    admin.ts      Super-Admin gate (x-admin-token / Bearer)
src/app/api/
  admin/master-data/upload/route.ts   POST — upload + validate + import (admin)
  schemes/route.ts                    GET  — all schemes
  schemes/[id]/route.ts               GET  — one scheme (by scheme_id or uuid)
  schemes/featured/route.ts           GET  — active schemes for cards
  schemes/eligible/route.ts           GET  — filtered by user answers
```

The parser looks the 56 required columns up **by header name**, so extra columns
in the workbook (e.g. "S.No", "Program Type") are ignored, not an error.

## Import flow (transactional, all-or-nothing)

```
Upload .xlsx → parse "Schemes" sheet → validate rows
   → import_master_data() : BEGIN → insert audit row → DELETE all → INSERT all → COMMIT
   → on ANY error: ROLLBACK (existing data untouched) + audit a 'failed' row
```

Validation failures and DB failures **never** modify scheme data.

## API usage

Upload (Super Admin only):

```bash
curl -X POST http://localhost:3000/api/admin/master-data/upload \
  -H "x-admin-token: $MASTER_DATA_ADMIN_TOKEN" \
  -F "file=@government-data-extractor/output/government_schemes.xlsx" \
  -F "version=1.0" -F "uploadedBy=business-analyst"
# → { "success": true, "schemesImported": 17, "updatedAt": "...", "version": "1.0", "durationMs": ... }
```

Reads (public):

```bash
curl http://localhost:3000/api/schemes
curl http://localhost:3000/api/schemes/nsw-first-home-owner-grant
curl http://localhost:3000/api/schemes/featured?limit=6
curl "http://localhost:3000/api/schemes/eligible?state=VIC&firstHomeBuyer=true&income=90000&propertyPrice=650000"
```

## Guarantees

- One row = one scheme (56 fields) + metadata (`imported_at`, `import_version`,
  `uploaded_by`, `source_filename`).
- Every upload writes one `master_data_imports` audit row (success or failed).
- Only the Super-Admin token can write; reads are public via RLS.
- No hardcoded scheme data anywhere in the read path.
