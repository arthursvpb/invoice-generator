import * as React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { InvoicePdf } from './invoice-pdf';
import type { CanonicalInvoice } from '@/lib/domain/types';

export function pdfFilename(canonical: CanonicalInvoice): string {
  const type = canonical.documentType;
  return `${type}-${canonical.invoiceNumber}-${canonical.issueDate}.pdf`;
}

function createDocument(canonical: CanonicalInvoice): React.ReactElement<DocumentProps> {
  return (<InvoicePdf canonical={canonical} />) as React.ReactElement<DocumentProps>;
}

export async function renderInvoiceBlob(canonical: CanonicalInvoice): Promise<Blob> {
  const instance = pdf(createDocument(canonical));
  return instance.toBlob();
}

export async function renderInvoiceBuffer(canonical: CanonicalInvoice): Promise<Uint8Array> {
  const instance = pdf(createDocument(canonical));
  const stream = (await instance.toBuffer()) as AsyncIterable<Buffer | Uint8Array> | Uint8Array;
  if (stream instanceof Uint8Array) return stream;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function downloadInvoicePdf(canonical: CanonicalInvoice): Promise<void> {
  const blob = await renderInvoiceBlob(canonical);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = pdfFilename(canonical);
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export async function previewInvoiceUrl(canonical: CanonicalInvoice): Promise<string> {
  const blob = await renderInvoiceBlob(canonical);
  return URL.createObjectURL(blob);
}
