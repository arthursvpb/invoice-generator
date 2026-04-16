'use client';

import { useFormContext } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDraftStore } from '@/lib/store/draft-store';
import { interpolate, useT } from '@/lib/i18n/use-t';
import type { DocumentType } from '@/lib/domain/types';

export function NumberingSection() {
  const { register, watch, setValue } = useFormContext();
  const t = useT();
  const copy = t.fields.numbering;
  const documentType = watch('documentType') as DocumentType;
  const currentNumber = watch('invoiceNumber');

  const suggest = () => {
    const next = useDraftStore.getState().suggestNumber(documentType);
    setValue('invoiceNumber', next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <SectionCard title={t.sections.numbering.title} description={t.sections.numbering.description}>
      <FieldGrid>
        <FieldRow
          name="invoiceNumber"
          label={copy.invoiceNumber}
          hint={copy.invoiceNumberHint}
          required
        >
          <div className="flex gap-2">
            <Input
              id="invoiceNumber"
              placeholder={
                documentType === 'cancellation'
                  ? copy.cancellationNumberPlaceholder
                  : copy.invoiceNumberPlaceholder
              }
              autoComplete="off"
              className="font-mono"
              {...register('invoiceNumber')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={suggest}
              aria-label={t.actions.suggest}
            >
              {t.actions.suggest}
            </Button>
          </div>
        </FieldRow>
        <FieldRow name="locale" label={copy.locale} required>
          <select
            id="locale"
            className="border-input focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            {...register('locale')}
          >
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="en">English</option>
          </select>
        </FieldRow>
      </FieldGrid>
      <FieldGrid>
        <FieldRow name="issueDate" label={copy.issueDate} required>
          <Input id="issueDate" type="date" {...register('issueDate')} />
        </FieldRow>
        <FieldRow name="dueDate" label={copy.dueDate}>
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </FieldRow>
      </FieldGrid>
      {currentNumber && (
        <p className="text-muted-foreground text-xs">
          {interpolate(t.sections.numbering.currentIdentifier, {
            number: `\u202F${String(currentNumber)}`,
          })}
        </p>
      )}
    </SectionCard>
  );
}
