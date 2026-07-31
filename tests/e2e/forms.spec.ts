import { test, expect } from './fixtures/test'
import { AppShell } from './pages/AppShell'

/**
 * E2E — the two public forms: the floating feedback modal and Contact Us.
 *
 * Both are modal dialogs, so the tests cover the dialog contract as well as the
 * form: focus handling, Escape to close, and submission outcomes including
 * server failure.
 */

test.describe('feedback modal', () => {
  let shell: AppShell

  test.beforeEach(async ({ page }) => {
    shell = new AppShell(page)
    await page.goto('/')
  })

  test('is reachable from anywhere via the floating button', async () => {
    await expect(shell.feedbackButton).toBeVisible()
    await shell.openFeedback()

    await expect(shell.feedbackDialog).toBeVisible()
    await expect(
      shell.feedbackDialog.getByRole('heading', { name: /Share Your Feedback/i }),
    ).toBeVisible()
  })

  test('offers every feedback category', async () => {
    await shell.openFeedback()

    for (const label of ['Bug Report', 'UI Issue', 'Feature Request', 'Other']) {
      await expect(shell.feedbackType(label)).toBeVisible()
    }
  })

  test('allows only one category at a time', async () => {
    await shell.openFeedback()

    await shell.chooseFeedbackType('Bug Report')
    await expect(shell.feedbackType('Bug Report')).toBeChecked()

    await shell.chooseFeedbackType('Feature Request')
    await expect(shell.feedbackType('Feature Request')).toBeChecked()
    await expect(shell.feedbackType('Bug Report')).not.toBeChecked()
  })

  test('requires a category and a message', async ({ page }) => {
    await shell.openFeedback()
    await shell.feedbackSubmit.click()

    await expect(page.getByText(/Please choose a feedback type/i)).toBeVisible()
    await expect(page.getByText(/Please tell us a little/i)).toBeVisible()
    // The dialog stays open so the user can fix the problem.
    await expect(shell.feedbackDialog).toBeVisible()
  })

  test('rejects an invalid email but accepts an empty one', async ({ page }) => {
    await shell.openFeedback()
    await shell.chooseFeedbackType('Bug Report')
    await shell.feedbackMessage.fill('The calculator shows the wrong duty for VIC.')

    await shell.feedbackEmail.fill('not-an-email')
    await shell.feedbackSubmit.click()
    await expect(page.getByText(/valid email address/i)).toBeVisible()

    await shell.feedbackEmail.fill('')
    await shell.feedbackSubmit.click()
    await expect(page.getByText(/Thank you/i)).toBeVisible()
  })

  test('counts characters as the message is typed', async ({ page }) => {
    await shell.openFeedback()
    await shell.feedbackMessage.fill('Twelve chars')

    await expect(page.getByText('12 / 1000')).toBeVisible()
  })

  test('submits successfully and confirms', async ({ page }) => {
    await shell.openFeedback()
    await shell.chooseFeedbackType('Feature Request')
    await shell.feedbackMessage.fill('Please let the calculator remember my last search.')
    await shell.feedbackSubmit.click()

    await expect(page.getByText(/Thank you/i)).toBeVisible()
    await expect(page.getByText(/submitted successfully/i)).toBeVisible()
  })

  test('sends the captured payload to the API', async ({ page }) => {
    const requestBody = page.waitForRequest(
      (request) => request.url().includes('/api/feedback') && request.method() === 'POST',
    )

    await shell.openFeedback()
    await shell.chooseFeedbackType('Bug Report')
    await shell.feedbackMessage.fill('Stamp duty is wrong on the results page.')
    await shell.feedbackSubmit.click()

    const payload = JSON.parse((await requestBody).postData() ?? '{}') as Record<string, unknown>
    expect(payload.feedbackType).toBe('bug')
    expect(payload.message).toContain('Stamp duty is wrong')
    // Context is captured automatically, never typed by the user.
    expect(payload.pageUrl).toContain('/')
    expect(payload.screenResolution).toMatch(/^\d+x\d+$/)
    expect(['light', 'dark']).toContain(payload.theme)
  })

  test('shows an inline error when the server rejects the submission', async ({ page }) => {
    await page.route('**/api/feedback', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'We could not save your feedback.' }),
      }),
    )

    await shell.openFeedback()
    await shell.chooseFeedbackType('Other')
    await shell.feedbackMessage.fill('Testing the failure path end to end.')
    await shell.feedbackSubmit.click()

    await expect(page.getByRole('alert').filter({ hasText: /could not save/i })).toBeVisible()
    // The message is preserved so the user does not retype it.
    await expect(shell.feedbackMessage).toHaveValue(/Testing the failure path/)
  })

  test('recovers when the network fails outright', async ({ page }) => {
    await page.route('**/api/feedback', (route) => route.abort('failed'))

    await shell.openFeedback()
    await shell.chooseFeedbackType('Bug Report')
    await shell.feedbackMessage.fill('Simulating an offline submission.')
    await shell.feedbackSubmit.click()

    await expect(page.getByRole('alert').filter({ hasText: /network error/i })).toBeVisible()
  })

  test('closes on Escape', async () => {
    await shell.openFeedback()
    await expect(shell.feedbackDialog).toBeVisible()

    await shell.feedbackDialog.press('Escape')

    await expect(shell.feedbackDialog).toBeHidden()
  })

  test('closes with the close button', async () => {
    await shell.openFeedback()
    await shell.feedbackClose.click()

    await expect(shell.feedbackDialog).toBeHidden()
  })

  test('moves focus into the dialog when it opens', async ({ page }) => {
    await shell.openFeedback()

    const focusIsInsideDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return !!dialog && !!document.activeElement && dialog.contains(document.activeElement)
    })
    expect(focusIsInsideDialog).toBe(true)
  })

  test('can be completed entirely from the keyboard', async ({ page }) => {
    await shell.feedbackButton.focus()
    await page.keyboard.press('Enter')
    await expect(shell.feedbackDialog).toBeVisible()

    // Radios are a real radio group, so arrow keys move the selection.
    await shell.feedbackType('Bug Report').focus()
    await expect(shell.feedbackType('Bug Report')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(shell.feedbackType('UI Issue')).toBeChecked()

    await shell.feedbackMessage.focus()
    await page.keyboard.type('Reported using only the keyboard.')
    await shell.feedbackSubmit.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByText(/Thank you/i)).toBeVisible()
  })

  test('is available on the questionnaire too', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(shell.feedbackButton).toBeVisible()
  })
})

