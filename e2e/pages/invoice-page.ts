import { expect, type Locator, type Page } from '@playwright/test';

export type Locale = 'pt-BR' | 'en';
export type ThemeOption = 'Light' | 'System' | 'Dark';
export type LanguageOption = 'PT' | 'EN';
export type DocumentType = 'invoice' | 'cancellation';

export class InvoicePage {
  constructor(public readonly page: Page) {}

  async seedDraftBeforeLoad(
    draft: Record<string, unknown>,
    locale: Locale = 'pt-BR',
  ): Promise<void> {
    await this.page.addInitScript(
      ({ draft, locale }) => {
        try {
          const payload = {
            state: {
              draft,
              documentType: draft.documentType ?? 'invoice',
              numbering: { year: 2026, invNextSeq: 1, cnNextSeq: 1 },
              locale,
              lastEditedAt: new Date().toISOString(),
            },
            version: 3,
          };
          localStorage.setItem('invgen:draft:v1', JSON.stringify(payload));
        } catch {
          // ignore
        }
      },
      { draft, locale },
    );
  }

  async seedSettingsBeforeLoad(settings: {
    issuerDefaults?: unknown;
    bankDefaults?: unknown;
    fxCache?: Record<string, { rate: string; date: string; fetchedAt: number }>;
  }): Promise<void> {
    await this.page.addInitScript((next) => {
      try {
        const payload = {
          state: {
            issuerDefaults: next.issuerDefaults ?? null,
            bankDefaults: next.bankDefaults ?? null,
            fxCache: next.fxCache ?? {},
          },
          version: 4,
        };
        localStorage.setItem('invgen:settings:v1', JSON.stringify(payload));
      } catch {
        // ignore
      }
    }, settings);
  }

  async seedCorruptedDraftBeforeLoad(): Promise<void> {
    await this.page.addInitScript(() => {
      try {
        localStorage.setItem('invgen:draft:v1', '{not valid json');
      } catch {
        // ignore
      }
    });
  }

  async seedV1DraftBeforeLoad(): Promise<void> {
    await this.page.addInitScript(() => {
      const v1 = {
        state: {
          draft: {
            documentType: 'invoice',
            invoiceNumber: 'INV-2025-001',
            issueDate: '2025-04-16',
            locale: 'pt-BR',
            issuer: { legalName: 'Acme Studio' },
            payer: { legalName: 'Globex GmbH' },
            endClient: { legalName: 'Old End Client' },
            contract: {
              serviceDescription: 'Eng',
              hourlyRate: '33',
              contractCurrency: 'EUR',
              payoutCurrency: 'EUR',
            },
            timesheet: {
              periodStart: '2025-04-01',
              periodEnd: '2025-04-30',
              totalHours: '56',
              source: 'csv',
              csvFileName: 'old.csv',
            },
          },
          documentType: 'invoice',
          numbering: { year: 2025, invNextSeq: 5, cnNextSeq: 1 },
          locale: 'pt-BR',
          lastEditedAt: '2025-04-16T00:00:00.000Z',
        },
        version: 1,
      };
      localStorage.setItem('invgen:draft:v1', JSON.stringify(v1));
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(this.page.locator('body[data-hydrated="true"]')).toBeAttached({
      timeout: 15_000,
    });
  }

  async readDraft(): Promise<Record<string, unknown> | null> {
    return this.page.evaluate(() => {
      const raw = localStorage.getItem('invgen:draft:v1');
      return raw ? JSON.parse(raw) : null;
    });
  }

  async readSettings(): Promise<Record<string, unknown> | null> {
    return this.page.evaluate(() => {
      const raw = localStorage.getItem('invgen:settings:v1');
      return raw ? JSON.parse(raw) : null;
    });
  }

  field(id: string): Locator {
    return this.page.locator(`[id="${id}"]`);
  }

  errorFor(name: string): Locator {
    return this.page.locator(`#${name.replace(/\./g, '\\.')}-error`);
  }

  sectionTitle(text: string | RegExp): Locator {
    return this.page.getByText(text, { exact: false });
  }

  // Toggles
  async setLanguage(target: LanguageOption): Promise<void> {
    const ariaLabel = target === 'PT' ? 'Portuguese' : 'English';
    await this.page.getByRole('radio', { name: ariaLabel }).click();
  }

  async setTheme(target: ThemeOption): Promise<void> {
    await this.page.getByRole('radio', { name: target }).click();
  }

  async setDocumentType(target: DocumentType, locale: Locale = 'pt-BR'): Promise<void> {
    const map: Record<Locale, Record<DocumentType, string>> = {
      'pt-BR': { invoice: 'Fatura', cancellation: 'Cancelamento' },
      en: { invoice: 'Invoice', cancellation: 'Cancellation' },
    };
    await this.page.getByRole('radio', { name: map[locale][target] }).click();
  }

  // Buttons
  previewButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Preview|Pré-visualizar)$/i,
    });
  }

  downloadButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Download PDF|Baixar PDF)$/i,
    });
  }

  resetButton(): Locator {
    return this.page.getByRole('button', { name: /^(Reset|Limpar)$/i });
  }

  suggestButton(): Locator {
    return this.page.getByRole('button', { name: /^(Suggest|Sugerir)$/i });
  }

  refreshFxButton(): Locator {
    return this.page.getByRole('button', { name: /^(Refresh|Atualizar)$/i });
  }

  showFxSourceButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Show source|Mostrar fonte)$/i,
    });
  }

  saveIssuerDefaultButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Save as default|Salvar como padrão)$/i,
    });
  }

  useIssuerDefaultsButton(): Locator {
    return this.page.getByRole('button', {
      name: /^(Use my defaults|Usar meus padrões)$/i,
    });
  }

  errorSummaryAlert(): Locator {
    return this.page.getByRole('alert').first();
  }

  previewDialog(): Locator {
    return this.page.getByRole('dialog');
  }

  pdfIframe(filenamePrefix: 'invoice' | 'cancellation'): Locator {
    return this.page.locator(`iframe[title^="${filenamePrefix}-"]`);
  }

  fxStatusBanner(): Locator {
    return this.page
      .locator('div')
      .filter({
        hasText:
          /Auto-fetched|Buscado|Using cached|Cache:|Auto-fetch failed|Falha ao buscar|Fetching|Buscando/,
      })
      .first();
  }

  corruptionBanner(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /could not be read|não pôde ser lido/ });
  }

  exportErrorAlert(): Locator {
    return this.page
      .locator('p[role="alert"]')
      .filter({ hasText: /Could not export|Não foi possível exportar/ });
  }

  async fillIssuerLegalName(value: string): Promise<void> {
    await this.field('issuer.legalName').fill(value);
  }

  async fillPayerLegalName(value: string): Promise<void> {
    await this.field('payer.legalName').fill(value);
  }

  async expectFirstInvalidFocused(id: string): Promise<void> {
    const handle = await this.page.evaluateHandle(() => document.activeElement?.id ?? null);
    const focusedId = await handle.jsonValue();
    expect(focusedId).toBe(id);
  }
}
