/**
 * A recording, chainable test double for the Supabase client.
 *
 * WHY THIS EXISTS
 * Integration tests here mock exactly ONE thing — the database driver — so that
 * everything above it runs for real: the Excel parser, the validator, the
 * import orchestration, the auth/role checks and the response shaping. That
 * gives genuine module-interaction coverage without Docker or a live database.
 *
 * WHAT IT IS NOT
 * It is not a Postgres emulator. It cannot prove an RLS policy works — only a
 * real database can, which is what the `*.realdb.*` suites are for. Use this to
 * assert HOW the application talks to the database (which table, which
 * operation, which payload, in which order) and how it behaves when the
 * database answers with data or with an error.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseError {
  message: string
}

export interface SupabaseResult<T = unknown> {
  data: T | null
  error: SupabaseError | null
}

export type QueryOperation = 'select' | 'insert' | 'update' | 'delete'

/** One recorded interaction with the database. */
export interface QueryRecord {
  kind: 'query'
  table: string
  operation: QueryOperation
  payload?: unknown
  columns?: string
  filters: Array<{ column: string; value: unknown }>
  orders: Array<{ column: string; ascending: boolean }>
  limit?: number
  /** True when the caller finished with .single() or .maybeSingle(). */
  expectsSingle: boolean
}

/** One recorded stored-procedure call. */
export interface RpcRecord {
  kind: 'rpc'
  fn: string
  args?: Record<string, unknown>
}

export type CallRecord = QueryRecord | RpcRecord

/** Decides what the "database" answers for a given interaction. */
export type Responder = (call: CallRecord) => SupabaseResult

export interface FakeUser {
  id: string
  email?: string
}

export interface FakeSupabaseOptions {
  /** Default: every call succeeds with `data: null`. */
  responder?: Responder
  /** Session returned by auth.getUser(). Default: signed out. */
  user?: FakeUser | null
}

/**
 * Thenable query builder. Chainable methods return `this`; awaiting it runs the
 * responder and records the interaction, which mirrors how supabase-js defers
 * execution until the builder is awaited.
 */
class FakeQueryBuilder implements PromiseLike<SupabaseResult> {
  constructor(
    private readonly record: QueryRecord,
    private readonly responder: Responder,
    private readonly log: CallRecord[],
  ) {}

  select(columns?: string): this {
    this.record.operation = 'select'
    this.record.columns = columns
    return this
  }

  insert(payload: unknown): this {
    this.record.operation = 'insert'
    this.record.payload = payload
    return this
  }

  update(payload: unknown): this {
    this.record.operation = 'update'
    this.record.payload = payload
    return this
  }

  delete(): this {
    this.record.operation = 'delete'
    return this
  }

  eq(column: string, value: unknown): this {
    this.record.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.record.orders.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  limit(count: number): this {
    this.record.limit = count
    return this
  }

  single(): this {
    this.record.expectsSingle = true
    return this
  }

  maybeSingle(): this {
    this.record.expectsSingle = true
    return this
  }

  then<TResult1 = SupabaseResult, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    let outcome: SupabaseResult
    try {
      this.log.push(this.record)
      outcome = this.responder(this.record)
    } catch (error) {
      return Promise.reject(error).then(onfulfilled, onrejected)
    }
    return Promise.resolve(outcome).then(onfulfilled, onrejected)
  }
}

export interface FakeSupabase {
  /** The object to hand to code under test (typed as a real SupabaseClient). */
  client: SupabaseClient
  /** Every interaction, in order. */
  calls: CallRecord[]
  /** Only the table queries. */
  queries: QueryRecord[]
  /** Only the stored-procedure calls. */
  rpcs: RpcRecord[]
  /** Interactions against one table, in order. */
  queriesFor(table: string): QueryRecord[]
  reset(): void
}

const defaultResponder: Responder = () => ({ data: null, error: null })

export function createFakeSupabase(options: FakeSupabaseOptions = {}): FakeSupabase {
  const responder = options.responder ?? defaultResponder
  const user = options.user ?? null
  const calls: CallRecord[] = []

  const raw = {
    from(table: string) {
      return new FakeQueryBuilder(
        {
          kind: 'query',
          table,
          operation: 'select',
          filters: [],
          orders: [],
          expectsSingle: false,
        },
        responder,
        calls,
      )
    },

    rpc(fn: string, args?: Record<string, unknown>) {
      const record: RpcRecord = { kind: 'rpc', fn, args }
      calls.push(record)
      return Promise.resolve(responder(record))
    },

    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  }

  return {
    client: raw as unknown as SupabaseClient,
    calls,
    get queries() {
      return calls.filter((c): c is QueryRecord => c.kind === 'query')
    },
    get rpcs() {
      return calls.filter((c): c is RpcRecord => c.kind === 'rpc')
    },
    queriesFor(table: string) {
      return calls.filter((c): c is QueryRecord => c.kind === 'query' && c.table === table)
    },
    reset() {
      calls.length = 0
    },
  }
}

/** Convenience responder: succeed with `data`, whatever the interaction. */
export function respondWith(data: unknown): Responder {
  return () => ({ data, error: null })
}

/** Convenience responder: fail every interaction with `message`. */
export function respondWithError(message: string): Responder {
  return () => ({ data: null, error: { message } })
}
