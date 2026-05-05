import { divide, multiply, negate, sum, toFixed } from './amounts';
import type {
  BankDetails,
  CanonicalAmounts,
  CanonicalBankDetails,
  CanonicalFixedServiceItem,
  CanonicalFxReference,
  CanonicalHourlyServiceItem,
  CanonicalInvoice,
  CanonicalLineItem,
  CanonicalOriginalInvoice,
  CanonicalParty,
  CanonicalReimbursementFx,
  CanonicalReimbursementItem,
  CurrencyCode,
  DocumentType,
  FxReference,
  InvoiceDraft,
  LineItem,
  Money,
  OriginalInvoiceRef,
  Party,
  ReimbursementFx,
} from './types';

export type CanonicalOptions = {
  bankDetails?: BankDetails | null;
};

function optionalTrim(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function money(amount: string, currency: CurrencyCode): Money {
  return { amount, currency };
}

function signed(documentType: DocumentType, amount: string): string {
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

function normalizeReimbursementFx(fx: ReimbursementFx): CanonicalReimbursementFx {
  return {
    direction: fx.direction,
    notes: optionalTrim(fx.notes),
    rate: toFixed(fx.rate, 6),
    referenceDate: fx.referenceDate,
    source: optionalTrim(fx.source),
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

function reimbursementPayoutEquivalent(
  originalAmount: string,
  fx: ReimbursementFx | undefined,
): string {
  if (!fx) return toFixed(originalAmount, 2);
  return fx.direction === 'payout_per_original'
    ? multiply(originalAmount, fx.rate, 2)
    : divide(originalAmount, fx.rate, 2);
}

function buildCanonicalLineItem(
  item: LineItem,
  documentType: DocumentType,
  contractCurrency: CurrencyCode,
  payoutCurrency: CurrencyCode,
): CanonicalLineItem {
  if (item.kind === 'hourly_service') {
    const lineTotalRaw = multiply(item.quantity, item.rate, 2);
    const result: CanonicalHourlyServiceItem = {
      description: item.description.trim(),
      kind: 'hourly_service',
      lineTotal: money(signed(documentType, lineTotalRaw), contractCurrency),
      quantity: toFixed(item.quantity, 2),
      rate: money(toFixed(item.rate, 2), contractCurrency),
    };
    return result;
  }

  if (item.kind === 'fixed_service') {
    const lineTotalRaw = toFixed(item.amount, 2);
    const result: CanonicalFixedServiceItem = {
      description: item.description.trim(),
      kind: 'fixed_service',
      lineTotal: money(signed(documentType, lineTotalRaw), contractCurrency),
    };
    return result;
  }

  const payoutEquivalentRaw = reimbursementPayoutEquivalent(item.originalAmount, item.fx);
  const result: CanonicalReimbursementItem = {
    description: item.description.trim(),
    fx: item.fx ? normalizeReimbursementFx(item.fx) : null,
    kind: 'reimbursement',
    note: optionalTrim(item.note),
    originalAmount: money(toFixed(item.originalAmount, 2), item.originalCurrency),
    payoutEquivalent: money(signed(documentType, payoutEquivalentRaw), payoutCurrency),
  };
  return result;
}

function computeAmounts(
  lineItems: CanonicalLineItem[],
  contractCurrency: CurrencyCode,
  payoutCurrency: CurrencyCode,
  fxReference: FxReference | undefined,
): CanonicalAmounts {
  const serviceTotals = lineItems
    .filter(
      (item): item is CanonicalHourlyServiceItem | CanonicalFixedServiceItem =>
        item.kind === 'hourly_service' || item.kind === 'fixed_service',
    )
    .map((item) => item.lineTotal.amount);

  const reimbursementTotals = lineItems
    .filter((item): item is CanonicalReimbursementItem => item.kind === 'reimbursement')
    .map((item) => item.payoutEquivalent.amount);

  const servicesContractualAmount = sum(serviceTotals, 2);
  const servicesContractual = money(servicesContractualAmount, contractCurrency);

  let servicesPayout: Money | null = null;
  if (contractCurrency === payoutCurrency) {
    servicesPayout = money(servicesContractualAmount, payoutCurrency);
  } else if (fxReference) {
    const converted = multiply(servicesContractualAmount, fxReference.rate, 2);
    servicesPayout = money(converted, payoutCurrency);
  }

  const reimbursementsTotalAmount =
    reimbursementTotals.length === 0 ? null : sum(reimbursementTotals, 2);
  const reimbursementsPayout =
    reimbursementsTotalAmount === null ? null : money(reimbursementsTotalAmount, payoutCurrency);

  const grandComponents: string[] = [];
  if (servicesPayout) grandComponents.push(servicesPayout.amount);
  else grandComponents.push(servicesContractualAmount);
  if (reimbursementsPayout) grandComponents.push(reimbursementsPayout.amount);

  const grandCurrency = servicesPayout ? payoutCurrency : contractCurrency;
  const grandTotal = money(sum(grandComponents, 2), grandCurrency);

  return {
    grandTotal,
    reimbursementsPayout,
    servicesContractual,
    servicesPayout,
  };
}

export function toCanonicalInvoice(
  draft: InvoiceDraft,
  options: CanonicalOptions = {},
): CanonicalInvoice {
  const { contractCurrency, payoutCurrency } = draft.contract;

  const lineItems = draft.lineItems.map((item) =>
    buildCanonicalLineItem(item, draft.documentType, contractCurrency, payoutCurrency),
  );

  const amounts = computeAmounts(lineItems, contractCurrency, payoutCurrency, draft.fxReference);

  const canonical: CanonicalInvoice = {
    amounts,
    bankDetails: normalizeBankDetails(options.bankDetails ?? null),
    contract: {
      contractCurrency,
      payoutCurrency,
      payoutMethod: optionalTrim(draft.contract.payoutMethod),
    },
    documentType: draft.documentType,
    dueDate: draft.dueDate ?? null,
    fxReference: draft.fxReference ? normalizeFxReference(draft.fxReference) : null,
    invoiceNumber: draft.invoiceNumber.trim(),
    issueDate: draft.issueDate,
    issuer: normalizeParty(draft.issuer),
    lineItems,
    locale: draft.locale,
    notes: optionalTrim(draft.notes),
    originalInvoice:
      draft.documentType === 'cancellation'
        ? normalizeOriginalInvoice(draft.originalInvoice)
        : null,
    payer: normalizeParty(draft.payer),
    serviceDeliveryDate: draft.servicePeriod.periodEnd,
    servicePeriod: {
      periodEnd: draft.servicePeriod.periodEnd,
      periodStart: draft.servicePeriod.periodStart,
    },
  };

  return deepFreeze(canonical);
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.values(value as Record<string, unknown>).forEach((v) => deepFreeze(v));
  return Object.freeze(value);
}
