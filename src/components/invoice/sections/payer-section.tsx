'use client';

import { SectionCard } from '@/components/invoice/form-field';
import { useT } from '@/lib/i18n/use-t';
import { PartyFields } from './party-fields';

export function PayerSection() {
  const t = useT();
  return (
    <SectionCard title={t.sections.payer.title} description={t.sections.payer.description}>
      <PartyFields namespace="payer" />
    </SectionCard>
  );
}
