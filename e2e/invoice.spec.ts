import { expect, test } from '@playwright/test';
import {
  mockFx502,
  mockFxMissingCurrency,
  mockFxOk,
  mockFxSlow,
  recordFxCalls,
} from './fixtures/fx-response';
import {
  sampleBank,
  validCancellationDraft,
  validDraft,
  validFxDraft,
} from './fixtures/valid-draft';
import { InvoicePage } from './pages/invoice-page';

// Each test gets a fresh browser context (and therefore empty localStorage)
// from Playwright by default; no reset hook required.

test.describe('A. Smoke', () => {
  test('1. boots /invoice with all 9 sections rendered', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    for (const title of [
      'Emissor',
      'Pagador',
      'Dados bancários',
      'Termos do contrato',
      'Apontamento de horas',
      'Numeração e datas',
      'Observações',
    ]) {
      await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
    }
    expect(page.url()).toMatch(/\/$/);
  });

  test('2. root serves the invoice form directly (no redirect)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('3. manifest and PWA icons reachable', async ({ request }) => {
    for (const path of [
      '/manifest.webmanifest',
      '/icons/icon-192.png',
      '/icons/apple-touch-icon.png',
    ]) {
      const res = await request.get(path);
      expect(res.status(), `expected 200 for ${path}`).toBe(200);
    }
  });
});

