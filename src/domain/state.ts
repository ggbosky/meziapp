import type {
  Appointment,
  AuditEvent,
  AvailabilitySlot,
  DemoSession,
  Feedback,
  ISODateTime,
  PsychologistApplication,
  PsychologistProfile,
  User,
} from './types';

/** Kompletní stav demo dat, který se ukládá do localStorage. */
export interface DemoState {
  schemaVersion: number;
  /** Kdy byla výchozí data vygenerována (termíny se počítají relativně k tomuto okamžiku). */
  seededAt: ISODateTime;
  session: DemoSession;
  users: User[];
  applications: PsychologistApplication[];
  profiles: PsychologistProfile[];
  slots: AvailabilitySlot[];
  appointments: Appointment[];
  feedback: Feedback[];
  auditEvents: AuditEvent[];
}
