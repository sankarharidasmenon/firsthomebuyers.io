import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration — UI/UX automation (Phase 5).
 *
 * The three Vitest suites (unit, integration, API) stay exactly as they are;
 * Playwright owns `tests/e2e/` only, and its spec glob cannot collide with
 * theirs (`*.spec.ts` here vs `*.test.ts` there, in separate directories).
 *
 * The server under test is the REAL production build, started the same way CI
 * starts it. Supabase values are non-secret placeholders: every test stubs the
 * API layer with `page.route()` (see tests/e2e/fixtures/test.ts), so no test
 * depends on a database being reachable, and none can be flaky because of one.
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // Independent tests, so they can run in parallel safely.
  fullyParallel: true,

  // A .only left in a commit must fail the build, not silently skip the suite.
  forbidOnly: !!process.env.CI,

  /**
   * Retries exist for genuinely transient failures (a cold server, a slow
   * animation frame), never to paper over a flaky assertion. Zero locally so
   * flakiness is visible while it is being written.
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * Capped deliberately. Playwright's default (roughly half the CPU count)
   * launched enough concurrent browsers with video capture to crash renderer
   * processes on a developer machine — a non-deterministic failure that has
   * nothing to do with the application. Determinism beats raw speed here; the
   * whole suite still finishes in a couple of minutes.
   */
  workers: process.env.CI ? 2 : 3,

  // Generous but finite: an assertion that needs longer than this is wrong.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/ui-junit.xml' }],
  ],

  outputDir: 'test-results/playwright-artifacts',

  use: {
    baseURL: BASE_URL,
    // Traces only on a retry: full fidelity for failures, no cost for the
    // ~99% of runs that pass.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      /**
       * Responsive coverage. The app has genuinely different mobile behaviour —
       * a bottom navigation bar that only mounts below `lg`, a hamburger menu,
       * and a feedback button that collapses to an icon — so this is a distinct
       * surface, not the same tests at a narrower width.
       */
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /**
   * Builds and serves the production app. `reuseExistingServer` keeps the local
   * loop fast when a server is already up; CI always starts a clean one.
   *
   * The build is included in the command so a stale .next can never silently be
   * tested instead of the current source.
   */
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Public, non-secret placeholders. The build prerenders /admin/login,
      // which constructs a Supabase browser client and throws if these are
      // unset; nothing in the tests talks to a real project.
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
})
