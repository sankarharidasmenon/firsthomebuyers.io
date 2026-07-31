import { test, expect } from './fixtures/test'
import { QuestionnairePage } from './pages/QuestionnairePage'

/**
 * E2E — the 5-step questionnaire: the application's central journey.
 *
 * Covers step navigation, required-field validation, conditional branching,
 * answer persistence across reloads, and the handover to the results page.
 */

test.describe('questionnaire flow', () => {
  let q: QuestionnairePage

  test.beforeEach(async ({ page }) => {
    q = new QuestionnairePage(page)
    await q.goto()
  })

  test('starts on step 1 of 5', async () => {
    await expect(q.stepIndicator(1)).toBeVisible()
    await expect(q.heading).toBeVisible()
    await expect(q.nameInput).toBeVisible()
  })

  test('advances through every step to the final submit', async ({ page }) => {
    await q.fillStart('Sarah')
    await q.nextButton.click()
    await expect(q.stepIndicator(2)).toBeVisible()

    await q.fillProperty()
    await q.nextButton.click()
    await expect(q.stepIndicator(3)).toBeVisible()

    await q.fillAbout()
    await q.nextButton.click()
    await expect(q.stepIndicator(4)).toBeVisible()

    await q.fillHistory()
    await q.nextButton.click()
    await expect(q.stepIndicator(5)).toBeVisible()

    // Final step swaps the Next button for the submit action.
    await expect(q.submitButton).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeHidden()
  })

  test('reaches the results page on submit', async ({ page }) => {
    await q.completeThroughHistory()
    await q.fillIncome()
    await q.submitButton.click()

    await expect(page).toHaveURL(/\/results\/grants/)
  })

  test('goes back a step without losing answers', async () => {
    await q.fillStart('Priya')
    await q.nextButton.click()
    await expect(q.stepIndicator(2)).toBeVisible()

    await q.backButton.click()

    await expect(q.stepIndicator(1)).toBeVisible()
    await expect(q.nameInput).toHaveValue('Priya')
    await expect(q.stateChip('NSW')).toHaveAttribute('aria-checked', 'true')
  })

  test('leaves for the home page from the first step', async ({ page }) => {
    await q.homeButton.click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('required field validation', () => {
  let q: QuestionnairePage

  test.beforeEach(async ({ page }) => {
    q = new QuestionnairePage(page)
    await q.goto()
  })

  test('blocks step 1 when nothing is entered', async () => {
    await q.nextButton.click()

    await expect(q.errors.first()).toBeVisible()
    // Still on step 1 — validation prevented the advance.
    await expect(q.stepIndicator(1)).toBeVisible()
  })

  test('names both missing fields on step 1', async () => {
    await q.nextButton.click()

    await expect(q.errors.filter({ hasText: /Enter your name/i })).toBeVisible()
    await expect(q.errors.filter({ hasText: /Choose/i })).toBeVisible()
  })

  test('blocks step 1 when only the name is given', async () => {
    await q.nameInput.fill('Sarah')
    await q.nextButton.click()

    await expect(q.stepIndicator(1)).toBeVisible()
    await expect(q.errors.filter({ hasText: /Choose/i })).toBeVisible()
  })

  test('clears an error as soon as the field is corrected', async () => {
    await q.nextButton.click()
    await expect(q.errors.filter({ hasText: /Enter your name/i })).toBeVisible()

    await q.nameInput.fill('Sarah')

    await expect(q.errors.filter({ hasText: /Enter your name/i })).toHaveCount(0)
  })

  test('blocks step 2 until the property questions are answered', async () => {
    await q.fillStart('Sarah')
    await q.nextButton.click()
    await expect(q.stepIndicator(2)).toBeVisible()

    await q.nextButton.click()

    await expect(q.stepIndicator(2)).toBeVisible()
    await expect(q.errors.first()).toBeVisible()
  })

  test('blocks the final step until income and deposit are given', async () => {
    await q.completeThroughHistory()
    await expect(q.stepIndicator(5)).toBeVisible()

    await q.submitButton.click()

    // Still on the questionnaire, not the results page.
    await expect(q.stepIndicator(5)).toBeVisible()
    await expect(q.errors.first()).toBeVisible()
  })

  test('rejects a non-numeric price by keeping the field empty', async () => {
    await q.fillStart('Sarah')
    await q.nextButton.click()

    await q.priceInput.fill('abc')

    // The currency control strips non-digits rather than showing bad input.
    await expect(q.priceInput).toHaveValue('')
  })
})

test.describe('conditional branching', () => {
  let q: QuestionnairePage

  test.beforeEach(async ({ page }) => {
    q = new QuestionnairePage(page)
    await q.goto()
    await q.fillStart('Sarah')
    await q.nextButton.click()
  })

  test('asks about moving in only when the home is a principal residence', async () => {
    const moveIn = q.question('move in within the required government timeframe')
    await expect(moveIn.getByRole('radio', { name: 'Yes' })).toBeHidden()

    await q.answerYesNo('Principal Place of Residence', 'Yes')

    await expect(moveIn.getByRole('radio', { name: 'Yes' })).toBeVisible()
  })

  test('warns when the property will not be a principal residence', async ({ page }) => {
    await q.answerYesNo('Principal Place of Residence', 'No')

    await expect(page.getByRole('status').filter({ hasText: /may not be eligible/i })).toBeVisible()
  })

  test('asks the NSW new-home question only for a new NSW property', async ({ page }) => {
    const nswQuestion = page.getByText('never been previously occupied')
    await expect(nswQuestion).toBeHidden()

    await q.propertyTypeChip('New').click()

    await expect(nswQuestion).toBeVisible()
  })

  test('collects co-buyer details only for a joint application', async ({ page }) => {
    await q.fillProperty()
    await q.nextButton.click()
    await expect(q.stepIndicator(3)).toBeVisible()

    /**
     * Assert on the collapsed container, not on the text inside it.
     *
     * <Cond> keeps its children MOUNTED and collapses with
     * grid-template-rows: 0fr + opacity: 0 + aria-hidden, so the reveal can
     * animate. Playwright measures an element's own box and ignores clipping
     * by an ancestor's overflow, and it does not count opacity: 0 as hidden —
     * so `getByText('Co-buyer details')` reports VISIBLE while collapsed even
     * though the block is correctly hidden from sight and from assistive tech.
     * `toBeHidden()` therefore fails against a correctly-behaving app.
     *
     * aria-hidden is the real contract here: it is what a screen reader obeys,
     * and it is what this test is actually about.
     */
    const coBuyerBlock = page.locator('.fhbq-cond', { hasText: 'Co-buyer details' })
    await expect(coBuyerBlock).toHaveAttribute('aria-hidden', 'true')

    await page.getByRole('radio', { name: /With a partner/ }).click()

    await expect(coBuyerBlock).toHaveAttribute('aria-hidden', 'false')
  })
})

test.describe('answer persistence', () => {
  test('restores answers after a page reload', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()

    await q.fillStart('Marcus', 'VIC')
    await page.reload()

    await expect(q.nameInput).toHaveValue('Marcus')
    await expect(q.stateChip('VIC')).toHaveAttribute('aria-checked', 'true')
  })

  test('writes answers to local storage as they are entered', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()

    await q.fillStart('Aisha', 'QLD')

    await expect
      .poll(async () => (await q.answersInStorage())?.name)
      .toBe('Aisha')
    expect((await q.answersInStorage())?.state).toBe('QLD')
  })

  test('keeps earlier answers when returning from a later step', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()

    await q.fillStart('Sarah')
    await q.nextButton.click()
    await q.fillProperty({ price: '725000' })

    await q.backButton.click()
    await expect(q.stepIndicator(1)).toBeVisible()
    await q.nextButton.click()

    await expect(q.stepIndicator(2)).toBeVisible()
    await expect(q.priceInput).toHaveValue('725,000')
  })
})

test.describe('keyboard navigation', () => {
  test('completes step 1 without a mouse', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()

    await q.nameInput.focus()
    await page.keyboard.type('Keyboard User')
    await expect(q.nameInput).toHaveValue('Keyboard User')

    // Chips are real buttons, so Enter activates the focused option.
    await q.stateChip('NSW').focus()
    await expect(q.stateChip('NSW')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(q.stateChip('NSW')).toHaveAttribute('aria-checked', 'true')

    await q.nextButton.focus()
    await page.keyboard.press('Enter')

    await expect(q.stepIndicator(2)).toBeVisible()
  })

  test('moves focus forward through the first step with Tab', async ({ page }) => {
    const q = new QuestionnairePage(page)
    await q.goto()

    await q.nameInput.focus()
    await page.keyboard.press('Tab')

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '')
    expect(focusedTag).not.toBe('BODY')
  })
})
