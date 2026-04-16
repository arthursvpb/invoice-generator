const STORAGE_KEY = 'invgen:bugReport:v1';
const COOLDOWN_MS = 30_000;

type StoredState = { lastReportAt?: number };

function readState(): StoredState {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const last = (parsed as Record<string, unknown>).lastReportAt;
    return typeof last === 'number' ? { lastReportAt: last } : {};
  } catch {
    return {};
  }
}

function writeState(next: StoredState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable / quota — best-effort, ignore.
  }
}

export function getCooldownRemaining(now: number = Date.now()): number {
  const { lastReportAt } = readState();
  if (typeof lastReportAt !== 'number') return 0;
  const elapsed = now - lastReportAt;
  if (elapsed < 0 || elapsed >= COOLDOWN_MS) return 0;
  return COOLDOWN_MS - elapsed;
}

export function markReportSubmitted(now: number = Date.now()): void {
  writeState({ lastReportAt: now });
}

export function clearCooldown(): void {
  writeState({});
}

export const COOLDOWN_WINDOW_MS = COOLDOWN_MS;
export const BUG_REPORT_STORAGE_KEY = STORAGE_KEY;
