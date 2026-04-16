'use client';

import { useFormContext } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/use-t';

export function TimesheetSection() {
  const { register } = useFormContext();
  const t = useT();
  const copy = t.fields.timesheet;
  const section = t.sections.timesheet;

  return (
    <SectionCard title={section.title} description={section.description}>
      <FieldGrid>
        <FieldRow name="timesheet.periodStart" label={copy.periodStart} required>
          <Input id="timesheet.periodStart" type="date" {...register('timesheet.periodStart')} />
        </FieldRow>
        <FieldRow name="timesheet.periodEnd" label={copy.periodEnd} required>
          <Input id="timesheet.periodEnd" type="date" {...register('timesheet.periodEnd')} />
        </FieldRow>
      </FieldGrid>
      <FieldRow name="timesheet.totalHours" label={copy.totalHours} required>
        <Input
          id="timesheet.totalHours"
          inputMode="decimal"
          placeholder="56"
          {...register('timesheet.totalHours')}
        />
      </FieldRow>
    </SectionCard>
  );
}
