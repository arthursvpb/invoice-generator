import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BUG_REPORT_STORAGE_KEY,
  COOLDOWN_WINDOW_MS,
  clearCooldown,
  getCooldownRemaining,
  markReportSubmitted,
} from '../cooldown';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('cooldown', () => {
  it('returns 0 when nothing has been recorded', () => {
    expect(getCooldownRemaining()).toBe(0);
  });

  it('returns the remaining window after a fresh mark', () => {
    const now = 1_000_000;
    markReportSubmitted(now);
    expect(getCooldownRemaining(now + 1_000)).toBe(COOLDOWN_WINDOW_MS - 1_000);
  });

  it('returns 0 once the window has elapsed', () => {
    const now = 2_000_000;
    markReportSubmitted(now);
    expect(getCooldownRemaining(now + COOLDOWN_WINDOW_MS)).toBe(0);
    expect(getCooldownRemaining(now + COOLDOWN_WINDOW_MS + 1)).toBe(0);
  });

  it('clearCooldown resets to zero immediately', () => {
    markReportSubmitted(5_000_000);
    clearCooldown();
    expect(getCooldownRemaining(5_000_000)).toBe(0);
  });

  it('ignores malformed storage and returns 0', () => {
    localStorage.setItem(BUG_REPORT_STORAGE_KEY, 'not-json');
    expect(getCooldownRemaining()).toBe(0);
  });

  it('ignores stored objects without a numeric lastReportAt', () => {
    localStorage.setItem(BUG_REPORT_STORAGE_KEY, JSON.stringify({ other: 'value' }));
    expect(getCooldownRemaining()).toBe(0);
  });

  it('treats negative elapsed time as expired (clock drift safety)', () => {
    const future = 10_000_000;
    markReportSubmitted(future);
    expect(getCooldownRemaining(future - 1_000)).toBe(0);
  });
});
