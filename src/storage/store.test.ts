import { describe, expect, it, vi } from 'vitest';
import { createSeed } from '../data/seed';
import { ok } from '../domain/result';
import { MemoryStorage, TEST_NOW } from '../test/helpers';
import { DemoStore, type StorageEventTarget } from './store';
import { SCHEMA_VERSION } from './schemaVersion';

const KEY = 'test:state';

function createStore(storage: MemoryStorage | null) {
  return new DemoStore({ storage, key: KEY, now: () => TEST_NOW, seed: createSeed });
}

describe('DemoStore', () => {
  it('při prvním spuštění uloží výchozí data', () => {
    const storage = new MemoryStorage();
    const store = createStore(storage);
    expect(store.getSnapshot().persistence).toBe('ok');
    expect(JSON.parse(storage.getItem(KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('neplatný JSON bezpečně nahradí výchozími daty a oznámí to', () => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, '{nefunkční json');
    const store = createStore(storage);
    expect(store.getSnapshot().recoveredFromInvalid).toBe(true);
    expect(store.getState().profiles.length).toBeGreaterThan(0);
    expect(() => JSON.parse(storage.getItem(KEY)!)).not.toThrow();
  });

  it('data starší verze schématu převede a zachová', () => {
    const storage = new MemoryStorage();
    const v1 = JSON.parse(JSON.stringify(createSeed(TEST_NOW))) as Record<string, unknown> & {
      users: Array<Record<string, unknown>>;
      profiles: Array<Record<string, unknown>>;
      applications: Array<Record<string, unknown>>;
      slots: Array<Record<string, unknown>>;
      appointments: Array<Record<string, unknown>>;
      session: Record<string, unknown>;
    };
    v1.schemaVersion = 1;
    v1.session = { userId: 'u-tereza' };
    v1.users.forEach((u) => { delete u.homeCityId; delete u.ageGroup; });
    for (const list of [v1.profiles, v1.applications]) list.forEach((p) => { delete p.cityId; delete p.offersInPerson; delete p.worksWithYouth; });
    for (const list of [v1.slots, v1.appointments]) list.forEach((x) => { delete x.format; });
    storage.setItem(KEY, JSON.stringify(v1));
    const store = createStore(storage);
    expect(store.getSnapshot().recoveredFromInvalid).toBe(false);
    expect(store.getState().schemaVersion).toBe(SCHEMA_VERSION);
    expect(store.getState().session.userId).toBe('u-tereza');
    expect(store.getState().slots.every((s) => s.format === 'online')).toBe(true);
    expect(JSON.parse(storage.getItem(KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('data jiné verze schématu nebo s chybnou strukturou nahradí', () => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, JSON.stringify({ ...createSeed(TEST_NOW), schemaVersion: 999 }));
    expect(createStore(storage).getSnapshot().recoveredFromInvalid).toBe(true);

    const broken = createSeed(TEST_NOW) as unknown as { slots: Array<Record<string, unknown>> };
    broken.slots[0]!.durationMinutes = 45;
    storage.setItem(KEY, JSON.stringify(broken));
    expect(createStore(storage).getSnapshot().recoveredFromInvalid).toBe(true);
  });

  it('funguje i bez dostupného úložiště (jen v paměti)', () => {
    const store = createStore(null);
    expect(store.getSnapshot().persistence).toBe('unavailable');
    const result = store.transact((state) => ok({ state: { ...state, session: { userId: 'u-tereza', cityId: null } }, value: null }));
    expect(result.ok).toBe(true);
    expect(store.getState().session.userId).toBe('u-tereza');
  });

  it('rozpozná zaplněné úložiště a ponechá změnu v paměti', () => {
    const storage = new MemoryStorage();
    const store = createStore(storage);
    storage.failWrites = 'quota';
    store.transact((state) => ok({ state: { ...state, session: { userId: 'u-tereza', cityId: null } }, value: null }));
    expect(store.getSnapshot().persistence).toBe('full');
    expect(store.getState().session.userId).toBe('u-tereza');
  });

  it('synchronizuje změny z jiné záložky přes událost storage', () => {
    const storage = new MemoryStorage();
    const tabA = createStore(storage);
    const tabB = createStore(storage);
    const handlers: Array<(e: StorageEvent) => void> = [];
    const target: StorageEventTarget = {
      addEventListener: (_type, handler) => handlers.push(handler),
      removeEventListener: vi.fn(),
    };
    tabB.connectToWindow(target);
    const listener = vi.fn();
    tabB.subscribe(listener);

    tabA.transact((state) => ok({ state: { ...state, session: { userId: 'u-ondrej', cityId: null } }, value: null }));
    handlers.forEach((h) => h({ key: KEY } as StorageEvent));

    expect(listener).toHaveBeenCalled();
    expect(tabB.getState().session.userId).toBe('u-ondrej');
  });

  it('před zápisem načte aktuální stav z jiné záložky', () => {
    const storage = new MemoryStorage();
    const tabA = createStore(storage);
    const tabB = createStore(storage);
    tabA.transact((state) => ok({ state: { ...state, feedback: [] }, value: null }));
    let seenFeedback = -1;
    tabB.transact((state) => {
      seenFeedback = state.feedback.length;
      return ok({ state, value: null });
    });
    expect(seenFeedback).toBe(0);
  });
});
