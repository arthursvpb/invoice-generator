'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { isPositive, isValidDecimal, multiply, toFixed } from '@/lib/domain/amounts';
import { formatCurrency } from '@/lib/format';
import { useT } from '@/lib/i18n/use-t';
import {
  createEmptyHourlyServiceItem,
  type DraftStore,
} from '@/lib/store/draft-store';
import type { LineItem } from '@/lib/domain/types';
import type { InvoiceDraftInput } from '@/lib/domain/schema';

type Item = LineItem;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyFixedServiceItem(): Item {
  return {
    id: newId(),
    kind: 'fixed_service',
    description: '',
    amount: '',
  };
}

function isServiceItem(item: Item): boolean {
  return item.kind === 'hourly_service' || item.kind === 'fixed_service';
}

export function ServiceItemsSection() {
  const t = useT();
  const copy = t.fields.serviceItems;
  const section = t.sections.serviceItems;
  const { control } = useFormContext<InvoiceDraftInput>();
  const { fields, append, remove } = useFieldArray<InvoiceDraftInput, 'lineItems', 'fieldId'>({
    control,
    name: 'lineItems',
    keyName: 'fieldId',
  });

  const serviceIndices = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => isServiceItem(field as Item));

  const handleRemove = (index: number) => {
    if (!confirm(copy.confirmRemove)) return;
    const remaining = fields.filter((_, i) => i !== index);
    const remainingService = remaining.filter((f) => isServiceItem(f as Item));
    if (remainingService.length === 0) {
      append(createEmptyHourlyServiceItem() as unknown as Parameters<typeof append>[0]);
    }
    remove(index);
  };

  return (
    <SectionCard title={section.title} description={section.description}>
      <div className="space-y-4">
        {serviceIndices.map(({ field, index }) => (
          <ServiceItemCard
            key={field.fieldId}
            index={index}
            kind={(field as Item).kind as 'hourly_service' | 'fixed_service'}
            onRemove={() => handleRemove(index)}
            removeDisabled={serviceIndices.length === 1}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append(createEmptyHourlyServiceItem() as unknown as Parameters<typeof append>[0])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          {copy.addHourly}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(emptyFixedServiceItem() as unknown as Parameters<typeof append>[0])}
        >
          <Plus className="size-3.5" aria-hidden />
          {copy.addFixed}
        </Button>
      </div>
    </SectionCard>
  );
}

function ServiceItemCard({
  index,
  kind,
  onRemove,
  removeDisabled,
}: {
  index: number;
  kind: 'hourly_service' | 'fixed_service';
  onRemove: () => void;
  removeDisabled: boolean;
}) {
  const t = useT();
  const copy = t.fields.serviceItems;
  const { register, control } = useFormContext<InvoiceDraftInput>();
  const locale = useWatch({ control, name: 'locale' });
  const contractCurrency = useWatch({ control, name: 'contract.contractCurrency' }) ?? '';

  const baseId = `lineItems.${index}`;
  const kindLabel = kind === 'hourly_service' ? copy.kindHourly : copy.kindFixed;

  return (
    <div className="border-border/60 space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.1em] uppercase">
          {kindLabel}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={removeDisabled}
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

      {kind === 'hourly_service' ? (
        <HourlyFields index={index} contractCurrency={contractCurrency} locale={locale} />
      ) : (
        <FixedFields index={index} contractCurrency={contractCurrency} locale={locale} />
      )}
    </div>
  );
}

function HourlyFields({
  index,
  contractCurrency,
  locale,
}: {
  index: number;
  contractCurrency: string;
  locale: DraftStore['locale'];
}) {
  const t = useT();
  const copy = t.fields.serviceItems;
  const { register, control } = useFormContext<InvoiceDraftInput>();
  const baseId = `lineItems.${index}`;
  const quantity = useWatch({ control, name: `lineItems.${index}.quantity` as const }) ?? '';
  const rate = useWatch({ control, name: `lineItems.${index}.rate` as const }) ?? '';

  const lineTotal = React.useMemo(() => {
    if (!isValidDecimal(quantity) || !isValidDecimal(rate)) return null;
    if (!isPositive(quantity) || !isPositive(rate)) return null;
    try {
      return multiply(quantity, rate, 2);
    } catch {
      return null;
    }
  }, [quantity, rate]);

  return (
    <>
      <FieldGrid>
        <FieldRow name={`${baseId}.quantity`} label={copy.quantity} required>
          <Input
            id={`${baseId}.quantity`}
            inputMode="decimal"
            placeholder="56"
            {...register(`lineItems.${index}.quantity` as const)}
          />
        </FieldRow>
        <FieldRow name={`${baseId}.rate`} label={copy.rate} required>
          <Input
            id={`${baseId}.rate`}
            inputMode="decimal"
            placeholder="33"
            {...register(`lineItems.${index}.rate` as const)}
          />
        </FieldRow>
      </FieldGrid>
      <LineTotal locale={locale} amount={lineTotal} currency={contractCurrency} />
    </>
  );
}

function FixedFields({
  index,
  contractCurrency,
  locale,
}: {
  index: number;
  contractCurrency: string;
  locale: DraftStore['locale'];
}) {
  const t = useT();
  const copy = t.fields.serviceItems;
  const { register, control } = useFormContext<InvoiceDraftInput>();
  const baseId = `lineItems.${index}`;
  const amount = useWatch({ control, name: `lineItems.${index}.amount` as const }) ?? '';

  const lineTotal = React.useMemo(() => {
    if (!isValidDecimal(amount) || !isPositive(amount)) return null;
    try {
      return toFixed(amount, 2);
    } catch {
      return null;
    }
  }, [amount]);

  return (
    <>
      <FieldRow name={`${baseId}.amount`} label={copy.amount} required>
        <Input
          id={`${baseId}.amount`}
          inputMode="decimal"
          placeholder="1000"
          {...register(`lineItems.${index}.amount` as const)}
        />
      </FieldRow>
      <LineTotal locale={locale} amount={lineTotal} currency={contractCurrency} />
    </>
  );
}

function LineTotal({
  locale,
  amount,
  currency,
}: {
  locale: DraftStore['locale'];
  amount: string | null;
  currency: string;
}) {
  const t = useT();
  const label = t.fields.serviceItems.lineTotal;
  const display =
    amount && /^[A-Z]{3}$/.test(currency)
      ? formatCurrency(amount, currency, locale)
      : t.fields.serviceItems.lineTotalPending;
  return (
    <div className="bg-muted/50 text-muted-foreground flex items-center justify-between rounded-md px-3 py-2 text-xs">
      <span className="font-semibold tracking-[0.1em] uppercase">{label}</span>
      <span className="text-foreground font-semibold">{display}</span>
    </div>
  );
}