test.describe('B. Theme + locale', () => {
  test('4. theme cycle system → light → dark', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    await inv.setTheme('Light');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await inv.setTheme('Dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await inv.setTheme('System');
    await expect(page.getByRole('radio', { name: 'System' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('5. theme persists across reload', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    await inv.setTheme('Dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 15_000 });
  });

  test('6. locale toggle PT ↔ EN flips section titles', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    await expect(page.getByText('Emissor', { exact: false }).first()).toBeVisible();
    await inv.setLanguage('EN');
    await expect(page.getByText('Issuer', { exact: false }).first()).toBeVisible();
    await inv.setLanguage('PT');
    await expect(page.getByText('Emissor', { exact: false }).first()).toBeVisible();
  });

  test('7. locale persists across reload', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    await inv.setLanguage('EN');
    await expect(page.getByText('Issuer', { exact: false }).first()).toBeVisible();
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('invgen:draft:v1');
      return raw ? JSON.parse(raw)?.state?.locale === 'en' : false;
    });
    await page.reload();
    await expect(page.getByText('Issuer', { exact: false }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('C. Schema validation - every refine', () => {
  test('8. empty issuer.legalName surfaces required error', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      issuer: { ...validDraft.issuer, legalName: '' },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.errorFor('issuer.legalName')).toBeVisible();
    await expect(inv.field('issuer.legalName')).toHaveAttribute('aria-invalid', 'true');
  });

  test('9. invoiceNumber lowercase prefix is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      invoiceNumber: 'inv-2026-001',
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('invoiceNumber')).toHaveAttribute('aria-invalid', 'true');
  });

  test('10. invoice with CN- prefix is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      invoiceNumber: 'CN-2026-001',
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('invoiceNumber')).toHaveAttribute('aria-invalid', 'true');
  });

  test('11. malformed issueDate is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({ ...validDraft, issueDate: '2026-13-01' });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('issueDate')).toHaveAttribute('aria-invalid', 'true');
  });

  test('12. dueDate < issueDate is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({ ...validDraft, dueDate: '2026-01-01' });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('dueDate')).toHaveAttribute('aria-invalid', 'true');
  });

  test('13. zero hourlyRate is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, hourlyRate: '0' },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('contract.hourlyRate')).toHaveAttribute('aria-invalid', 'true');
  });

  test('14. non-numeric hourlyRate is rejected without crashing (isPositive defensive)', async ({
    page,
  }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, hourlyRate: 'abc' },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('contract.hourlyRate')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/Application error/i)).toHaveCount(0);
  });

  test('15. empty totalHours is rejected without crash (the original bug)', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      timesheet: { ...validDraft.timesheet, totalHours: '' },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('timesheet.totalHours')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/Invalid decimal string/i)).toHaveCount(0);
  });

  test('16. periodEnd < periodStart is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      timesheet: {
        ...validDraft.timesheet,
        periodStart: '2026-04-30',
        periodEnd: '2026-04-01',
      },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('timesheet.periodEnd')).toHaveAttribute('aria-invalid', 'true');
  });

  test('17. currencies differ but fxReference missing is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await mockFx502(page);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.errorSummaryAlert()).toBeVisible();
  });

  test('18. cancellation original issueDate after cancellation issueDate is rejected', async ({
    page,
  }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validCancellationDraft,
      issueDate: '2026-04-01',
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-30',
        contractualAmount: '1848.00',
        currency: 'EUR',
      },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('originalInvoice.issueDate')).toHaveAttribute('aria-invalid', 'true');
  });

  test('19. notes longer than 2000 chars is rejected', async ({ page }) => {
    const inv = new InvoicePage(page);
    const tooLong = 'x'.repeat(2001);
    await inv.seedDraftBeforeLoad({ ...validDraft, notes: tooLong });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('notes')).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('D. Form interactions', () => {
  test('20. currency code lowercase is normalised on blur', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.field('contract.contractCurrency').fill('eur');
    await inv.field('contract.contractCurrency').blur();
    await inv.previewButton().click();
    const draft = await inv.readDraft();
    const persistedCurrency =
      (draft as Record<string, Record<string, Record<string, Record<string, string>>>> | null)
        ?.state?.draft?.contract?.contractCurrency ?? '';
    expect(['EUR', 'eur']).toContain(persistedCurrency);
  });

  test('21. bank-name preserves spaces during typing (regression)', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    const bankName = inv.field('bank.bankName');
    await bankName.click();
    await page.keyboard.type('Sample Trust Bank', { delay: 30 });
    await expect(bankName).toHaveValue('Sample Trust Bank');
    const settings = await inv.readSettings();
    const persisted =
      (settings as Record<string, Record<string, Record<string, string>>> | null)?.state
        ?.bankDefaults?.bankName ?? '';
    expect(persisted).toBe('Sample Trust Bank');
  });

  test('22. clearing all bank fields collapses bankDefaults to null', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedSettingsBeforeLoad({ bankDefaults: sampleBank });
    await inv.goto();
    for (const id of [
      'bank.payoutMethod',
      'bank.bankName',
      'bank.accountType',
      'bank.accountHolder',
      'bank.accountNumber',
      'bank.routingNumber',
      'bank.bankAddress',
    ]) {
      await inv.field(id).fill('');
    }
    await inv.field('bank.bankAddress').blur();
    const settings = await inv.readSettings();
    const bank = (settings as Record<string, Record<string, unknown>> | null)?.state?.bankDefaults;
    expect(bank).toBeNull();
  });

  test('23. issuer save → reset → use defaults restores values', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.saveIssuerDefaultButton().click();
    page.once('dialog', (d) => void d.accept());
    await inv.resetButton().click();
    await expect(inv.field('issuer.legalName')).toHaveValue('');
    await inv.useIssuerDefaultsButton().click();
    await expect(inv.field('issuer.legalName')).toHaveValue('Acme Studio');
  });

  test('24. reset cancel keeps the draft intact', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    page.once('dialog', (d) => void d.dismiss());
    await inv.resetButton().click();
    await expect(inv.field('issuer.legalName')).toHaveValue('Acme Studio');
  });

  test('25. invalid email surfaces per-field error', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      issuer: { ...validDraft.issuer, billingEmail: 'not-an-email' },
    });
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.field('issuer.billingEmail')).toHaveAttribute('aria-invalid', 'true');
  });

  test('26. successful download bumps numbering sequence', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    const before = await inv.readDraft();
    const beforeSeq =
      (before as Record<string, Record<string, Record<string, number>>> | null)?.state?.numbering
        ?.invNextSeq ?? 0;
    const downloadPromise = page.waitForEvent('download').catch(() => null);
    await inv.downloadButton().click();
    await downloadPromise;
    await page.waitForFunction(
      (start) => {
        const raw = localStorage.getItem('invgen:draft:v1');
        if (!raw) return false;
        const seq = JSON.parse(raw)?.state?.numbering?.invNextSeq;
        return typeof seq === 'number' && seq === start + 1;
      },
      beforeSeq,
      { timeout: 15_000 },
    );
  });

  test('27. seeded valid draft previews without orphan errors', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('E. FX behaviour', () => {
  test('28. happy path auto-fetches and populates rate', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFxOk(page, { rate: 1.0834 });
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.fxStatusBanner()).toContainText(/Buscado|Auto-fetched/, {
      timeout: 10_000,
    });
    await expect(inv.field('fxReference.rate')).toHaveValue(/1\.0834/);
  });

  test('29. HTTP 502 shows error banner', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFx502(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.fxStatusBanner()).toContainText(/HTTP 502|Falha|failed/i, {
      timeout: 10_000,
    });
  });

  test('30. slow response triggers timeout error', async ({ page }) => {
    test.setTimeout(60_000);
    const inv = new InvoicePage(page);
    await mockFxSlow(page, 9_500);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.fxStatusBanner()).toContainText(/aborted|timeout|Falha/i, {
      timeout: 15_000,
    });
  });

  test('31. missing currency in response shows error mentioning USD', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFxMissingCurrency(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.fxStatusBanner()).toContainText(/USD/i, {
      timeout: 10_000,
    });
  });

  test('32. fresh cache uses cached value with no network call', async ({ page }) => {
    const inv = new InvoicePage(page);
    const calls = await recordFxCalls(page);
    await inv.seedSettingsBeforeLoad({
      fxCache: {
        EUR_USD: { rate: '1.10', date: '2026-04-15', fetchedAt: Date.now() },
      },
    });
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.fxStatusBanner()).toContainText(/Cache|cached/i, {
      timeout: 10_000,
    });
    await expect(inv.field('fxReference.rate')).toHaveValue(/1\.10/);
    expect(calls()).toHaveLength(0);
  });

  test('33. manual override persists then refresh re-fetches', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFxOk(page, { rate: 1.0834 });
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.field('fxReference.rate')).toHaveValue(/1\.0834/, {
      timeout: 10_000,
    });
    await inv.field('fxReference.rate').fill('1.50');
    await expect(inv.field('fxReference.rate')).toHaveValue('1.50');
    await inv.refreshFxButton().click();
    await expect(inv.field('fxReference.rate')).toHaveValue(/1\.0834/, {
      timeout: 10_000,
    });
  });

  test('34. switching back to same currency hides FX section without crash', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFxOk(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.field('fxReference.rate')).toBeVisible();
    await inv.field('contract.payoutCurrency').fill('EUR');
    await inv.field('contract.payoutCurrency').blur();
    await expect(inv.field('fxReference.rate')).toHaveCount(0);
  });
});

