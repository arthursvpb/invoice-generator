'use client';

import { useFormContext } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/use-t';

export function ContractSection() {
  const { register } = useFormContext();
  const t = useT();
  const copy = t.fields.contract;

  return (
    <SectionCard title={t.sections.contract.title} description={t.sections.contract.description}>
      <FieldGrid>
        <FieldRow
          name="contract.contractCurrency"
          label={copy.contractCurrency}
          hint={copy.contractCurrencyHint}
          required
        >
          <Input
            id="contract.contractCurrency"
            maxLength={3}
            placeholder="EUR"
            className="uppercase"
            autoComplete="off"
            {...register('contract.contractCurrency')}
          />
        </FieldRow>
        <FieldRow
          name="contract.payoutCurrency"
          label={copy.payoutCurrency}
          hint={copy.payoutCurrencyHint}
          required
        >
          <Input
            id="contract.payoutCurrency"
            maxLength={3}
            placeholder="USD"
            className="uppercase"
            autoComplete="off"
            {...register('contract.payoutCurrency')}
          />
        </FieldRow>
      </FieldGrid>
      <FieldRow name="contract.payoutMethod" label={copy.payoutMethod}>
        <Input
          id="contract.payoutMethod"
          placeholder={copy.payoutMethodPlaceholder}
          autoComplete="off"
          {...register('contract.payoutMethod')}
        />
      </FieldRow>
    </SectionCard>
  );
}
