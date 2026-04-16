'use client';

import { useFormContext } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/use-t';

export function CancellationReferenceSection() {
  const { register, watch } = useFormContext();
  const t = useT();
  const copy = t.fields.cancellation;
  const documentType = watch('documentType');

  if (documentType !== 'cancellation') return null;

  return (
    <SectionCard
      title={t.sections.cancellation.title}
      description={t.sections.cancellation.description}
      tone="warn"
    >
      <FieldGrid>
        <FieldRow name="originalInvoice.invoiceNumber" label={copy.invoiceNumber} required>
          <Input
            id="originalInvoice.invoiceNumber"
            placeholder={copy.invoiceNumberPlaceholder}
            autoComplete="off"
            className="font-mono"
            {...register('originalInvoice.invoiceNumber')}
          />
        </FieldRow>
        <FieldRow name="originalInvoice.issueDate" label={copy.issueDate} required>
          <Input
            id="originalInvoice.issueDate"
            type="date"
            {...register('originalInvoice.issueDate')}
          />
        </FieldRow>
      </FieldGrid>
      <FieldGrid>
        <FieldRow name="originalInvoice.contractualAmount" label={copy.contractualAmount} required>
          <Input
            id="originalInvoice.contractualAmount"
            inputMode="decimal"
            placeholder="1848.00"
            {...register('originalInvoice.contractualAmount')}
          />
        </FieldRow>
        <FieldRow name="originalInvoice.currency" label={copy.currency} required>
          <Input
            id="originalInvoice.currency"
            maxLength={3}
            className="uppercase"
            placeholder="EUR"
            autoComplete="off"
            {...register('originalInvoice.currency')}
          />
        </FieldRow>
      </FieldGrid>
      <FieldRow
        name="originalInvoice.payoutAmount"
        label={copy.payoutAmount}
        hint={copy.payoutAmountHint}
      >
        <Input
          id="originalInvoice.payoutAmount"
          inputMode="decimal"
          placeholder="Optional"
          {...register('originalInvoice.payoutAmount')}
        />
      </FieldRow>
    </SectionCard>
  );
}
