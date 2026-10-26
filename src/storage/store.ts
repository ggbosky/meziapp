import { ok, type Result } from '../domain/result';
import type { DemoState } from '../domain/state';
import { validateDemoState } from './validate';

/**
 * Centrální úložiště demo dat. Jako jediné místo v aplikaci pracuje
 * s localStorage: načítá výchozí data, validuje uložený stav, zachytává
 * chyby nedostupného nebo zaplněného úložiště a synchronizuje změny
 * mezi záložkami prohlížeče.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** ok = změny se ukládají; unavailable = úložiště nejde použít; full = úložiště je zaplněné. */
export type PersistenceStatus = 'ok' | 'unavailable' | 'full';

export interface StoreSnapshot {
  state: DemoState;
  persistence: PersistenceStatus;
  /** Uložená data byla neplatná a nahradila je výchozí demo data. */
  recoveredFromInvalid: boolean;
}

export interface DemoStoreOptions {
  storage: StorageLike | null;
  key: string;
  now: () => Date;
  seed: (now: Date) => DemoState;
}

type Listener = () => void;

export interface StorageEventTarget {
  addEventListener(type: 'storage', listener: (event: StorageEvent) => void): void;
  removeEventListener(type: 'storage', listener: (event: StorageEvent) => void): void;
}

function isQuotaError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22 || code === 1014;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Bezpečně získá localStorage. V některých režimech prohlížeče přístup vyhodí výjimku. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export class DemoStore {
  private snapshot: StoreSnapshot;
  private readonly listeners = new Set<Listener>();
  /** Poslední serializovaný stav, který tato záložka zapsala nebo načetla. */
  private lastRaw: string | null = null;

  constructor(private readonly options: DemoStoreOptions) {
    this.snapshot = this.loadInitial();
  }

  readonly getSnapshot = (): StoreSnapshot => this.snapshot;

  readonly getState = (): DemoState => this.snapshot.state;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Provede změnu stavu. Před zápisem znovu načte aktuálně uložená data
   * (mohla je změnit jiná záložka), takže pravidla se ověřují nad čerstvým
   * stavem. Nejde o transakci napříč zařízeními — to bez serveru nelze.
   */
  transact<T>(change: (state: DemoState) => Result<{ state: DemoState; value: T }>): Result<T> {
    this.syncFromStorage();
    const result = change(this.snapshot.state);
    if (!result.ok) return result;
    if (result.value.state !== this.snapshot.state) {
      const persistence = this.write(result.value.state);
      this.snapshot = { ...this.snapshot, state: result.value.state, persistence };
      this.emit();
    }
    return ok(result.value.value);
  }

  /** Obnoví výchozí demo data. Přihlášený demo účet zůstane, pokud v nových datech existuje. */
  reset(): void {
    const fresh = this.options.seed(this.options.now());
    const currentUserId = this.snapshot.state.session.userId;
    if (currentUserId && fresh.users.some((u) => u.id === currentUserId)) {
      fresh.session = { userId: currentUserId };
    }
    const persistence = this.write(fresh);
    this.snapshot = { state: fresh, persistence, recoveredFromInvalid: false };
    this.emit();
  }

  dismissRecoveryNotice(): void {
    if (!this.snapshot.recoveredFromInvalid) return;
    this.snapshot = { ...this.snapshot, recoveredFromInvalid: false };
    this.emit();
  }

  /**
   * Načte stav z úložiště, pokud se změnil (typicky zápisem z jiné záložky).
   * Neplatná data z cizího zápisu ignoruje a ponechá poslední platný stav.
   */
  syncFromStorage(): boolean {
    const { storage, key } = this.options;
    if (!storage) return false;
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return false;
    }
    if (raw === null || raw === this.lastRaw) return false;
    const validation = validateDemoState(safeParse(raw));
    if (!validation.ok) return false;
    this.lastRaw = raw;
    this.snapshot = { ...this.snapshot, state: validation.state };
    this.emit();
    return true;
  }

  /** Připojí synchronizaci přes událost „storage“, kterou prohlížeč posílá ostatním záložkám. */
  connectToWindow(target: StorageEventTarget): () => void {
    const handler = (event: StorageEvent) => {
      if (event.key === null || event.key === this.options.key) this.syncFromStorage();
    };
    target.addEventListener('storage', handler);
    return () => target.removeEventListener('storage', handler);
  }

  private loadInitial(): StoreSnapshot {
    const { storage, key, now, seed } = this.options;
    let raw: string | null = null;
    let readable = storage !== null;
    try {
      raw = storage ? storage.getItem(key) : null;
    } catch {
      readable = false;
    }

    if (raw !== null) {
      const validation = validateDemoState(safeParse(raw));
      if (validation.ok) {
        this.lastRaw = raw;
        return { state: validation.state, persistence: 'ok', recoveredFromInvalid: false };
      }
      const fresh = seed(now());
      return { state: fresh, persistence: this.write(fresh), recoveredFromInvalid: true };
    }

    const fresh = seed(now());
    return { state: fresh, persistence: readable ? this.write(fresh) : 'unavailable', recoveredFromInvalid: false };
  }

  private write(state: DemoState): StoreSnapshot['persistence'] {
    const { storage, key } = this.options;
    if (!storage) return 'unavailable';
    const raw = JSON.stringify(state);
    try {
      storage.setItem(key, raw);
      this.lastRaw = raw;
      return 'ok';
    } catch (error) {
      return isQuotaError(error) ? 'full' : 'unavailable';
    }
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