test.describe('contact modal', () => {
  let shell: AppShell

  test.beforeEach(async ({ page }) => {
    shell = new AppShell(page)
    await page.goto('/')
  })

  test('opens from the floating social widget', async () => {
    await shell.openContact()

    await expect(shell.contactDialog).toBeVisible()
    await expect(shell.contactDialog.getByRole('heading', { name: /Contact Us/i })).toBeVisible()
  })

  test('requires every field', async ({ page }) => {
    await shell.openContact()
    await shell.contactSubmit.click()

    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Reason is required')).toBeVisible()
  })

  /**
   * The contact form uses `<input type="email">` inside a form WITHOUT
   * `noValidate`, so the browser's own constraint validation runs first and
   * blocks submission for a value with no "@" — the application's own
   * "Invalid email address" message is never reached for those.
   *
   * "sarah@example" passes native validation (a dotless domain is legal HTML)
   * but fails the app's regex, which requires a TLD. That is the only way to
   * exercise the application-level check through the real UI.
   */
  test('rejects an email that passes browser validation but fails the app rule', async ({ page }) => {
    await shell.openContact()
    await shell.contactName.fill('Sarah Chen')
    await shell.contactEmail.fill('sarah@example')
    await shell.contactReason.fill('I have a question about the First Home Guarantee.')
    await shell.contactSubmit.click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
  })

  test('lets the browser block an address with no @ before the form submits', async ({ page }) => {
    let submitted = false
    page.on('request', (r) => {
      if (r.url().includes('/api/contact')) submitted = true
    })

    await shell.openContact()
    await shell.contactName.fill('Sarah Chen')
    await shell.contactEmail.fill('sarah-at-example')
    await shell.contactReason.fill('I have a question.')
    await shell.contactSubmit.click()

    // Native validation stops it; nothing reaches the API and the dialog stays open.
    expect(submitted).toBe(false)
    await expect(shell.contactDialog).toBeVisible()
  })

  test('submits a valid enquiry', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => r.url().includes('/api/contact') && r.method() === 'POST',
    )

    await shell.openContact()
    await shell.contactName.fill('Sarah Chen')
    await shell.contactEmail.fill('sarah@example.com')
    await shell.contactReason.fill('I have a question about the First Home Guarantee.')
    await shell.contactSubmit.click()

    const payload = JSON.parse((await request).postData() ?? '{}') as Record<string, unknown>
    expect(payload).toMatchObject({ name: 'Sarah Chen', email: 'sarah@example.com' })
    await expect(shell.contactDialog).toBeHidden()
  })

  test('reports a server failure without closing the dialog', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to send message' }),
      }),
    )

    await shell.openContact()
    await shell.contactName.fill('Sarah Chen')
    await shell.contactEmail.fill('sarah@example.com')
    await shell.contactReason.fill('Testing the failure path.')
    await shell.contactSubmit.click()

    await expect(page.getByText(/Unable to send your message/i)).toBeVisible()
    await expect(shell.contactDialog).toBeVisible()
  })

  test('clears an inline error once the field is corrected', async ({ page }) => {
    await shell.openContact()
    await shell.contactSubmit.click()
    await expect(page.getByText('Name is required')).toBeVisible()

    await shell.contactName.fill('Sarah')

    await expect(page.getByText('Name is required')).toBeHidden()
  })
})
