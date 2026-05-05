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
      contractCurrency: 'EUR',
      payoutCurrency: 'EUR',
    },
    servicePeriod: {
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
    },
    lineItems: [
      {
        id: 'item-1',
        kind: 'hourly_service',
        description: 'Software engineering services',
        quantity: '56',
        rate: '33',
      },
    ],
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
      contractCurrency: 'EUR',
      payoutCurrency: 'EUR',
    },
    servicePeriod: {
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
    },
    lineItems: [
      {
        id: 'item-1',
        kind: 'hourly_service',
        description: 'Software engineering services',
        quantity: '56',
        rate: '33',
      },
    ],
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

  it('requires fxReference when contract and payout currencies differ for service items', () => {
    const input = validInvoiceDraft({
      contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
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
      contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
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
      lineItems: [
        { id: 'a', kind: 'hourly_service', description: 'x', quantity: '56', rate: '0' },
      ],
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects empty lineItems', () => {
    const input = validInvoiceDraft({ lineItems: [] });
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

  it('rejects servicePeriod where periodEnd is before periodStart', () => {
    const input = validInvoiceDraft({
      servicePeriod: { periodStart: '2026-04-30', periodEnd: '2026-04-01' },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('normalises currency code casing', () => {
    const input = validInvoiceDraft({
      contract: { contractCurrency: 'eur', payoutCurrency: 'eur' },
    });
    const result = invoiceDraftSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contract.contractCurrency).toBe('EUR');
    }
  });

  describe('reimbursement line items', () => {
    it('accepts a same-currency reimbursement without FX', () => {
      const input = validInvoiceDraft({
        contract: { contractCurrency: 'EUR', payoutCurrency: 'EUR' },
        lineItems: [
          {
            id: 'a',
            kind: 'hourly_service',
            description: 'Engineering',
            quantity: '40',
            rate: '50',
          },
          {
            id: 'b',
            kind: 'reimbursement',
            description: 'Travel',
            originalAmount: '100',
            originalCurrency: 'EUR',
          },
        ],
      });
      const result = invoiceDraftSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('requires FX when reimbursement currency differs from payout', () => {
      const input = validInvoiceDraft({
        contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
        fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.08' },
        lineItems: [
          {
            id: 'a',
            kind: 'hourly_service',
            description: 'Engineering',
            quantity: '40',
            rate: '50',
          },
          {
            id: 'b',
            kind: 'reimbursement',
            description: 'AI tooling',
            originalAmount: '1710.68',
            originalCurrency: 'BRL',
          },
        ],
      });
      const result = invoiceDraftSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths.some((p) => p.startsWith('lineItems.1.fx'))).toBe(true);
      }
    });

    it('rejects FX when reimbursement currency equals payout', () => {
      const input = validInvoiceDraft({
        contract: { contractCurrency: 'EUR', payoutCurrency: 'EUR' },
        lineItems: [
          {
            id: 'a',
            kind: 'reimbursement',
            description: 'Travel',
            originalAmount: '100',
            originalCurrency: 'EUR',
            fx: {
              rate: '1.0',
              direction: 'payout_per_original',
              referenceDate: '2026-04-15',
            },
          },
        ],
      });
      const result = invoiceDraftSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('accepts a reimbursement with PTAX-style original_per_payout FX', () => {
      const input = validInvoiceDraft({
        contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
        fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.08' },
        lineItems: [
          {
            id: 'a',
            kind: 'hourly_service',
            description: 'Engineering',
            quantity: '40',
            rate: '50',
          },
          {
            id: 'b',
            kind: 'reimbursement',
            description: 'AI tooling',
            originalAmount: '1710.68',
            originalCurrency: 'BRL',
            fx: {
              rate: '4.9880',
              direction: 'original_per_payout',
              referenceDate: '2026-04-30',
              source: 'USD/BRL PTAX purchase',
            },
            note: 'Approved by client',
          },
        ],
      });
      const result = invoiceDraftSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('allows reimbursement-only invoices when payout currency differs from contract currency', () => {
      const input = validInvoiceDraft({
        contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
        lineItems: [
          {
            id: 'a',
            kind: 'reimbursement',
            description: 'Travel',
            originalAmount: '100',
            originalCurrency: 'USD',
          },
        ],
      });
      const result = invoiceDraftSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
