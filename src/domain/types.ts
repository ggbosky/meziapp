/**
 * Doménové entity prototypu. Všechny časové údaje se ukládají jako ISO 8601
 * v UTC (s příponou „Z“), takže jsou jednoznačné bez ohledu na časové pásmo
 * prohlížeče. Pro zobrazení se převádějí do Europe/Prague.
 */

export type ISODateTime = string;

export type UserRole = 'client' | 'professional' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  /** Krátký popis účtu pro výběr v demo režimu. */
  demoDescription: string;
  createdAt: ISODateTime;
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
}
