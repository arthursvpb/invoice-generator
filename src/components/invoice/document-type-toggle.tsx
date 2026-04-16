'use client';

import * as React from 'react';
import { FileText, FileX2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';
import type { DocumentType } from '@/lib/domain/types';

export function DocumentTypeToggle({
  value,
  onChange,
}: {
  value: DocumentType;
  onChange: (next: DocumentType) => void;
}) {
  const t = useT();
  const options: Array<{ value: DocumentType; label: string; icon: React.ElementType }> = [
    { value: 'invoice', label: t.documentType.invoice, icon: FileText },
    { value: 'cancellation', label: t.documentType.cancellation, icon: FileX2 },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t.documentType.ariaLabel}
      className="border-border/70 bg-background inline-flex items-center rounded-lg border p-0.5"
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors',
              active
                ? 'bg-secondary text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
