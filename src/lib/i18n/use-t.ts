'use client';

import { useDraftStore } from '@/lib/store/draft-store';
import { messages, type Messages } from './messages';

export function useT(): Messages {
  const locale = useDraftStore((s) => s.locale);
  return messages[locale];
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}
