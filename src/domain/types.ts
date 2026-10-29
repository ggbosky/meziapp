/**
 * Doménové entity prototypu. Všechny časové údaje se ukládají jako ISO 8601
 * v UTC (s příponou „Z“), takže jsou jednoznačné bez ohledu na časové pásmo
 * prohlížeče. Pro zobrazení se převádějí do Europe/Prague.
 */

export type ISODateTime = string;

export type UserRole = 'client' | 'professional' | 'admin';

/** Věková skupina klienta: dospělý (18+), nebo dospívající (15–17). */
export type AgeGroup = 'adult' | 'youth';

/** Forma konzultace. Osobně jen u odborníků, kteří osobní setkání nabízejí. */
export type ConsultationFormat = 'online' | 'in_person';

export interface User {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  /** Krátký popis účtu pro výběr v demo režimu. */
  demoDescription: string;
  createdAt: ISODateTime;
  /** Jen klienti: nejbližší větší město (bez adresy). */
  homeCityId: string | null;
  /** Jen klienti: věková skupina. */
  ageGroup: AgeGroup | null;
}

export type SpecializationId =
  | 'anxiety'
  | 'relationships'
  | 'grief'
  | 'burnout'
  | 'life_changes'
  | 'self_esteem'
  | 'loneliness'
  | 'young_adults';

export type LanguageCode = 'cs' | 'sk' | 'en' | 'uk' | 'de';

/** Body, které administrace ověřuje před schválením odborníka. */
export type VerificationItem = 'identity' | 'education' | 'registry' | 'declarations';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface VerificationCheck {
  status: VerificationStatus;
  /** Interní poznámka administrace k ověření (co a jak bylo zkontrolováno). */
  note: string;
  checkedAt: ISODateTime | null;
  checkedBy: string | null;
}

export type DocumentKind = 'diploma' | 'registry' | 'training';

/** Přiložený doklad. V prototypu se ukládá jen název a velikost souboru, ne jeho obsah. */
export interface ApplicationDocument {
  id: string;
  kind: DocumentKind;
  fileName: string;
  sizeBytes: number;
  addedAt: ISODateTime;
}

export interface Declarations {
  /** Údaje jsou pravdivé a doklady patří žadateli. */
  truthful: boolean;
  /** Bezúhonnost. */
  integrity: boolean;
  /** Dodržování etického kodexu. */
  ethics: boolean;
  /** Dostupná supervize nebo odborná konzultace. */
  supervision: boolean;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'needs_changes' | 'rejected';

export interface ApplicationFields {
  professionalName: string;
  professionalRole: string;
  qualificationSummary: string;
  specializations: SpecializationId[];
  languages: LanguageCode[];
  /** Kolik konzultací měsíčně odborník nabízí. */
  capacityPerMonth: number;
  bio: string;
  /** Město praxe (nejbližší větší město). */
  cityId: string | null;
  /** Nabízí kromě online i osobní setkání. */
  offersInPerson: boolean;
  /** Pracuje i s dospívajícími (15–17 let). */
  worksWithYouth: boolean;
  /** Číslo v profesním registru nebo číslo členství v profesní organizaci. */
  registryNumber: string;
  documents: ApplicationDocument[];
  declarations: Declarations;
}

export interface PsychologistApplication extends ApplicationFields {
  id: string;
  userId: string;
  status: ApplicationStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  submittedAt: ISODateTime | null;
  decidedAt: ISODateTime | null;
  /** Zpráva pro žadatele (co doplnit nebo proč byla přihláška zamítnuta). */
  reviewerMessage: string | null;
  /** Interní provozní poznámka administrace. Týká se pouze přihlášky. */
  internalNote: string;
  profileId: string | null;
  /** Výsledky ověření jednotlivých bodů administrací. */
  verification: Record<VerificationItem, VerificationCheck>;
}

export type ProfileStatus = 'active' | 'suspended';

export interface PsychologistProfile {
  id: string;
  userId: string;
  applicationId: string;
  professionalName: string;
  professionalRole: string;
  qualificationSummary: string;
  specializations: SpecializationId[];
  languages: LanguageCode[];
  capacityPerMonth: number;
  cityId: string | null;
  offersInPerson: boolean;
  worksWithYouth: boolean;
  /** Popis přístupu ke konzultacím. */
  approach: string;
  bio: string;
  /** Pozastavení administrací. Pozastavený profil není veřejně vidět. */
  status: ProfileStatus;
  suspendedAt: ISODateTime | null;
  suspensionReason: string | null;
  /** Odborník si může sám pozastavit příjem nových rezervací. */
  acceptingBookings: boolean;
  approvedAt: ISODateTime;
  /** Do kdy platí ověření odbornosti; poté je potřeba ověřit znovu. */
  verificationValidUntil: ISODateTime;
  /** Index barevného tónu avataru. */
  avatarTone: number;
}

export type ConsultationDuration = 30 | 50;

/** „published“ = termín je vypsaný; „withdrawn“ = odborník ho stáhl a veřejně se nenabízí. */
export type SlotStatus = 'published' | 'withdrawn';

export interface AvailabilitySlot {
  id: string;
  profileId: string;
  startsAt: ISODateTime;
  durationMinutes: ConsultationDuration;
  format: ConsultationFormat;
  status: SlotStatus;
  createdAt: ISODateTime;
  withdrawnAt: ISODateTime | null;
}

export type AppointmentStatus = 'booked' | 'cancelled_by_client' | 'cancelled_by_psychologist' | 'completed';

export interface Appointment {
  id: string;
  slotId: string;
  profileId: string;
  clientId: string;
  startsAt: ISODateTime;
  durationMinutes: ConsultationDuration;
  format: ConsultationFormat;
  status: AppointmentStatus;
  createdAt: ISODateTime;
  cancelledAt: ISODateTime | null;
}

export type ProcessClarity = 'clear' | 'partly' | 'unclear';

/** Soukromá zpětná vazba k průběhu služby. Nejde o měření účinnosti. */
export interface Feedback {
  id: string;
  appointmentId: string;
  clientId: string;
  createdAt: ISODateTime;
  processClarity: ProcessClarity;
  note: string;
}

export type AuditAction =
  | 'application_approved'
  | 'application_changes_requested'
  | 'application_rejected'
  | 'application_note_updated'
  | 'application_verification_updated'
  | 'profile_suspended'
  | 'profile_reactivated';

export interface AuditEvent {
  id: string;
  at: ISODateTime;
  actorId: string;
  action: AuditAction;
  targetType: 'application' | 'profile';
  targetId: string;
  summary: string;
}

export interface DemoSession {
  userId: string | null;
  /** Poloha nepřihlášeného návštěvníka (jen v tomto prohlížeči). */
  cityId: string | null;
}
