import { describe, expect, it } from 'vitest';
import { toCanonicalInvoice } from '../canonical';
import type { CanonicalReimbursementItem, InvoiceDraft } from '../types';

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
      description: '  Software engineering  ',
      quantity: '56',
      rate: '33',
    },
  ],
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
    expect(Object.isFrozen(canonical.lineItems)).toBe(true);
  });

  it('computes services contractual amount with 2dp rounding', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.amounts.servicesContractual).toEqual({ amount: '1848.00', currency: 'EUR' });
    expect(canonical.amounts.servicesPayout).toEqual({ amount: '1848.00', currency: 'EUR' });
    expect(canonical.amounts.reimbursementsPayout).toBeNull();
    expect(canonical.amounts.grandTotal).toEqual({ amount: '1848.00', currency: 'EUR' });
  });

  it('trims party strings and preserves nulls for empty optionals', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.issuer.legalName).toBe('Acme Studio');
    expect(canonical.issuer.taxId).toBe('12345');
    expect(canonical.issuer.billingEmail).toBe('billing@example.com');
    expect(canonical.lineItems[0]?.description).toBe('Software engineering');
    expect(canonical.notes).toBe('Delivered on schedule.');
  });

  it('derives serviceDeliveryDate from servicePeriod.periodEnd', () => {
    const canonical = toCanonicalInvoice(baseInvoice);
    expect(canonical.serviceDeliveryDate).toBe('2026-04-30');
  });

  it('computes services payout amount from invoice fx when currencies differ', () => {
    const draft: InvoiceDraft = {
      ...baseInvoice,
      contract: { ...baseInvoice.contract, payoutCurrency: 'USD' },
      fxReference: {
        providerLabel: 'ECB',
        referenceDate: '2026-04-15',
        rate: '1.08',
      },
    };
    const canonical = toCanonicalInvoice(draft);
    expect(canonical.amounts.servicesContractual).toEqual({ amount: '1848.00', currency: 'EUR' });
    expect(canonical.amounts.servicesPayout).toEqual({ amount: '1995.84', currency: 'USD' });
    expect(canonical.amounts.grandTotal).toEqual({ amount: '1995.84', currency: 'USD' });
    expect(canonical.fxReference?.rate).toBe('1.080000');
  });

  it('negates per-line totals for cancellation invoices', () => {
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
    const hourly = canonical.lineItems[0];
    if (hourly?.kind !== 'hourly_service') throw new Error('expected hourly');
    expect(hourly.lineTotal).toEqual({ amount: '-1848.00', currency: 'EUR' });
    expect(canonical.amounts.servicesContractual).toEqual({ amount: '-1848.00', currency: 'EUR' });
    expect(canonical.amounts.grandTotal).toEqual({ amount: '-1848.00', currency: 'EUR' });
    expect(canonical.originalInvoice).not.toBeNull();
    expect(canonical.originalInvoice?.invoiceNumber).toBe('INV-2026-001');
  });

  it('negates payout amount for cancellation with fx reference', () => {
    const cancellation: InvoiceDraft = {
      ...baseInvoice,
      documentType: 'cancellation',
      invoiceNumber: 'CN-2026-001',
      contract: { ...baseInvoice.contract, payoutCurrency: 'USD' },
      fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.08' },
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-01',
        contractualAmount: '1848.00',
        payoutAmount: '1995.84',
        currency: 'EUR',
      },
    };
    const canonical = toCanonicalInvoice(cancellation);
    expect(canonical.amounts.servicesContractual).toEqual({ amount: '-1848.00', currency: 'EUR' });
    expect(canonical.amounts.servicesPayout).toEqual({ amount: '-1995.84', currency: 'USD' });
    expect(canonical.amounts.grandTotal).toEqual({ amount: '-1995.84', currency: 'USD' });
  });

  it('sets optionals to null when absent', () => {
    const minimal: InvoiceDraft = {
      ...baseInvoice,
      dueDate: undefined,
      notes: undefined,
      issuer: { legalName: 'Acme Studio' },
      contract: { ...baseInvoice.contract, payoutMethod: undefined },
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
      'lineItems',
      'locale',
      'notes',
      'originalInvoice',
      'payer',
      'serviceDeliveryDate',
      'servicePeriod',
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

  describe('reimbursement line items', () => {
    it('uses originalAmount as the payout equivalent when currencies match', () => {
      const draft: InvoiceDraft = {
        ...baseInvoice,
        contract: { contractCurrency: 'EUR', payoutCurrency: 'EUR' },
        lineItems: [
          ...baseInvoice.lineItems,
          {
            id: 'r-1',
            kind: 'reimbursement',
            description: 'Travel',
            originalAmount: '120.50',
            originalCurrency: 'EUR',
          },
        ],
      };
      const canonical = toCanonicalInvoice(draft);
      const reimbursement = canonical.lineItems[1] as CanonicalReimbursementItem;
      expect(reimbursement.payoutEquivalent).toEqual({ amount: '120.50', currency: 'EUR' });
      expect(canonical.amounts.reimbursementsPayout).toEqual({ amount: '120.50', currency: 'EUR' });
      expect(canonical.amounts.grandTotal).toEqual({ amount: '1968.50', currency: 'EUR' });
    });

    it('divides by rate for original_per_payout direction (PTAX style)', () => {
      const draft: InvoiceDraft = {
        ...baseInvoice,
        contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
        fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.05' },
        lineItems: [
          {
            id: 's-1',
            kind: 'hourly_service',
            description: 'Software development services',
            quantity: '176',
            rate: '33',
          },
          {
            id: 'r-1',
            kind: 'reimbursement',
            description: 'Claude / AI tooling reimbursement',
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
      };
      const canonical = toCanonicalInvoice(draft);
      const reimbursement = canonical.lineItems[1] as CanonicalReimbursementItem;
      expect(reimbursement.payoutEquivalent).toEqual({ amount: '342.96', currency: 'USD' });
      expect(canonical.amounts.servicesContractual).toEqual({
        amount: '5808.00',
        currency: 'EUR',
      });
      expect(canonical.amounts.servicesPayout).toEqual({ amount: '6098.40', currency: 'USD' });
      expect(canonical.amounts.reimbursementsPayout).toEqual({
        amount: '342.96',
        currency: 'USD',
      });
      expect(canonical.amounts.grandTotal).toEqual({ amount: '6441.36', currency: 'USD' });
    });

    it('multiplies by rate for payout_per_original direction (ECB style)', () => {
      const draft: InvoiceDraft = {
        ...baseInvoice,
        contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
        fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.08' },
        lineItems: [
          ...baseInvoice.lineItems,
          {
            id: 'r-1',
            kind: 'reimbursement',
            description: 'Travel',
            originalAmount: '100',
            originalCurrency: 'EUR',
            fx: {
              rate: '1.08',
              direction: 'payout_per_original',
              referenceDate: '2026-04-15',
              source: 'ECB',
            },
          },
        ],
      };
      const canonical = toCanonicalInvoice(draft);
      const reimbursement = canonical.lineItems[1] as CanonicalReimbursementItem;
      expect(reimbursement.payoutEquivalent).toEqual({ amount: '108.00', currency: 'USD' });
    });

    it('negates reimbursement equivalent for cancellation', () => {
      const draft: InvoiceDraft = {
        ...baseInvoice,
        documentType: 'cancellation',
        invoiceNumber: 'CN-2026-001',
        contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
        fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.05' },
        lineItems: [
          {
            id: 's-1',
            kind: 'hourly_service',
            description: 'Engineering',
            quantity: '40',
            rate: '50',
          },
          {
            id: 'r-1',
            kind: 'reimbursement',
            description: 'Travel',
            originalAmount: '100',
            originalCurrency: 'USD',
          },
        ],
        originalInvoice: {
          invoiceNumber: 'INV-2026-001',
          issueDate: '2026-04-01',
          contractualAmount: '2000.00',
          currency: 'EUR',
        },
      };
      const canonical = toCanonicalInvoice(draft);
      const reimbursement = canonical.lineItems[1] as CanonicalReimbursementItem;
      expect(reimbursement.payoutEquivalent).toEqual({ amount: '-100.00', currency: 'USD' });
      expect(canonical.amounts.reimbursementsPayout).toEqual({
        amount: '-100.00',
        currency: 'USD',
      });
    });
  });
});
