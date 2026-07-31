import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * API test configuration — the third suite, kept separate from unit and
 * integration for the same reasons those two are separate from each other:
 *
 *   - scope:      exercises Next.js Route Handlers at the HTTP contract level
 *                 (status codes, response bodies, headers), not modules
 *   - coverage:   scoped to src/app/api/** so the number means "how much of the
 *                 API surface is tested" rather than being diluted by lib code
 *   - reporting:  its own JUnit file, so the CI artifact does not collide with
 *                 the integration report
 *   - isolation:  serial, because /api/feedback holds module-level rate-limit
 *                 state that parallel files would race on
 *
 * No server is started and no browser is involved: the exported handlers are
 * imported and invoked with real Request / FormData objects, which is the
 * supported way to test App Router route handlers.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    environment: 'node',
    include: ['tests/api/**/*.api.test.ts'],
    globals: false,

    testTimeout: 30_000,
    hookTimeout: 30_000,

    // The rate limiter in /api/feedback is a module-level Map. Running files in
    // parallel would let one suite consume another's request budget.
    fileParallelism: false,

    reporters: ['default', ['junit', { outputFile: './test-results/api-junit.xml' }]],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage/api',
      skipFull: false,

      // Every route handler in the application, so an untested endpoint shows
      // up as a 0% row rather than silently absent.
      include: ['src/app/api/**/*.ts'],

      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
})
