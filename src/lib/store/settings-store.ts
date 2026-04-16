'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BankDetails, Party } from '@/lib/domain/types';

const STORAGE_KEY = 'invgen:settings:v1';
const SCHEMA_VERSION = 4;

export type FxCacheEntry = {
  rate: string;
  date: string;
  fetchedAt: number;
};

export type FxCache = Record<string, FxCacheEntry>;

type SettingsState = {
  issuerDefaults: Party | null;
  bankDefaults: BankDetails | null;
  fxCache: FxCache;
};

type SettingsActions = {
  setIssuerDefaults: (party: Party | null) => void;
  setBankDefaults: (next: BankDetails | null) => void;
  setCachedFxRate: (base: string, quote: string, rate: string, date: string) => void;
  clearFxCache: () => void;
};

export type SettingsStore = SettingsState & SettingsActions;

function fxKey(base: string, quote: string): string {
  return `${base.toUpperCase()}_${quote.toUpperCase()}`;
}

function createInitialState(): SettingsState {
  return {
    issuerDefaults: null,
    bankDefaults: null,
    fxCache: {},
  };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...createInitialState(),
      setIssuerDefaults: (party) => set({ issuerDefaults: party }),
      setBankDefaults: (next) => set({ bankDefaults: next }),
      setCachedFxRate: (base, quote, rate, date) =>
        set((state) => ({
          fxCache: {
            ...state.fxCache,
            [fxKey(base, quote)]: { rate, date, fetchedAt: Date.now() },
          },
        })),
      clearFxCache: () => set({ fxCache: {} }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) {
          return createInitialState();
        }
        const previous = persisted as Partial<SettingsState>;
        const fxCache =
          previous.fxCache &&
          typeof previous.fxCache === 'object' &&
          !Array.isArray(previous.fxCache)
            ? previous.fxCache
            : {};
        return {
          issuerDefaults: previous.issuerDefaults ?? null,
          bankDefaults: previous.bankDefaults ?? null,
          fxCache,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          useSettingsStore.setState(createInitialState());
        }
      },
    },
  ),
);

export { fxKey };
