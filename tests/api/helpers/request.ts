/**
 * Request builders and response readers for Route Handler tests.
 *
 * The handlers are plain exported functions taking a Web `Request` and
 * returning a Web `Response`, so they can be invoked directly — no server, no
 * browser, no Docker. That is the supported way to test App Router routes and
 * it keeps the whole suite in-process and fast.
 */
import type { NextRequest } from 'next/server'

const ORIGIN = 'http://localhost:3000'

export interface RequestInitLite {
  method?: string
  headers?: Record<string, string>
  /** Client IP seen by the handler via x-forwarded-for. */
  ip?: string
  userAgent?: string
}

function buildHeaders(init: RequestInitLite = {}, contentType?: string): Headers {
  const headers = new Headers(init.headers ?? {})
  if (contentType && !headers.has('content-type')) headers.set('content-type', contentType)
  if (init.ip) headers.set('x-forwarded-for', init.ip)
  if (init.userAgent) headers.set('user-agent', init.userAgent)
  return headers
}

/** A JSON POST (or other method) to `path`. */
export function jsonRequest(path: string, body: unknown, init: RequestInitLite = {}): Request {
  return new Request(`${ORIGIN}${path}`, {
    method: init.method ?? 'POST',
    headers: buildHeaders(init, 'application/json'),
    body: JSON.stringify(body),
  })
}

/**
 * A request whose body is NOT valid JSON, for asserting how a handler behaves
 * when `await req.json()` rejects.
 */
export function malformedJsonRequest(path: string, raw = '{not json', init: RequestInitLite = {}): Request {
  return new Request(`${ORIGIN}${path}`, {
    method: init.method ?? 'POST',
    headers: buildHeaders(init, 'application/json'),
    body: raw,
  })
}

/** A multipart form POST, for the master-data upload route. */
export function formRequest(path: string, form: FormData, init: RequestInitLite = {}): Request {
  // Content-Type is set by the runtime from the FormData boundary — do not set it.
  return new Request(`${ORIGIN}${path}`, {
    method: init.method ?? 'POST',
    headers: buildHeaders(init),
    body: form,
  })
}

/** A GET, optionally with a query string. */
export function getRequest(path: string, init: RequestInitLite = {}): Request {
  return new Request(`${ORIGIN}${path}`, {
    method: 'GET',
    headers: buildHeaders(init),
  })
}

/**
 * Handlers typed against `NextRequest` only use the Web `Request` surface here
 * (`.json()`, `.headers`). Constructing a real NextRequest would pull in Next's
 * server runtime for no benefit, so the cast is deliberate and safe — but it
 * would stop being safe if a handler started using `nextUrl` or `cookies`.
 */
export function asNextRequest(request: Request): NextRequest {
  return request as unknown as NextRequest
}

/** Status plus parsed JSON body, the two things nearly every assertion needs. */
export async function readJson<T = Record<string, unknown>>(
  response: Response,
): Promise<{ status: number; body: T; headers: Headers }> {
  const text = await response.text()
  let body: T
  try {
    body = JSON.parse(text) as T
  } catch {
    throw new Error(`Expected a JSON response body, got: ${text.slice(0, 200)}`)
  }
  return { status: response.status, body, headers: response.headers }
}

/**
 * A distinct client IP per call. /api/feedback rate-limits per IP using
 * module-level state that persists for the whole file, so tests that are not
 * about rate limiting must each look like a different client.
 */
let ipCounter = 0
export function uniqueIp(): string {
  ipCounter += 1
  const a = Math.floor(ipCounter / 65536) % 256
  const b = Math.floor(ipCounter / 256) % 256
  const c = ipCounter % 256
  return `10.${a}.${b}.${c}`
}
