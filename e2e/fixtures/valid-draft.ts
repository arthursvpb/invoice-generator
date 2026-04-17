export const validDraft = {
  documentType: 'invoice' as const,
  invoiceNumber: 'INV-2026-001',
  issueDate: '2026-04-16',
  dueDate: '2026-05-16',
  locale: 'pt-BR' as const,
  issuer: {
    legalName: 'Acme Studio',
    taxId: '12345',
    country: 'Brazil',
    address: '1 Example Street',
    billingEmail: 'billing@example.com',
  },
  payer: {
    legalName: 'Globex GmbH',
    country: 'Germany',
  },
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
};

export const validFxDraft = {
  ...validDraft,
  contract: {
    ...validDraft.contract,
    payoutCurrency: 'USD',
  },
  fxReference: {
    providerLabel: 'ECB via frankfurter.dev',
    referenceDate: '2026-04-15',
    rate: '1.08',
    sourceUrl: 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD',
  },
};

export const validCancellationDraft = {
  ...validDraft,
  documentType: 'cancellation' as const,
  invoiceNumber: 'CN-2026-001',
  originalInvoice: {
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-04-01',
    contractualAmount: '1848.00',
    currency: 'EUR',
  },
};

export const sampleBank = {
  payoutMethod: 'ACH',
  bankName: 'Sample Bank',
  accountType: 'Checking',
  accountHolder: 'ACME STUDIO LDA',
  accountNumber: '0000000000',
  routingNumber: '0000000',
  bankAddress: '1 Example Street, City, ZIP, Country',
};
