import { appConfig } from '../../config/app';
import { createSeed, DEMO_USER_IDS } from '../../data/seed';
import { fail, ok, type Result } from '../../domain/result';
import {
  bookableSlotsForProfile,
  checkBookable,
  checkNewSlot,
  effectiveAppointmentStatus,
  holdingAppointment,
  isAppointmentUpcoming,
  slotState,
} from '../../domain/rules';
import type { DemoState } from '../../domain/state';
import { shortName } from '../../domain/text';
import { addMinutes, toISO } from '../../domain/time';
import type {
  ApplicationFields,
  Appointment,
  AuditAction,
  AuditEvent,
  AvailabilitySlot,
  Feedback,
  PsychologistApplication,
  PsychologistProfile,
} from '../../domain/types';
import {
  ADMIN_MESSAGE_LIMITS,
  FEEDBACK_NOTE_MAX,
  INTERNAL_NOTE_MAX,
  validateApplicationFields,
  validateProfileEdit,
} from '../../domain/validation';
import { DemoStore, type StorageLike } from '../../storage/store';
import type {
  AdminAppointmentView,
  AdminProfileView,
  AdminStats,
  AppServices,
  CatalogQuery,
  ClientAppointmentView,
  OwnSlotView,
  PracticeAppointmentView,
  ProfessionalStatus,
  PublicProfileSummary,
} from '../types';
import { createId, currentUser, requireApprovedProfessional, requireRole } from './access';

export interface LocalServicesOptions {
  storage: StorageLike | null;
  now?: () => Date;
  storageKey?: string;
  seed?: (now: Date) => DemoState;
}

export type LocalServices = AppServices & { store: DemoStore };

type Change<T> = Result<{ state: DemoState; value: T }>;

const replaceById = <T extends { id: string }>(list: T[], item: T): T[] => list.map((x) => (x.id === item.id ? item : x));

function sanitizeFields(fields: ApplicationFields): ApplicationFields {
  return {
    professionalName: fields.professionalName.trim(),
    professionalRole: fields.professionalRole.trim(),
    qualificationSummary: fields.qualificationSummary.trim(),
    specializations: [...new Set(fields.specializations)],
    languages: [...new Set(fields.languages)],
    capacityPerMonth: fields.capacityPerMonth,
    bio: fields.bio.trim(),
  };
}

function checkMessage(message: string, label: string): string | null {
  const length = message.trim().length;
  if (length < ADMIN_MESSAGE_LIMITS.min) return `${label} potřebuje aspoň ${ADMIN_MESSAGE_LIMITS.min} znaků.`;
  if (length > ADMIN_MESSAGE_LIMITS.max) return `${label} může mít nejvýš ${ADMIN_MESSAGE_LIMITS.max} znaků.`;
  return null;
}

