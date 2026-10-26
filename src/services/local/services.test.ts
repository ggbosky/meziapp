import { describe, expect, it } from 'vitest';
import { DEMO_USER_IDS } from '../../data/seed';
import { addMinutes, localInputToISO } from '../../domain/time';
import { createTestClock, createTestServices, MemoryStorage } from '../../test/helpers';
import type { LocalServices } from './createLocalServices';

/**
 * Testy datové logiky. Filtrování podle demo účtu zde ověřuje realistické
 * chování prototypu, NE bezpečnost — data jsou v prohlížeči dostupná celá.
 */

async function signIn(services: LocalServices, userId: string) {
  const result = await services.session.signInAs(userId);
  expect(result.ok).toBe(true);
}

function firstOpenSlot(services: LocalServices, profileId = 'p-hana') {
  const slot = services.profiles.listBookableSlots(profileId)[0];
  if (!slot) throw new Error('V seed datech chybí volný termín');
  return slot;
}

describe('výchozí data', () => {
  it('obsahují požadované demo účty, profily a žádosti', () => {
    const services = createTestServices();
    const state = services.store.getState();
    expect(state.users.filter((u) => u.role === 'client')).toHaveLength(2);
    expect(state.profiles.filter((p) => p.status === 'active')).toHaveLength(5);
    expect(state.profiles.filter((p) => p.status === 'suspended')).toHaveLength(1);
    expect(state.applications.filter((a) => a.status === 'submitted')).toHaveLength(2);
    expect(state.auditEvents.length).toBeGreaterThan(0);
    expect(state.users.every((u) => u.email.endsWith('@example.com'))).toBe(true);
  });

  it('generují termíny relativně k aktuálnímu datu na příštích 14 dní', () => {
    const services = createTestServices();
    const now = services.now().getTime();
    const future = services.store.getState().slots.filter((s) => Date.parse(s.startsAt) > now);
    expect(future.length).toBeGreaterThan(10);
    const latest = Math.max(...future.map((s) => Date.parse(s.startsAt)));
    expect(latest).toBeLessThan(addMinutes(services.now(), 15 * 24 * 60).getTime());
  });

  it('ukládají čas jednoznačně v UTC a převádějí pražský čas správně', () => {
    expect(localInputToISO('2026-10-27', '09:00')).toBe('2026-10-27T08:00:00.000Z'); // zimní čas
    expect(localInputToISO('2026-07-01', '09:00')).toBe('2026-07-01T07:00:00.000Z'); // letní čas
    const services = createTestServices();
    expect(services.store.getState().slots.every((s) => s.startsAt.endsWith('Z'))).toBe(true);
  });
});

