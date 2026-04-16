'use client';

import * as React from 'react';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/use-t';
import { useSettingsStore } from '@/lib/store/settings-store';
import type { BankDetails } from '@/lib/domain/types';

const FIELDS: Array<keyof BankDetails> = [
  'payoutMethod',
  'bankName',
  'accountType',
  'accountHolder',
  'accountNumber',
  'routingNumber',
  'bankAddress',
];

export function BankDetailsSection() {
  const t = useT();
  const copy = t.fields.bank;
  const sectionCopy = t.sections.bank;
  const bankDefaults = useSettingsStore((s) => s.bankDefaults);
  const setBankDefaults = useSettingsStore((s) => s.setBankDefaults);

  const update = (key: keyof BankDetails, value: string) => {
    const next: BankDetails = { ...(bankDefaults ?? {}), [key]: value };
    const hasAny = FIELDS.some((field) => (next[field] ?? '').trim().length > 0);
    setBankDefaults(hasAny ? next : null);
  };

  const value = (key: keyof BankDetails): string => bankDefaults?.[key] ?? '';

  return (
    <SectionCard title={sectionCopy.title} description={sectionCopy.description}>
      <FieldRow name="bank.payoutMethod" label={copy.payoutMethod}>
        <Input
          id="bank.payoutMethod"
          placeholder={copy.payoutMethodPlaceholder}
          autoComplete="off"
          value={value('payoutMethod')}
          onChange={(event) => update('payoutMethod', event.target.value)}
        />
      </FieldRow>
      <FieldGrid>
        <FieldRow name="bank.bankName" label={copy.bankName}>
          <Input
            id="bank.bankName"
            placeholder={copy.bankNamePlaceholder}
            autoComplete="off"
            value={value('bankName')}
            onChange={(event) => update('bankName', event.target.value)}
          />
        </FieldRow>
        <FieldRow name="bank.accountType" label={copy.accountType}>
          <Input
            id="bank.accountType"
            placeholder={copy.accountTypePlaceholder}
            autoComplete="off"
            value={value('accountType')}
            onChange={(event) => update('accountType', event.target.value)}
          />
        </FieldRow>
      </FieldGrid>
      <FieldRow name="bank.accountHolder" label={copy.accountHolder}>
        <Input
          id="bank.accountHolder"
          placeholder={copy.accountHolderPlaceholder}
          autoComplete="off"
          value={value('accountHolder')}
          onChange={(event) => update('accountHolder', event.target.value)}
        />
      </FieldRow>
      <FieldGrid>
        <FieldRow name="bank.accountNumber" label={copy.accountNumber}>
          <Input
            id="bank.accountNumber"
            placeholder={copy.accountNumberPlaceholder}
            autoComplete="off"
            value={value('accountNumber')}
            onChange={(event) => update('accountNumber', event.target.value)}
          />
        </FieldRow>
        <FieldRow name="bank.routingNumber" label={copy.routingNumber}>
          <Input
            id="bank.routingNumber"
            placeholder={copy.routingNumberPlaceholder}
            autoComplete="off"
            value={value('routingNumber')}
            onChange={(event) => update('routingNumber', event.target.value)}
          />
        </FieldRow>
      </FieldGrid>
      <FieldRow name="bank.bankAddress" label={copy.bankAddress}>
        <Input
          id="bank.bankAddress"
          placeholder={copy.bankAddressPlaceholder}
          autoComplete="off"
          value={value('bankAddress')}
          onChange={(event) => update('bankAddress', event.target.value)}
        />
      </FieldRow>
      <p className="text-muted-foreground text-xs">{sectionCopy.savedHint}</p>
    </SectionCard>
  );
}
