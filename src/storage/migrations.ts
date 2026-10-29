import { SCHEMA_VERSION } from './schemaVersion';

/**
 * Převody uložených dat ze starších verzí schématu. Každý krok převede
 * data o jednu verzi výš. Výsledek se potom běžně validuje; pokud
 * neprojde, úložiště bezpečně obnoví výchozí demo data.
 */

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const mapList = (v: unknown, fn: (item: Rec) => Rec): unknown => (Array.isArray(v) ? v.map((x) => (isRecord(x) ? fn(x) : x)) : v);

const STEPS: Record<number, (data: Rec) => Rec> = {
  // 1 → 2: poloha klientů a odborníků, věková skupina, forma konzultace.
  1: (data) => {
    const professional = { cityId: null, offersInPerson: false, worksWithYouth: false };
    return {
      ...data,
      schemaVersion: 2,
      session: isRecord(data.session) ? { ...data.session, cityId: null } : data.session,
      users: mapList(data.users, (u) => ({ ...u, homeCityId: null, ageGroup: u.role === 'client' ? 'adult' : null })),
      applications: mapList(data.applications, (a) => ({ ...professional, ...a })),
      profiles: mapList(data.profiles, (p) => ({ ...professional, ...p })),
      slots: mapList(data.slots, (s) => ({ format: 'online', ...s })),
      appointments: mapList(data.appointments, (a) => ({ format: 'online', ...a })),
    };
  },
  // 2 → 3: ověřování odborníků (registrace, doklady, prohlášení, výsledky ověření).
  2: (data) => {
    const check = (status: string, at: unknown) => ({ status, note: '', checkedAt: status === 'verified' ? at : null, checkedBy: null });
    const yearAfter = (iso: unknown) =>
      typeof iso === 'string' ? new Date(Date.parse(iso) + 365 * 24 * 3600 * 1000).toISOString() : new Date().toISOString();
    return {
      ...data,
      schemaVersion: 3,
      applications: mapList(data.applications, (a) => {
        const approved = a.status === 'approved';
        const status = approved ? 'verified' : 'pending';
        const at = a.decidedAt ?? null;
        return {
          registryNumber: '',
          documents: [],
          declarations: { truthful: approved, integrity: approved, ethics: approved, supervision: approved },
          ...a,
          verification: {
            identity: check(status, at),
            education: check(status, at),
            registry: check(status, at),
            declarations: check(status, at),
          },
        };
      }),
      profiles: mapList(data.profiles, (p) => ({ verificationValidUntil: yearAfter(p.approvedAt), ...p })),
    };
  },
};

/** Vrací převedená data, nebo původní hodnotu, pokud převod neexistuje. */
export function migrateState(raw: unknown): { data: unknown; migrated: boolean } {
  if (!isRecord(raw) || typeof raw.schemaVersion !== 'number') return { data: raw, migrated: false };
  let data: Rec = raw;
  let migrated = false;
  while (typeof data.schemaVersion === 'number' && data.schemaVersion < SCHEMA_VERSION) {
    const step = STEPS[data.schemaVersion];
    if (!step) break;
    data = step(data);
    migrated = true;
  }
  return { data, migrated };
}
