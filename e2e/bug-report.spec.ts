import { expect, test } from '@playwright/test';
import { BugReportPage } from './pages/bug-report-page';
import { InvoicePage } from './pages/invoice-page';

const VALID_TITLE = 'FX rate fails to refresh';
const VALID_DESCRIPTION = 'After switching payout currency from USD to BRL the rate stayed cached.';

test.describe('Bug report', () => {
  test('1. footer renders the Report a bug button', async ({ page }) => {
    const invoice = new InvoicePage(page);
    await invoice.goto();
    const bug = new BugReportPage(page);
    await expect(bug.triggerButton()).toBeVisible();
  });

  test('2. clicking trigger opens the dialog with an empty form', async ({ page }) => {
    const invoice = new InvoicePage(page);
    await invoice.goto();
    const bug = new BugReportPage(page);
    await bug.openDialog();
    await expect(bug.titleInput()).toHaveValue('');
    await expect(bug.descriptionInput()).toHaveValue('');
    await expect(bug.contextCheckbox()).toBeChecked();
  });

  test('3. submitting an empty form marks both fields invalid', async ({ page }) => {
    const invoice = new InvoicePage(page);
    await invoice.goto();
    const bug = new BugReportPage(page);
    await bug.openDialog();
    await bug.submit();
    await expect(bug.titleInput()).toHaveAttribute('aria-invalid', 'true');
    await expect(bug.descriptionInput()).toHaveAttribute('aria-invalid', 'true');
    const alerts = await page.getByRole('alert').count();
    expect(alerts).toBeGreaterThanOrEqual(2);
  });

  test('4. valid submit calls window.open with the GitHub URL', async ({ page }) => {
    const invoice = new InvoicePage(page);
    const bug = new BugReportPage(page);
    await bug.installWindowOpenSpy();
    await invoice.goto();
    await bug.openDialog();
    await bug.fill(VALID_TITLE, VALID_DESCRIPTION);
    await bug.submit();
    await expect(bug.dialog()).toHaveCount(0, { timeout: 5_000 });
    const calls = await bug.getOpenCalls();
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]!.url);
    expect(url.origin + url.pathname).toContain('/issues/new');
    expect(url.searchParams.get('title')).toBe(`[bug] ${VALID_TITLE}`);
    expect(url.searchParams.get('labels')).toBe('bug');
    const body = url.searchParams.get('body') ?? '';
    expect(body).toContain(VALID_DESCRIPTION);
    expect(body).toMatch(/Versão do app|App version/);
    expect(calls[0]!.target).toBe('_blank');
    expect(calls[0]!.features).toBe('noopener');
  });

  test('5. reopening within the cooldown disables submit and shows countdown', async ({ page }) => {
    const invoice = new InvoicePage(page);
    const bug = new BugReportPage(page);
    await bug.installWindowOpenSpy();
    await invoice.goto();
    await bug.openDialog();
    await bug.fill(VALID_TITLE, VALID_DESCRIPTION);
    await bug.submit();
    await expect(bug.dialog()).toHaveCount(0, { timeout: 5_000 });
    await bug.openDialog();
    await expect(bug.submitButton()).toBeDisabled();
    await expect(bug.cooldownStatus()).toBeVisible();
  });

  test('6. clearing the cooldown re-enables submit', async ({ page }) => {
    const invoice = new InvoicePage(page);
    const bug = new BugReportPage(page);
    await bug.installWindowOpenSpy();
    await invoice.goto();
    await bug.openDialog();
    await bug.fill(VALID_TITLE, VALID_DESCRIPTION);
    await bug.submit();
    await bug.clearCooldown();
    await bug.openDialog();
    await expect(bug.submitButton()).toBeEnabled({ timeout: 5_000 });
    await expect(bug.cooldownStatus()).toHaveCount(0);
  });

  test('7. unchecking technical context omits the context block from the URL', async ({ page }) => {
    const invoice = new InvoicePage(page);
    const bug = new BugReportPage(page);
    await bug.installWindowOpenSpy();
    await invoice.goto();
    await bug.openDialog();
    await bug.contextCheckbox().uncheck();
    await bug.fill(VALID_TITLE, VALID_DESCRIPTION);
    await bug.submit();
    const calls = await bug.getOpenCalls();
    const body = new URL(calls[0]!.url).searchParams.get('body') ?? '';
    expect(body).toContain(VALID_DESCRIPTION);
    expect(body).not.toMatch(/App version|Versão do app/);
    expect(body).not.toMatch(/Locale|Idioma/);
  });

  test('8. title above 120 chars is rejected', async ({ page }) => {
    const invoice = new InvoicePage(page);
    await invoice.goto();
    const bug = new BugReportPage(page);
    await bug.openDialog();
    await bug.fill('A'.repeat(121), VALID_DESCRIPTION);
    await bug.submit();
    await expect(bug.titleInput()).toHaveAttribute('aria-invalid', 'true');
  });

  test('9. description below 20 chars is rejected', async ({ page }) => {
    const invoice = new InvoicePage(page);
    await invoice.goto();
    const bug = new BugReportPage(page);
    await bug.openDialog();
    await bug.fill(VALID_TITLE, 'too short');
    await bug.submit();
    await expect(bug.descriptionInput()).toHaveAttribute('aria-invalid', 'true');
  });

  test('10. pt-BR locale renders translated labels and pt-BR body template', async ({ page }) => {
    const invoice = new InvoicePage(page);
    const bug = new BugReportPage(page);
    await bug.installWindowOpenSpy();
    await invoice.goto();
    await expect(page.getByRole('button', { name: /^Relatar bug$/i })).toBeVisible();
    await bug.openDialog();
    await expect(bug.dialog()).toContainText(/Relatar bug/);
    await bug.fill(VALID_TITLE, VALID_DESCRIPTION);
    await bug.submit();
    const calls = await bug.getOpenCalls();
    const body = new URL(calls[0]!.url).searchParams.get('body') ?? '';
    expect(body).toContain('**Descrição**');
    expect(body).toContain('**Contexto técnico**');
    expect(body).toContain('Versão do app');
  });
});