describe('rezervace', () => {
  it('klient si rezervuje volný termín a ten přestane být nabízený', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(services);
    const result = await services.appointments.book(slot.id);
    expect(result.ok).toBe(true);
    expect(services.profiles.listBookableSlots('p-hana').some((s) => s.id === slot.id)).toBe(false);
    expect(services.appointments.listMine().some((v) => v.appointment.slotId === slot.id && v.status === 'booked')).toBe(true);
  });

  it('po zrušení klientem se budoucí termín znovu uvolní', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(services);
    const booked = await services.appointments.book(slot.id);
    if (!booked.ok) throw new Error(booked.error.message);
    const cancelled = await services.appointments.cancelAsClient(booked.value.id);
    expect(cancelled.ok && cancelled.value.status).toBe('cancelled_by_client');
    expect(services.profiles.listBookableSlots('p-hana').some((s) => s.id === slot.id)).toBe(true);

    // Uvolněný termín si může rezervovat i jiný klient.
    await signIn(services, DEMO_USER_IDS.clientA);
    expect((await services.appointments.book(slot.id)).ok).toBe(true);
  });

  it('nelze rezervovat obsazený termín', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(services);
    await services.appointments.book(slot.id);
    await signIn(services, DEMO_USER_IDS.clientA);
    const second = await services.appointments.book(slot.id);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe('SLOT_TAKEN');
  });

  it('nelze rezervovat minulý termín ani termín těsně před začátkem', async () => {
    const clock = createTestClock();
    const services = createTestServices(new MemoryStorage(), clock);
    await signIn(services, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(services);
    clock.set(addMinutes(new Date(slot.startsAt), 10));
    const late = await services.appointments.book(slot.id);
    expect(!late.ok && late.error.code).toBe('SLOT_IN_PAST');

    const pastSlot = services.store.getState().slots.find((s) => Date.parse(s.startsAt) < clock.now().getTime() - 86_400_000);
    expect(pastSlot).toBeDefined();
    const past = await services.appointments.book(pastSlot!.id);
    expect(past.ok).toBe(false);
  });

  it('nelze rezervovat termín zrušený odborníkem', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistA);
    const own = services.availability.listOwn().find((v) => v.canWithdraw);
    expect(own).toBeDefined();
    expect((await services.availability.withdrawSlot(own!.slot.id)).ok).toBe(true);
    await signIn(services, DEMO_USER_IDS.clientB);
    const result = await services.appointments.book(own!.slot.id);
    expect(!result.ok && result.error.code).toBe('SLOT_WITHDRAWN');
  });

  it('dvojité odeslání nevytvoří dvě rezervace', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(services);
    const [a, b] = await Promise.all([services.appointments.book(slot.id), services.appointments.book(slot.id)]);
    expect(a.ok && b.ok).toBe(true);
    const forSlot = services.store.getState().appointments.filter((x) => x.slotId === slot.id && x.status === 'booked');
    expect(forSlot).toHaveLength(1);
  });

  it('klient nemůže mít překrývající se aktivní rezervace', async () => {
    const services = createTestServices();
    // Odbornice B vypíše termín ve stejný čas jako má klientka A rezervaci u odbornice A.
    const terezaNext = services.store.getState().appointments.find((a) => a.id === 'a-tereza-next')!;
    await signIn(services, 'u-hana');
    const added = await services.availability.addSlot({
      startsAt: addMinutes(new Date(terezaNext.startsAt), 20).toISOString(),
      durationMinutes: 50,
    });
    if (!added.ok) throw new Error(added.error.message);
    await signIn(services, DEMO_USER_IDS.clientA);
    const result = await services.appointments.book(added.value.id);
    expect(!result.ok && result.error.code).toBe('CLIENT_OVERLAP');
  });

  it('nelze rezervovat termín pozastaveného odborníka', async () => {
    const services = createTestServices();
    const slot = firstOpenSlot(services, 'p-marta');
    await signIn(services, DEMO_USER_IDS.admin);
    expect((await services.admin.suspendProfile('p-marta', 'Ověřujeme údaje v profilu.')).ok).toBe(true);
    expect(services.profiles.listPublic().some((p) => p.profile.id === 'p-marta')).toBe(false);
    expect(services.profiles.getPublic('p-marta')).toBeNull();

    await signIn(services, DEMO_USER_IDS.clientB);
    const result = await services.appointments.book(slot.id);
    expect(!result.ok && result.error.code).toBe('PROFILE_UNAVAILABLE');

    await signIn(services, DEMO_USER_IDS.admin);
    expect((await services.admin.reactivateProfile('p-marta')).ok).toBe(true);
    await signIn(services, DEMO_USER_IDS.clientB);
    expect((await services.appointments.book(slot.id)).ok).toBe(true);
  });

  it('pozastavení příjmu rezervací odborníkem skryje volné termíny', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistA);
    expect((await services.profiles.setAcceptingBookings(false)).ok).toBe(true);
    expect(services.profiles.listBookableSlots('p-alzbeta')).toHaveLength(0);
    const summary = services.profiles.listPublic().find((p) => p.profile.id === 'p-alzbeta');
    expect(summary?.nextSlot).toBeNull();
  });

  it('zrušení odborníkem termín znovu veřejně nenabízí', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistA);
    const booked = services.availability.listOwn().find((v) => v.canCancelBooking);
    expect(booked).toBeDefined();
    const result = await services.appointments.cancelAsPsychologist(booked!.appointment!.id);
    expect(result.ok && result.value.status).toBe('cancelled_by_psychologist');
    expect(services.profiles.listBookableSlots('p-alzbeta').some((s) => s.id === booked!.slot.id)).toBe(false);
  });

  it('klient smí mít nejvýš dvě naplánované konzultace', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientA); // už má jednu rezervaci
    expect((await services.appointments.book(firstOpenSlot(services, 'p-hana').id)).ok).toBe(true);
    const third = await services.appointments.book(firstOpenSlot(services, 'p-marta').id);
    expect(!third.ok && third.error.code).toBe('BOOKING_LIMIT');
  });

  it('zpětnou vazbu lze vyplnit jen k proběhlé konzultaci a jen jednou', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientA);
    const views = services.appointments.listMine();
    const completed = views.find((v) => v.canGiveFeedback)!;
    const upcoming = views.find((v) => v.status === 'booked')!;
    expect((await services.appointments.submitFeedback(upcoming.appointment.id, { processClarity: 'clear', note: '' })).ok).toBe(false);
    expect((await services.appointments.submitFeedback(completed.appointment.id, { processClarity: 'partly', note: 'Ok' })).ok).toBe(true);
    expect((await services.appointments.submitFeedback(completed.appointment.id, { processClarity: 'clear', note: '' })).ok).toBe(false);
  });
});

