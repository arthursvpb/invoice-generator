'use client';

import { useFormContext } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/use-t';

export function ServicePeriodSection() {
  const { register } = useFormContext();
  const t = useT();
  const copy = t.fields.servicePeriod;
  const section = t.sections.servicePeriod;

  return (
    <SectionCard title={section.title} description={section.description}>
      <FieldGrid>
        <FieldRow name="servicePeriod.periodStart" label={copy.periodStart} required>
          <Input
            id="servicePeriod.periodStart"
            type="date"
            {...register('servicePeriod.periodStart')}
          />
        </FieldRow>
        <FieldRow name="servicePeriod.periodEnd" label={copy.periodEnd} required>
          <Input
            id="servicePeriod.periodEnd"
            type="date"
            {...register('servicePeriod.periodEnd')}
          />
        </FieldRow>
      </FieldGrid>
    </SectionCard>
  );
}
