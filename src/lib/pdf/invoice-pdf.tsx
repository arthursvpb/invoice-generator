import * as React from 'react';
import { Document, Link, Page, Text, View } from '@react-pdf/renderer';
import { registerPdfFonts } from './fonts';
import { styles } from './styles';
import type { Messages } from '@/lib/i18n/messages';
import { messages as dictionary } from '@/lib/i18n/messages';
import { interpolate } from '@/lib/i18n/use-t';
import type { CanonicalBankDetails, CanonicalInvoice, CanonicalParty } from '@/lib/domain/types';
import { formatCurrency, formatDate, formatDateLong, formatNumber } from '@/lib/format';

registerPdfFonts();

const AUTHOR_LINKEDIN = 'https://www.linkedin.com/in/arthursvpb/';
const AUTHOR_NAME = 'Arthur Vasconcellos';
const FOOTER_PREFIX = 'Invoice Generator created by ';

const pdfCopy: Record<
  'pt-BR' | 'en',
  {
    bannerCancellation: string;
    from: string;
    billTo: string;
    period: string;
    service: string;
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
    contractualReference: string;
    contractualOnly: string;
    fxDisclosure: string;
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
    service: 'Service',
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
    contractualReference: '{hours} h × {rate} = {contractual}',
    contractualOnly: '{hours} h × {rate}',
    fxDisclosure: 'FX reference: {provider} on {date}, 1 {from} = {rate} {to}',
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
    service: 'Serviço',
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
    contractualReference: '{hours} h × {rate} = {contractual}',
    contractualOnly: '{hours} h × {rate}',
    fxDisclosure: 'Câmbio: {provider} em {date}, 1 {from} = {rate} {to}',
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

export function InvoicePdf({ canonical }: { canonical: CanonicalInvoice }) {
  const locale = canonical.locale;
  const copy = pdfCopy[locale];
  const isCancellation = canonical.documentType === 'cancellation';
  const pageEyebrow = dictionary[locale].page[isCancellation ? 'cancellation' : 'invoice'].eyebrow;

  const hoursText = formatNumber(canonical.timesheet.totalHours, locale, 2);
  const rateText = formatCurrency(
    canonical.contract.hourlyRate.amount,
    canonical.contract.hourlyRate.currency,
    locale,
  );

  const contractual = canonical.amounts.contractual;
  const payout = canonical.amounts.payout;
  const heroMoney = payout ?? contractual;
  const heroFormatted = formatCurrency(heroMoney.amount, heroMoney.currency, locale);
  const isHeroNegative = heroMoney.amount.startsWith('-');

  const contractualFormatted = formatCurrency(contractual.amount, contractual.currency, locale);
  const referenceLine = payout
    ? interpolate(copy.contractualReference, {
        hours: hoursText,
        rate: rateText,
        contractual: contractualFormatted,
      })
    : interpolate(copy.contractualOnly, { hours: hoursText, rate: rateText });

  const fx = canonical.fxReference;
  const fxLine = fx
    ? interpolate(copy.fxDisclosure, {
        provider: fx.providerLabel,
        date: formatDate(fx.referenceDate, locale),
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

  return (
    <Document
      title={metaTitle}
      author={canonical.issuer.legalName}
      creator="Invoice Generator"
      producer="Invoice Generator"
      subject={canonical.contract.serviceDescription}
      creationDate={fixedDate}
      modificationDate={fixedDate}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>{pageEyebrow}</Text>
            <Text style={styles.title}>{canonical.issuer.legalName}</Text>
            <Text style={styles.subtitle}>{canonical.contract.serviceDescription}</Text>
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
              {formatDate(canonical.timesheet.periodStart, locale)} —{' '}
              {formatDate(canonical.timesheet.periodEnd, locale)}
            </Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.sectionEyebrow}>{copy.service}</Text>
            <Text style={styles.periodValue}>{canonical.contract.serviceDescription}</Text>
          </View>
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>{copy.payoutTotal}</Text>
          <Text
            style={
              isHeroNegative ? [styles.heroAmount, styles.heroAmountNegative] : styles.heroAmount
            }
          >
            {heroFormatted}
          </Text>
          <Text style={styles.heroReference}>{referenceLine}</Text>
          {fxLine && <Text style={styles.disclosure}>{fxLine}</Text>}
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
