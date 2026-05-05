import * as React from 'react';
import { Document, Link, Page, Text, View } from '@react-pdf/renderer';
import { registerPdfFonts } from './fonts';
import { styles } from './styles';
import type { Messages } from '@/lib/i18n/messages';
import { messages as dictionary } from '@/lib/i18n/messages';
import { interpolate } from '@/lib/i18n/use-t';
import type {
  CanonicalBankDetails,
  CanonicalFixedServiceItem,
  CanonicalHourlyServiceItem,
  CanonicalInvoice,
  CanonicalLineItem,
  CanonicalParty,
  CanonicalReimbursementFx,
  CanonicalReimbursementItem,
  Locale,
} from '@/lib/domain/types';
import { formatCurrency, formatDate, formatDateLong, formatNumber } from '@/lib/format';

registerPdfFonts();

const AUTHOR_LINKEDIN = 'https://www.linkedin.com/in/arthursvpb/';
const AUTHOR_NAME = 'Arthur Vasconcellos';
const FOOTER_PREFIX = 'Invoice Generator created by ';

const pdfCopy: Record<
  Locale,
  {
    bannerCancellation: string;
    from: string;
    billTo: string;
    period: string;
    services: string;
    reimbursements: string;
    invoiceNumber: string;
    invoiceDate: string;
    serviceDeliveryDate: string;
    dueDate: string;
    bankDetails: string;
    bankPayoutMethod: string;
    bankName: string;
    bankAccountType: string;
    bankAccountHolder: string;
    bankAccountNumber: string;
    bankRoutingNumber: string;
    bankAddress: string;
    payoutTotal: string;
    grandTotal: string;
    servicesSubtotal: string;
    reimbursementsSubtotal: string;
    hoursReference: string;
    fixedReference: string;
    fxDisclosureServices: string;
    fxDisclosureServicesPostfix: string;
    fxDisclosureReimbursementOriginalPerPayout: string;
    fxDisclosureReimbursementPayoutPerOriginal: string;
    reimbursementOriginalToPayout: string;
    originalRef: string;
    originalNumber: string;
    originalDate: string;
    originalAmount: string;
    originalPayout: string;
    signedOn: string;
    page: string;
    notSet: string;
  }
> = {
  en: {
    bannerCancellation: 'Cancellation invoice · cancels and voids the original below',
    from: 'From',
    billTo: 'Bill to',
    period: 'Period',
    services: 'Services',
    reimbursements: 'Reimbursements',
    invoiceNumber: 'Invoice no.',
    invoiceDate: 'Invoice date',
    serviceDeliveryDate: 'Delivery date',
    dueDate: 'Due date',
    bankDetails: 'Bank details',
    bankPayoutMethod: 'Preferred payout method',
    bankName: 'Bank name',
    bankAccountType: 'Account type',
    bankAccountHolder: 'Account holder',
    bankAccountNumber: 'Account number',
    bankRoutingNumber: 'Routing number',
    bankAddress: 'Bank address',
    payoutTotal: 'Payout total',
    grandTotal: 'Grand total',
    servicesSubtotal: 'Services subtotal',
    reimbursementsSubtotal: 'Reimbursements subtotal',
    hoursReference: '{hours} h × {rate}',
    fixedReference: 'Fixed fee',
    fxDisclosureServices:
      'FX reference: {provider} on {date}, 1 {from} = {rate} {to}',
    fxDisclosureServicesPostfix:
      'Services subtotal {contractual} converted at 1 {from} = {rate} {to}',
    fxDisclosureReimbursementOriginalPerPayout:
      '{source} on {date} · 1 {to} = {rate} {from}',
    fxDisclosureReimbursementPayoutPerOriginal:
      '{source} on {date} · 1 {from} = {rate} {to}',
    reimbursementOriginalToPayout: '{original} → {payout}',
    originalRef: 'Original invoice reference',
    originalNumber: 'Number',
    originalDate: 'Issue date',
    originalAmount: 'Contractual amount',
    originalPayout: 'Payout amount',
    signedOn: 'Issued on {date}',
    page: 'Page {n} of {total}',
    notSet: '—',
  },
  'pt-BR': {
    bannerCancellation: 'Fatura de cancelamento · cancela e anula a fatura original abaixo',
    from: 'De',
    billTo: 'Para',
    period: 'Período',
    services: 'Serviços',
    reimbursements: 'Reembolsos',
    invoiceNumber: 'Nº da fatura',
    invoiceDate: 'Data de emissão',
    serviceDeliveryDate: 'Data de entrega',
    dueDate: 'Data de vencimento',
    bankDetails: 'Dados bancários',
    bankPayoutMethod: 'Forma de pagamento preferida',
    bankName: 'Banco',
    bankAccountType: 'Tipo de conta',
    bankAccountHolder: 'Titular da conta',
    bankAccountNumber: 'Número da conta',
    bankRoutingNumber: 'Agência ou roteamento',
    bankAddress: 'Endereço do banco',
    payoutTotal: 'Total a receber',
    grandTotal: 'Total geral',
    servicesSubtotal: 'Subtotal de serviços',
    reimbursementsSubtotal: 'Subtotal de reembolsos',
    hoursReference: '{hours} h × {rate}',
    fixedReference: 'Valor fixo',
    fxDisclosureServices: 'Câmbio: {provider} em {date}, 1 {from} = {rate} {to}',
    fxDisclosureServicesPostfix:
      'Subtotal de serviços {contractual} convertido a 1 {from} = {rate} {to}',
    fxDisclosureReimbursementOriginalPerPayout:
      '{source} em {date} · 1 {to} = {rate} {from}',
    fxDisclosureReimbursementPayoutPerOriginal:
      '{source} em {date} · 1 {from} = {rate} {to}',
    reimbursementOriginalToPayout: '{original} → {payout}',
    originalRef: 'Referência da fatura original',
    originalNumber: 'Número',
    originalDate: 'Data de emissão',
    originalAmount: 'Valor contratual',
    originalPayout: 'Valor de pagamento',
    signedOn: 'Emitido em {date}',
    page: 'Página {n} de {total}',
    notSet: '—',
  },
};

