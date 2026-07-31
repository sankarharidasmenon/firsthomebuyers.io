import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Integration test configuration — deliberately separate from
 * vitest.config.mts (unit tests) rather than a shared config with two projects.
 *
 * The two suites differ in ways that matter:
 *   - scope:      unit tests one module; integration wires several together
 *   - speed:      `npm test` must stay a sub-second inner loop
 *   - isolation:  real-database tests share one project, so they run serially
 *   - reporting:  CI needs a JUnit file from this suite for artifact upload
 *   - coverage:   different modules, so different thresholds
 */
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./src/*" alias in tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    globals: false,

    // Integration work is heavier than unit work: real Excel serialisation, and
    // for the realdb suites a network round trip to Supabase.
    testTimeout: 30_000,
    hookTimeout: 30_000,

    /**
     * Files run one at a time. The `*.realdb.*` suites share ONE test database,
     * so parallel files would race on the same rows. The mocked suites do not
     * need this, but a uniform, predictable execution model is worth more here
     * than a few hundred milliseconds.
     */
    fileParallelism: false,

    // 'default' for humans, 'junit' for the CI artifact.
    reporters: ['default', ['junit', { outputFile: './test-results/integration-junit.xml' }]],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      // Separate directory so it never overwrites the unit-test coverage report.
      reportsDirectory: './coverage/integration',
      skipFull: false,

      /**
       * Scoped to the modules these tests actually wire together. Note the
       * numbers here are NOT comparable to the unit suite's: integration tests
       * assert on collaboration between modules, and buying a higher line
       * percentage by testing every branch at this level would just be slow,
       * brittle unit testing wearing a different hat.
       */
      include: [
        'src/lib/masterData/**/*.ts',
        'src/lib/schemes/repository.ts',
        'src/lib/auth/session.ts',
      ],

      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
    },
  },
})
