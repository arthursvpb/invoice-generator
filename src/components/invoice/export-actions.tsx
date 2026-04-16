'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Download, Eye, Loader2, RotateCcw } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { toCanonicalInvoice } from '@/lib/domain/canonical';
import { invoiceDraftSchema } from '@/lib/domain/schema';
import { useDraftStore } from '@/lib/store/draft-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useT } from '@/lib/i18n/use-t';
import type { CanonicalInvoice, DocumentType } from '@/lib/domain/types';

const PreviewDialog = dynamic(() => import('./preview-dialog').then((m) => m.PreviewDialog), {
  ssr: false,
});

type Busy = 'preview' | 'download' | null;

export function ExportActions({
  onReset,
  onValidate,
}: {
  onReset: () => void;
  onValidate: () => Promise<boolean>;
}) {
  const { getValues } = useFormContext();
  const t = useT();
  const bumpSequence = useDraftStore((s) => s.bumpSequence);
  const [canonical, setCanonical] = React.useState<CanonicalInvoice | null>(null);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<Busy>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const buildCanonical = (): CanonicalInvoice | null => {
    const parsed = invoiceDraftSchema.safeParse(getValues());
    if (!parsed.success) return null;
    const bankDetails = useSettingsStore.getState().bankDefaults;
    try {
      return toCanonicalInvoice(parsed.data, { bankDetails });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setExportError(message);
      return null;
    }
  };

  const onPreview = async () => {
    setExportError(null);
    const ok = await onValidate();
    if (!ok) return;
    const next = buildCanonical();
    if (!next) return;
    setCanonical(next);
    setOpen(true);
  };

  const onDownload = async () => {
    setExportError(null);
    const ok = await onValidate();
    if (!ok) return;
    const next = buildCanonical();
    if (!next) return;
    setBusy('download');
    try {
      const { downloadInvoicePdf } = await import('@/lib/pdf/export');
      await downloadInvoicePdf(next);
      bumpSequence(next.documentType as DocumentType);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setExportError(message);
    } finally {
      setBusy(null);
    }
  };

  const onConfirmDownloadFromDialog = () => {
    if (canonical) bumpSequence(canonical.documentType as DocumentType);
  };

  return (
    <>
      <div className="border-border/60 bg-background/90 sticky bottom-0 -mx-4 mt-6 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            aria-label={t.actions.reset}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t.actions.reset}
          </Button>
          <Button type="button" variant="outline" onClick={onPreview} disabled={busy !== null}>
            {busy === 'preview' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
            {t.actions.preview}
          </Button>
          <Button type="button" onClick={onDownload} disabled={busy !== null}>
            {busy === 'download' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {t.actions.download}
          </Button>
        </div>
        {exportError && (
          <p role="alert" className="text-destructive mt-2 text-right text-xs">
            {t.actions.exportError.replace('{message}', exportError)}
          </p>
        )}
      </div>
      <PreviewDialog
        canonical={canonical}
        open={open}
        onOpenChange={setOpen}
        onConfirmDownload={onConfirmDownloadFromDialog}
      />
    </>
  );
}