function PartyBlock({ eyebrow, party }: { eyebrow: string; party: CanonicalParty }) {
  return (
    <View style={styles.partyCol}>
      <Text style={styles.partyEyebrow}>{eyebrow}</Text>
      <Text style={styles.partyName}>{party.legalName}</Text>
      {party.taxId && <Text style={styles.partyLine}>{party.taxId}</Text>}
      {party.address && <Text style={styles.partyLine}>{party.address}</Text>}
      {party.country && <Text style={styles.partyLine}>{party.country}</Text>}
      {party.billingEmail && <Text style={styles.partyLine}>{party.billingEmail}</Text>}
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function BankBlock({ bank, copy }: { bank: CanonicalBankDetails; copy: (typeof pdfCopy)['en'] }) {
  const items: Array<{ label: string; value: string }> = [];
  if (bank.payoutMethod) items.push({ label: copy.bankPayoutMethod, value: bank.payoutMethod });
  if (bank.accountType) items.push({ label: copy.bankAccountType, value: bank.accountType });
  if (bank.bankName) items.push({ label: copy.bankName, value: bank.bankName });
  if (bank.accountHolder) items.push({ label: copy.bankAccountHolder, value: bank.accountHolder });
  if (bank.accountNumber) items.push({ label: copy.bankAccountNumber, value: bank.accountNumber });
  if (bank.routingNumber) items.push({ label: copy.bankRoutingNumber, value: bank.routingNumber });
  if (bank.bankAddress) items.push({ label: copy.bankAddress, value: bank.bankAddress });

  if (items.length === 0) return null;

  return (
    <View style={styles.bankBlock}>
      <Text style={styles.bankTitle}>{copy.bankDetails}</Text>
      <View style={styles.bankGrid}>
        {items.map((item) => (
          <View key={item.label} style={styles.bankItem}>
            <Text style={styles.bankLabel}>{item.label}</Text>
            <Text style={styles.bankValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function isService(
  item: CanonicalLineItem,
): item is CanonicalHourlyServiceItem | CanonicalFixedServiceItem {
  return item.kind === 'hourly_service' || item.kind === 'fixed_service';
}

function ServicesTable({
  items,
  locale,
  copy,
  servicesSubtotal,
  servicesPayout,
  fxLineFooter,
}: {
  items: Array<CanonicalHourlyServiceItem | CanonicalFixedServiceItem>;
  locale: Locale;
  copy: (typeof pdfCopy)['en'];
  servicesSubtotal: { amount: string; currency: string };
  servicesPayout: { amount: string; currency: string } | null;
  fxLineFooter: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.itemsBlock}>
      <Text style={styles.sectionEyebrow}>{copy.services}</Text>
      {items.map((item, index) => (
        <ServiceRow key={`${item.kind}-${index}`} item={item} locale={locale} copy={copy} />
      ))}
      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>{copy.servicesSubtotal}</Text>
        <Text
          style={
            servicesSubtotal.amount.startsWith('-')
              ? [styles.subtotalValue, styles.negativeValue]
              : styles.subtotalValue
          }
        >
          {formatCurrency(servicesSubtotal.amount, servicesSubtotal.currency, locale)}
        </Text>
      </View>
      {servicesPayout && servicesPayout.currency !== servicesSubtotal.currency && (
        <View style={styles.subtotalRowDimmed}>
          <Text style={styles.subtotalLabelDimmed}>{fxLineFooter ?? ''}</Text>
          <Text
            style={
              servicesPayout.amount.startsWith('-')
                ? [styles.subtotalValueDimmed, styles.negativeValue]
                : styles.subtotalValueDimmed
            }
          >
            {formatCurrency(servicesPayout.amount, servicesPayout.currency, locale)}
          </Text>
        </View>
      )}
    </View>
  );
}

function ServiceRow({
  item,
  locale,
  copy,
}: {
  item: CanonicalHourlyServiceItem | CanonicalFixedServiceItem;
  locale: Locale;
  copy: (typeof pdfCopy)['en'];
}) {
  const reference =
    item.kind === 'hourly_service'
      ? interpolate(copy.hoursReference, {
          hours: formatNumber(item.quantity, locale, 2),
          rate: formatCurrency(item.rate.amount, item.rate.currency, locale),
        })
      : copy.fixedReference;

  const lineTotalText = formatCurrency(item.lineTotal.amount, item.lineTotal.currency, locale);
  const isNegative = item.lineTotal.amount.startsWith('-');

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMain}>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemReference}>{reference}</Text>
      </View>
      <Text
        style={isNegative ? [styles.itemAmount, styles.negativeValue] : styles.itemAmount}
      >
        {lineTotalText}
      </Text>
    </View>
  );
}

function reimbursementFxLine(
  fx: CanonicalReimbursementFx,
  originalCurrency: string,
  payoutCurrency: string,
  locale: Locale,
  copy: (typeof pdfCopy)['en'],
): string {
  const date = formatDate(fx.referenceDate, locale);
  const sourceLabel = fx.source ?? '';
  if (fx.direction === 'original_per_payout') {
    return interpolate(copy.fxDisclosureReimbursementOriginalPerPayout, {
      source: sourceLabel || (locale === 'pt-BR' ? 'Câmbio' : 'FX'),
      date,
      from: originalCurrency,
      to: payoutCurrency,
      rate: fx.rate,
    });
  }
  return interpolate(copy.fxDisclosureReimbursementPayoutPerOriginal, {
    source: sourceLabel || (locale === 'pt-BR' ? 'Câmbio' : 'FX'),
    date,
    from: originalCurrency,
    to: payoutCurrency,
    rate: fx.rate,
  });
}

function ReimbursementsTable({
  items,
  locale,
  copy,
  subtotal,
}: {
  items: CanonicalReimbursementItem[];
  locale: Locale;
  copy: (typeof pdfCopy)['en'];
  subtotal: { amount: string; currency: string } | null;
}) {
  if (items.length === 0 || !subtotal) return null;
  return (
    <View style={styles.itemsBlock}>
      <Text style={styles.sectionEyebrow}>{copy.reimbursements}</Text>
      {items.map((item, index) => (
        <ReimbursementRow key={index} item={item} locale={locale} copy={copy} />
      ))}
      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>{copy.reimbursementsSubtotal}</Text>
        <Text
          style={
            subtotal.amount.startsWith('-')
              ? [styles.subtotalValue, styles.negativeValue]
              : styles.subtotalValue
          }
        >
          {formatCurrency(subtotal.amount, subtotal.currency, locale)}
        </Text>
      </View>
    </View>
  );
}

function ReimbursementRow({
  item,
  locale,
  copy,
}: {
  item: CanonicalReimbursementItem;
  locale: Locale;
  copy: (typeof pdfCopy)['en'];
}) {
  const original = formatCurrency(item.originalAmount.amount, item.originalAmount.currency, locale);
  const payout = formatCurrency(item.payoutEquivalent.amount, item.payoutEquivalent.currency, locale);
  const sameCurrency = item.originalAmount.currency === item.payoutEquivalent.currency;
  const referenceText = sameCurrency
    ? original
    : interpolate(copy.reimbursementOriginalToPayout, { original, payout });
  const fxText = item.fx
    ? reimbursementFxLine(
        item.fx,
        item.originalAmount.currency,
        item.payoutEquivalent.currency,
        locale,
        copy,
      )
    : null;
  const isNegative = item.payoutEquivalent.amount.startsWith('-');

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMain}>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemReference}>{referenceText}</Text>
        {item.note && <Text style={styles.itemNote}>{item.note}</Text>}
        {fxText && <Text style={styles.itemFx}>{fxText}</Text>}
      </View>
      <Text
        style={isNegative ? [styles.itemAmount, styles.negativeValue] : styles.itemAmount}
      >
        {payout}
      </Text>
    </View>
  );
}

export function InvoicePdf({ canonical }: { canonical: CanonicalInvoice }) {
  const locale = canonical.locale;
  const copy = pdfCopy[locale];
  const isCancellation = canonical.documentType === 'cancellation';
  const pageEyebrow = dictionary[locale].page[isCancellation ? 'cancellation' : 'invoice'].eyebrow;

  const serviceItems = canonical.lineItems.filter(isService);
  const reimbursementItems = canonical.lineItems.filter(
    (item): item is CanonicalReimbursementItem => item.kind === 'reimbursement',
  );

  const { servicesContractual, servicesPayout, reimbursementsPayout, grandTotal } =
    canonical.amounts;

  const heroFormatted = formatCurrency(grandTotal.amount, grandTotal.currency, locale);
  const isHeroNegative = grandTotal.amount.startsWith('-');

  const fx = canonical.fxReference;
  const servicesFxLine = fx
    ? interpolate(copy.fxDisclosureServices, {
        provider: fx.providerLabel,
        date: formatDate(fx.referenceDate, locale),
        from: canonical.contract.contractCurrency,
        rate: fx.rate,
        to: canonical.contract.payoutCurrency,
      })
    : null;
  const servicesFxFooter =
    fx && servicesPayout
      ? interpolate(copy.fxDisclosureServicesPostfix, {
          contractual: formatCurrency(servicesContractual.amount, servicesContractual.currency, locale),
          from: canonical.contract.contractCurrency,
          rate: fx.rate,
          to: canonical.contract.payoutCurrency,
        })
      : null;

  const issueDateLong = formatDateLong(canonical.issueDate, locale);
  const serviceDeliveryDateLong = formatDateLong(canonical.serviceDeliveryDate, locale);
  const dueDateLong = canonical.dueDate ? formatDateLong(canonical.dueDate, locale) : copy.notSet;

  const metaTitle = `${canonical.documentType} ${canonical.invoiceNumber}`;
  const fixedDate = new Date(`${canonical.issueDate}T00:00:00Z`);

  const subjectParts = serviceItems
    .map((item) => item.description)
    .concat(reimbursementItems.map((item) => item.description));
  const subject = subjectParts.length > 0 ? subjectParts.join(' · ') : metaTitle;

  return (
    <Document
      title={metaTitle}
      author={canonical.issuer.legalName}
      creator="Invoice Generator"
      producer="Invoice Generator"
      subject={subject}
      creationDate={fixedDate}
      modificationDate={fixedDate}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandStamp}>
              <Text style={styles.brandAv}>AV</Text>
              <Text style={styles.brandLabs}> LABS</Text>
            </View>
            <Text style={styles.eyebrow}>{pageEyebrow}</Text>
            <Text style={styles.title}>{canonical.issuer.legalName}</Text>
          </View>
          <View style={styles.metaGrid}>
            <MetaItem label={copy.invoiceNumber} value={canonical.invoiceNumber} />
            <MetaItem label={copy.invoiceDate} value={issueDateLong} />
            <MetaItem label={copy.serviceDeliveryDate} value={serviceDeliveryDateLong} />
            <MetaItem label={copy.dueDate} value={dueDateLong} />
          </View>
        </View>

        {isCancellation && <Text style={styles.banner}>{copy.bannerCancellation}</Text>}

        <View style={styles.parties}>
          <PartyBlock eyebrow={copy.from} party={canonical.issuer} />
          <PartyBlock eyebrow={copy.billTo} party={canonical.payer} />
        </View>

        {canonical.bankDetails && <BankBlock bank={canonical.bankDetails} copy={copy} />}

        <View style={styles.divider} />

        <View style={styles.periodRow}>
          <View style={styles.periodItem}>
            <Text style={styles.sectionEyebrow}>{copy.period}</Text>
            <Text style={styles.periodValue}>
              {formatDate(canonical.servicePeriod.periodStart, locale)} —{' '}
              {formatDate(canonical.servicePeriod.periodEnd, locale)}
            </Text>
          </View>
        </View>

        <ServicesTable
          items={serviceItems}
          locale={locale}
          copy={copy}
          servicesSubtotal={servicesContractual}
          servicesPayout={servicesPayout}
          fxLineFooter={servicesFxFooter}
        />

        <ReimbursementsTable
          items={reimbursementItems}
          locale={locale}
          copy={copy}
          subtotal={reimbursementsPayout}
        />

        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>{copy.payoutTotal}</Text>
          <Text
            style={
              isHeroNegative ? [styles.heroAmount, styles.heroAmountNegative] : styles.heroAmount
            }
          >
            {heroFormatted}
          </Text>
          {servicesFxLine && <Text style={styles.disclosure}>{servicesFxLine}</Text>}
        </View>

        {canonical.originalInvoice && (
          <View style={styles.originalRef}>
            <Text style={styles.originalRefTitle}>{copy.originalRef}</Text>
            <View style={styles.originalRefGrid}>
              <View style={styles.originalRefItem}>
                <Text style={styles.originalRefLabel}>{copy.originalNumber}</Text>
                <Text style={styles.originalRefValue}>
                  {canonical.originalInvoice.invoiceNumber}
                </Text>
              </View>
              <View style={styles.originalRefItem}>
                <Text style={styles.originalRefLabel}>{copy.originalDate}</Text>
                <Text style={styles.originalRefValue}>
                  {formatDate(canonical.originalInvoice.issueDate, locale)}
                </Text>
              </View>
              <View style={styles.originalRefItem}>
                <Text style={styles.originalRefLabel}>{copy.originalAmount}</Text>
                <Text style={styles.originalRefValue}>
                  {formatCurrency(
                    canonical.originalInvoice.contractualAmount.amount,
                    canonical.originalInvoice.contractualAmount.currency,
                    locale,
                  )}
                </Text>
              </View>
              {canonical.originalInvoice.payoutAmount && (
                <View style={styles.originalRefItem}>
                  <Text style={styles.originalRefLabel}>{copy.originalPayout}</Text>
                  <Text style={styles.originalRefValue}>
                    {formatCurrency(
                      canonical.originalInvoice.payoutAmount.amount,
                      canonical.originalInvoice.payoutAmount.currency,
                      locale,
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {canonical.notes && (
          <View>
            <Text style={styles.notes}>{canonical.notes}</Text>
          </View>
        )}

        <View style={styles.signatureCenter}>
          <Text style={styles.signatureName}>{canonical.issuer.legalName}</Text>
          <Text style={styles.signatureDate}>
            {interpolate(copy.signedOn, { date: issueDateLong })}
          </Text>
        </View>

        <View style={styles.footerCenter} fixed>
          <Text style={styles.footerLink}>
            {FOOTER_PREFIX}
            <Link src={AUTHOR_LINKEDIN} style={styles.footerLinkAccent}>
              {AUTHOR_NAME}
            </Link>
          </Text>
        </View>
        <View style={styles.footerPage} fixed>
          <Text
            render={({ pageNumber, totalPages }) =>
              interpolate(copy.page, { n: String(pageNumber), total: String(totalPages) })
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export { pdfCopy };

export type { Messages };
