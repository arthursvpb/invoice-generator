'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from 'next-themes';
import { Bug, Check, Copy, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { interpolate, useT } from '@/lib/i18n/use-t';
import { useDraftStore } from '@/lib/store/draft-store';
import { buildIssueUrl, type BugReportContext } from '@/lib/bug-report/build-issue-url';
import {
  COOLDOWN_WINDOW_MS,
  getCooldownRemaining,
  markReportSubmitted,
} from '@/lib/bug-report/cooldown';

type FormValues = { title: string; description: string };

function buildContext(locale: string, theme: string | undefined): BugReportContext {
  const safeTimezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'unknown';
    }
  })();
  return {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    locale,
    theme: theme ?? 'system',
    timezone: safeTimezone,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
  };
}

export function BugReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const t = useT();
  const locale = useDraftStore((s) => s.locale);
  const { resolvedTheme } = useTheme();
  const [includeContext, setIncludeContext] = React.useState(true);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [popupUrl, setPopupUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const schema = React.useMemo(
    () =>
      z.object({
        title: z
          .string()
          .trim()
          .min(5, t.bugReport.errors.titleTooShort)
          .max(120, t.bugReport.errors.titleTooLong),
        description: z
          .string()
          .trim()
          .min(20, t.bugReport.errors.descriptionTooShort)
          .max(4000, t.bugReport.errors.descriptionTooLong),
      }),
    [t],
  );

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (!open) return;
    const tick = () => setCooldownSeconds(Math.ceil(getCooldownRemaining() / 1000));
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      methods.reset({ title: '', description: '' });
      setPopupUrl(null);
      setCopied(false);
    }
  }, [open, methods]);

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (cooldownSeconds > 0) return;
    const context = includeContext ? buildContext(locale, resolvedTheme) : null;
    const url = buildIssueUrl(
      { title: values.title, description: values.description, context },
      t.bugReport.issue,
    );
    markReportSubmitted();
    setCooldownSeconds(Math.ceil(COOLDOWN_WINDOW_MS / 1000));
    const newWindow = window.open(url, '_blank', 'noopener');
    if (!newWindow) {
      setPopupUrl(url);
      return;
    }
    onOpenChange(false);
  };

  const onCopyUrl = async () => {
    if (!popupUrl) return;
    try {
      await navigator.clipboard.writeText(popupUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  const titleError = methods.formState.errors.title?.message;
  const descriptionError = methods.formState.errors.description?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,560px)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="size-4" aria-hidden />
            {t.bugReport.dialogTitle}
          </DialogTitle>
          <DialogDescription>{t.bugReport.dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="bug-report.title"
              className={titleError ? 'text-destructive' : undefined}
            >
              {t.bugReport.titleLabel}
            </Label>
            <Input
              id="bug-report.title"
              placeholder={t.bugReport.titlePlaceholder}
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? 'bug-report.title-error' : undefined}
              autoComplete="off"
              {...methods.register('title')}
            />
            {titleError && (
              <p id="bug-report.title-error" role="alert" className="text-destructive text-xs">
                {titleError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="bug-report.description"
              className={descriptionError ? 'text-destructive' : undefined}
            >
              {t.bugReport.descriptionLabel}
            </Label>
            <Textarea
              id="bug-report.description"
              placeholder={t.bugReport.descriptionPlaceholder}
              aria-invalid={descriptionError ? true : undefined}
              aria-describedby={descriptionError ? 'bug-report.description-error' : undefined}
              rows={6}
              {...methods.register('description')}
            />
            {descriptionError && (
              <p
                id="bug-report.description-error"
                role="alert"
                className="text-destructive text-xs"
              >
                {descriptionError}
              </p>
            )}
          </div>

          <label className="border-border/60 bg-muted/30 flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(event) => setIncludeContext(event.target.checked)}
              className="mt-0.5"
            />
            <span className="space-y-0.5">
              <span className="font-medium">{t.bugReport.includeContextLabel}</span>
              <span className="text-muted-foreground block text-xs">
                {t.bugReport.includeContextHint}
              </span>
            </span>
          </label>

          {popupUrl && (
            <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
              <p>{t.bugReport.popupBlocked}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopyUrl}
                className="h-7 gap-1 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="size-3" aria-hidden />
                    {t.bugReport.copied}
                  </>
                ) : (
                  <>
                    <Copy className="size-3" aria-hidden />
                    {t.bugReport.copyUrl}
                  </>
                )}
              </Button>
            </div>
          )}

          <DialogFooter className="gap-2">
            {cooldownSeconds > 0 && (
              <span
                role="status"
                aria-live="polite"
                className="text-muted-foreground mr-auto self-center text-xs"
              >
                {interpolate(t.bugReport.cooldown, { seconds: cooldownSeconds })}
              </span>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.bugReport.cancel}
            </Button>
            <Button type="submit" disabled={cooldownSeconds > 0}>
              <ExternalLink className="size-4" aria-hidden />
              {t.bugReport.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