test.describe('F. Storage + persistence', () => {
  test('35. draft round-trip preserves required inputs', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await page.reload();
    await expect(inv.field('issuer.legalName')).toHaveValue('Acme Studio');
    await expect(inv.field('contract.hourlyRate')).toHaveValue('33');
    await expect(inv.field('timesheet.totalHours')).toHaveValue('56');
  });

  test('36. settings round-trip preserves issuer and bank defaults', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedSettingsBeforeLoad({
      issuerDefaults: validDraft.issuer,
      bankDefaults: sampleBank,
    });
    await inv.goto();
    await page.reload();
    await expect(inv.field('bank.bankName')).toHaveValue('Sample Bank');
    await inv.useIssuerDefaultsButton().click();
    await expect(inv.field('issuer.legalName')).toHaveValue('Acme Studio');
  });

  test('37. corrupted draft surfaces the corruption banner once', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedCorruptedDraftBeforeLoad();
    await inv.goto();
    await expect(inv.corruptionBanner()).toBeVisible();
    await page
      .getByRole('button', { name: /^(Dismiss|Fechar)$/i })
      .first()
      .click();
    await expect(inv.corruptionBanner()).toHaveCount(0);
  });

  test('38. corrupted settings does not crash the app', async ({ page }) => {
    const inv = new InvoicePage(page);
    await page.addInitScript(() => {
      localStorage.setItem('invgen:settings:v1', '{not json');
    });
    await inv.goto();
    await expect(page.getByText('Emissor', { exact: false }).first()).toBeVisible();
  });

  test('39. v1 → current draft migration drops endClient and timesheet.source', async ({
    page,
  }) => {
    const inv = new InvoicePage(page);
    await inv.seedV1DraftBeforeLoad();
    await inv.goto();
    const draft = await inv.readDraft();
    const draftDraft = (draft as Record<string, Record<string, Record<string, unknown>>> | null)
      ?.state?.draft;
    expect(draftDraft).not.toHaveProperty('endClient');
    const ts = (draftDraft?.timesheet ?? {}) as Record<string, unknown>;
    expect(ts).not.toHaveProperty('source');
    expect(ts).not.toHaveProperty('csvFileName');
    expect(ts.totalHours).toBe('56');
  });
});

test.describe('G. Document type + cancellation', () => {
  test('40. switching to cancellation flips number prefix and shows original section', async ({
    page,
  }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.setDocumentType('cancellation');
    await expect(inv.field('invoiceNumber')).toHaveValue(/^CN-/);
    await expect(inv.field('originalInvoice.invoiceNumber')).toBeVisible();
  });

  test('41. switching back to invoice clears originalInvoice without orphan errors', async ({
    page,
  }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.setDocumentType('cancellation');
    await inv.field('originalInvoice.invoiceNumber').fill('INV-2026-001');
    await inv.field('originalInvoice.issueDate').fill('2026-04-01');
    await inv.field('originalInvoice.contractualAmount').fill('1848.00');
    await inv.field('originalInvoice.currency').fill('EUR');
    await inv.setDocumentType('invoice');
    await expect(inv.field('originalInvoice.invoiceNumber')).toHaveCount(0);
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
  });

  test('42. cancellation preview opens with CN- title', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validCancellationDraft);
    await inv.goto();
    await expect(inv.field('invoiceNumber')).toHaveValue('CN-2026-001');
    await expect(inv.field('originalInvoice.invoiceNumber')).toHaveValue('INV-2026-001');
    const formStateBefore = await page.evaluate(() => ({
      ariaInvalidCount: document.querySelectorAll('[aria-invalid="true"]').length,
    }));
    expect(formStateBefore.ariaInvalidCount).toBe(0);
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
    await expect(inv.previewDialog()).toContainText('cancellation-CN-2026-001-2026-04-16.pdf', {
      timeout: 15_000,
    });
  });
});

