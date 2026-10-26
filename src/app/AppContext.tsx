import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Result } from '../domain/result';
import type { User } from '../domain/types';
import type { AppServices } from '../services/types';
import type { StoreSnapshot } from '../storage/store';

const ServicesContext = createContext<AppServices | null>(null);

export function ServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices musí být uvnitř ServicesProvider');
  return services;
}

/**
 * Odebírá změny demo dat. Komponenty volají čtecí metody služeb během
 * renderu; tento hook zajistí nové vykreslení po každé změně stavu.
 */
export function useDemoSnapshot(): StoreSnapshot {
  const { demo } = useServices();
  return useSyncExternalStore(demo.subscribe, demo.getSnapshot, demo.getSnapshot);
}

export function useCurrentUser(): User | null {
  const services = useServices();
  useDemoSnapshot();
  return services.session.getCurrentUser();
}

/** Aktuální čas, který se po minutě obnoví (např. pro přechod rezervace do historie). */
export function useNow(intervalMs = 60_000): Date {
  const { now } = useServices();
  const [current, setCurrent] = useState(() => now());
  useEffect(() => {
    const id = window.setInterval(() => setCurrent(now()), intervalMs);
    return () => window.clearInterval(id);
  }, [now, intervalMs]);
  return current;
}

/**
 * Spustí asynchronní akci a zabrání jejímu opakovanému spuštění, dokud
 * neskončí (ochrana proti dvojkliku i na úrovni rozhraní).
 */
export function useAction<Args extends unknown[], T>(action: (...args: Args) => Promise<Result<T>>) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (...args: Args): Promise<Result<T> | null> => {
      if (running.current) return null;
      running.current = true;
      setPending(true);
      try {
        return await action(...args);
      } finally {
        running.current = false;
        setPending(false);
      }
    },
    [action],
  );
  return [run, pending] as const;
}
