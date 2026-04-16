import type { DocumentType } from './types';

export const PREFIX_INVOICE = 'INV';
export const PREFIX_CANCELLATION = 'CN';

const PREFIXES: Record<DocumentType, 'INV' | 'CN'> = {
  invoice: PREFIX_INVOICE,
  cancellation: PREFIX_CANCELLATION,
};

const NUMBER_RE = /^(INV|CN)-(\d{4})-(\d{3,})$/;

export type NumberingParts = {
  prefix: 'INV' | 'CN';
  year: number;
  sequence: number;
};

export type NumberingState = {
  year: number;
  invNextSeq: number;
  cnNextSeq: number;
};

export function prefixFor(type: DocumentType): 'INV' | 'CN' {
  return PREFIXES[type];
}

export function documentTypeFor(prefix: 'INV' | 'CN'): DocumentType {
  return prefix === 'INV' ? 'invoice' : 'cancellation';
}

export function formatInvoiceNumber(
  type: DocumentType,
  year: number,
  sequence: number,
  padTo = 3,
): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error(`Invalid year: ${year}`);
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Invalid sequence: ${sequence}`);
  }
  const seq = String(sequence).padStart(padTo, '0');
  return `${prefixFor(type)}-${year}-${seq}`;
}

export function parseInvoiceNumber(value: string): NumberingParts | null {
  const match = NUMBER_RE.exec(value);
  if (!match) return null;
  return {
    prefix: match[1] as 'INV' | 'CN',
    year: Number(match[2]),
    sequence: Number(match[3]),
  };
}

export function suggestNextNumber(
  type: DocumentType,
  currentYear: number,
  state: NumberingState,
): string {
  const sameYear = state.year === currentYear;
  const nextSeq = sameYear ? (type === 'invoice' ? state.invNextSeq : state.cnNextSeq) : 1;
  return formatInvoiceNumber(type, currentYear, nextSeq);
}

export function bumpNumberingState(
  state: NumberingState,
  type: DocumentType,
  forYear: number,
): NumberingState {
  if (state.year !== forYear) {
    return {
      year: forYear,
      invNextSeq: type === 'invoice' ? 2 : 1,
      cnNextSeq: type === 'cancellation' ? 2 : 1,
    };
  }
  return {
    ...state,
    invNextSeq: type === 'invoice' ? state.invNextSeq + 1 : state.invNextSeq,
    cnNextSeq: type === 'cancellation' ? state.cnNextSeq + 1 : state.cnNextSeq,
  };
}
