import type { Result } from '../domain/result';
import type { SlotState } from '../domain/rules';
import type {
  ApplicationFields,
  Appointment,
  AppointmentStatus,
  AuditEvent,
  AvailabilitySlot,
  ConsultationDuration,
  Feedback,
  ISODateTime,
  LanguageCode,
  ProcessClarity,
  PsychologistApplication,
  PsychologistProfile,
  SpecializationId,
  User,
} from '../domain/types';
import type { ProfileEditInput } from '../domain/validation';
import type { PersistenceStatus, StoreSnapshot } from '../storage/store';

/**
 * Rozhraní služeb, se kterými pracují komponenty. Dnešní implementace běží
 * nad localStorage (services/local). Budoucí backendová implementace může
 * stejná rozhraní splnit voláním API: čtecí metody pracují nad lokální
 * cache stavu, zápisové metody jsou asynchronní a vracejí Result.
 *
 * Kontroly oprávnění v lokální implementaci simulují chování skutečné služby.
 * NEJSOU bezpečnostním mechanismem — všechna demo data má návštěvník
 * technicky k dispozici ve svém prohlížeči.
 */

// ——— Pohledy (view modely) ———

export interface PublicProfileSummary {
  profile: PsychologistProfile;
  nextSlot: AvailabilitySlot | null;
  openSlotCount: number;
}

export type CatalogSort = 'soonest' | 'name';

export interface CatalogQuery {
  specialization?: SpecializationId | null;
  language?: LanguageCode | null;
  /** Jen odborníci s volným termínem do N dní. */
  availableWithinDays?: number | null;
  sort?: CatalogSort;
}

export interface ClientAppointmentView {
  appointment: Appointment;
  status: AppointmentStatus;
  profile: PsychologistProfile;
  feedback: Feedback | null;
  canCancel: boolean;
  canGiveFeedback: boolean;
}

export interface PracticeAppointmentView {
  appointment: Appointment;
  status: AppointmentStatus;
  /** Minimum údajů o klientovi: křestní jméno a iniciála. */
  clientLabel: string;
  canCancel: boolean;
}

export interface OwnSlotView {
  slot: AvailabilitySlot;
  state: SlotState;
  appointment: Appointment | null;
  clientLabel: string | null;
  canWithdraw: boolean;
  canCancelBooking: boolean;
}

export type ProfessionalStatus =
  | { kind: 'no_application' }
  | { kind: 'application'; application: PsychologistApplication }
  | { kind: 'approved'; application: PsychologistApplication; profile: PsychologistProfile };

export interface AdminProfileView {
  profile: PsychologistProfile;
  upcomingOpenSlots: number;
  upcomingBookings: number;
}

export interface AdminAppointmentView {
  appointment: Appointment;
  status: AppointmentStatus;
  profileName: string;
  clientLabel: string;
}

export interface AdminStats {
  /** Vypsané (nestažené) termíny v demo datech. */
  offeredSlots: number;
  /** Všechny rezervace včetně zrušených. */
  bookings: number;
  /** Podíl vypsaných termínů s naplánovanou nebo proběhlou rezervací. */
  occupancy: number;
  cancelledByClient: number;
  cancelledByPsychologist: number;
  completed: number;
  upcoming: { days: number; offeredSlots: number; bookedSlots: number; occupancy: number };
}

export interface FeedbackInput {
  processClarity: ProcessClarity;
  note: string;
}

export interface NewSlotInput {
  startsAt: ISODateTime;
  durationMinutes: ConsultationDuration;
}

// ——— Služby ———

export interface SessionService {
  getCurrentUser(): User | null;
  listDemoAccounts(): User[];
  signInAs(userId: string): Promise<Result<User>>;
  signOut(): Promise<void>;
}

export interface ProfileService {
  listPublic(query?: CatalogQuery): PublicProfileSummary[];
  /** Veřejný profil; pozastavené profily vrací null. */
  getPublic(profileId: string): PsychologistProfile | null;
  listBookableSlots(profileId: string): AvailabilitySlot[];
  /** Stav aktuálního odborníka (přihláška, nebo schválený profil). */
  getOwnStatus(): ProfessionalStatus | null;
  updateOwnProfile(input: ProfileEditInput): Promise<Result<PsychologistProfile>>;
  setAcceptingBookings(accepting: boolean): Promise<Result<PsychologistProfile>>;
}

export interface ApplicationService {
  getOwn(): PsychologistApplication | null;
  saveDraft(fields: ApplicationFields): Promise<Result<PsychologistApplication>>;
  submit(fields: ApplicationFields): Promise<Result<PsychologistApplication>>;
}

export interface AvailabilityService {
  listOwn(): OwnSlotView[];
  addSlot(input: NewSlotInput): Promise<Result<AvailabilitySlot>>;
  withdrawSlot(slotId: string): Promise<Result<AvailabilitySlot>>;
}

export interface AppointmentService {
  book(slotId: string): Promise<Result<Appointment>>;
  cancelAsClient(appointmentId: string): Promise<Result<Appointment>>;
  cancelAsPsychologist(appointmentId: string): Promise<Result<Appointment>>;
  listMine(): ClientAppointmentView[];
  getMine(appointmentId: string): ClientAppointmentView | null;
  listForMyPractice(): PracticeAppointmentView[];
  submitFeedback(appointmentId: string, input: FeedbackInput): Promise<Result<Feedback>>;
}

export interface AdminService {
  listApplications(): PsychologistApplication[];
  getApplication(applicationId: string): PsychologistApplication | null;
  approve(applicationId: string): Promise<Result<PsychologistProfile>>;
  requestChanges(applicationId: string, message: string): Promise<Result<PsychologistApplication>>;
  reject(applicationId: string, message: string): Promise<Result<PsychologistApplication>>;
  updateInternalNote(applicationId: string, note: string): Promise<Result<PsychologistApplication>>;
  listProfiles(): AdminProfileView[];
  suspendProfile(profileId: string, reason: string): Promise<Result<PsychologistProfile>>;
  reactivateProfile(profileId: string): Promise<Result<PsychologistProfile>>;
  listAppointments(): AdminAppointmentView[];
  getStats(): AdminStats;
  listAuditEvents(): AuditEvent[];
  getUserName(userId: string): string;
}

export interface DemoService {
  getSnapshot(): StoreSnapshot;
  subscribe(listener: () => void): () => void;
  getPersistence(): PersistenceStatus;
  reset(): void;
  dismissRecoveryNotice(): void;
}

export interface AppServices {
  now: () => Date;
  demo: DemoService;
  session: SessionService;
  profiles: ProfileService;
  applications: ApplicationService;
  availability: AvailabilityService;
  appointments: AppointmentService;
  admin: AdminService;
}
