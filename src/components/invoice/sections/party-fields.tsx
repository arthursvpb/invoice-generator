'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/use-t';

type PartyPath = 'issuer' | 'payer';

export function PartyFields({ namespace }: { namespace: PartyPath }) {
  const { register } = useFormContext();
  const t = useT();
  const copy = t.fields.party;

  const field = (key: string) => `${namespace}.${key}` as const;

  return (
    <>
      <FieldRow name={field('legalName')} label={copy.legalName} required>
        <Input
          id={field('legalName')}
          placeholder={copy.companyPlaceholder}
          autoComplete="organization"
          {...register(field('legalName'))}
        />
      </FieldRow>
      <FieldGrid>
        <FieldRow name={field('taxId')} label={copy.taxId} hint={copy.taxIdHint}>
          <Input
            id={field('taxId')}
            placeholder={copy.optional}
            autoComplete="off"
            {...register(field('taxId'))}
          />
        </FieldRow>
        <FieldRow name={field('country')} label={copy.country}>
          <Input
            id={field('country')}
            placeholder={copy.optional}
            autoComplete="country-name"
            {...register(field('country'))}
          />
        </FieldRow>
      </FieldGrid>
      <FieldRow name={field('address')} label={copy.address}>
        <Input
          id={field('address')}
          placeholder={copy.addressPlaceholder}
          autoComplete="street-address"
          {...register(field('address'))}
        />
      </FieldRow>
      <FieldRow name={field('billingEmail')} label={copy.billingEmail}>
        <Input
          id={field('billingEmail')}
          type="email"
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
          {...register(field('billingEmail'))}
        />
      </FieldRow>
    </>
  );
}
