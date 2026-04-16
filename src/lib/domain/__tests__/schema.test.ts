import { describe, expect, it } from 'vitest';
import { invoiceDraftSchema } from '../schema';
import type { InvoiceDraftInput } from '../schema';

function validInvoiceDraft(overrides: Record<string, unknown> = {}): InvoiceDraftInput {
  return {
    documentType: 'invoice',
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-04-16',
    dueDate: '2026-05-16',
    locale: 'pt-BR',
    issuer: { legalName: 'Acme Studio' },
    payer: { legalName: 'Globex GmbH' },
    contract: {
      serviceDescription: 'Software engineering services',
      hourlyRate: '33',
      contractCurrency: 'EUR',
      payoutCurrency: 'EUR',
    },
    timesheet: {
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      totalHours: '56',
    },
    ...overrides,
  } as InvoiceDraftInput;
}

function validCancellationDraft(overrides: Record<string, unknown> = {}): InvoiceDraftInput {
  return {
    documentType: 'cancellation',
    invoiceNumber: 'CN-2026-001',
    issueDate: '2026-04-16',
    locale: 'pt-BR',
    issuer: { legalName: 'Acme Studio' },
    payer: { legalName: 'Globex GmbH' },
    contract: {
      serviceDescription: 'Software engineering services',
      hourlyRate: '33',
      contractCurrency: 'EUR',
      payoutCurrency: 'EUR',
    },
    timesheet: {
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      totalHours: '56',
    },
    originalInvoice: {
      invoiceNumber: 'INV-2026-001',
      issueDate: '2026-04-01',
      contractualAmount: '1848.00',
      currency: 'EUR',
    },
    ...overrides,
  } as InvoiceDraftInput;
}

describe('invoiceDraftSchema', () => {
  it('accepts a valid invoice draft', () => {
    const result = invoiceDraftSchema.safeParse(validInvoiceDraft());
    expect(result.success).toBe(true);
  });

  it('accepts a valid cancellation draft', () => {
    const result = invoiceDraftSchema.safeParse(validCancellationDraft());
    expect(result.success).toBe(true);
  });

  it('requires fxReference when contract and payout currencies differ', () => {
    const input = validInvoiceDraft({
      contract: {
        serviceDescription: 'Software engineering services',
        hourlyRate: '33',
        contractCurrency: 'EUR',
        payoutCurrency: 'USD',
      },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('fxReference');
    }
  });

  it('accepts fxReference when currencies differ', () => {
    const input = validInvoiceDraft({
      contract: {
        serviceDescription: 'Software engineering services',
        hourlyRate: '33',
        contractCurrency: 'EUR',
        payoutCurrency: 'USD',
      },
      fxReference: {
        providerLabel: 'ECB',
        referenceDate: '2026-04-15',
        rate: '1.08',
      },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects cancellation with INV prefix', () => {
    const input = validCancellationDraft({ invoiceNumber: 'INV-2026-001' });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('CN-'))).toBe(true);
    }
  });

  it('rejects invoice with CN prefix', () => {
    const input = validInvoiceDraft({ invoiceNumber: 'CN-2026-001' });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects non-positive hourly rate', () => {
    const input = validInvoiceDraft({
      contract: {
        serviceDescription: 'x',
        hourlyRate: '0',
        contractCurrency: 'EUR',
        payoutCurrency: 'EUR',
      },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects due date before issue date', () => {
    const input = validInvoiceDraft({ dueDate: '2026-01-01' });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('dueDate');
    }
  });

  it('rejects cancellation whose original invoice is issued after the cancellation date', () => {
    const input = validCancellationDraft({
      issueDate: '2026-04-01',
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-30',
        contractualAmount: '1848.00',
        currency: 'EUR',
      },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('originalInvoice.issueDate');
    }
  });

  it('rejects timesheet where periodEnd is before periodStart', () => {
    const input = validInvoiceDraft({
      timesheet: {
        periodStart: '2026-04-30',
        periodEnd: '2026-04-01',
        totalHours: '56',
      },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('normalises currency code casing', () => {
    const input = validInvoiceDraft({
      contract: {
        serviceDescription: 'Software engineering services',
        hourlyRate: '33',
        contractCurrency: 'eur',
        payoutCurrency: 'eur',
      },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contract.contractCurrency).toBe('EUR');
    }
  });
});