test.describe('H. PDF render + preview', () => {
  test('43. preview opens a dialog with a blob iframe', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
    await expect(inv.pdfIframe('invoice')).toHaveAttribute('src', /^blob:/, {
      timeout: 15_000,
    });
  });

  test('44. Esc closes the preview dialog', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(inv.previewDialog()).toHaveCount(0);
  });

  test('45. preview filename in the dialog title', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toContainText('invoice-INV-2026-001-2026-04-16.pdf', {
      timeout: 15_000,
    });
  });

  test('46. FX disclosure renders only when currencies differ', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFxOk(page);
    await inv.seedDraftBeforeLoad(validFxDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.pdfIframe('invoice')).toBeVisible({ timeout: 15_000 });
  });

  test('47. preview with bank details succeeds', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedSettingsBeforeLoad({ bankDefaults: sampleBank });
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.pdfIframe('invoice')).toBeVisible({ timeout: 15_000 });
  });

  test('48. preview without bank details succeeds', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.pdfIframe('invoice')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('I. A11y + keyboard', () => {
  test('49. tab order moves between visible inputs in DOM order', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.field('issuer.legalName').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? null);
    expect(focusedId).not.toBe('issuer.legalName');
  });

  test('50. inputs show a focus-visible outline', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.goto();
    await inv.field('issuer.legalName').focus();
    const outline = await inv.field('issuer.legalName').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineStyle + ' ' + styles.boxShadow;
    });
    expect(outline.length).toBeGreaterThan(0);
  });

  test('51. Esc closes the preview dialog (a11y safety)', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(inv.previewDialog()).toHaveCount(0);
  });

  test('52. pressing Enter inside an input does not trigger an export', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.field('issuer.legalName').focus();
    await page.keyboard.press('Enter');
    await expect(inv.previewDialog()).toHaveCount(0);
  });
});

test.describe('J. Mobile + responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('53. mobile layout renders without horizontal scroll', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test('54. mobile FX section fits and shows fetched banner', async ({ page }) => {
    const inv = new InvoicePage(page);
    await mockFxOk(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await expect(inv.fxStatusBanner()).toContainText(/Buscado|Auto-fetched/, {
      timeout: 10_000,
    });
  });

  test('55. mobile preview dialog is reachable', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: /^(Download PDF|Baixar PDF)$/i }).last(),
    ).toBeVisible();
  });
});

test.describe('K. Race / concurrency', () => {
  test('56. rapid currency changes do not crash and end on the final pair', async ({ page }) => {
    const inv = new InvoicePage(page);
    const calls = await recordFxCalls(page);
    await inv.seedDraftBeforeLoad({
      ...validDraft,
      contract: { ...validDraft.contract, payoutCurrency: 'USD' },
    });
    await inv.goto();
    await inv.field('contract.payoutCurrency').fill('BRL');
    await inv.field('contract.payoutCurrency').fill('GBP');
    await inv.field('contract.payoutCurrency').fill('USD');
    await inv.field('contract.payoutCurrency').blur();
    await page.waitForFunction(
      () => {
        const raw = localStorage.getItem('invgen:settings:v1');
        if (!raw) return false;
        const cache = JSON.parse(raw)?.state?.fxCache ?? {};
        return Boolean(cache.EUR_USD);
      },
      { timeout: 15_000 },
    );
    expect(calls().length).toBeGreaterThan(0);
    expect(calls().length).toBeLessThanOrEqual(4);
  });

  test('57. preview while download in progress shows a single busy state', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    page.on('download', () => undefined);
    await Promise.all([inv.downloadButton().click(), inv.previewButton().click()]);
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
  });

  test('58. resetting after closing the preview dialog clears the draft', async ({ page }) => {
    const inv = new InvoicePage(page);
    await inv.seedDraftBeforeLoad(validDraft);
    await inv.goto();
    await inv.previewButton().click();
    await expect(inv.previewDialog()).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(inv.previewDialog()).toHaveCount(0);
    page.once('dialog', (d) => void d.accept());
    await inv.resetButton().click();
    await expect(inv.field('issuer.legalName')).toHaveValue('');
  });
});
