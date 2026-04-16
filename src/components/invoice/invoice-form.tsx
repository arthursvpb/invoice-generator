'use client';

import * as React from 'react';
import { FormProvider, useForm, type FieldErrors, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceDraftSchema, type InvoiceDraftInput } from '@/lib/domain/schema';
import type { DocumentType } from '@/lib/domain/types';
import { useDraftStore, createDefaultDraft } from '@/lib/store/draft-store';
import { useT } from '@/lib/i18n/use-t';
import { DocumentTypeToggle } from './document-type-toggle';
import { ErrorSummary } from './error-summary';
import { CorruptionBanner } from './corruption-banner';
import { IssuerSection } from './sections/issuer-section';
import { PayerSection } from './sections/payer-section';
import { ContractSection } from './sections/contract-section';
import { TimesheetSection } from './sections/timesheet-section';
import { FxReferenceSection } from './sections/fx-reference-section';
import { CancellationReferenceSection } from './sections/cancellation-reference-section';
import { BankDetailsSection } from './sections/bank-details-section';
import { NumberingSection } from './sections/numbering-section';
import { NotesSection } from './sections/notes-section';
import { ExportActions } from './export-actions';

type ErrorTree = FieldErrors | { message?: string; type?: string; ref?: unknown };

function findFirstErrorPath(errors: ErrorTree | undefined, path = ''): string | null {
  if (!errors || typeof errors !== 'object') return null;
  for (const [key, raw] of Object.entries(errors)) {
    const value = raw as ErrorTree | undefined;
    if (!value || typeof value !== 'object') continue;
    const nextPath = path ? `${path}.${key}` : key;
    if ('message' in value && typeof value.message === 'string') {
      return nextPath;
    }
    const nested = findFirstErrorPath(value as FieldErrors, nextPath);
    if (nested) return nested;
  }
  return null;
}

function focusAndScroll(path: string) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(path) as HTMLElement | null;
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function InvoiceForm() {
  const t = useT();
  const storedDraft = useDraftStore((s) => s.draft);
  const storedLocale = useDraftStore((s) => s.locale);

  const methods = useForm<InvoiceDraftInput>({
    defaultValues: storedDraft,
    resolver: zodResolver(invoiceDraftSchema),
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (useDraftStore.persist.hasHydrated()) {
      methods.reset(useDraftStore.getState().draft, { keepDirty: false });
      return;
    }
    const unsubscribe = useDraftStore.persist.onFinishHydration((state) => {
      methods.reset(state.draft, { keepDirty: false });
    });
    return unsubscribe;
  }, [methods]);

  React.useEffect(() => {
    const subscription = methods.watch((values) => {
      if (!values) return;
      useDraftStore.getState().replaceDraft(values as InvoiceDraftInput);
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  React.useEffect(() => {
    if (methods.getValues('locale') !== storedLocale) {
      methods.setValue('locale', storedLocale, { shouldDirty: false });
    }
  }, [storedLocale, methods]);

  const documentType = (methods.watch('documentType') as DocumentType) ?? 'invoice';

  const onDocumentTypeChange = (next: DocumentType) => {
    methods.setValue('documentType', next, { shouldDirty: true });
    const suggested = useDraftStore.getState().suggestNumber(next);
    methods.setValue('invoiceNumber', suggested, {
      shouldDirty: true,
      shouldValidate: methods.formState.isSubmitted,
    });
    if (next === 'cancellation') {
      methods.setValue(
        'originalInvoice',
        {
          invoiceNumber: '',
          issueDate: '',
          contractualAmount: '',
          currency: methods.getValues('contract.contractCurrency') ?? '',
        },
        { shouldDirty: true },
      );
    } else {
      methods.unregister('originalInvoice');
    }
  };

  const onSubmit: SubmitHandler<InvoiceDraftInput> = () => {
    return;
  };

  const handleReset = () => {
    if (!confirm(t.actions.confirmReset)) return;
    useDraftStore.getState().resetDraft();
    methods.reset(createDefaultDraft());
  };

  const validateAll = async (): Promise<boolean> => {
    const valid = await methods.trigger();
    if (!valid) {
      const firstPath = findFirstErrorPath(methods.formState.errors);
      if (firstPath) {
        focusAndScroll(firstPath);
      }
    }
    return valid;
  };

  const pageCopy = documentType === 'cancellation' ? t.page.cancellation : t.page.invoice;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
              {pageCopy.eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{pageCopy.title}</h1>
          </div>
          <DocumentTypeToggle value={documentType} onChange={onDocumentTypeChange} />
        </div>

        <CorruptionBanner />
        <ErrorSummary />

        <IssuerSection />
        <PayerSection />
        <BankDetailsSection />
        <ContractSection />
        <TimesheetSection />
        <FxReferenceSection />
        <CancellationReferenceSection />
        <NumberingSection />
        <NotesSection />
        <ExportActions onReset={handleReset} onValidate={validateAll} />
      </form>
    </FormProvider>
  );
}