export function createLocalServices(options: LocalServicesOptions): LocalServices {
  const now = options.now ?? (() => new Date());
  const store = new DemoStore({
    storage: options.storage,
    key: options.storageKey ?? `${appConfig.storageKey}:state`,
    now,
    seed: options.seed ?? createSeed,
  });
  const read = () => store.getState();

  const audit = (
    state: DemoState,
    actorId: string,
    action: AuditAction,
    targetType: AuditEvent['targetType'],
    targetId: string,
    summary: string,
  ): AuditEvent[] => [
    { id: createId('audit'), at: toISO(now()), actorId, action, targetType, targetId, summary },
    ...state.auditEvents,
  ];

  const userName = (state: DemoState, userId: string) => state.users.find((u) => u.id === userId)?.displayName ?? 'Neznámý účet';
  const clientLabel = (state: DemoState, userId: string) => shortName(userName(state, userId));

  // ——— Demo relace ———

  const session: AppServices['session'] = {
    getCurrentUser: () => currentUser(read()),
    listDemoAccounts: () => {
      const state = read();
      return Object.values(DEMO_USER_IDS)
        .map((id) => state.users.find((u) => u.id === id))
        .filter((u): u is NonNullable<typeof u> => Boolean(u));
    },
    signInAs: async (userId) =>
      store.transact((state) => {
        const user = state.users.find((u) => u.id === userId);
        if (!user) return fail('NOT_FOUND', 'Tento demo účet neexistuje. Zkus obnovit demo data.');
        return ok({ state: { ...state, session: { userId } }, value: user });
      }),
    signOut: async () => {
      store.transact((state) => ok({ state: { ...state, session: { userId: null } }, value: null }));
    },
  };

  // ——— Profily ———

  const profiles: AppServices['profiles'] = {
    listPublic: (query: CatalogQuery = {}) => {
      const state = read();
      const t = now();
      let items: PublicProfileSummary[] = state.profiles
        .filter((p) => p.status === 'active')
        .map((profile) => {
          const open = bookableSlotsForProfile(state, profile.id, t);
          return { profile, nextSlot: open[0] ?? null, openSlotCount: open.length };
        });
      if (query.specialization) items = items.filter((i) => i.profile.specializations.includes(query.specialization!));
      if (query.language) items = items.filter((i) => i.profile.languages.includes(query.language!));
      if (query.availableWithinDays) {
        const limit = addMinutes(t, query.availableWithinDays * 24 * 60).getTime();
        items = items.filter((i) => i.nextSlot !== null && Date.parse(i.nextSlot.startsAt) <= limit);
      }
      const byName = (a: PublicProfileSummary, b: PublicProfileSummary) =>
        a.profile.professionalName.localeCompare(b.profile.professionalName, 'cs');
      if (query.sort === 'name') return items.sort(byName);
      return items.sort((a, b) => {
        if (a.nextSlot && b.nextSlot) return Date.parse(a.nextSlot.startsAt) - Date.parse(b.nextSlot.startsAt);
        if (a.nextSlot) return -1;
        if (b.nextSlot) return 1;
        return byName(a, b);
      });
    },
    getPublic: (profileId) => read().profiles.find((p) => p.id === profileId && p.status === 'active') ?? null,
    listBookableSlots: (profileId) => bookableSlotsForProfile(read(), profileId, now()),
    getOwnStatus: (): ProfessionalStatus | null => {
      const state = read();
      const user = currentUser(state);
      if (!user || user.role !== 'professional') return null;
      const application = state.applications.find((a) => a.userId === user.id);
      if (!application) return { kind: 'no_application' };
      const profile = state.profiles.find((p) => p.userId === user.id);
      if (application.status === 'approved' && profile) return { kind: 'approved', application, profile };
      return { kind: 'application', application };
    },
    updateOwnProfile: async (input) =>
      store.transact((state): Change<PsychologistProfile> => {
        const access = requireApprovedProfessional(state);
        if (!access.ok) return access;
        const errors = validateProfileEdit(input);
        if (Object.keys(errors).length > 0) return fail('INVALID_INPUT', 'Zkontroluj prosím zvýrazněná pole.', errors);
        const profile: PsychologistProfile = {
          ...access.value.profile,
          approach: input.approach.trim(),
          bio: input.bio.trim(),
          specializations: [...new Set(input.specializations)],
          languages: [...new Set(input.languages)],
        };
        return ok({ state: { ...state, profiles: replaceById(state.profiles, profile) }, value: profile });
      }),
    setAcceptingBookings: async (accepting) =>
      store.transact((state): Change<PsychologistProfile> => {
        const access = requireApprovedProfessional(state);
        if (!access.ok) return access;
        const profile = { ...access.value.profile, acceptingBookings: accepting };
        return ok({ state: { ...state, profiles: replaceById(state.profiles, profile) }, value: profile });
      }),
  };

  // ——— Přihlášky odborníků ———

  const saveApplication = (fields: ApplicationFields, mode: 'draft' | 'submit') =>
    store.transact((state): Change<PsychologistApplication> => {
      const userResult = requireRole(state, 'professional');
      if (!userResult.ok) return userResult;
      const user = userResult.value;
      const existing = state.applications.find((a) => a.userId === user.id);
      if (existing && !['draft', 'needs_changes'].includes(existing.status)) {
        return fail('INVALID_STATE', 'Přihlášku v tomto stavu už nelze upravovat.');
      }
      const clean = sanitizeFields(fields);
      const errors = validateApplicationFields(clean, mode);
      if (Object.keys(errors).length > 0) {
        return fail('INVALID_INPUT', 'Zkontroluj prosím zvýrazněná pole.', errors);
      }
      const at = toISO(now());
      const base: PsychologistApplication = existing ?? {
        ...clean,
        id: createId('app'),
        userId: user.id,
        status: 'draft',
        createdAt: at,
        updatedAt: at,
        submittedAt: null,
        decidedAt: null,
        reviewerMessage: null,
        internalNote: '',
        profileId: null,
      };
      const application: PsychologistApplication = {
        ...base,
        ...clean,
        updatedAt: at,
        ...(mode === 'submit' ? { status: 'submitted' as const, submittedAt: at } : {}),
      };
      const applications = existing ? replaceById(state.applications, application) : [...state.applications, application];
      return ok({ state: { ...state, applications }, value: application });
    });

  const applications: AppServices['applications'] = {
    getOwn: () => {
      const state = read();
      const user = currentUser(state);
      if (!user || user.role !== 'professional') return null;
      return state.applications.find((a) => a.userId === user.id) ?? null;
    },
    saveDraft: async (fields) => saveApplication(fields, 'draft'),
    submit: async (fields) => saveApplication(fields, 'submit'),
  };

  // ——— Dostupnost ———

  const availability: AppServices['availability'] = {
    listOwn: () => {
      const state = read();
      const access = requireApprovedProfessional(state);
      if (!access.ok) return [];
      const t = now();
      return state.slots
        .filter((s) => s.profileId === access.value.profile.id)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((slot): OwnSlotView => {
          const holder = holdingAppointment(state, slot.id);
          const cancelled = state.appointments.find((a) => a.slotId === slot.id && a.status === 'cancelled_by_psychologist');
          const appointment = holder ?? cancelled ?? null;
          const current = slotState(state, slot, t);
          return {
            slot,
            state: current,
            appointment,
            clientLabel: appointment ? clientLabel(state, appointment.clientId) : null,
            canWithdraw: current === 'open',
            canCancelBooking: Boolean(holder && isAppointmentUpcoming(holder, t) && Date.parse(holder.startsAt) > t.getTime()),
          };
        });
    },
    addSlot: async (input) =>
      store.transact((state): Change<AvailabilitySlot> => {
        const access = requireApprovedProfessional(state);
        if (!access.ok) return access;
        const { profile } = access.value;
        if (profile.status !== 'active') {
          return fail('INVALID_STATE', 'Profil je pozastavený administrací, nové termíny teď nelze přidávat.');
        }
        const error = checkNewSlot(state, profile.id, input, now());
        if (error) return { ok: false, error };
        const slot: AvailabilitySlot = {
          id: createId('slot'),
          profileId: profile.id,
          startsAt: toISO(new Date(input.startsAt)),
          durationMinutes: input.durationMinutes,
          status: 'published',
          createdAt: toISO(now()),
          withdrawnAt: null,
        };
        return ok({ state: { ...state, slots: [...state.slots, slot] }, value: slot });
      }),
    withdrawSlot: async (slotId) =>
      store.transact((state): Change<AvailabilitySlot> => {
        const access = requireApprovedProfessional(state);
        if (!access.ok) return access;
        const slot = state.slots.find((s) => s.id === slotId && s.profileId === access.value.profile.id);
        if (!slot) return fail('NOT_FOUND', 'Termín jsme nenašli.');
        if (slot.status === 'withdrawn') return fail('INVALID_STATE', 'Termín už je zrušený.');
        if (Date.parse(slot.startsAt) <= now().getTime()) {
          return fail('INVALID_STATE', 'Termíny, které už proběhly, zůstávají v historii a nelze je rušit.');
        }
        if (holdingAppointment(state, slot.id)) {
          return fail('INVALID_STATE', 'Termín je rezervovaný. Zruš ho prosím jako rezervovaný termín.');
        }
        const updated: AvailabilitySlot = { ...slot, status: 'withdrawn', withdrawnAt: toISO(now()) };
        return ok({ state: { ...state, slots: replaceById(state.slots, updated) }, value: updated });
      }),
  };

  // ——— Rezervace ———

  const toClientView = (state: DemoState, appointment: Appointment, t: Date): ClientAppointmentView | null => {
    const profile = state.profiles.find((p) => p.id === appointment.profileId);
    if (!profile) return null;
    const status = effectiveAppointmentStatus(appointment, t);
    const feedback = state.feedback.find((f) => f.appointmentId === appointment.id) ?? null;
    return {
      appointment,
      status,
      profile,
      feedback,
      canCancel: appointment.status === 'booked' && Date.parse(appointment.startsAt) > t.getTime(),
      canGiveFeedback: status === 'completed' && feedback === null,
    };
  };

  const appointments: AppServices['appointments'] = {
    book: async (slotId) =>
      store.transact((state): Change<Appointment> => {
        const userResult = requireRole(state, 'client');
        if (!userResult.ok) return userResult;
        const client = userResult.value;
        // Opakované odeslání stejné rezervace (dvojklik) vrátí už vytvořenou rezervaci.
        const existing = state.appointments.find((a) => a.slotId === slotId && a.clientId === client.id && a.status === 'booked');
        if (existing) return ok({ state, value: existing });
        const t = now();
        const error = checkBookable(state, slotId, client.id, t);
        if (error) return { ok: false, error };
        const slot = state.slots.find((s) => s.id === slotId)!;
        const appointment: Appointment = {
          id: createId('appt'),
          slotId,
          profileId: slot.profileId,
          clientId: client.id,
          startsAt: slot.startsAt,
          durationMinutes: slot.durationMinutes,
          status: 'booked',
          createdAt: toISO(t),
          cancelledAt: null,
        };
        return ok({ state: { ...state, appointments: [...state.appointments, appointment] }, value: appointment });
      }),
    cancelAsClient: async (appointmentId) =>
      store.transact((state): Change<Appointment> => {
        const userResult = requireRole(state, 'client');
        if (!userResult.ok) return userResult;
        const appointment = state.appointments.find((a) => a.id === appointmentId && a.clientId === userResult.value.id);
        if (!appointment) return fail('NOT_FOUND', 'Rezervaci jsme nenašli.');
        if (appointment.status !== 'booked') return fail('INVALID_STATE', 'Tato rezervace už není aktivní.');
        if (Date.parse(appointment.startsAt) <= now().getTime()) {
          return fail('INVALID_STATE', 'Konzultace už začala nebo proběhla, rezervaci proto nelze zrušit.');
        }
        // Termín zůstává vypsaný, a pokud je v budoucnu, znovu se nabídne ostatním.
        const updated: Appointment = { ...appointment, status: 'cancelled_by_client', cancelledAt: toISO(now()) };
        return ok({ state: { ...state, appointments: replaceById(state.appointments, updated) }, value: updated });
      }),
    cancelAsPsychologist: async (appointmentId) =>
      store.transact((state): Change<Appointment> => {
        const access = requireApprovedProfessional(state);
        if (!access.ok) return access;
        const appointment = state.appointments.find((a) => a.id === appointmentId && a.profileId === access.value.profile.id);
        if (!appointment) return fail('NOT_FOUND', 'Rezervaci jsme nenašli.');
        if (appointment.status !== 'booked') return fail('INVALID_STATE', 'Tato rezervace už není aktivní.');
        if (Date.parse(appointment.startsAt) <= now().getTime()) {
          return fail('INVALID_STATE', 'Proběhlé konzultace zůstávají v historii a nelze je rušit.');
        }
        const at = toISO(now());
        const updated: Appointment = { ...appointment, status: 'cancelled_by_psychologist', cancelledAt: at };
        // Termín zrušený odborníkem se veřejně znovu nenabízí.
        const slots = state.slots.map((s) => (s.id === appointment.slotId ? { ...s, status: 'withdrawn' as const, withdrawnAt: at } : s));
        return ok({ state: { ...state, slots, appointments: replaceById(state.appointments, updated) }, value: updated });
      }),
    listMine: () => {
      const state = read();
      const user = currentUser(state);
      if (!user || user.role !== 'client') return [];
      const t = now();
      return state.appointments
        .filter((a) => a.clientId === user.id)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((a) => toClientView(state, a, t))
        .filter((v): v is ClientAppointmentView => v !== null);
    },
    getMine: (appointmentId) => {
      const state = read();
      const user = currentUser(state);
      if (!user || user.role !== 'client') return null;
      const appointment = state.appointments.find((a) => a.id === appointmentId && a.clientId === user.id);
      return appointment ? toClientView(state, appointment, now()) : null;
    },
    listForMyPractice: () => {
      const state = read();
      const access = requireApprovedProfessional(state);
      if (!access.ok) return [];
      const t = now();
      return state.appointments
        .filter((a) => a.profileId === access.value.profile.id)
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map(
          (appointment): PracticeAppointmentView => ({
            appointment,
            status: effectiveAppointmentStatus(appointment, t),
            clientLabel: clientLabel(state, appointment.clientId),
            canCancel: appointment.status === 'booked' && Date.parse(appointment.startsAt) > t.getTime(),
          }),
        );
    },
    submitFeedback: async (appointmentId, input) =>
      store.transact((state): Change<Feedback> => {
        const userResult = requireRole(state, 'client');
        if (!userResult.ok) return userResult;
        const appointment = state.appointments.find((a) => a.id === appointmentId && a.clientId === userResult.value.id);
        if (!appointment) return fail('NOT_FOUND', 'Rezervaci jsme nenašli.');
        if (effectiveAppointmentStatus(appointment, now()) !== 'completed') {
          return fail('INVALID_STATE', 'Zpětnou vazbu lze vyplnit až po proběhlé konzultaci.');
        }
        if (state.feedback.some((f) => f.appointmentId === appointmentId)) {
          return fail('INVALID_STATE', 'Zpětnou vazbu k této konzultaci už máš vyplněnou.');
        }
        if (!['clear', 'partly', 'unclear'].includes(input.processClarity)) {
          return fail('INVALID_INPUT', 'Vyber jednu z možností.', { processClarity: 'Vyber jednu z možností.' });
        }
        if (input.note.trim().length > FEEDBACK_NOTE_MAX) {
          return fail('INVALID_INPUT', `Poznámka může mít nejvýš ${FEEDBACK_NOTE_MAX} znaků.`, {
            note: `Poznámka může mít nejvýš ${FEEDBACK_NOTE_MAX} znaků.`,
          });
        }
        const feedback: Feedback = {
          id: createId('fb'),
          appointmentId,
          clientId: userResult.value.id,
          createdAt: toISO(now()),
          processClarity: input.processClarity,
          note: input.note.trim(),
        };
        return ok({ state: { ...state, feedback: [...state.feedback, feedback] }, value: feedback });
      }),
  };

  // ——— Administrace ———

  const isAdmin = () => requireRole(read(), 'admin').ok;

  const withApplication = (
    applicationId: string,
    allowed: PsychologistApplication['status'][],
    change: (state: DemoState, app: PsychologistApplication, adminId: string) => Change<PsychologistApplication>,
  ) =>
    store.transact((state): Change<PsychologistApplication> => {
      const admin = requireRole(state, 'admin');
      if (!admin.ok) return admin;
      const app = state.applications.find((a) => a.id === applicationId);
      if (!app) return fail('NOT_FOUND', 'Přihlášku jsme nenašli.');
      if (!allowed.includes(app.status)) return fail('INVALID_STATE', 'Přihláška je v jiném stavu. Obnov stránku a zkus to znovu.');
      return change(state, app, admin.value.id);
    });

  const withProfile = (
    profileId: string,
    change: (state: DemoState, profile: PsychologistProfile, adminId: string) => Change<PsychologistProfile>,
  ) =>
    store.transact((state): Change<PsychologistProfile> => {
      const admin = requireRole(state, 'admin');
      if (!admin.ok) return admin;
      const profile = state.profiles.find((p) => p.id === profileId);
      if (!profile) return fail('NOT_FOUND', 'Profil jsme nenašli.');
      return change(state, profile, admin.value.id);
    });

  const admin: AppServices['admin'] = {
    listApplications: () => {
      if (!isAdmin()) return [];
      return [...read().applications].sort(
        (a, b) => Date.parse(b.submittedAt ?? b.updatedAt) - Date.parse(a.submittedAt ?? a.updatedAt),
      );
    },
    getApplication: (applicationId) => (isAdmin() ? (read().applications.find((a) => a.id === applicationId) ?? null) : null),
    approve: async (applicationId) =>
      store.transact((state): Change<PsychologistProfile> => {
        const adminResult = requireRole(state, 'admin');
        if (!adminResult.ok) return adminResult;
        const app = state.applications.find((a) => a.id === applicationId);
        if (!app) return fail('NOT_FOUND', 'Přihlášku jsme nenašli.');
        if (app.status !== 'submitted') return fail('INVALID_STATE', 'Schválit lze jen přihlášku, která čeká na posouzení.');
        const at = toISO(now());
        const profile: PsychologistProfile = {
          id: createId('p'),
          userId: app.userId,
          applicationId: app.id,
          professionalName: app.professionalName,
          professionalRole: app.professionalRole,
          qualificationSummary: app.qualificationSummary,
          specializations: app.specializations,
          languages: app.languages,
          capacityPerMonth: app.capacityPerMonth,
          approach: '',
          bio: app.bio,
          status: 'active',
          suspendedAt: null,
          suspensionReason: null,
          acceptingBookings: true,
          approvedAt: at,
          avatarTone: state.profiles.length % 6,
        };
        const updatedApp: PsychologistApplication = {
          ...app,
          status: 'approved',
          decidedAt: at,
          updatedAt: at,
          reviewerMessage: null,
          profileId: profile.id,
        };
        return ok({
          state: {
            ...state,
            applications: replaceById(state.applications, updatedApp),
            profiles: [...state.profiles, profile],
            auditEvents: audit(
              state,
              adminResult.value.id,
              'application_approved',
              'application',
              app.id,
              `Schválena přihláška: ${app.professionalName}.`,
            ),
          },
          value: profile,
        });
      }),
    requestChanges: async (applicationId, message) =>
      withApplication(applicationId, ['submitted'], (state, app, adminId) => {
        const error = checkMessage(message, 'Zpráva pro žadatele');
        if (error) return fail('INVALID_INPUT', error, { message: error });
        const at = toISO(now());
        const updated: PsychologistApplication = {
          ...app,
          status: 'needs_changes',
          reviewerMessage: message.trim(),
          decidedAt: at,
          updatedAt: at,
        };
        return ok({
          state: {
            ...state,
            applications: replaceById(state.applications, updated),
            auditEvents: audit(
              state,
              adminId,
              'application_changes_requested',
              'application',
              app.id,
              `Vyžádáno doplnění přihlášky: ${app.professionalName}.`,
            ),
          },
          value: updated,
        });
      }),
    reject: async (applicationId, message) =>
      withApplication(applicationId, ['submitted', 'needs_changes'], (state, app, adminId) => {
        const error = checkMessage(message, 'Zdůvodnění');
        if (error) return fail('INVALID_INPUT', error, { message: error });
        const at = toISO(now());
        const updated: PsychologistApplication = {
          ...app,
          status: 'rejected',
          reviewerMessage: message.trim(),
          decidedAt: at,
          updatedAt: at,
        };
        return ok({
          state: {
            ...state,
            applications: replaceById(state.applications, updated),
            auditEvents: audit(state, adminId, 'application_rejected', 'application', app.id, `Zamítnuta přihláška: ${app.professionalName}.`),
          },
          value: updated,
        });
      }),
    updateInternalNote: async (applicationId, note) =>
      withApplication(applicationId, ['draft', 'submitted', 'approved', 'needs_changes', 'rejected'], (state, app, adminId) => {
        if (note.trim().length > INTERNAL_NOTE_MAX) {
          const error = `Poznámka může mít nejvýš ${INTERNAL_NOTE_MAX} znaků.`;
          return fail('INVALID_INPUT', error, { note: error });
        }
        if (note.trim() === app.internalNote) return ok({ state, value: app });
        const updated: PsychologistApplication = { ...app, internalNote: note.trim(), updatedAt: toISO(now()) };
        return ok({
          state: {
            ...state,
            applications: replaceById(state.applications, updated),
            auditEvents: audit(
              state,
              adminId,
              'application_note_updated',
              'application',
              app.id,
              `Upravena interní poznámka k přihlášce: ${app.professionalName}.`,
            ),
          },
          value: updated,
        });
      }),
    listProfiles: () => {
      if (!isAdmin()) return [];
      const state = read();
      const t = now();
      return state.profiles
        .map((profile): AdminProfileView => {
          const future = state.slots.filter(
            (s) => s.profileId === profile.id && s.status === 'published' && Date.parse(s.startsAt) > t.getTime(),
          );
          return {
            profile,
            upcomingOpenSlots: future.filter((s) => !holdingAppointment(state, s.id)).length,
            upcomingBookings: state.appointments.filter((a) => a.profileId === profile.id && isAppointmentUpcoming(a, t)).length,
          };
        })
        .sort((a, b) => a.profile.professionalName.localeCompare(b.profile.professionalName, 'cs'));
    },
    suspendProfile: async (profileId, reason) =>
      withProfile(profileId, (state, profile, adminId) => {
        if (profile.status === 'suspended') return fail('INVALID_STATE', 'Profil už je pozastavený.');
        const error = checkMessage(reason, 'Důvod pozastavení');
        if (error) return fail('INVALID_INPUT', error, { message: error });
        const updated: PsychologistProfile = {
          ...profile,
          status: 'suspended',
          suspendedAt: toISO(now()),
          suspensionReason: reason.trim(),
        };
        return ok({
          state: {
            ...state,
            profiles: replaceById(state.profiles, updated),
            auditEvents: audit(
              state,
              adminId,
              'profile_suspended',
              'profile',
              profile.id,
              `Pozastaven profil: ${profile.professionalName}. Důvod: ${reason.trim()}`,
            ),
          },
          value: updated,
        });
      }),
    reactivateProfile: async (profileId) =>
      withProfile(profileId, (state, profile, adminId) => {
        if (profile.status === 'active') return fail('INVALID_STATE', 'Profil je už aktivní.');
        const updated: PsychologistProfile = { ...profile, status: 'active', suspendedAt: null, suspensionReason: null };
        return ok({
          state: {
            ...state,
            profiles: replaceById(state.profiles, updated),
            auditEvents: audit(state, adminId, 'profile_reactivated', 'profile', profile.id, `Obnoven profil: ${profile.professionalName}.`),
          },
          value: updated,
        });
      }),
    listAppointments: () => {
      if (!isAdmin()) return [];
      const state = read();
      const t = now();
      return [...state.appointments]
        .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
        .map(
          (appointment): AdminAppointmentView => ({
            appointment,
            status: effectiveAppointmentStatus(appointment, t),
            profileName: state.profiles.find((p) => p.id === appointment.profileId)?.professionalName ?? 'Neznámý profil',
            clientLabel: clientLabel(state, appointment.clientId),
          }),
        );
    },
    getStats: (): AdminStats => {
      const empty: AdminStats = {
        offeredSlots: 0,
        bookings: 0,
        occupancy: 0,
        cancelledByClient: 0,
        cancelledByPsychologist: 0,
        completed: 0,
        upcoming: { days: 14, offeredSlots: 0, bookedSlots: 0, occupancy: 0 },
      };
      if (!isAdmin()) return empty;
      const state = read();
      const t = now();
      const published = state.slots.filter((s) => s.status === 'published');
      const held = published.filter((s) => holdingAppointment(state, s.id));
      const horizon = addMinutes(t, 14 * 24 * 60).getTime();
      const upcoming = published.filter((s) => Date.parse(s.startsAt) > t.getTime() && Date.parse(s.startsAt) <= horizon);
      const upcomingHeld = upcoming.filter((s) => holdingAppointment(state, s.id));
      const statuses = state.appointments.map((a) => effectiveAppointmentStatus(a, t));
      return {
        offeredSlots: published.length,
        bookings: state.appointments.length,
        occupancy: published.length ? held.length / published.length : 0,
        cancelledByClient: statuses.filter((s) => s === 'cancelled_by_client').length,
        cancelledByPsychologist: statuses.filter((s) => s === 'cancelled_by_psychologist').length,
        completed: statuses.filter((s) => s === 'completed').length,
        upcoming: {
          days: 14,
          offeredSlots: upcoming.length,
          bookedSlots: upcomingHeld.length,
          occupancy: upcoming.length ? upcomingHeld.length / upcoming.length : 0,
        },
      };
    },
    listAuditEvents: () => (isAdmin() ? [...read().auditEvents].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)) : []),
    getUserName: (userId) => userName(read(), userId),
  };

  const demo: AppServices['demo'] = {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    getPersistence: () => store.getSnapshot().persistence,
    reset: () => store.reset(),
    dismissRecoveryNotice: () => store.dismissRecoveryNotice(),
  };

  return { store, now, demo, session, profiles, applications, availability, appointments, admin };
}
