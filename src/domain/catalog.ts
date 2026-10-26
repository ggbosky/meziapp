import type { ApplicationStatus, AppointmentStatus, LanguageCode, SpecializationId } from './types';

export const SPECIALIZATIONS: ReadonlyArray<{ id: SpecializationId; label: string }> = [
  { id: 'anxiety', label: 'Úzkost a stres' },
  { id: 'relationships', label: 'Vztahy a rodina' },
  { id: 'grief', label: 'Ztráta a truchlení' },
  { id: 'burnout', label: 'Pracovní zátěž a vyčerpání' },
  { id: 'life_changes', label: 'Životní změny' },
  { id: 'self_esteem', label: 'Sebehodnocení' },
  { id: 'loneliness', label: 'Osamělost' },
  { id: 'young_adults', label: 'Studium a mladá dospělost' },
];

export const LANGUAGES: ReadonlyArray<{ id: LanguageCode; label: string }> = [
  { id: 'cs', label: 'Čeština' },
  { id: 'sk', label: 'Slovenština' },
  { id: 'en', label: 'Angličtina' },
  { id: 'uk', label: 'Ukrajinština' },
  { id: 'de', label: 'Němčina' },
];

export const SPECIALIZATION_IDS = SPECIALIZATIONS.map((s) => s.id);
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.id);

export function specializationLabel(id: SpecializationId): string {
  return SPECIALIZATIONS.find((s) => s.id === id)?.label ?? id;
}

export function languageLabel(id: LanguageCode): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Rozpracovaná',
  submitted: 'Čeká na posouzení',
  approved: 'Schválená',
  needs_changes: 'Vyžaduje doplnění',
  rejected: 'Zamítnutá',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: 'Naplánovaná',
  completed: 'Proběhlá',
  cancelled_by_client: 'Zrušená klientem',
  cancelled_by_psychologist: 'Zrušená odborníkem',
};
