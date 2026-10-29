import { LANGUAGE_CODES, SPECIALIZATION_IDS } from '../domain/catalog';
import type { DemoState } from '../domain/state';
import { CITY_IDS } from '../domain/places';
import { isValidISO } from '../domain/time';
import { SCHEMA_VERSION } from './schemaVersion';

/**
 * Ruční validace dat načtených z localStorage. Data mohou být poškozená,
 * ručně upravená nebo uložená starší verzí aplikace, proto jim nevěříme.
 */

type Rec = Record<string, unknown>;

const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isISO = (v: unknown): boolean => isString(v) && isValidISO(v);
const isISOOrNull = (v: unknown): boolean => v === null || isISO(v);
const isStringOrNull = (v: unknown): boolean => v === null || isString(v);
const isBool = (v: unknown): boolean => typeof v === 'boolean';
const isFiniteNumber = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);
const oneOf =
  <T extends string | number>(...values: readonly T[]) =>
  (v: unknown): boolean =>
    values.includes(v as T);
const arrayOf =
  (check: (v: unknown) => boolean) =>
  (v: unknown): boolean =>
    Array.isArray(v) && v.every(check);

type Shape = Record<string, (v: unknown) => boolean>;

function matches(value: unknown, shape: Shape): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(shape).every(([key, check]) => check(value[key]));
}

const specializations = arrayOf(oneOf(...SPECIALIZATION_IDS));
const languages = arrayOf(oneOf(...LANGUAGE_CODES));
const cityOrNull = (v: unknown): boolean => v === null || (isString(v) && CITY_IDS.includes(v));
const format = oneOf('online', 'in_person');

const applicationFields: Shape = {
  professionalName: isString,
  professionalRole: isString,
  qualificationSummary: isString,
  specializations,
  languages,
  capacityPerMonth: isFiniteNumber,
  bio: isString,
  cityId: cityOrNull,
  offersInPerson: isBool,
  worksWithYouth: isBool,
};

const shapes = {
  user: {
    id: isString,
    role: oneOf('client', 'professional', 'admin'),
    displayName: isString,
    email: isString,
    demoDescription: isString,
    createdAt: isISO,
    homeCityId: cityOrNull,
    ageGroup: (v: unknown) => v === null || v === 'adult' || v === 'youth',
  },
  application: {
    ...applicationFields,
    id: isString,
    userId: isString,
    status: oneOf('draft', 'submitted', 'approved', 'needs_changes', 'rejected'),
    createdAt: isISO,
    updatedAt: isISO,
    submittedAt: isISOOrNull,
    decidedAt: isISOOrNull,
    reviewerMessage: isStringOrNull,
    internalNote: isString,
    profileId: isStringOrNull,
  },
  profile: {
    ...applicationFields,
    id: isString,
    userId: isString,
    applicationId: isString,
    approach: isString,
    status: oneOf('active', 'suspended'),
    suspendedAt: isISOOrNull,
    suspensionReason: isStringOrNull,
    acceptingBookings: isBool,
    approvedAt: isISO,
    avatarTone: isFiniteNumber,
  },
  slot: {
    id: isString,
    profileId: isString,
    startsAt: isISO,
    durationMinutes: oneOf(30, 50),
    format,
    status: oneOf('published', 'withdrawn'),
    createdAt: isISO,
    withdrawnAt: isISOOrNull,
  },
  appointment: {
    id: isString,
    slotId: isString,
    profileId: isString,
    clientId: isString,
    startsAt: isISO,
    durationMinutes: oneOf(30, 50),
    format,
    status: oneOf('booked', 'cancelled_by_client', 'cancelled_by_psychologist', 'completed'),
    createdAt: isISO,
    cancelledAt: isISOOrNull,
  },
  feedback: {
    id: isString,
    appointmentId: isString,
    clientId: isString,
    createdAt: isISO,
    processClarity: oneOf('clear', 'partly', 'unclear'),
    note: isString,
  },
  audit: {
    id: isString,
    at: isISO,
    actorId: isString,
    action: oneOf(
      'application_approved',
      'application_changes_requested',
      'application_rejected',
      'application_note_updated',
      'profile_suspended',
      'profile_reactivated',
    ),
    targetType: oneOf('application', 'profile'),
    targetId: isString,
    summary: isString,
  },
} satisfies Record<string, Shape>;

export type ValidationResult = { ok: true; state: DemoState } | { ok: false; reason: string };

export function validateDemoState(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return { ok: false, reason: 'Data nejsou objekt.' };
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: `Nepodporovaná verze schématu (${String(raw.schemaVersion)}).` };
  }
  if (!isISO(raw.seededAt)) return { ok: false, reason: 'Chybí datum vytvoření dat.' };
  if (!isRecord(raw.session) || !isStringOrNull(raw.session.userId) || !cityOrNull(raw.session.cityId)) {
    return { ok: false, reason: 'Neplatná relace.' };
  }

  const collections: Array<[keyof typeof shapes, string]> = [
    ['user', 'users'],
    ['application', 'applications'],
    ['profile', 'profiles'],
    ['slot', 'slots'],
    ['appointment', 'appointments'],
    ['feedback', 'feedback'],
    ['audit', 'auditEvents'],
  ];
  for (const [shape, key] of collections) {
    const list = raw[key];
    if (!Array.isArray(list)) return { ok: false, reason: `Chybí kolekce ${key}.` };
    const index = list.findIndex((item) => !matches(item, shapes[shape]));
    if (index !== -1) return { ok: false, reason: `Neplatný záznam v kolekci ${key} (pozice ${index}).` };
  }

  const state = raw as unknown as DemoState;

  // Základní referenční integrita, aby rozhraní nenarazilo na chybějící vazby.
  const userIds = new Set(state.users.map((u) => u.id));
  const profileIds = new Set(state.profiles.map((p) => p.id));
  const slotIds = new Set(state.slots.map((s) => s.id));
  const appointmentIds = new Set(state.appointments.map((a) => a.id));
  if (state.session.userId !== null && !userIds.has(state.session.userId)) {
    return { ok: false, reason: 'Relace odkazuje na neexistujícího uživatele.' };
  }
  if (!state.profiles.every((p) => userIds.has(p.userId))) return { ok: false, reason: 'Profil bez uživatele.' };
  if (!state.applications.every((a) => userIds.has(a.userId))) return { ok: false, reason: 'Přihláška bez uživatele.' };
  if (!state.slots.every((s) => profileIds.has(s.profileId))) return { ok: false, reason: 'Termín bez profilu.' };
  if (!state.appointments.every((a) => slotIds.has(a.slotId) && userIds.has(a.clientId) && profileIds.has(a.profileId))) {
    return { ok: false, reason: 'Rezervace s neplatnou vazbou.' };
  }
  if (!state.feedback.every((f) => appointmentIds.has(f.appointmentId))) {
    return { ok: false, reason: 'Zpětná vazba bez rezervace.' };
  }
  return { ok: true, state };
}
