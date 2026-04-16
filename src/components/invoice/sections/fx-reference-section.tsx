'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, Loader2, RefreshCcw } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { SectionCard, FieldGrid, FieldRow } from '@/components/invoice/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { interpolate, useT } from '@/lib/i18n/use-t';
import { fetchLatestRate, PROVIDER_LABEL } from '@/lib/fx/frankfurter-client';
import { fxKey, useSettingsStore } from '@/lib/store/settings-store';

const TTL_MS = 6 * 60 * 60 * 1000;

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'fetched'; date: string; rate: string; cached: boolean }
  | { kind: 'error'; message: string };

export function FxReferenceSection() {
  const { register, watch, setValue } = useFormContext();
  const t = useT();
  const copy = t.fields.fx;
  const sectionCopy = t.sections.fx;
  const fxCache = useSettingsStore((s) => s.fxCache);
  const setCachedFxRate = useSettingsStore((s) => s.setCachedFxRate);

  const contractCurrency = (watch('contract.contractCurrency') as string | undefined) ?? '';
  const payoutCurrency = (watch('contract.payoutCurrency') as string | undefined) ?? '';
  const from = contractCurrency.trim().toUpperCase();
  const to = payoutCurrency.trim().toUpperCase();
  const required = /^[A-Z]{3}$/.test(from) && /^[A-Z]{3}$/.test(to) && from !== to;

  const [status, setStatus] = React.useState<Status>({ kind: 'idle' });
  const [showSource, setShowSource] = React.useState(false);
  const lastPair = React.useRef<string>('');

  const performFetch = React.useCallback(
    async (signal?: AbortSignal) => {
      setStatus({ kind: 'loading' });
      const result = await fetchLatestRate(from, to, signal);
      if (signal?.aborted) return;
      if (!result.ok) {
        setStatus({ kind: 'error', message: result.error });
        return;
      }
      setValue('fxReference.providerLabel', result.value.provider, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue('fxReference.referenceDate', result.value.date, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue('fxReference.rate', result.value.rate, { shouldDirty: true, shouldValidate: true });
      setValue('fxReference.sourceUrl', result.value.sourceUrl, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setCachedFxRate(from, to, result.value.rate, result.value.date);
      setStatus({
        kind: 'fetched',
        date: result.value.date,
        rate: result.value.rate,
        cached: false,
      });
    },
    [from, to, setValue, setCachedFxRate],
  );

  React.useEffect(() => {
    if (!required) {
      lastPair.current = '';
      setStatus({ kind: 'idle' });
      return;
    }
    const pair = fxKey(from, to);
    if (lastPair.current === pair) return;
    lastPair.current = pair;

    const cached = fxCache[pair];
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      setValue('fxReference.providerLabel', PROVIDER_LABEL, { shouldDirty: false });
      setValue('fxReference.referenceDate', cached.date, { shouldDirty: false });
      setValue('fxReference.rate', cached.rate, { shouldDirty: false, shouldValidate: true });
      setStatus({ kind: 'fetched', date: cached.date, rate: cached.rate, cached: true });
      return;
    }

    const controller = new AbortController();
    void performFetch(controller.signal);
    return () => controller.abort();
  }, [required, from, to, fxCache, performFetch, setValue]);

  if (!required) return null;

  const onRefresh = () => {
    lastPair.current = '';
    void performFetch();
  };

  const rateLabel = interpolate(sectionCopy.rateLabel, {
    from: from || '---',
    to: to || '---',
  });

  return (
    <SectionCard title={sectionCopy.title} description={sectionCopy.description} tone="accent">
      <FxStatusLine status={status} from={from} to={to} onRefresh={onRefresh} />

      <FieldRow name="fxReference.rate" label={rateLabel} required>
        <Input
          id="fxReference.rate"
          inputMode="decimal"
          placeholder="1.08"
          {...register('fxReference.rate')}
        />
      </FieldRow>

      <button
        type="button"
        onClick={() => setShowSource((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background inline-flex items-center gap-1 self-start text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-expanded={showSource}
      >
        {showSource ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronRight className="size-3" aria-hidden />
        )}
        {showSource ? sectionCopy.hideSource : sectionCopy.showSource}
      </button>

      {showSource && (
        <div className="space-y-4">
          <FieldGrid>
            <FieldRow name="fxReference.providerLabel" label={copy.provider} required>
              <Input
                id="fxReference.providerLabel"
                placeholder={copy.providerPlaceholder}
                autoComplete="off"
                {...register('fxReference.providerLabel')}
              />
            </FieldRow>
            <FieldRow name="fxReference.referenceDate" label={copy.referenceDate} required>
              <Input
                id="fxReference.referenceDate"
                type="date"
                {...register('fxReference.referenceDate')}
              />
            </FieldRow>
          </FieldGrid>
          <FieldGrid>
            <FieldRow name="fxReference.sourceUrl" label={copy.sourceUrl}>
              <Input
                id="fxReference.sourceUrl"
                type="url"
                placeholder="https://www.ecb.europa.eu/..."
                autoComplete="url"
                {...register('fxReference.sourceUrl')}
              />
            </FieldRow>
            <FieldRow name="fxReference.notes" label={copy.notes}>
              <Input
                id="fxReference.notes"
                placeholder={copy.notesPlaceholder}
                autoComplete="off"
                {...register('fxReference.notes')}
              />
            </FieldRow>
          </FieldGrid>
        </div>
      )}
    </SectionCard>
  );
}

function FxStatusLine({
  status,
  from,
  to,
  onRefresh,
}: {
  status: Status;
  from: string;
  to: string;
  onRefresh: () => void;
}) {
  const t = useT();
  const sectionCopy = t.sections.fx;

  if (status.kind === 'idle') return null;

  if (status.kind === 'loading') {
    return (
      <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-xs">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        <span>{sectionCopy.fetching}</span>
      </div>
    );
  }

  if (status.kind === 'error') {
    return (
      <div className="border-destructive/40 bg-destructive/5 text-destructive flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs">
        <span>{interpolate(sectionCopy.error, { message: status.message })}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onRefresh}
        >
          <RefreshCcw className="size-3" aria-hidden />
          {sectionCopy.refresh}
        </Button>
      </div>
    );
  }

  const message = status.cached
    ? interpolate(sectionCopy.cached, {
        rate: status.rate,
        date: status.date,
        from,
        to,
      })
    : interpolate(sectionCopy.autoFetched, {
        rate: status.rate,
        date: status.date,
        from,
        to,
      });

  return (
    <div className="bg-muted/50 text-muted-foreground flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-xs">
      <span>{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onRefresh}
      >
        <RefreshCcw className="size-3" aria-hidden />
        {sectionCopy.refresh}
      </Button>
    </div>
  );
}
