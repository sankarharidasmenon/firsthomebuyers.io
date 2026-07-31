import { test as base, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Shared test fixture.
 *
 * DETERMINISM
 * Every test runs with the API layer stubbed at the network boundary via
 * `page.route()`. Nothing here depends on Supabase being reachable, on scheme
 * data existing, or on a mail server — which removes the single biggest source
 * of end-to-end flakiness. The application code under test is entirely real;
 * only the far side of `fetch` is replaced.
 *
 * Individual tests can override any route by registering their own handler
 * afterwards — the most recently registered matching route wins.
 */

/** Minimal, correctly-shaped eligibility payload (see EligibilityResult). */
export const EMPTY_ELIGIBILITY = {
  items: [],
  cashGrantsTotal: 0,
  taxSavingsTotal: 0,
  eligibleSchemesCount: 0,
  totalEligibleCount: 0,
}

export const SAMPLE_SCHEMES = {
  schemes: [
    {
      id: '11111111-2222-3333-4444-555555555555',
      scheme_id: 'fhog-nsw',
      scheme_name: 'First Home Owner Grant (NSW)',
      type: 'Grant',
      status: 'Open',
      applicable_states: 'NSW',
      benefit_value: '$10,000',
      short_description: 'One-off payment for eligible first home buyers.',
      official_url: 'https://www.revenue.nsw.gov.au/grants-schemes',
      priority_ranking: '1',
    },
  ],
  count: 1,
}

async function json(route: Parameters<Parameters<Page['route']>[1]>[0], body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/** Registers the default API stubs. Exported so a test can re-apply them. */
export async function stubApi(page: Page): Promise<void> {
  await page.route('**/api/eligibility', (route) => json(route, EMPTY_ELIGIBILITY))
  await page.route('**/api/schemes**', (route) => json(route, SAMPLE_SCHEMES))
  await page.route('**/api/grant-calculator', (route) =>
    json(route, {
      grants: [],
      schemes: [],
      duty: null,
      cashGrantsTotal: 0,
      stampDutySaving: 0,
      totalValue: 0,
    }),
  )
  await page.route('**/api/feedback', (route) => json(route, { ok: true }, 201))
  await page.route('**/api/contact', (route) => json(route, { success: true }))
}

export const test = base.extend<{ stubbedApi: void }>({
  stubbedApi: [
    async ({ page }, use) => {
      await stubApi(page)
      await use()
    },
    { auto: true },
  ],
})

export { expect }

/**
 * Accessibility scan.
 *
 * Scoped to WCAG 2.1 A/AA, which is the standard the design system claims to
 * meet. `colour-contrast` is excluded from the automated gate ONLY where noted
 * by the caller — never silently.
 */
export async function analyzeA11y(page: Page, options: { disableRules?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules)
  return builder.analyze()
}

/** A readable failure message listing each violation and the nodes involved. */
export function formatViolations(
  violations: Awaited<ReturnType<typeof analyzeA11y>>['violations'],
): string {
  return violations
    .map(
      (v) =>
        `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n` +
        v.nodes
          .slice(0, 3)
          .map((n) => `    -> ${n.target.join(' ')}`)
          .join('\n'),
    )
    .join('\n')
}
