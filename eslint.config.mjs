import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Build / test output.
    ".dist/**",
    "coverage/**",

    // Vendored data-extraction projects: standalone tools with their own
    // dependencies and lifecycle, already excluded from tsconfig's `exclude`.
    // Keeping ESLint's scope aligned with TypeScript's stops us linting code
    // we neither build nor ship.
    "data-extractor/**",
    "government-data-extractor/**",

    // One-off operational / QA scripts and scratch files — not part of the
    // application build. Note this means scripts/test-master-data.ts is not
    // linted; it is a manual tool, not application code.
    "scripts/**",
    "scratch-*.ts",
    "tmp-*.ts",
  ]),

  // ──────────────────────────────────────────────────────────────────────────
  // LEGACY BASELINE — shrink this block, never grow it.
  //
  // These rules currently fail on pre-existing application code. Downgrading
  // them to warnings lets CI run a BLOCKING lint gate today rather than
  // disabling linting altogether. `npm run lint:ci` caps the total warning
  // count, so any NEW violation still fails the build.
  //
  // Counts measured on branch v6 before the gate was introduced (49 errors):
  //   react-hooks/static-components       18
  //   react-hooks/set-state-in-effect     17
  //   @typescript-eslint/no-explicit-any   7
  //   react/no-unescaped-entities          4
  //   react-hooks/purity                   2
  //   prefer-const                         1
  //
  // Ratchet: fix a rule's violations, restore it to "error" here, and lower
  // the --max-warnings budget in the "lint:ci" script by the same amount.
  // `prefer-const` and `react/no-unescaped-entities` are the cheapest wins.
  // The react-hooks rules flag genuine effect/purity smells — schedule those
  // deliberately, with tests in place first.
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "firstnest/legacy-baseline",
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
