import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLatestRate, PROVIDER_LABEL } from '../frankfurter-client';

const realFetch = global.fetch;

function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  global.fetch = realFetch;
});

describe('fetchLatestRate', () => {
  it('returns the parsed rate on success', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ base: 'EUR', date: '2026-04-15', rates: { USD: 1.0834 } }));
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('EUR', 'USD');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rate).toBe('1.0834');
      expect(result.value.date).toBe('2026-04-15');
      expect(result.value.provider).toBe(PROVIDER_LABEL);
      expect(result.value.base).toBe('EUR');
      expect(result.value.quote).toBe('USD');
      expect(result.value.sourceUrl).toContain('base=EUR');
      expect(result.value.sourceUrl).toContain('symbols=USD');
    }
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('uppercases and trims currency codes', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ base: 'EUR', date: '2026-04-15', rates: { BRL: 5.88 } }));
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate(' eur ', 'brl');
    expect(result.ok).toBe(true);
    const url = (mock.mock.calls[0]?.[0] as string) ?? '';
    expect(url).toContain('base=EUR');
    expect(url).toContain('symbols=BRL');
  });

  it('rejects same-currency requests without calling fetch', async () => {
    const mock = vi.fn();
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('EUR', 'EUR');
    expect(result.ok).toBe(false);
    expect(mock).not.toHaveBeenCalled();
  });

  it('rejects invalid currency codes without calling fetch', async () => {
    const mock = vi.fn();
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('XX', 'USD');
    expect(result.ok).toBe(false);
    expect(mock).not.toHaveBeenCalled();
  });

  it('reports HTTP errors', async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse({}, { status: 502 }));
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('EUR', 'USD');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('502');
    }
  });

  it('reports missing currency in response', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ base: 'EUR', date: '2026-04-15', rates: { GBP: 0.85 } }));
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('EUR', 'USD');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('USD');
    }
  });

  it('reports network errors', async () => {
    const mock = vi.fn().mockRejectedValue(new TypeError('network down'));
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('EUR', 'USD');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('network down');
    }
  });

  it('returns aborted when the signal is aborted', async () => {
    const mock = vi.fn().mockImplementation(() => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      return Promise.reject(e);
    });
    global.fetch = mock as unknown as typeof fetch;
    const result = await fetchLatestRate('EUR', 'USD');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('aborted');
    }
  });
});
