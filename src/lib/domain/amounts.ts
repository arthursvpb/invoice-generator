import Big from 'big.js';

Big.RM = Big.roundHalfEven;

const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

export function isValidDecimal(value: string): boolean {
  return DECIMAL_RE.test(value);
}

export function parseDecimal(value: string): Big {
  if (!isValidDecimal(value)) {
    throw new Error(`Invalid decimal string: ${JSON.stringify(value)}`);
  }
  return new Big(value);
}

export function toFixed(value: string, decimals = 2): string {
  return parseDecimal(value).toFixed(decimals);
}

export function multiply(a: string, b: string, decimals = 2): string {
  return parseDecimal(a).times(parseDecimal(b)).toFixed(decimals);
}

export function divide(a: string, b: string, decimals = 2): string {
  return parseDecimal(a).div(parseDecimal(b)).toFixed(decimals);
}

export function negate(value: string, decimals = 2): string {
  return parseDecimal(value).times(-1).toFixed(decimals);
}

export function sum(values: string[], decimals = 2): string {
  if (values.length === 0) return new Big(0).toFixed(decimals);
  return values.reduce((acc, v) => acc.plus(parseDecimal(v)), new Big(0)).toFixed(decimals);
}

export function isPositive(value: string): boolean {
  if (!isValidDecimal(value)) return false;
  return new Big(value).gt(0);
}

export function gt(a: string, b: string): boolean {
  if (!isValidDecimal(a) || !isValidDecimal(b)) return false;
  return new Big(a).gt(new Big(b));
}

export function eq(a: string, b: string, decimals = 2): boolean {
  if (!isValidDecimal(a) || !isValidDecimal(b)) return false;
  return new Big(a).round(decimals).eq(new Big(b).round(decimals));
}

export function calculateContractualAmount(hours: string, rate: string): string {
  return multiply(hours, rate, 2);
}

export function calculatePayoutAmount(contractualAmount: string, fxRate: string): string {
  return multiply(contractualAmount, fxRate, 2);
}
