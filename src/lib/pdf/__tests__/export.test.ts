import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { toCanonicalInvoice } from '@/lib/domain/canonical';
import type { InvoiceDraft } from '@/lib/domain/types';
import { pdfFilename, renderInvoiceBuffer } from '../export';

const baseDraft: InvoiceDraft = {
  documentType: 'invoice',
  invoiceNumber: 'INV-2026-001',
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
      description: 'Software engineering services - April 2026',
      quantity: '56',
      rate: '33',
    },
  ],
};

function sha(buf: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(buf)).digest('hex');
}

describe('pdfFilename', () => {
  it('uses documentType, invoice number, and issue date', () => {
    const canonical = toCanonicalInvoice(baseDraft);
    expect(pdfFilename(canonical)).toBe('invoice-INV-2026-001-2026-04-16.pdf');
  });

  it('carries cancellation prefix', () => {
    const canonical = toCanonicalInvoice({
      ...baseDraft,
      documentType: 'cancellation',
      invoiceNumber: 'CN-2026-001',
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-01',
        contractualAmount: '1848.00',
        currency: 'EUR',
      },
    });
    expect(pdfFilename(canonical)).toBe('cancellation-CN-2026-001-2026-04-16.pdf');
  });
});

describe('renderInvoiceBuffer', () => {
  it('produces a non-empty PDF buffer starting with the PDF header', async () => {
    const canonical = toCanonicalInvoice(baseDraft);
    const buffer = await renderInvoiceBuffer(canonical);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    const header = Buffer.from(buffer.slice(0, 5)).toString('utf8');
    expect(header).toBe('%PDF-');
  });

  it('produces stable content length across renders of the same payload', async () => {
    const canonical = toCanonicalInvoice(baseDraft);
    const a = await renderInvoiceBuffer(canonical);
    const b = await renderInvoiceBuffer(canonical);
    expect(a.byteLength).toBe(b.byteLength);
  });

  it('produces different content for different document types', async () => {
    const invoice = toCanonicalInvoice(baseDraft);
    const cancellation = toCanonicalInvoice({
      ...baseDraft,
      documentType: 'cancellation',
      invoiceNumber: 'CN-2026-001',
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-01',
        contractualAmount: '1848.00',
        currency: 'EUR',
      },
    });
    const invoicePdf = await renderInvoiceBuffer(invoice);
    const cancellationPdf = await renderInvoiceBuffer(cancellation);
    expect(sha(invoicePdf)).not.toBe(sha(cancellationPdf));
  });

  it('renders the cancellation variant without throwing', async () => {
    const canonical = toCanonicalInvoice({
      ...baseDraft,
      documentType: 'cancellation',
      invoiceNumber: 'CN-2026-001',
      originalInvoice: {
        invoiceNumber: 'INV-2026-001',
        issueDate: '2026-04-01',
        contractualAmount: '1848.00',
        currency: 'EUR',
      },
    });
    const buffer = await renderInvoiceBuffer(canonical);
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('renders the FX variant without throwing', async () => {
    const canonical = toCanonicalInvoice({
      ...baseDraft,
      contract: { ...baseDraft.contract, payoutCurrency: 'USD' },
      fxReference: {
        providerLabel: 'ECB',
        referenceDate: '2026-04-15',
        rate: '1.08',
      },
    });
    const buffer = await renderInvoiceBuffer(canonical);
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('renders an invoice with a reimbursement line item', async () => {
    const canonical = toCanonicalInvoice({
      ...baseDraft,
      contract: { contractCurrency: 'EUR', payoutCurrency: 'USD' },
      fxReference: { providerLabel: 'ECB', referenceDate: '2026-04-15', rate: '1.05' },
      lineItems: [
        ...baseDraft.lineItems,
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
    });
    const buffer = await renderInvoiceBuffer(canonical);
    expect(buffer.byteLength).toBeGreaterThan(1000);
    const baseline = await renderInvoiceBuffer(toCanonicalInvoice(baseDraft));
    expect(sha(buffer)).not.toBe(sha(baseline));
  });
});
