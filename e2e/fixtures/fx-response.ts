import type { Page, Route } from '@playwright/test';

const ENDPOINT_GLOB = 'https://api.frankfurter.dev/v1/latest*';

type Handler = (route: Route) => void | Promise<void>;

async function install(page: Page, handler: Handler): Promise<void> {
  await page.route(ENDPOINT_GLOB, handler);
}

export async function mockFxOk(
  page: Page,
  options: { rate?: number; date?: string; quote?: string } = {},
): Promise<void> {
  const rate = options.rate ?? 1.0834;
  const date = options.date ?? '2026-04-15';
  const quote = options.quote ?? 'USD';
  await install(page, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ base: 'EUR', date, rates: { [quote]: rate } }),
    });
  });
}

export async function mockFx502(page: Page): Promise<void> {
  await install(page, async (route) => {
    await route.fulfill({ status: 502, body: 'Bad Gateway' });
  });
}

export async function mockFxMissingCurrency(page: Page): Promise<void> {
  await install(page, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        base: 'EUR',
        date: '2026-04-15',
        rates: { GBP: 0.85 },
      }),
    });
  });
}

export async function mockFxAbort(page: Page): Promise<void> {
  await install(page, async (route) => {
    await route.abort('failed');
  });
}

export async function mockFxSlow(page: Page, delayMs = 9_000): Promise<void> {
  await install(page, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        base: 'EUR',
        date: '2026-04-15',
        rates: { USD: 1.08 },
      }),
    });
  });
}

export async function recordFxCalls(page: Page): Promise<() => string[]> {
  const calls: string[] = [];
  await page.route(ENDPOINT_GLOB, async (route) => {
    calls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        base: 'EUR',
        date: '2026-04-15',
        rates: { USD: 1.0834 },
      }),
    });
  });
  return () => calls;
}
