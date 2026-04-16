'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Save, UserRound } from 'lucide-react';
import { SectionCard } from '@/components/invoice/form-field';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';
import { useSettingsStore } from '@/lib/store/settings-store';
import type { Party } from '@/lib/domain/types';
import { PartyFields } from './party-fields';

export function IssuerSection() {
  const { getValues, setValue } = useFormContext();
  const t = useT();
  const issuerDefaults = useSettingsStore((s) => s.issuerDefaults);
  const setIssuerDefaults = useSettingsStore((s) => s.setIssuerDefaults);

  const applyDefaults = () => {
    if (!issuerDefaults) return;
    setValue('issuer', issuerDefaults, { shouldDirty: true });
  };

  const saveAsDefault = () => {
    const current = getValues('issuer') as Party | undefined;
    if (!current || !current.legalName?.trim()) return;
    setIssuerDefaults(current);
  };

  return (
    <SectionCard
      title={t.sections.issuer.title}
      description={t.sections.issuer.description}
      footer={
        <div className="text-muted-foreground flex flex-wrap items-center justify-end gap-2">
          {issuerDefaults && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={applyDefaults}
              className="h-7 px-2 text-xs"
            >
              <UserRound className="size-3.5" aria-hidden />
              {t.actions.useDefaults}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={saveAsDefault}
            className="h-7 px-2 text-xs"
          >
            <Save className="size-3.5" aria-hidden />
            {t.actions.saveAsDefault}
          </Button>
        </div>
      }
    >
      <PartyFields namespace="issuer" />
    </SectionCard>
  );
}
