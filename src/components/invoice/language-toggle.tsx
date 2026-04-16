'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { useDraftStore } from '@/lib/store/draft-store';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/domain/types';

const OPTIONS: Array<{ value: Locale; label: string; short: string }> = [
  { value: 'pt-BR', label: 'Portuguese', short: 'PT' },
  { value: 'en', label: 'English', short: 'EN' },
];

export function LanguageToggle() {
  const locale = useDraftStore((s) => s.locale);
  const setLocale = useDraftStore((s) => s.setLocale);

  return (
    <div
      role="radiogroup"
      aria-label="Document language"
      className="border-border/60 bg-background/40 inline-flex items-center gap-0.5 rounded-md border p-0.5"
    >
      <Globe className="text-muted-foreground ml-1.5 size-3" aria-hidden />
      {OPTIONS.map(({ value, label, short }) => {
        const active = locale === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setLocale(value)}
            className={cn(
              'text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-7 items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
              active && 'bg-secondary text-foreground',
            )}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}