describe('správa dostupnosti', () => {
  it('odmítne překrývající se termín a přijme navazující', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistB);
    const start = localInputToISO('2026-11-20', '15:00')!;
    expect((await services.availability.addSlot({ startsAt: start, durationMinutes: 50 })).ok).toBe(true);
    const overlap = await services.availability.addSlot({ startsAt: localInputToISO('2026-11-20', '15:30')!, durationMinutes: 30 });
    expect(!overlap.ok && overlap.error.code).toBe('SLOT_OVERLAP');
    const next = await services.availability.addSlot({ startsAt: localInputToISO('2026-11-20', '15:50')!, durationMinutes: 30 });
    expect(next.ok).toBe(true);
  });

  it('odmítne termín v minulosti a neplatnou délku', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistB);
    const past = await services.availability.addSlot({ startsAt: localInputToISO('2026-10-20', '10:00')!, durationMinutes: 50 });
    expect(!past.ok && past.error.code).toBe('SLOT_IN_PAST');
    const invalid = await services.availability.addSlot({
      startsAt: localInputToISO('2026-11-20', '10:00')!,
      durationMinutes: 45 as 50,
    });
    expect(invalid.ok).toBe(false);
  });

  it('proběhlé termíny nelze rušit', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistA);
    const past = services.availability.listOwn().find((v) => Date.parse(v.slot.startsAt) < services.now().getTime());
    expect(past).toBeDefined();
    expect(past!.canWithdraw).toBe(false);
    expect((await services.availability.withdrawSlot(past!.slot.id)).ok).toBe(false);
  });
});

describe('přihlášky a schvalování', () => {
  it('neschválený žadatel nemůže vypisovat termíny ani vidět rezervace', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.applicantPending);
    expect(services.profiles.getOwnStatus()?.kind).toBe('application');
    const added = await services.availability.addSlot({ startsAt: localInputToISO('2026-11-20', '10:00')!, durationMinutes: 50 });
    expect(!added.ok && added.error.code).toBe('NOT_APPROVED');
    expect(services.availability.listOwn()).toEqual([]);
    expect(services.appointments.listForMyPractice()).toEqual([]);
  });

  it('schválení žádosti zpřístupní funkce psychologa', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.admin);
    const result = await services.admin.approve('app-katerina');
    expect(result.ok).toBe(true);
    expect(services.admin.listAuditEvents()[0]?.action).toBe('application_approved');

    await signIn(services, DEMO_USER_IDS.applicantPending);
    expect(services.profiles.getOwnStatus()?.kind).toBe('approved');
    const added = await services.availability.addSlot({ startsAt: localInputToISO('2026-11-20', '10:00')!, durationMinutes: 50 });
    expect(added.ok).toBe(true);
    const profileId = result.ok ? result.value.id : '';
    expect(services.profiles.listPublic().some((p) => p.profile.id === profileId)).toBe(true);
  });

  it('nový žadatel projde stavy rozpracovaná → čeká → vyžaduje doplnění → čeká', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.applicantNew);
    expect(services.profiles.getOwnStatus()?.kind).toBe('no_application');
    const fields = {
      professionalName: 'Testovací Odbornice',
      professionalRole: 'Psycholožka',
      qualificationSummary: 'Fiktivní shrnutí kvalifikace pro test, dostatečně dlouhé.',
      specializations: ['anxiety' as const],
      languages: ['cs' as const],
      capacityPerMonth: 4,
      bio: 'Fiktivní profesní popis pro test, který má dost znaků.',
    };
    const draft = await services.applications.saveDraft({ ...fields, bio: '' });
    expect(draft.ok && draft.value.status).toBe('draft');
    const invalid = await services.applications.submit({ ...fields, bio: '' });
    expect(!invalid.ok && invalid.error.fieldErrors?.bio).toBeTruthy();
    const submitted = await services.applications.submit(fields);
    expect(submitted.ok && submitted.value.status).toBe('submitted');
    const appId = submitted.ok ? submitted.value.id : '';

    await signIn(services, DEMO_USER_IDS.admin);
    expect((await services.admin.requestChanges(appId, 'Doplň prosím jazyky konzultací.')).ok).toBe(true);
    await signIn(services, DEMO_USER_IDS.applicantNew);
    expect(services.applications.getOwn()?.status).toBe('needs_changes');
    expect((await services.applications.submit({ ...fields, languages: ['cs', 'en'] })).ok).toBe(true);
    expect(services.applications.getOwn()?.status).toBe('submitted');
  });

  it('zamítnutou přihlášku nelze upravit', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.admin);
    expect((await services.admin.reject('app-jakub', 'Kapacita pro tento typ zaměření je naplněná.')).ok).toBe(true);
    await signIn(services, 'u-jakub');
    const result = await services.applications.submit(services.applications.getOwn()!);
    expect(!result.ok && result.error.code).toBe('INVALID_STATE');
  });
});

