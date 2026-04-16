'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { formatInvoiceNumber, bumpNumberingState } from '@/lib/domain/numbering';
import type { DocumentType, Locale } from '@/lib/domain/types';
import type { InvoiceDraftInput } from '@/lib/domain/schema';

const STORAGE_KEY = 'invgen:draft:v1';
const SCHEMA_VERSION = 2;

export type NumberingState = {
  year: number;
  invNextSeq: number;
  cnNextSeq: number;
};

type DraftState = {
  draft: InvoiceDraftInput;
  documentType: DocumentType;
  numbering: NumberingState;
  locale: Locale;
  lastEditedAt: string | null;
  wasResetFromCorruption: boolean;
};

type DraftActions = {
  updateDraft: (partial: Partial<InvoiceDraftInput>) => void;
  replaceDraft: (next: InvoiceDraftInput) => void;
  setDocumentType: (type: DocumentType) => void;
  setLocale: (locale: Locale) => void;
  bumpSequence: (type: DocumentType) => void;
  suggestNumber: (type: DocumentType) => string;
  resetDraft: () => void;
  acknowledgeCorruptionReset: () => void;
};

export type DraftStore = DraftState & DraftActions;

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDefaultDraft(): InvoiceDraftInput {
  const year = new Date().getFullYear();
  return {
    documentType: 'invoice',
    invoiceNumber: formatInvoiceNumber('invoice', year, 1),
    issueDate: todayIso(),
    locale: 'pt-BR',
    issuer: { legalName: '' },
    payer: { legalName: '' },
    contract: {
      serviceDescription: '',
      hourlyRate: '',
      contractCurrency: 'EUR',
      payoutCurrency: 'EUR',
    },
    timesheet: {
      periodStart: '',
      periodEnd: '',
      totalHours: '',
    },
  } as InvoiceDraftInput;
}

function createInitialState(): DraftState {
  return {
    draft: createDefaultDraft(),
    documentType: 'invoice',
    numbering: {
      year: new Date().getFullYear(),
      invNextSeq: 1,
      cnNextSeq: 1,
    },
    locale: 'pt-BR',
    lastEditedAt: null,
    wasResetFromCorruption: false,
  };
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      updateDraft: (partial) =>
        set((state) => ({
          draft: { ...state.draft, ...partial } as InvoiceDraftInput,
          lastEditedAt: new Date().toISOString(),
        })),
      replaceDraft: (next) => set({ draft: next, lastEditedAt: new Date().toISOString() }),
      setDocumentType: (type) => set({ documentType: type }),
      setLocale: (locale) =>
        set((state) => ({
          locale,
          draft: { ...state.draft, locale } as InvoiceDraftInput,
        })),
      bumpSequence: (type) =>
        set((state) => ({
          numbering: bumpNumberingState(state.numbering, type, state.numbering.year),
        })),
      suggestNumber: (type) => {
        const year = new Date().getFullYear();
        const state = get();
        const sameYear = state.numbering.year === year;
        const seq = sameYear
          ? type === 'invoice'
            ? state.numbering.invNextSeq
            : state.numbering.cnNextSeq
          : 1;
        return formatInvoiceNumber(type, year, seq);
      },
      resetDraft: () => set({ ...createInitialState(), wasResetFromCorruption: false }),
      acknowledgeCorruptionReset: () => set({ wasResetFromCorruption: false }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      migrate: (persisted) => {
        const fallback = createInitialState();
        if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) {
          return { ...fallback, wasResetFromCorruption: true };
        }
        const previous = persisted as Partial<DraftState>;
        if (!previous.draft || typeof previous.draft !== 'object') {
          return { ...fallback, wasResetFromCorruption: true };
        }
        const previousDraft = previous.draft as Record<string, unknown>;
        const rawTimesheet = previousDraft.timesheet;
        const previousTimesheet =
          rawTimesheet && typeof rawTimesheet === 'object'
            ? (rawTimesheet as Record<string, unknown>)
            : {};
        const cleanDraft = {
          ...previousDraft,
          timesheet: {
            periodStart: (previousTimesheet.periodStart as string) ?? '',
            periodEnd: (previousTimesheet.periodEnd as string) ?? '',
            totalHours: (previousTimesheet.totalHours as string) ?? '',
          },
        };
        delete (cleanDraft as Record<string, unknown>).endClient;
        return {
          ...fallback,
          draft: cleanDraft as InvoiceDraftInput,
          documentType: previous.documentType ?? fallback.documentType,
          numbering: previous.numbering ?? fallback.numbering,
          locale: previous.locale ?? fallback.locale,
          lastEditedAt: previous.lastEditedAt ?? null,
          wasResetFromCorruption: false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useDraftStore.setState({
            ...createInitialState(),
            wasResetFromCorruption: true,
          });
        } else if (state) {
          useDraftStore.setState({ wasResetFromCorruption: false });
        }
      },
      partialize: (state) => ({
        draft: state.draft,
        documentType: state.documentType,
        numbering: state.numbering,
        locale: state.locale,
        lastEditedAt: state.lastEditedAt,
      }),
    },
  ),
);
