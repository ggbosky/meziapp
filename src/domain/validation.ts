import { LANGUAGE_CODES, SPECIALIZATION_IDS } from './catalog';
import { CITY_IDS } from './places';
import { allDeclared, DOCUMENT_RULES, emptyDeclarations } from './verification';
import type { ApplicationFields, LanguageCode, SpecializationId } from './types';

export type FieldErrors = Record<string, string>;

export const APPLICATION_LIMITS = {
  professionalName: { min: 3, max: 80 },
  professionalRole: { min: 2, max: 60 },
  qualificationSummary: { min: 30, max: 1000 },
  bio: { min: 30, max: 800 },
  capacity: { min: 1, max: 40 },
  specializationsMax: 5,
} as const;

export const PROFILE_LIMITS = {
  approach: { min: 30, max: 1200 },
  bio: { min: 0, max: 800 },
} as const;

export const FEEDBACK_NOTE_MAX = 400;
export const ADMIN_MESSAGE_LIMITS = { min: 10, max: 600 } as const;
export const INTERNAL_NOTE_MAX = 1000;

function checkText(errors: FieldErrors, field: string, value: string, min: number, max: number, label: string, required: boolean) {
  const length = value.trim().length;
  if (length === 0) {
    if (required) errors[field] = `Vyplň prosím pole „${label}“.`;
    return;
  }
  if (length < min) errors[field] = `Pole „${label}“ potřebuje aspoň ${min} znaků (teď ${length}).`;
  else if (length > max) errors[field] = `Pole „${label}“ může mít nejvýš ${max} znaků (teď ${length}).`;
}

/**
 * Validace přihlášky odborníka. Rozpracovaná verze kontroluje jen maximální
 * délky a formát, k odeslání musí být vyplněné vše.
 */
export function validateApplicationFields(fields: ApplicationFields, mode: 'draft' | 'submit'): FieldErrors {
  const errors: FieldErrors = {};
  const required = mode === 'submit';
  const L = APPLICATION_LIMITS;
  checkText(errors, 'professionalName', fields.professionalName, L.professionalName.min, L.professionalName.max, 'Profesní jméno', required);
  checkText(errors, 'professionalRole', fields.professionalRole, L.professionalRole.min, L.professionalRole.max, 'Profesní role', required);
  checkText(
    errors,
    'qualificationSummary',
    fields.qualificationSummary,
    L.qualificationSummary.min,
    L.qualificationSummary.max,
    'Shrnutí kvalifikace',
    required,
  );
  checkText(errors, 'bio', fields.bio, L.bio.min, L.bio.max, 'Profesní popis', required);

  if (!fields.specializations.every((s) => (SPECIALIZATION_IDS as string[]).includes(s))) {
    errors.specializations = 'Vyber zaměření ze seznamu.';
  } else if (required && fields.specializations.length === 0) {
    errors.specializations = 'Vyber aspoň jedno zaměření.';
  } else if (fields.specializations.length > L.specializationsMax) {
    errors.specializations = `Vyber nejvýš ${L.specializationsMax} zaměření.`;
  }

  if (!fields.languages.every((l) => (LANGUAGE_CODES as string[]).includes(l))) {
    errors.languages = 'Vyber jazyk ze seznamu.';
  } else if (required && fields.languages.length === 0) {
    errors.languages = 'Vyber aspoň jeden jazyk.';
  }

  if (fields.cityId !== null && !CITY_IDS.includes(fields.cityId)) {
    errors.cityId = 'Vyber město ze seznamu.';
  } else if (fields.offersInPerson && !fields.cityId) {
    errors.cityId = 'Pro osobní setkání vyber město, kde konzultace nabízíš.';
  }

  const registry = fields.registryNumber.trim();
  if (registry.length > 40) errors.registryNumber = 'Číslo může mít nejvýš 40 znaků.';
  else if (required && registry.length < 3) {
    errors.registryNumber = 'Uveď číslo v profesním registru nebo číslo členství, abychom ho mohli ověřit.';
  }

  if (fields.documents.length > DOCUMENT_RULES.maxFiles) {
    errors.documents = `Přilož nejvýš ${DOCUMENT_RULES.maxFiles} dokladů.`;
  } else if (required && !fields.documents.some((d) => d.kind === 'diploma')) {
    errors.documents = 'Přilož prosím diplom. Bez něj nemůžeme ověřit vzdělání.';
  }

  if (required && !allDeclared(fields.declarations)) {
    errors.declarations = 'K odeslání je potřeba potvrdit všechna prohlášení.';
  }

  const capacity = fields.capacityPerMonth;
  if (!Number.isInteger(capacity) || capacity < L.capacity.min || capacity > L.capacity.max) {
    if (required || capacity !== 0) {
      errors.capacityPerMonth = `Kapacita musí být celé číslo od ${L.capacity.min} do ${L.capacity.max}.`;
    }
  }
  return errors;
}

export interface ProfileEditInput {
  approach: string;
  bio: string;
  specializations: SpecializationId[];
  languages: LanguageCode[];
  cityId: string | null;
  offersInPerson: boolean;
  worksWithYouth: boolean;
}

export function validateProfileEdit(input: ProfileEditInput): FieldErrors {
  const errors: FieldErrors = {};
  checkText(errors, 'approach', input.approach, PROFILE_LIMITS.approach.min, PROFILE_LIMITS.approach.max, 'Jak pracuji', true);
  if (input.bio.trim().length > PROFILE_LIMITS.bio.max) {
    errors.bio = `Pole „O mně“ může mít nejvýš ${PROFILE_LIMITS.bio.max} znaků.`;
  }
  if (input.specializations.length === 0) errors.specializations = 'Vyber aspoň jedno zaměření.';
  else if (input.specializations.length > APPLICATION_LIMITS.specializationsMax) {
    errors.specializations = `Vyber nejvýš ${APPLICATION_LIMITS.specializationsMax} zaměření.`;
  }
  if (input.languages.length === 0) errors.languages = 'Vyber aspoň jeden jazyk.';
  if (input.cityId !== null && !CITY_IDS.includes(input.cityId)) errors.cityId = 'Vyber město ze seznamu.';
  else if (input.offersInPerson && !input.cityId) errors.cityId = 'Pro osobní setkání vyber město, kde konzultace nabízíš.';
  return errors;
}

export function emptyApplicationFields(): ApplicationFields {
  return {
    professionalName: '',
    professionalRole: '',
    qualificationSummary: '',
    specializations: [],
    languages: ['cs'],
    capacityPerMonth: 4,
    bio: '',
    cityId: null,
    offersInPerson: false,
    worksWithYouth: false,
    registryNumber: '',
    documents: [],
    declarations: emptyDeclarations(),
  };
}
