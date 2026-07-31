import type { Locator, Page } from '@playwright/test'

/**
 * Page object for chrome that appears on every page: the navbar, the theme
 * toggle, the floating feedback widget and the floating social widget (which
 * is how the Contact Us modal is reached).
 *
 * All selectors here are role- or label-based — this part of the app exposes
 * proper accessible names, so no CSS is needed.
 */
export class AppShell {
  constructor(private readonly page: Page) {}

  /* ── Navigation ─────────────────────────────────────────────────────────── */

  get homeLink(): Locator {
    return this.page.getByRole('link', { name: 'FirstNest home' })
  }

  get mobileMenuButton(): Locator {
    return this.page.getByRole('button', { name: 'Toggle mobile menu' })
  }

  /* ── Theme ──────────────────────────────────────────────────────────────── */

  get themeToggle(): Locator {
    return this.page.getByRole('button', { name: 'Toggle theme' })
  }

  /** 'dark' | 'light', read from the class next-themes puts on <html>. */
  currentTheme(): Promise<string> {
    return this.page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click()
  }

  /* ── Feedback widget ────────────────────────────────────────────────────── */

  get feedbackButton(): Locator {
    return this.page.getByRole('button', { name: 'Share feedback' })
  }

  get feedbackDialog(): Locator {
    return this.page.getByRole('dialog')
  }

  get feedbackTypeGroup(): Locator {
    return this.page.getByRole('radiogroup', { name: 'Feedback type' })
  }

  /**
   * The radio input itself — use for assertions (`toBeChecked`, `toBeFocused`)
   * and for keyboard interaction, both of which work on a visually-hidden input.
   */
  feedbackType(label: string): Locator {
    return this.page.getByRole('radio', { name: new RegExp(label, 'i') })
  }

  /**
   * The clickable card. The radio input is `sr-only` — the standard accessible
   * pattern of a visually-hidden input inside its label — so it is clipped to
   * 1px and cannot receive a pointer event. A real user clicks the label, and
   * so does this. (`<label>` is an HTML element, not a styling hook, so this
   * stays robust against CSS changes.)
   */
  feedbackTypeCard(label: string): Locator {
    return this.feedbackDialog.locator('label').filter({ hasText: new RegExp(label, 'i') })
  }

  async chooseFeedbackType(label: string): Promise<void> {
    await this.feedbackTypeCard(label).click()
  }

  get feedbackMessage(): Locator {
    return this.page.getByPlaceholder('Describe your feedback in detail...')
  }

  get feedbackEmail(): Locator {
    return this.page.getByPlaceholder('you@example.com')
  }

  get feedbackSubmit(): Locator {
    return this.page.getByRole('button', { name: /Send Feedback/i })
  }

  get feedbackClose(): Locator {
    return this.page.getByRole('button', { name: 'Close feedback' })
  }

  async openFeedback(): Promise<void> {
    await this.feedbackButton.click()
    await this.feedbackDialog.waitFor({ state: 'visible' })
  }

  /* ── Contact modal (reached through the floating social widget) ─────────── */

  get socialLauncher(): Locator {
    return this.page.getByRole('button', { name: 'Open social media links' })
  }

  get emailUsButton(): Locator {
    return this.page.getByRole('button', { name: 'Email us' })
  }

  get contactDialog(): Locator {
    return this.page.getByRole('dialog')
  }

  get contactName(): Locator {
    return this.page.getByPlaceholder('Enter your full name')
  }

  get contactEmail(): Locator {
    return this.page.getByPlaceholder('Enter your email address')
  }

  get contactReason(): Locator {
    return this.page.getByPlaceholder('Tell us how we can help you...')
  }

  get contactSubmit(): Locator {
    return this.page.getByRole('button', { name: 'Send Message' })
  }

  async openContact(): Promise<void> {
    await this.socialLauncher.click()
    await this.emailUsButton.click()
    await this.contactDialog.waitFor({ state: 'visible' })
  }
}
