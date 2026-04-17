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
    serviceDescription: 'Software engineering services - April 2026',
    hourlyRate: '33',
    contractCurrency: 'EUR',
    payoutCurrency: 'EUR',
  },
  timesheet: {
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    totalHours: '56',
  },
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
});
