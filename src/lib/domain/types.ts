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
  contractCurrency: CurrencyCode;
  payoutCurrency: CurrencyCode;
  payoutMethod?: string;
};

export type ServicePeriod = {
  periodStart: string;
  periodEnd: string;
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

export type LineItemId = string;

// Service line items are denominated in the invoice's contractCurrency.
// Their conversion to payoutCurrency uses the invoice-level FX reference (when present).
export type HourlyServiceItem = {
  id: LineItemId;
  kind: 'hourly_service';
  description: string;
  quantity: string;
  rate: string;
};

export type FixedServiceItem = {
  id: LineItemId;
  kind: 'fixed_service';
  description: string;
  amount: string;
};

// Reimbursement items carry their own original currency and per-item FX.
// `direction = 'original_per_payout'` means rate = "1 payoutCurrency = rate × originalCurrency"
// (PTAX style for BRL reimbursements settled in USD: rate 4.9880 means 1 USD = 4.9880 BRL).
// `direction = 'payout_per_original'` means rate = "1 originalCurrency = rate × payoutCurrency"
// (ECB style: rate 1.08 means 1 EUR = 1.08 USD).
export type ReimbursementFxDirection = 'original_per_payout' | 'payout_per_original';

export type ReimbursementFx = {
  rate: string;
  direction: ReimbursementFxDirection;
  referenceDate: string;
  source?: string;
  notes?: string;
};

export type ReimbursementItem = {
  id: LineItemId;
  kind: 'reimbursement';
  description: string;
  originalAmount: string;
  originalCurrency: CurrencyCode;
  fx?: ReimbursementFx;
  note?: string;
};

export type LineItem = HourlyServiceItem | FixedServiceItem | ReimbursementItem;

export type InvoiceDraftBase = {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  locale: Locale;
  issuer: Party;
  payer: Party;
  contract: ContractTerms;
  servicePeriod: ServicePeriod;
  lineItems: LineItem[];
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
  contractCurrency: CurrencyCode;
  payoutCurrency: CurrencyCode;
  payoutMethod: string | null;
};

export type CanonicalServicePeriod = {
  periodStart: string;
  periodEnd: string;
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

export type CanonicalHourlyServiceItem = {
  kind: 'hourly_service';
  description: string;
  quantity: string;
  rate: Money;
  lineTotal: Money;
};

export type CanonicalFixedServiceItem = {
  kind: 'fixed_service';
  description: string;
  lineTotal: Money;
};

export type CanonicalReimbursementFx = {
  rate: string;
  direction: ReimbursementFxDirection;
  referenceDate: string;
  source: string | null;
  notes: string | null;
};

export type CanonicalReimbursementItem = {
  kind: 'reimbursement';
  description: string;
  originalAmount: Money;
  fx: CanonicalReimbursementFx | null;
  payoutEquivalent: Money;
  note: string | null;
};

export type CanonicalLineItem =
  | CanonicalHourlyServiceItem
  | CanonicalFixedServiceItem
  | CanonicalReimbursementItem;

export type CanonicalAmounts = {
  servicesContractual: Money;
  servicesPayout: Money | null;
  reimbursementsPayout: Money | null;
  grandTotal: Money;
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
  lineItems: CanonicalLineItem[];
  locale: Locale;
  notes: string | null;
  originalInvoice: CanonicalOriginalInvoice | null;
  payer: CanonicalParty;
  serviceDeliveryDate: string;
  servicePeriod: CanonicalServicePeriod;
};

export type PdfDocumentModel = CanonicalInvoice;
