import { describe, expect, it } from 'vitest';
import {
  bumpNumberingState,
  documentTypeFor,
  formatInvoiceNumber,
  parseInvoiceNumber,
  prefixFor,
  suggestNextNumber,
} from '../numbering';

describe('numbering.formatInvoiceNumber', () => {
  it('formats invoice and cancellation numbers with zero padding', () => {
    expect(formatInvoiceNumber('invoice', 2026, 1)).toBe('INV-2026-001');
    expect(formatInvoiceNumber('invoice', 2026, 42)).toBe('INV-2026-042');
    expect(formatInvoiceNumber('cancellation', 2026, 7)).toBe('CN-2026-007');
    expect(formatInvoiceNumber('invoice', 2026, 1234)).toBe('INV-2026-1234');
  });

  it('throws on invalid year or sequence', () => {
    expect(() => formatInvoiceNumber('invoice', 999, 1)).toThrow();
    expect(() => formatInvoiceNumber('invoice', 2026, 0)).toThrow();
    expect(() => formatInvoiceNumber('invoice', 2026, -1)).toThrow();
  });
});

describe('numbering.parseInvoiceNumber', () => {
  it('parses valid numbers', () => {
    expect(parseInvoiceNumber('INV-2026-001')).toEqual({
      prefix: 'INV',
      year: 2026,
      sequence: 1,
    });
    expect(parseInvoiceNumber('CN-2025-0042')).toEqual({
      prefix: 'CN',
      year: 2025,
      sequence: 42,
    });
  });

  it('returns null on malformed input', () => {
    expect(parseInvoiceNumber('INV-2026-1')).toBeNull();
    expect(parseInvoiceNumber('INV-202-001')).toBeNull();
    expect(parseInvoiceNumber('XXX-2026-001')).toBeNull();
    expect(parseInvoiceNumber('inv-2026-001')).toBeNull();
    expect(parseInvoiceNumber('')).toBeNull();
  });
});

describe('numbering.prefix helpers', () => {
  it('prefixFor and documentTypeFor are inverses', () => {
    expect(prefixFor('invoice')).toBe('INV');
    expect(prefixFor('cancellation')).toBe('CN');
    expect(documentTypeFor('INV')).toBe('invoice');
    expect(documentTypeFor('CN')).toBe('cancellation');
  });
});

describe('numbering.suggestNextNumber', () => {
  it('uses the next sequence for the matching year and type', () => {
    const state = { year: 2026, invNextSeq: 5, cnNextSeq: 2 };
    expect(suggestNextNumber('invoice', 2026, state)).toBe('INV-2026-005');
    expect(suggestNextNumber('cancellation', 2026, state)).toBe('CN-2026-002');
  });

  it('resets to 1 when the year changes', () => {
    const state = { year: 2025, invNextSeq: 12, cnNextSeq: 3 };
    expect(suggestNextNumber('invoice', 2026, state)).toBe('INV-2026-001');
    expect(suggestNextNumber('cancellation', 2026, state)).toBe('CN-2026-001');
  });
});

describe('numbering.bumpNumberingState', () => {
  it('advances only the bumped type when the year matches', () => {
    const state = { year: 2026, invNextSeq: 3, cnNextSeq: 2 };
    expect(bumpNumberingState(state, 'invoice', 2026)).toEqual({
      year: 2026,
      invNextSeq: 4,
      cnNextSeq: 2,
    });
    expect(bumpNumberingState(state, 'cancellation', 2026)).toEqual({
      year: 2026,
      invNextSeq: 3,
      cnNextSeq: 3,
    });
  });

  it('resets both counters when the year rolls over', () => {
    const state = { year: 2025, invNextSeq: 12, cnNextSeq: 4 };
    expect(bumpNumberingState(state, 'invoice', 2026)).toEqual({
      year: 2026,
      invNextSeq: 2,
      cnNextSeq: 1,
    });
    expect(bumpNumberingState(state, 'cancellation', 2026)).toEqual({
      year: 2026,
      invNextSeq: 1,
      cnNextSeq: 2,
    });
  });
});
