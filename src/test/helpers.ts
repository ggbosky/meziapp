import type { StorageLike } from '../storage/store';
import { createLocalServices, type LocalServices } from '../services/local/createLocalServices';

/** Jednoduché úložiště v paměti, které se chová jako localStorage. */
export class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  failWrites: 'quota' | 'error' | null = null;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites === 'quota') {
      const error = new Error('Quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    }
    if (this.failWrites === 'error') throw new Error('Storage disabled');
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

/** Pevný čas pro testy: pondělí 26. 10. 2026 9:00 v Praze (8:00 UTC). */
export const TEST_NOW = new Date('2026-10-26T08:00:00.000Z');

export function createTestClock(start: Date = TEST_NOW) {
  let current = start.getTime();
  return {
    now: () => new Date(current),
    set: (date: Date) => {
      current = date.getTime();
    },
    advanceMinutes: (minutes: number) => {
      current += minutes * 60_000;
    },
  };
}

export function createTestServices(storage: StorageLike | null = new MemoryStorage(), clock = createTestClock()): LocalServices {
  return createLocalServices({ storage, now: clock.now, storageKey: 'test:state' });
}
