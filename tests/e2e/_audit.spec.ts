import { test } from './fixtures/test'
import { analyzeA11y } from './fixtures/test'
import { QuestionnairePage } from './pages/QuestionnairePage'
import { AppShell } from './pages/AppShell'

/** TEMPORARY inventory run — deleted once the baseline is recorded. */
test('audit', async ({ page }) => {
  const report: Record<string, Record<string, number>> = {}

  const record = async (label: string) => {
    const r = await analyzeA11y(page)
    report[label] = {}
    for (const v of r.violations) report[label][`${v.id}(${v.impact})`] = v.nodes.length
  }

  await page.goto('/')
  await record('home-light')

  const shell = new AppShell(page)
  await shell.toggleTheme()
  await record('home-dark')

  const q = new QuestionnairePage(page)
  await q.goto()
  await record('questionnaire-dark-step1')

  await page.goto('/')
  await shell.toggleTheme()
  await q.goto()
  await record('questionnaire-light-step1')

  await q.fillStart('Sarah')
  await q.nextButton.click()
  await record('questionnaire-step2')

  await page.goto('/')
  await shell.openFeedback()
  await record('feedback-modal')

  await page.goto('/')
  await shell.openContact()
  await record('contact-modal')

  // Remaining states.
  await q.goto()
  await q.nextButton.click()
  await q.errors.first().waitFor()
  await record('questionnaire-error-state')

  await q.goto()
  await q.fillStart('Sarah')
  await q.nextButton.click()
  await q.answerYesNo('Principal Place of Residence', 'Yes')
  await record('questionnaire-step2-ppr-open')

  await q.goto()
  await q.completeThroughHistory('Sarah')
  await q.fillIncome()
  await q.submitButton.click()
  await page.waitForURL(/\/results\/grants/)
  await record('results-page')

  await page.goto('/')
  await shell.openFeedback()
  await shell.feedbackSubmit.click()
  await page.getByText(/Please choose a feedback type/i).waitFor()
  await record('feedback-modal-error')

  console.log('AXE_INVENTORY_START')
  console.log(JSON.stringify(report, null, 2))
  console.log('AXE_INVENTORY_END')
})
