export type Locale = 'pt-BR' | 'en';

export type DocumentType = 'invoice' | 'cancellation';

export type CurrencyCode = string;

export type Party = {
  legalName: string;
  taxId?: string;
  address?: string;
  country?: string;
  billingEmail?: string;
};

export type BankDetails = {
  payoutMethod?: string;
  bankName?: string;
  accountType?: string;
  accountHolder?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankAddress?: string;
};

export type CanonicalBankDetails = {
  payoutMethod: string | null;
  bankName: string | null;
  accountType: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  bankAddress: string | null;
};

export type ContractTerms = {
  serviceDescription: string;
  hourlyRate: string;
  contractCurrency: CurrencyCode;
  payoutCurrency: CurrencyCode;
  payoutMethod?: string;
};

export type TimesheetSummary = {
  periodStart: string;
  periodEnd: string;
  totalHours: string;
};

export type FxReference = {
  providerLabel: string;
  referenceDate: string;
  rate: string;
  sourceUrl?: string;
  notes?: string;
};

export type OriginalInvoiceRef = {
  invoiceNumber: string;
  issueDate: string;
  contractualAmount: string;
  payoutAmount?: string;
  currency: CurrencyCode;
};

export type InvoiceDraftBase = {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  locale: Locale;
  issuer: Party;
  payer: Party;
  contract: ContractTerms;
  timesheet: TimesheetSummary;
  fxReference?: FxReference;
  notes?: string;
};

export type InvoiceDraft =
  | (InvoiceDraftBase & { documentType: 'invoice' })
  | (InvoiceDraftBase & { documentType: 'cancellation'; originalInvoice: OriginalInvoiceRef });

export type Money = {
  amount: string;
  currency: CurrencyCode;
};

export type CanonicalParty = {
  legalName: string;
  taxId: string | null;
  address: string | null;
  country: string | null;
  billingEmail: string | null;
};

export type CanonicalContract = {
  serviceDescription: string;
  hourlyRate: Money;
  contractCurrency: CurrencyCode;
  payoutCurrency: CurrencyCode;
  payoutMethod: string | null;
};

export type CanonicalTimesheet = {
  periodStart: string;
  periodEnd: string;
  totalHours: string;
};

export type CanonicalFxReference = {
  providerLabel: string;
  referenceDate: string;
  rate: string;
  sourceUrl: string | null;
  notes: string | null;
};

export type CanonicalOriginalInvoice = {
  invoiceNumber: string;
  issueDate: string;
  contractualAmount: Money;
  payoutAmount: Money | null;
};

export type CanonicalAmounts = {
  contractual: Money;
  payout: Money | null;
};

export type CanonicalInvoice = {
  amounts: CanonicalAmounts;
  bankDetails: CanonicalBankDetails | null;
  contract: CanonicalContract;
  documentType: DocumentType;
  dueDate: string | null;
  fxReference: CanonicalFxReference | null;
  invoiceNumber: string;
  issueDate: string;
  issuer: CanonicalParty;
  locale: Locale;
  notes: string | null;
  originalInvoice: CanonicalOriginalInvoice | null;
  payer: CanonicalParty;
  serviceDeliveryDate: string;
  timesheet: CanonicalTimesheet;
};

export type PdfDocumentModel = CanonicalInvoice;
