'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { formatInvoiceNumber, bumpNumberingState } from '@/lib/domain/numbering';
import type {
  DocumentType,
  HourlyServiceItem,
  LineItem,
  Locale,
  ReimbursementItem,
} from '@/lib/domain/types';
import type { InvoiceDraftInput } from '@/lib/domain/schema';

const STORAGE_KEY = 'invgen:draft:v1';
const SCHEMA_VERSION = 3;

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

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyHourlyServiceItem(): HourlyServiceItem {
  return {
    id: newId(),
    kind: 'hourly_service',
    description: '',
    quantity: '',
    rate: '',
  };
}

export function createEmptyReimbursementItem(payoutCurrency: string): ReimbursementItem {
  return {
    id: newId(),
    kind: 'reimbursement',
    description: '',
    originalAmount: '',
    originalCurrency: payoutCurrency,
  };
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
      contractCurrency: 'EUR',
      payoutCurrency: 'EUR',
    },
    servicePeriod: {
      periodStart: '',
      periodEnd: '',
    },
    lineItems: [createEmptyHourlyServiceItem()],
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

function migrateLegacyDraft(rawDraft: Record<string, unknown>): InvoiceDraftInput | null {
  const legacyContract =
    typeof rawDraft.contract === 'object' && rawDraft.contract !== null
      ? (rawDraft.contract as Record<string, unknown>)
      : {};
  const legacyTimesheet =
    typeof rawDraft.timesheet === 'object' && rawDraft.timesheet !== null
      ? (rawDraft.timesheet as Record<string, unknown>)
      : {};
  const legacyServicePeriod =
    typeof rawDraft.servicePeriod === 'object' && rawDraft.servicePeriod !== null
      ? (rawDraft.servicePeriod as Record<string, unknown>)
      : {};

  const description =
    typeof legacyContract.serviceDescription === 'string' ? legacyContract.serviceDescription : '';
  const rate = typeof legacyContract.hourlyRate === 'string' ? legacyContract.hourlyRate : '';
  const quantity = typeof legacyTimesheet.totalHours === 'string' ? legacyTimesheet.totalHours : '';

  const hourlyItem: HourlyServiceItem = {
    id: newId(),
    kind: 'hourly_service',
    description,
    quantity,
    rate,
  };

  const periodStart =
    (typeof legacyServicePeriod.periodStart === 'string' && legacyServicePeriod.periodStart) ||
    (typeof legacyTimesheet.periodStart === 'string' ? legacyTimesheet.periodStart : '');
  const periodEnd =
    (typeof legacyServicePeriod.periodEnd === 'string' && legacyServicePeriod.periodEnd) ||
    (typeof legacyTimesheet.periodEnd === 'string' ? legacyTimesheet.periodEnd : '');

  const existingLineItems = Array.isArray(rawDraft.lineItems)
    ? (rawDraft.lineItems as LineItem[])
    : null;

  const cleaned: Record<string, unknown> = { ...rawDraft };
  delete cleaned.endClient;
  delete cleaned.timesheet;
  cleaned.contract = {
    contractCurrency:
      typeof legacyContract.contractCurrency === 'string' ? legacyContract.contractCurrency : 'EUR',
    payoutCurrency:
      typeof legacyContract.payoutCurrency === 'string' ? legacyContract.payoutCurrency : 'EUR',
    payoutMethod:
      typeof legacyContract.payoutMethod === 'string' ? legacyContract.payoutMethod : undefined,
  };
  cleaned.servicePeriod = { periodStart, periodEnd };
  cleaned.lineItems =
    existingLineItems && existingLineItems.length > 0 ? existingLineItems : [hourlyItem];

  return cleaned as InvoiceDraftInput;
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
        const migratedDraft = migrateLegacyDraft(previous.draft as Record<string, unknown>);
        if (!migratedDraft) {
          return { ...fallback, wasResetFromCorruption: true };
        }
        return {
          ...fallback,
          draft: migratedDraft,
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
