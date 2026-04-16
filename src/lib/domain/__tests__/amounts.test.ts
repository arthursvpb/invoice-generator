import { describe, expect, it } from 'vitest';
import {
  calculateContractualAmount,
  calculatePayoutAmount,
  eq,
  gt,
  isPositive,
  isValidDecimal,
  multiply,
  negate,
  parseDecimal,
  toFixed,
} from '../amounts';

describe('amounts.isValidDecimal', () => {
  it('accepts integers and decimals', () => {
    expect(isValidDecimal('0')).toBe(true);
    expect(isValidDecimal('56')).toBe(true);
    expect(isValidDecimal('33.50')).toBe(true);
    expect(isValidDecimal('-12.75')).toBe(true);
  });

  it('rejects invalid or scientific input', () => {
    expect(isValidDecimal('')).toBe(false);
    expect(isValidDecimal('abc')).toBe(false);
    expect(isValidDecimal('1.2.3')).toBe(false);
    expect(isValidDecimal('1e5')).toBe(false);
    expect(isValidDecimal('.5')).toBe(false);
    expect(isValidDecimal(' 12')).toBe(false);
  });
});

describe('amounts.parseDecimal', () => {
  it('throws on invalid', () => {
    expect(() => parseDecimal('bad')).toThrow();
  });
});

describe('amounts.multiply', () => {
  it('multiplies and rounds to the requested precision', () => {
    expect(multiply('56', '33')).toBe('1848.00');
    expect(multiply('1848', '1.08', 2)).toBe('1995.84');
  });

  it('applies banker rounding at the halfway point', () => {
    expect(multiply('0.125', '1', 2)).toBe('0.12');
    expect(multiply('0.135', '1', 2)).toBe('0.14');
    expect(multiply('0.145', '1', 2)).toBe('0.14');
    expect(multiply('0.155', '1', 2)).toBe('0.16');
  });

  it('preserves precision that floats would lose', () => {
    expect(multiply('0.1', '0.2', 20)).toBe('0.02000000000000000000');
  });
});

describe('amounts.negate', () => {
  it('flips sign and keeps fixed decimals', () => {
    expect(negate('1848.00')).toBe('-1848.00');
    expect(negate('-1848.00')).toBe('1848.00');
    expect(negate('0', 2)).toBe('0.00');
  });
});

describe('amounts.toFixed', () => {
  it('pads decimals without altering numeric value', () => {
    expect(toFixed('33', 2)).toBe('33.00');
    expect(toFixed('1.2', 3)).toBe('1.200');
  });
});

describe('amounts.comparisons', () => {
  it('returns false on invalid input rather than throwing', () => {
    expect(isPositive('')).toBe(false);
    expect(isPositive(' ')).toBe(false);
    expect(isPositive('abc')).toBe(false);
    expect(gt('', '1')).toBe(false);
    expect(gt('1', 'abc')).toBe(false);
    expect(eq('', '0')).toBe(false);
    expect(eq('1.00', 'nope')).toBe(false);
  });

  it('gt and eq work across decimal precisions', () => {
    expect(gt('1.01', '1.00')).toBe(true);
    expect(gt('1.00', '1.01')).toBe(false);
    expect(eq('1.00', '1.000')).toBe(true);
    expect(isPositive('0.01')).toBe(true);
    expect(isPositive('0')).toBe(false);
    expect(isPositive('-0.01')).toBe(false);
  });
});

describe('amounts named calculators', () => {
  it('computes contractual amount', () => {
    expect(calculateContractualAmount('56', '33')).toBe('1848.00');
    expect(calculateContractualAmount('37.5', '45')).toBe('1687.50');
  });

  it('computes payout amount from contractual and fx rate', () => {
    expect(calculatePayoutAmount('1848.00', '1.08')).toBe('1995.84');
    expect(calculatePayoutAmount('1687.50', '0.195')).toBe('329.06');
  });
});
