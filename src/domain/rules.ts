import { appConfig } from '../config/app';
import { domainError, type DomainError } from './result';
import type { DemoState } from './state';
import { addMinutes, atTime, formatDayLong, formatTime } from './time';
import type { Appointment, AppointmentStatus, AvailabilitySlot, ISODateTime, PsychologistProfile } from './types';

/**
 * Čistá pravidla rezervací. Neznají úložiště ani uživatelské rozhraní,
 * takže je lze použít stejně v lokální implementaci i v budoucím backendu.
 */

interface TimeRange {
  startsAt: ISODateTime;
  durationMinutes: number;
}

export function rangeEnd(range: TimeRange): Date {
  return addMinutes(new Date(range.startsAt), range.durationMinutes);
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = Date.parse(a.startsAt);
  const bStart = Date.parse(b.startsAt);
  return aStart < rangeEnd(b).getTime() && bStart < rangeEnd(a).getTime();
}

/** Rezervace, jejíž čas už uplynul, se zobrazuje jako proběhlá. */
export function effectiveAppointmentStatus(appointment: Appointment, now: Date): AppointmentStatus {
  if (appointment.status === 'booked' && rangeEnd(appointment).getTime() <= now.getTime()) return 'completed';
  return appointment.status;
}

/** Aktivní = naplánovaná a ještě neskončila. */
export function isAppointmentUpcoming(appointment: Appointment, now: Date): boolean {
  return appointment.status === 'booked' && rangeEnd(appointment).getTime() > now.getTime();
}

/** Rezervace, která termín drží (naplánovaná nebo proběhlá). */
export function holdingAppointment(state: DemoState, slotId: string): Appointment | undefined {
  return state.appointments.find((a) => a.slotId === slotId && (a.status === 'booked' || a.status === 'completed'));
}

export function isProfileBookable(profile: PsychologistProfile): boolean {
  return profile.status === 'active' && profile.acceptingBookings;
}

export function earliestBookableTime(now: Date): Date {
  return addMinutes(now, appConfig.booking.leadTimeMinutes);
}

export type SlotState = 'open' | 'booked' | 'withdrawn' | 'past';

export function slotState(state: DemoState, slot: AvailabilitySlot, now: Date): SlotState {
  if (slot.status === 'withdrawn') return 'withdrawn';
  if (holdingAppointment(state, slot.id)) return 'booked';
  if (Date.parse(slot.startsAt) <= now.getTime()) return 'past';
  return 'open';
}

/** Volné termíny, které si klient právě teď může rezervovat. */
export function bookableSlotsForProfile(state: DemoState, profileId: string, now: Date): AvailabilitySlot[] {
  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile || !isProfileBookable(profile)) return [];
  const earliest = earliestBookableTime(now).getTime();
  return state.slots
    .filter(
      (s) =>
        s.profileId === profileId &&
        s.status === 'published' &&
        Date.parse(s.startsAt) >= earliest &&
        !holdingAppointment(state, s.id),
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/** Ověří, zda si klient může termín rezervovat. Vrací chybu, nebo null. */
export function checkBookable(state: DemoState, slotId: string, clientId: string, now: Date): DomainError | null {
  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) return domainError('NOT_FOUND', 'Tento termín už v nabídce není.');
  if (slot.status === 'withdrawn') return domainError('SLOT_WITHDRAWN', 'Odborník tento termín zrušil. Vyber si prosím jiný.');
  if (Date.parse(slot.startsAt) < earliestBookableTime(now).getTime()) {
    return domainError(
      'SLOT_IN_PAST',
      `Tento termín už proběhl nebo začíná za méně než ${appConfig.booking.leadTimeMinutes} minut. Vyber si prosím pozdější.`,
    );
  }
  const holder = holdingAppointment(state, slotId);
  if (holder) {
    return domainError(
      'SLOT_TAKEN',
      holder.clientId === clientId ? 'Tento termín už máš rezervovaný.' : 'Termín si mezitím rezervoval někdo jiný. Vyber si prosím jiný.',
    );
  }
  const profile = state.profiles.find((p) => p.id === slot.profileId);
  if (!profile || !isProfileBookable(profile)) {
    return domainError('PROFILE_UNAVAILABLE', 'Tento odborník teď nepřijímá nové rezervace.');
  }
  const upcoming = state.appointments.filter((a) => a.clientId === clientId && isAppointmentUpcoming(a, now));
  const clash = upcoming.find((a) => rangesOverlap(a, slot));
  if (clash) {
    return domainError(
      'CLIENT_OVERLAP',
      `V tomto čase už máš jinou rezervaci (${formatDayLong(clash.startsAt)} ${atTime(clash.startsAt)}).`,
    );
  }
  const max = appConfig.booking.maxActiveBookingsPerClient;
  if (upcoming.length >= max) {
    return domainError(
      'BOOKING_LIMIT',
      `Najednou můžeš mít nejvýš ${max} naplánované konzultace, aby se kapacita dostala k co nejvíce lidem. Další termín si můžeš rezervovat po proběhnutí nebo zrušení některé z nich.`,
    );
  }
  return null;
}

/** Ověří nový termín odborníka: budoucnost, délka, horizont a překryvy. */
export function checkNewSlot(
  state: DemoState,
  profileId: string,
  input: { startsAt: ISODateTime; durationMinutes: number },
  now: Date,
): DomainError | null {
  if (!(appConfig.booking.durations as readonly number[]).includes(input.durationMinutes)) {
    return domainError('INVALID_INPUT', 'Délka konzultace může být 30 nebo 50 minut.');
  }
  const start = Date.parse(input.startsAt);
  if (Number.isNaN(start)) return domainError('INVALID_INPUT', 'Zadej platné datum a čas.');
  if (start <= now.getTime()) return domainError('SLOT_IN_PAST', 'Termín musí být v budoucnosti.');
  if (start > addMinutes(now, appConfig.booking.planningHorizonDays * 24 * 60).getTime()) {
    return domainError(
      'INVALID_INPUT',
      `Termíny lze vypisovat nejvýš ${appConfig.booking.planningHorizonDays} dní dopředu.`,
    );
  }
  if (new Date(start).getUTCMinutes() % 5 !== 0) {
    return domainError('INVALID_INPUT', 'Čas začátku zadej v pětiminutových krocích.');
  }
  const clash = state.slots.find(
    (s) => s.profileId === profileId && s.status === 'published' && rangesOverlap(s, input),
  );
  if (clash) {
    return domainError(
      'SLOT_OVERLAP',
      `Termín se překrývá s jiným tvým termínem (${formatDayLong(clash.startsAt)} ${formatTime(clash.startsAt)}–${formatTime(rangeEnd(clash))}).`,
    );
  }
  return null;
}
