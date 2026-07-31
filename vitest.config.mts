import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" -> "./src/*" alias in tsconfig.json so tests import
    // modules exactly the way the application does.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    // Phase 2 covers pure business logic only — no DOM, no component rendering.
    // A jsdom environment would be dead weight here; add it per-file with
    // `// @vitest-environment jsdom` if a later phase needs it.
    environment: 'node',

    // Tests live outside src/ so the application tree stays untouched.
    include: ['tests/unit/**/*.test.ts'],

    // Explicit imports from 'vitest' instead of injected globals: keeps the
    // test files honest under `tsc --noEmit` without widening tsconfig types.
    globals: false,

    // Surface slow tests rather than letting them hide; these are pure
    // functions and should be sub-millisecond.
    slowTestThreshold: 50,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',

      // NOTE: the v8 text reporter omits files that are at 100% on every
      // metric, so a module missing from the terminal table is fully covered,
      // not uncovered. `skipFull: false` does not change this. The lcov and
      // html reports list every file — use those for a complete inventory.
      skipFull: false,

      // Scoped DELIBERATELY to the modules Phase 2 tests. Including all of
      // src/** would report a meaningless single-digit percentage dominated by
      // UI components and static data files (forumsData.ts, postcodes.ts,
      // mockArticles.ts) that unit tests are the wrong tool for.
      //
      // Each later phase widens this list as it adds its own tests:
      //   Phase 3 (integration) -> src/lib/masterData/**, src/lib/schemes/repository.ts
      //   Phase 4 (API)         -> src/app/api/**
      include: [
        'src/lib/calculations.ts',
        'src/lib/schemes/stampDuty.ts',
        'src/lib/schemes/priceCaps.ts',
        'src/lib/calculator/grantCalculator.ts',
        'src/lib/feedback/validation.ts',
      ],

      // Fail the run if coverage regresses. These are pure, fully-reachable
      // functions, so the bar is high on purpose.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
})