describe('pohledy podle demo účtu', () => {
  it('klient vidí jen své rezervace', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientA);
    const mine = services.appointments.listMine();
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((v) => v.appointment.clientId === DEMO_USER_IDS.clientA)).toBe(true);
    expect(services.appointments.getMine('a-ondrej-next')).toBeNull();
  });

  it('psycholog vidí jen rezervace svých termínů a zkrácené jméno klienta', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.psychologistA);
    const practice = services.appointments.listForMyPractice();
    expect(practice.length).toBeGreaterThan(0);
    expect(practice.every((v) => v.appointment.profileId === 'p-alzbeta')).toBe(true);
    expect(practice.map((v) => v.clientLabel)).toContain('Tereza M.');
    const other = services.store.getState().appointments.find((a) => a.profileId === 'p-vojtech')!;
    expect((await services.appointments.cancelAsPsychologist(other.id)).ok).toBe(false);
  });

  it('administrativní funkce jsou pro jiné účty nedostupné', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.clientA);
    expect(services.admin.listApplications()).toEqual([]);
    expect(services.admin.listAppointments()).toEqual([]);
    const result = await services.admin.approve('app-katerina');
    expect(!result.ok && result.error.code).toBe('FORBIDDEN');
  });

  it('statistiky se počítají z demo dat', async () => {
    const services = createTestServices();
    await signIn(services, DEMO_USER_IDS.admin);
    const stats = services.admin.getStats();
    const state = services.store.getState();
    expect(stats.bookings).toBe(state.appointments.length);
    expect(stats.offeredSlots).toBe(state.slots.filter((s) => s.status === 'published').length);
    expect(stats.completed).toBe(3);
    expect(stats.cancelledByClient).toBe(1);
    expect(stats.cancelledByPsychologist).toBe(1);
    expect(stats.occupancy).toBeGreaterThan(0);
    expect(stats.occupancy).toBeLessThanOrEqual(1);
  });
});

describe('ukládání a obnovení', () => {
  it('zachová data po obnovení stránky (nová instance nad stejným úložištěm)', async () => {
    const storage = new MemoryStorage();
    const first = createTestServices(storage);
    await signIn(first, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(first);
    const booked = await first.appointments.book(slot.id);
    expect(booked.ok).toBe(true);

    const reloaded = createTestServices(storage);
    expect(reloaded.session.getCurrentUser()?.id).toBe(DEMO_USER_IDS.clientB);
    expect(reloaded.appointments.listMine().some((v) => v.appointment.slotId === slot.id)).toBe(true);
  });

  it('obnovení dema vrátí výchozí data a zachová přihlášený účet', async () => {
    const storage = new MemoryStorage();
    const services = createTestServices(storage);
    await signIn(services, DEMO_USER_IDS.clientB);
    const slot = firstOpenSlot(services);
    await services.appointments.book(slot.id);
    services.demo.reset();
    expect(services.store.getState().appointments.some((a) => a.slotId === slot.id && a.clientId === DEMO_USER_IDS.clientB)).toBe(false);
    expect(services.session.getCurrentUser()?.id).toBe(DEMO_USER_IDS.clientB);
    expect(createTestServices(storage).profiles.listBookableSlots('p-hana').some((s) => s.id === slot.id)).toBe(true);
  });
});
