'use client';

import * as React from 'react';
import { Download, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { downloadInvoicePdf, previewInvoiceUrl, pdfFilename } from '@/lib/pdf/export';
import { useT } from '@/lib/i18n/use-t';
import type { CanonicalInvoice } from '@/lib/domain/types';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; url: string }
  | { kind: 'error'; message: string };

export function PreviewDialog({
  canonical,
  open,
  onOpenChange,
  onConfirmDownload,
}: {
  canonical: CanonicalInvoice | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onConfirmDownload: () => void;
}) {
  const t = useT();
  const [status, setStatus] = React.useState<Status>({ kind: 'idle' });

  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    if (!open || !canonical) {
      setStatus({ kind: 'idle' });
      return;
    }

    setStatus({ kind: 'loading' });
    previewInvoiceUrl(canonical)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setStatus({ kind: 'ready', url });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setStatus({ kind: 'error', message });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, canonical]);

  const handleDownload = async () => {
    if (!canonical) return;
    await downloadInvoicePdf(canonical);
    onConfirmDownload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[min(96vw,960px)] max-w-none flex-col gap-3 p-0 sm:rounded-lg">
        <DialogHeader className="border-border/60 border-b px-4 py-3 text-left">
          <DialogTitle className="text-sm font-semibold">
            {canonical ? pdfFilename(canonical) : t.actions.preview}
          </DialogTitle>
          <DialogDescription className="text-xs">{t.actions.preview}</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/30 relative flex-1 overflow-hidden">
          {status.kind === 'loading' && (
            <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              {t.actions.preview}…
            </div>
          )}
          {status.kind === 'error' && (
            <div className="text-destructive absolute inset-0 flex items-center justify-center px-6 text-center text-xs">
              <div>
                <X className="mx-auto mb-1 size-4" aria-hidden />
                <p>{status.message}</p>
              </div>
            </div>
          )}
          {status.kind === 'ready' && (
            <iframe
              title={canonical ? pdfFilename(canonical) : 'Invoice preview'}
              src={status.url}
              className="h-full w-full border-0"
            />
          )}
        </div>
        <div className="border-border/60 flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t.toast.dismiss}
          </Button>
          <Button type="button" onClick={handleDownload} disabled={status.kind !== 'ready'}>
            <Download className="size-4" aria-hidden />
            {t.actions.download}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
