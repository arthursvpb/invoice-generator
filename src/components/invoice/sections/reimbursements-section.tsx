'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { divide, isPositive, isValidDecimal, multiply, toFixed } from '@/lib/domain/amounts';
import { formatCurrency } from '@/lib/format';
import { interpolate, useT } from '@/lib/i18n/use-t';
import { createEmptyReimbursementItem, type DraftStore } from '@/lib/store/draft-store';
import type { LineItem, ReimbursementFxDirection } from '@/lib/domain/types';
import type { InvoiceDraftInput } from '@/lib/domain/schema';

type Item = LineItem;

function isReimbursement(item: Item): boolean {
  return item.kind === 'reimbursement';
}

export function ReimbursementsSection() {
  const t = useT();
  const copy = t.fields.reimbursements;
  const section = t.sections.reimbursements;
  const { control } = useFormContext<InvoiceDraftInput>();
  const payoutCurrency = useWatch({ control, name: 'contract.payoutCurrency' }) ?? '';
  const { fields, append, remove } = useFieldArray<InvoiceDraftInput, 'lineItems', 'fieldId'>({
    control,
    name: 'lineItems',
    keyName: 'fieldId',
  });

  const reimbursementIndices = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => isReimbursement(field as Item));

  const handleAdd = () => {
    append(
      createEmptyReimbursementItem(payoutCurrency || 'USD') as unknown as Parameters<
        typeof append
      >[0],
    );
  };

  const handleRemove = (index: number) => {
    if (!confirm(copy.confirmRemove)) return;
    remove(index);
  };

  return (
    <SectionCard title={section.title} description={section.description}>
      {reimbursementIndices.length === 0 ? (
        <p className="text-muted-foreground text-xs">{copy.empty}</p>
      ) : (
        <div className="space-y-4">
          {reimbursementIndices.map(({ field, index }) => (
            <ReimbursementCard
              key={field.fieldId}
              index={index}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="size-3.5" aria-hidden />
        {copy.add}
      </Button>
    </SectionCard>
  );
}

function ReimbursementCard({ index, onRemove }: { index: number; onRemove: () => void }) {
  const t = useT();
  const copy = t.fields.reimbursements;
  const { register, control, setValue } = useFormContext<InvoiceDraftInput>();
  const baseId = `lineItems.${index}`;
  const locale = useWatch({ control, name: 'locale' });
  const payoutCurrency = (useWatch({ control, name: 'contract.payoutCurrency' }) ?? '').trim().toUpperCase();
  const originalCurrency = (
    useWatch({ control, name: `lineItems.${index}.originalCurrency` as const }) ?? ''
  )
    .trim()
    .toUpperCase();
  const originalAmount =
    useWatch({ control, name: `lineItems.${index}.originalAmount` as const }) ?? '';
  const fxRate = useWatch({ control, name: `lineItems.${index}.fx.rate` as const }) ?? '';
  const fxDirection = useWatch({
    control,
    name: `lineItems.${index}.fx.direction` as const,
  }) as ReimbursementFxDirection | undefined;

  const fxRequired =
    /^[A-Z]{3}$/.test(originalCurrency) &&
    /^[A-Z]{3}$/.test(payoutCurrency) &&
    originalCurrency !== payoutCurrency;

  // Ensure the form value of `fx` matches the visibility rule.
  React.useEffect(() => {
    if (fxRequired && !fxDirection) {
      setValue(`lineItems.${index}.fx.direction` as const, 'original_per_payout', {
        shouldDirty: true,
      });
    }
    if (!fxRequired && fxDirection !== undefined) {
      setValue(`lineItems.${index}.fx` as const, undefined, { shouldDirty: true });
    }
  }, [fxRequired, fxDirection, index, setValue]);

  const equivalent = React.useMemo(() => {
    if (!isValidDecimal(originalAmount) || !isPositive(originalAmount)) return null;
    if (!fxRequired) {
      try {
        return toFixed(originalAmount, 2);
      } catch {
        return null;
      }
    }
    if (!isValidDecimal(fxRate) || !isPositive(fxRate)) return null;
    try {
      return fxDirection === 'payout_per_original'
        ? multiply(originalAmount, fxRate, 2)
        : divide(originalAmount, fxRate, 2);
    } catch {
      return null;
    }
  }, [originalAmount, fxRate, fxRequired, fxDirection]);

  return (
    <div className="border-border/60 space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.1em] uppercase">
          {copy.cardEyebrow}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={copy.removeAria}
        >
          <Trash2 className="size-3.5" aria-hidden />
          {copy.remove}
        </Button>
      </div>

      <FieldRow name={`${baseId}.description`} label={copy.description} required>
        <Textarea
          id={`${baseId}.description`}
          rows={2}
          placeholder={copy.descriptionPlaceholder}
          {...register(`lineItems.${index}.description` as const)}
        />
      </FieldRow>

      <FieldGrid>
        <FieldRow name={`${baseId}.originalAmount`} label={copy.originalAmount} required>
          <Input
            id={`${baseId}.originalAmount`}
            inputMode="decimal"
            placeholder="1710.68"
            {...register(`lineItems.${index}.originalAmount` as const)}
          />
        </FieldRow>
        <FieldRow
          name={`${baseId}.originalCurrency`}
          label={copy.originalCurrency}
          hint={copy.originalCurrencyHint}
          required
        >
          <Input
            id={`${baseId}.originalCurrency`}
            maxLength={3}
            placeholder="BRL"
            className="uppercase"
            autoComplete="off"
            {...register(`lineItems.${index}.originalCurrency` as const)}
          />
        </FieldRow>
      </FieldGrid>

      {fxRequired && (
        <FxSubgroup index={index} payoutCurrency={payoutCurrency} originalCurrency={originalCurrency} />
      )}

      <FieldRow name={`${baseId}.note`} label={copy.note} hint={copy.noteHint}>
        <Input
          id={`${baseId}.note`}
          placeholder={copy.notePlaceholder}
          autoComplete="off"
          {...register(`lineItems.${index}.note` as const)}
        />
      </FieldRow>

      <ReimbursementEquivalent
        locale={locale}
        amount={equivalent}
        currency={payoutCurrency}
        labelKey={fxRequired ? copy.equivalentInPayout : copy.equivalentNoFx}
      />
    </div>
  );
}

function FxSubgroup({
  index,
  payoutCurrency,
  originalCurrency,
}: {
  index: number;
  payoutCurrency: string;
  originalCurrency: string;
}) {
  const t = useT();
  const copy = t.fields.reimbursements;
  const { register, control, setValue } = useFormContext<InvoiceDraftInput>();
  const baseId = `lineItems.${index}.fx`;
  const direction =
    (useWatch({ control, name: `lineItems.${index}.fx.direction` as const }) as
      | ReimbursementFxDirection
      | undefined) ?? 'original_per_payout';

  const directionDescription =
    direction === 'original_per_payout'
      ? interpolate(copy.directionOriginalPerPayout, {
          payout: payoutCurrency || '---',
          original: originalCurrency || '---',
        })
      : interpolate(copy.directionPayoutPerOriginal, {
          original: originalCurrency || '---',
          payout: payoutCurrency || '---',
        });

  return (
    <div className="border-border/60 space-y-4 rounded-md border border-dashed p-4">
      <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.1em] uppercase">
        {copy.fxTitle}
      </p>

      <FieldGrid>
        <FieldRow name={`${baseId}.rate`} label={copy.fxRate} required hint={directionDescription}>
          <Input
            id={`${baseId}.rate`}
            inputMode="decimal"
            placeholder="4.9880"
            {...register(`lineItems.${index}.fx.rate` as const)}
          />
        </FieldRow>
        <FieldRow name={`${baseId}.direction`} label={copy.fxDirection} required>
          <Select
            value={direction}
            onValueChange={(value) =>
              setValue(
                `lineItems.${index}.fx.direction` as const,
                value as ReimbursementFxDirection,
                { shouldDirty: true, shouldValidate: true },
              )
            }
          >
            <SelectTrigger id={`${baseId}.direction`} aria-label={copy.fxDirection}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original_per_payout">{copy.directionOriginalPerPayoutLabel}</SelectItem>
              <SelectItem value="payout_per_original">{copy.directionPayoutPerOriginalLabel}</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </FieldGrid>

      <FieldGrid>
        <FieldRow name={`${baseId}.referenceDate`} label={copy.fxReferenceDate} required>
          <Input
            id={`${baseId}.referenceDate`}
            type="date"
            {...register(`lineItems.${index}.fx.referenceDate` as const)}
          />
        </FieldRow>
        <FieldRow name={`${baseId}.source`} label={copy.fxSource} hint={copy.fxSourceHint}>
          <Input
            id={`${baseId}.source`}
            placeholder={copy.fxSourcePlaceholder}
            autoComplete="off"
            {...register(`lineItems.${index}.fx.source` as const)}
          />
        </FieldRow>
      </FieldGrid>
    </div>
  );
}

function ReimbursementEquivalent({
  locale,
  amount,
  currency,
  labelKey,
}: {
  locale: DraftStore['locale'];
  amount: string | null;
  currency: string;
  labelKey: string;
}) {
  const t = useT();
  const display =
    amount && /^[A-Z]{3}$/.test(currency)
      ? formatCurrency(amount, currency, locale)
      : t.fields.reimbursements.equivalentPending;
  return (
    <div className="bg-muted/50 text-muted-foreground flex items-center justify-between rounded-md px-3 py-2 text-xs">
      <span className="font-semibold tracking-[0.1em] uppercase">{labelKey}</span>
      <span className="text-foreground font-semibold">{display}</span>
    </div>
  );
}
