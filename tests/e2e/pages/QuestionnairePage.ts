import type { Locator, Page } from '@playwright/test'

/**
 * Page object for the 5-step questionnaire at /onboarding.
 *
 * SELECTOR NOTE — why one CSS class is used here
 * The questionnaire renders `<label class="fhbq-q">` WITHOUT htmlFor, and the
 * inputs have no id, so the label is not programmatically associated with its
 * control. `getByLabel()` therefore cannot work, and the UI may not be modified
 * to add the association.
 *
 * Several steps also show multiple identical Yes/No groups, so a bare
 * `getByRole('radio', { name: 'Yes' })` is ambiguous.
 *
 * The workaround is to scope by the field container and filter on the question
 * text — real user-visible language, not styling. It is confined to the single
 * `question()` helper below so specs never touch a CSS selector and a DOM change
 * is a one-line fix here.
 *
 * (This is also a genuine accessibility defect: screen-reader users get the same
 * ambiguity. It is recorded in the Phase 5 report.)
 */
const FIELD = '.fhbq-field'

export type StepId = 'start' | 'property' | 'about' | 'history' | 'income'

export class QuestionnairePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/onboarding')
    await this.nameInput.waitFor({ state: 'visible' })
  }

  /* ── Structural ─────────────────────────────────────────────────────────── */

  /** The field block whose question text contains `text`. */
  question(text: string): Locator {
    return this.page.locator(FIELD).filter({ hasText: text }).first()
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 })
  }

  /** "Step 2 of 5" — rendered in both the mobile and desktop headers. */
  stepIndicator(step: number, total = 5): Locator {
    return this.page.getByText(`Step ${step} of ${total}`).first()
  }

  get nextButton(): Locator {
    return this.page.getByRole('button', { name: 'Next' })
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /Check government grants/i })
  }

  /**
   * `exact: true` matters here: accessible-name matching is substring-based by
   * default, so a loose 'Back' also matches the floating "Share feedback"
   * button. Two real Back controls exist on desktop (the sticky header and the
   * in-card nav) and only the in-card one renders on mobile, so take the last —
   * the control sitting beside Next that a user actually reaches for.
   */
  get backButton(): Locator {
    return this.page.getByRole('button', { name: 'Back', exact: true }).last()
  }

  get homeButton(): Locator {
    return this.page.getByRole('button', { name: 'Home', exact: true })
  }

  /** Inline validation messages (rendered with role="alert"). */
  get errors(): Locator {
    return this.page.getByRole('alert')
  }

  /* ── Step 1: start ──────────────────────────────────────────────────────── */

  get nameInput(): Locator {
    return this.page.getByPlaceholder('e.g. Sarah')
  }

  stateChip(code: string): Locator {
    return this.page.getByRole('radio', { name: code, exact: true })
  }

  async fillStart(name: string, state = 'NSW'): Promise<void> {
    await this.nameInput.fill(name)
    await this.stateChip(state).click()
  }

  /* ── Step 2: property ───────────────────────────────────────────────────── */

  get priceInput(): Locator {
    return this.page.getByPlaceholder('650,000')
  }

  propertyTypeChip(label: string): Locator {
    return this.page.getByRole('radio', { name: label, exact: true })
  }

  get locationTrigger(): Locator {
    return this.page.getByRole('button', { name: /Search your suburb or postcode/ })
  }

  get locationSearch(): Locator {
    return this.page.getByPlaceholder('Type a suburb or 4-digit postcode')
  }

  /** Opens the combobox, searches, and picks the first match. */
  async chooseLocation(query: string): Promise<void> {
    await this.locationTrigger.click()
    await this.locationSearch.fill(query)
    const firstOption = this.page.locator('.fhbq-combo-opt').first()
    await firstOption.waitFor({ state: 'visible' })
    await firstOption.click()
  }

  /** Answers a Yes/No question identified by its visible question text. */
  async answerYesNo(questionText: string, answer: 'Yes' | 'No'): Promise<void> {
    await this.question(questionText).getByRole('radio', { name: answer, exact: true }).click()
  }

  async fillProperty(options: { price?: string; type?: string; location?: string } = {}): Promise<void> {
    await this.propertyTypeChip(options.type ?? 'Established (Existing)').click()
    await this.priceInput.fill(options.price ?? '650000')
    await this.chooseLocation(options.location ?? '2000')
    await this.answerYesNo('Principal Place of Residence', 'Yes')
    await this.answerYesNo('move in within the required government timeframe', 'Yes')
  }

  /* ── Step 3: about ──────────────────────────────────────────────────────── */

  async fillAbout(options: { joint?: boolean } = {}): Promise<void> {
    await this.answerYesNo('18 years of age or older', 'Yes')
    await this.page
      .getByRole('radio', { name: options.joint ? /With a partner/ : /Just me/ })
      .click()
    await this.page.getByRole('radio', { name: 'Australian Citizen', exact: true }).click()
    await this.page.getByRole('radio', { name: 'Individual', exact: true }).click()
  }

  /* ── Step 4: history ────────────────────────────────────────────────────── */

  async fillHistory(): Promise<void> {
    await this.answerYesNo('ever owned residential property', 'No')
    await this.answerYesNo('spouse or domestic partner', 'No')
    await this.answerYesNo('previously received a First Home Owner Grant', 'No')
  }

  /* ── Step 5: income ─────────────────────────────────────────────────────── */

  get incomeInput(): Locator {
    return this.page.getByPlaceholder('85,000')
  }

  get depositInput(): Locator {
    return this.page.getByPlaceholder('40,000')
  }

  async fillIncome(income = '95000', deposit = '60000'): Promise<void> {
    await this.incomeInput.fill(income)
    await this.depositInput.fill(deposit)
  }

  /* ── Composite ──────────────────────────────────────────────────────────── */

  /** Walks steps 1-4, leaving the user on step 5 (income). */
  async completeThroughHistory(name = 'Sarah'): Promise<void> {
    await this.fillStart(name)
    await this.nextButton.click()

    await this.fillProperty()
    await this.nextButton.click()

    await this.fillAbout()
    await this.nextButton.click()

    await this.fillHistory()
    await this.nextButton.click()
  }

  /** Reads the persisted answer model straight from localStorage. */
  answersInStorage(): Promise<Record<string, unknown> | null> {
    return this.page.evaluate(() => {
      const raw = window.localStorage.getItem('firstnest_questionnaire')
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
    })
  }
}
