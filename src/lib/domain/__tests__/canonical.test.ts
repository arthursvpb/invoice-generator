import { describe, expect, it } from 'vitest';
import { toCanonicalInvoice } from '../canonical';
import type { InvoiceDraft } from '../types';

const baseInvoice: InvoiceDraft = {
  documentType: 'invoice',
  invoiceNumber: 'INV-2026-001',
  issueDate: '2026-04-16',
  dueDate: '2026-05-16',
  locale: 'pt-BR',
  issuer: {
    legalName: '  Acme Studio  ',
    taxId: '  12345  ',
    address: '  1 Example Street  ',
    country: 'BR',
    billingEmail: ' billing@example.com ',
  },
  payer: { legalName: 'Globex GmbH' },
  contract: {
    serviceDescription: '  Software engineering  ',
    hourlyRate: '33',
    contractCurrency: 'EUR',
    payoutCurrency: 'EUR',
  },
  timesheet: {
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    totalHours: '56',
  },
  notes: '  Delivered on schedule.  ',
};

describe('toCanonicalInvoice', () => {
  it('produces deep-equal output for the same input', () => {
    const a = toCanonicalInvoice(baseInvoice);
    const b = toCanonicalInvoice(baseInvoice);
    expect(a).toEqual(b);
  });

  it('produces the same serialised JSON for the same input', () => {
    const a = JSON.stringify(toCanonicalInvoice(baseInvoice));
    const b = JSON.stringify(toCanonicalInvoice(baseInvoice));
    expect(a).toBe(b);
  });

  it('freezes the output', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(Object.isFrozen(canonical)).toBe(true);
    expect(Object.isFrozen(canonical.contract)).toBe(true);
    expect(Object.isFrozen(canonical.issuer)).toBe(true);
  });

  it('computes contractual amount with 2dp rounding', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.amounts.contractual).toEqual({ amount: '1848.00', currency: 'EUR' });
    expect(canonical.amounts.payout).toBeNull();
  });

  it('trims party strings and preserves nulls for empty optionals', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.issuer.legalName).toBe('Acme Studio');
    expect(canonical.issuer.taxId).toBe('12345');
    expect(canonical.issuer.billingEmail).toBe('billing@example.com');
    expect(canonical.contract.serviceDescription).toBe('Software engineering');
    expect(canonical.notes).toBe('Delivered on schedule.');
  });

  it('derives serviceDeliveryDate from timesheet.periodEnd', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.serviceDeliveryDate).toBe('2026-04-30');
  });

  it('computes payout amount from fx reference when currencies differ', () => {
    const draft: InvoiceDraft = {
      ...baseInvoice,
      contract: {
        ...baseInvoice.contract,
        payoutCurrency: 'USD',
      },
      fxReference: {
        providerLabel: 'ECB',
        referenceDate: '2026-04-15',
        rate: '1.08',
      },
    };
    const canonical = toCanonicalInvoice(draft);
    expect(canonical.amounts.contractual).toEqual({ amount: '1848.00', currency: 'EUR' });
    expect(canonical.amounts.payout).toEqual({ amount: '1995.84', currency: 'USD' });
    expect(canonical.fxReference?.rate).toBe('1.080000');
  });

  it('negates amounts for cancellation invoices', () => {
    const cancellation: InvoiceDraft = {
      ...baseInvoice,
      documentType: 'cancellation',
      invoiceNumber: 'CN-2026-001',
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-01',
        contractualAmount: '1848.00',
        currency: 'EUR',
      },
    };
    const canonical = toCanonicalInvoice(cancellation);
    expect(canonical.amounts.contractual).toEqual({ amount: '-1848.00', currency: 'EUR' });
    expect(canonical.originalInvoice).not.toBeNull();
    expect(canonical.originalInvoice?.invoiceNumber).toBe('INV-2026-001');
  });

  it('negates payout amount for cancellation with fx reference', () => {
    const cancellation: InvoiceDraft = {
      ...baseInvoice,
      documentType: 'cancellation',
      invoiceNumber: 'CN-2026-001',
      contract: {
        ...baseInvoice.contract,
        payoutCurrency: 'USD',
      },
      fxReference: {
        providerLabel: 'ECB',
        referenceDate: '2026-04-15',
        rate: '1.08',
      },
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-01',
        contractualAmount: '1848.00',
        payoutAmount: '1995.84',
        currency: 'EUR',
      },
    };
    const canonical = toCanonicalInvoice(cancellation);
    expect(canonical.amounts.contractual).toEqual({ amount: '-1848.00', currency: 'EUR' });
    expect(canonical.amounts.payout).toEqual({ amount: '-1995.84', currency: 'USD' });
  });

  it('sets optionals to null when absent', () => {
    const minimal: InvoiceDraft = {
      ...baseInvoice,
      dueDate: undefined,
      notes: undefined,
      issuer: { legalName: 'Acme Studio' },
      contract: {
        ...baseInvoice.contract,
        payoutMethod: undefined,
      },
    };
    const canonical = toCanonicalInvoice(minimal);
    expect(canonical.dueDate).toBeNull();
    expect(canonical.notes).toBeNull();
    expect(canonical.contract.payoutMethod).toBeNull();
    expect(canonical.issuer.taxId).toBeNull();
  });

  it('serialises canonical output with stable key order', () => {
    const expectedTopLevelKeys = [
      'amounts',
      'bankDetails',
      'contract',
      'documentType',
      'dueDate',
      'fxReference',
      'invoiceNumber',
      'issueDate',
      'issuer',
      'locale',
      'notes',
      'originalInvoice',
      'payer',
      'serviceDeliveryDate',
      'timesheet',
    ];
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(Object.keys(canonical)).toEqual(expectedTopLevelKeys);
  });

  it('omits bankDetails when no fields are provided', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.bankDetails).toBeNull();
  });

  it('passes through bankDetails when provided in options', () => {
    const canonical = toCanonicalInvoice(baseInvoice, {
      bankDetails: {
        payoutMethod: ' ACH ',
        bankName: 'Sample Bank',
        accountType: 'Checking',
        accountHolder: 'ACME STUDIO LDA',
        accountNumber: '0000000000',
        routingNumber: '0000000',
        bankAddress: '1 Example Street, City, ZIP, Country',
      },
    });
    expect(canonical.bankDetails).not.toBeNull();
    expect(canonical.bankDetails?.payoutMethod).toBe('ACH');
    expect(canonical.bankDetails?.bankName).toBe('Sample Bank');
    expect(canonical.bankDetails?.accountNumber).toBe('0000000000');
  });

  it('treats fully-empty bankDetails as null', () => {
    const canonical = toCanonicalInvoice(baseInvoice, {
      bankDetails: {
        payoutMethod: '   ',
        bankName: '',
      },
    });
    expect(canonical.bankDetails).toBeNull();
  });
});
