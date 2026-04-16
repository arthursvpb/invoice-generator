import { calculateContractualAmount, calculatePayoutAmount, negate, toFixed } from './amounts';
import type {
  BankDetails,
  CanonicalBankDetails,
  CanonicalFxReference,
  CanonicalInvoice,
  CanonicalOriginalInvoice,
  CanonicalParty,
  DocumentType,
  FxReference,
  InvoiceDraft,
  Money,
  OriginalInvoiceRef,
  Party,
} from './types';

export type CanonicalOptions = {
  bankDetails?: BankDetails | null;
};

function optionalTrim(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function money(amount: string, currency: string): Money {
  return { amount, currency };
}

function signedAmount(documentType: DocumentType, amount: string): string {
  return documentType === 'cancellation' ? negate(amount, 2) : toFixed(amount, 2);
}

function normalizeParty(party: Party): CanonicalParty {
  return {
    address: optionalTrim(party.address),
    billingEmail: optionalTrim(party.billingEmail),
    country: optionalTrim(party.country),
    legalName: party.legalName.trim(),
    taxId: optionalTrim(party.taxId),
  };
}

function normalizeFxReference(fx: FxReference): CanonicalFxReference {
  return {
    notes: optionalTrim(fx.notes),
    providerLabel: fx.providerLabel.trim(),
    rate: toFixed(fx.rate, 6),
    referenceDate: fx.referenceDate,
    sourceUrl: optionalTrim(fx.sourceUrl),
  };
}

function normalizeOriginalInvoice(ref: OriginalInvoiceRef): CanonicalOriginalInvoice {
  return {
    contractualAmount: money(toFixed(ref.contractualAmount, 2), ref.currency),
    invoiceNumber: ref.invoiceNumber.trim(),
    issueDate: ref.issueDate,
    payoutAmount: ref.payoutAmount ? money(toFixed(ref.payoutAmount, 2), ref.currency) : null,
  };
}

function normalizeBankDetails(
  details: BankDetails | null | undefined,
): CanonicalBankDetails | null {
  if (!details) return null;
  const result: CanonicalBankDetails = {
    accountHolder: optionalTrim(details.accountHolder),
    accountNumber: optionalTrim(details.accountNumber),
    accountType: optionalTrim(details.accountType),
    bankAddress: optionalTrim(details.bankAddress),
    bankName: optionalTrim(details.bankName),
    payoutMethod: optionalTrim(details.payoutMethod),
    routingNumber: optionalTrim(details.routingNumber),
  };
  const hasAny = Object.values(result).some((v) => v !== null);
  return hasAny ? result : null;
}

export function toCanonicalInvoice(
  draft: InvoiceDraft,
  options: CanonicalOptions = {},
): CanonicalInvoice {
  const contractualRaw = calculateContractualAmount(
    draft.timesheet.totalHours,
    draft.contract.hourlyRate,
  );

  const contractual = money(
    signedAmount(draft.documentType, contractualRaw),
    draft.contract.contractCurrency,
  );

  let payout: Money | null = null;
  if (draft.fxReference) {
    const payoutRaw = calculatePayoutAmount(contractualRaw, draft.fxReference.rate);
    payout = money(signedAmount(draft.documentType, payoutRaw), draft.contract.payoutCurrency);
  }

  const canonical: CanonicalInvoice = {
    amounts: {
      contractual,
      payout,
    },
    bankDetails: normalizeBankDetails(options.bankDetails ?? null),
    contract: {
      contractCurrency: draft.contract.contractCurrency,
      hourlyRate: money(toFixed(draft.contract.hourlyRate, 2), draft.contract.contractCurrency),
      payoutCurrency: draft.contract.payoutCurrency,
      payoutMethod: optionalTrim(draft.contract.payoutMethod),
      serviceDescription: draft.contract.serviceDescription.trim(),
    },
    documentType: draft.documentType,
    dueDate: draft.dueDate ?? null,
    fxReference: draft.fxReference ? normalizeFxReference(draft.fxReference) : null,
    invoiceNumber: draft.invoiceNumber.trim(),
    issueDate: draft.issueDate,
    issuer: normalizeParty(draft.issuer),
    locale: draft.locale,
    notes: optionalTrim(draft.notes),
    originalInvoice:
      draft.documentType === 'cancellation'
        ? normalizeOriginalInvoice(draft.originalInvoice)
        : null,
    payer: normalizeParty(draft.payer),
    serviceDeliveryDate: draft.timesheet.periodEnd,
    timesheet: {
      periodEnd: draft.timesheet.periodEnd,
      periodStart: draft.timesheet.periodStart,
      totalHours: toFixed(draft.timesheet.totalHours, 2),
    },
  };

  return deepFreeze(canonical);
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.values(value as Record<string, unknown>).forEach((v) => deepFreeze(v));
  return Object.freeze(value);
}
