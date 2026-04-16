'use client';

import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDraftStore } from '@/lib/store/draft-store';
import { useT } from '@/lib/i18n/use-t';

export function CorruptionBanner() {
  const wasReset = useDraftStore((s) => s.wasResetFromCorruption);
  const ack = useDraftStore((s) => s.acknowledgeCorruptionReset);
  const t = useT();

  if (!wasReset) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
    >
      <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" aria-hidden />
      <p className="flex-1">{t.toast.corruptedReset}</p>
      <button
        type="button"
        onClick={ack}
        aria-label={t.toast.dismiss}
        className="rounded-sm p-0.5 text-amber-800 transition-colors hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
