'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFormContext, type FieldErrors } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { interpolate, useT } from '@/lib/i18n/use-t';

type ErrorNode = {
  message?: string;
  type?: string;
  ref?: unknown;
};

function collectMessages(
  errors: FieldErrors | ErrorNode | undefined,
  path = '',
  acc: Array<{ path: string; message: string }> = [],
): Array<{ path: string; message: string }> {
  if (!errors || typeof errors !== 'object') return acc;
  for (const [key, raw] of Object.entries(errors)) {
    const value = raw as ErrorNode | FieldErrors | undefined;
    if (!value || typeof value !== 'object') continue;
    const nextPath = path ? `${path}.${key}` : key;
    if ('message' in value && typeof value.message === 'string') {
      acc.push({ path: nextPath, message: value.message });
    } else {
      collectMessages(value as FieldErrors, nextPath, acc);
    }
  }
  return acc;
}

function humanise(path: string): string {
  return path
    .split('.')
    .map((part) => part.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(' / ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function ErrorSummary() {
  const t = useT();
  const {
    formState: { errors },
  } = useFormContext();

  const messages = React.useMemo(() => collectMessages(errors), [errors]);

  if (messages.length === 0) return null;

  const heading =
    messages.length === 1
      ? t.errorSummary.single
      : interpolate(t.errorSummary.many, { count: messages.length });

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="text-destructive size-4" aria-hidden />
          {heading}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-destructive space-y-1.5 text-xs">
          {messages.map(({ path, message }) => (
            <li key={path}>
              <span className="font-medium">{humanise(path)}:</span> {message}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
