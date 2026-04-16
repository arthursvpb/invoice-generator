const ENDPOINT = 'https://api.frankfurter.dev/v1/latest';
const PROVIDER_LABEL = 'ECB via frankfurter.dev';
const FETCH_TIMEOUT_MS = 8000;

export type FxRate = {
  rate: string;
  date: string;
  provider: string;
  sourceUrl: string;
  base: string;
  quote: string;
};

export type FxResult = { ok: true; value: FxRate } | { ok: false; error: string };

function combinedSignal(external: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException('timeout', 'AbortError')),
    timeoutMs,
  );
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else
      external.addEventListener('abort', () => controller.abort(external.reason), { once: true });
  }
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return controller.signal;
}

export async function fetchLatestRate(
  base: string,
  quote: string,
  signal?: AbortSignal,
): Promise<FxResult> {
  const from = base.trim().toUpperCase();
  const to = quote.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return { ok: false, error: 'invalid currency code' };
  }
  if (from === to) {
    return { ok: false, error: 'same currency' };
  }
  const url = `${ENDPOINT}?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;
  try {
    const response = await fetch(url, { signal: combinedSignal(signal, FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const body = (await response.json()) as {
      base?: string;
      date?: string;
      rates?: Record<string, number>;
    };
    const numeric = body.rates?.[to];
    if (typeof numeric !== 'number' || !Number.isFinite(numeric) || numeric <= 0) {
      return { ok: false, error: `${to} not in response` };
    }
    const date =
      typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : new Date().toISOString().slice(0, 10);
    return {
      ok: true,
      value: {
        rate: numeric.toString(),
        date,
        provider: PROVIDER_LABEL,
        sourceUrl: url,
        base: from,
        quote: to,
      },
    };
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      return { ok: false, error: 'aborted' };
    }
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export { PROVIDER_LABEL };
