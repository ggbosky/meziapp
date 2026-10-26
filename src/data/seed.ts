import type { DemoState } from '../domain/state';
import { addDaysToKey, addMinutes, dateKey, parseDateKey, toISO, zonedTimeToUtc } from '../domain/time';
import { earliestBookableTime } from '../domain/rules';
import type {
  Appointment,
  ApplicationFields,
  AuditEvent,
  AvailabilitySlot,
  ConsultationDuration,
  Feedback,
  PsychologistApplication,
  PsychologistProfile,
  User,
} from '../domain/types';
import { SCHEMA_VERSION } from '../storage/schemaVersion';

/**
 * Výchozí FIKTIVNÍ data prototypu. Všechny osoby, kvalifikace, termíny
 * i rezervace jsou smyšlené. Termíny se generují relativně k aktuálnímu
 * datu, aby prototyp po týdnu nebyl plný minulých termínů.
 */

export const DEMO_USER_IDS = {
  clientA: 'u-tereza',
  clientB: 'u-ondrej',
  psychologistA: 'u-alzbeta',
  psychologistB: 'u-vojtech',
  applicantPending: 'u-katerina',
  applicantNew: 'u-lenka',
  admin: 'u-admin',
} as const;

const SEED_DAYS = 14;

interface ProfileSeed extends ApplicationFields {
  key: string;
  approach: string;
  approvedDaysAgo: number;
  status: 'active' | 'suspended';
  avatarTone: number;
  /** Týdenní vzor termínů: den v týdnu (0 = pondělí) → začátky. */
  pattern: Partial<Record<number, Array<[string, ConsultationDuration]>>>;
}

const PROFILE_SEEDS: ProfileSeed[] = [
  {
    key: 'alzbeta',
    professionalName: 'Alžběta Krejčí',
    professionalRole: 'Psycholožka',
    qualificationSummary:
      'Fiktivní údaj: magisterské studium psychologie a dlouhodobý výcvik v poradenské práci s dospělými. V prototypu nebylo nic ověřováno.',
    specializations: ['anxiety', 'burnout', 'life_changes'],
    languages: ['cs', 'en'],
    capacityPerMonth: 8,
    bio: 'Smyšlená postava pro ukázku aplikace. V příběhu prototypu pracuje v poradně pro dospělé a část svého času nabízí zdarma.',
    approach:
      'Na první konzultaci se spolu podíváme, s čím přicházíš a co by ti teď mohlo pomoct. Nemusíš mít předem připravené téma ani přesná slova. Pracuji klidným tempem a společně hledáme, jaký další krok dává smysl.',
    approvedDaysAgo: 96,
    status: 'active',
    avatarTone: 0,
    pattern: { 0: [['09:00', 50]], 2: [['16:00', 50], ['17:00', 50]], 4: [['10:00', 30]] },
  },
  {
    key: 'vojtech',
    professionalName: 'Vojtěch Pokorný',
    professionalRole: 'Psycholog',
    qualificationSummary:
      'Fiktivní údaj: studium psychologie a praxe v poradenství pro studenty a mladé dospělé. V prototypu nebylo nic ověřováno.',
    specializations: ['relationships', 'loneliness', 'young_adults'],
    languages: ['cs', 'sk'],
    capacityPerMonth: 6,
    bio: 'Smyšlená postava pro ukázku aplikace. Konzultace nabízí převážně ve večerních hodinách.',
    approach:
      'Konzultace beru jako bezpečný prostor, kde můžeš v klidu mluvit o tom, co se teď děje. Zajímá mě tvůj pohled a tempo. Na konci se domluvíme, co si z rozhovoru odnášíš a kde případně hledat další podporu.',
    approvedDaysAgo: 74,
    status: 'active',
    avatarTone: 1,
    pattern: { 1: [['17:30', 50], ['18:30', 50]], 3: [['08:00', 30], ['08:40', 30]] },
  },
  {
    key: 'hana',
    professionalName: 'Hana Zelenková',
    professionalRole: 'Poradenská psycholožka',
    qualificationSummary:
      'Fiktivní údaj: studium psychologie se zaměřením na poradenství a práci s lidmi po ztrátě blízkého. V prototypu nebylo nic ověřováno.',
    specializations: ['grief', 'relationships', 'self_esteem'],
    languages: ['cs', 'de'],
    capacityPerMonth: 6,
    bio: 'Smyšlená postava pro ukázku aplikace. Konzultace vede česky nebo německy.',
    approach:
      'Ráda nejdřív poslouchám. Společně si můžeme ujasnit, co je pro tebe teď nejtěžší a co ti v podobných chvílích pomáhalo dřív. Neslibuji rychlá řešení, ale nabízím pozornost a otevřený rozhovor.',
    approvedDaysAgo: 61,
    status: 'active',
    avatarTone: 2,
    pattern: { 0: [['14:00', 50]], 3: [['14:00', 50], ['15:00', 50]] },
  },
  {
    key: 'daniel',
    professionalName: 'Daniel Říha',
    professionalRole: 'Psycholog',
    qualificationSummary:
      'Fiktivní údaj: studium psychologie a praxe v oblasti pracovní zátěže. V prototypu nebylo nic ověřováno.',
    specializations: ['burnout', 'anxiety'],
    languages: ['cs', 'en'],
    capacityPerMonth: 4,
    bio: 'Smyšlená postava pro ukázku aplikace. Nové termíny vypisuje nepravidelně.',
    approach:
      'Pomáhám zorientovat se v situacích, kdy je toho na člověka moc. Na konzultaci můžeme probrat, co tě teď zatěžuje, a podívat se na možnosti, které máš k dispozici.',
    approvedDaysAgo: 48,
    status: 'active',
    avatarTone: 3,
    pattern: {},
  },
  {
    key: 'marta',
    professionalName: 'Marta Šťastná',
    professionalRole: 'Psycholožka',
    qualificationSummary:
      'Fiktivní údaj: studium psychologie a zkušenost s poradenstvím pro lidi v nové životní situaci. V prototypu nebylo nic ověřováno.',
    specializations: ['young_adults', 'self_esteem', 'life_changes'],
    languages: ['cs', 'uk', 'en'],
    capacityPerMonth: 10,
    bio: 'Smyšlená postava pro ukázku aplikace. Konzultace nabízí česky, ukrajinsky nebo anglicky.',
    approach:
      'Na konzultaci je místo pro cokoli, co právě řešíš, i když to zatím neumíš pojmenovat. Společně se podíváme, co by ti mohlo ulevit, a domluvíme se, jestli a jak pokračovat.',
    approvedDaysAgo: 33,
    status: 'active',
    avatarTone: 4,
    pattern: { 1: [['10:00', 50]], 5: [['09:00', 50], ['10:00', 50]] },
  },
  {
    key: 'filip',
    professionalName: 'Filip Novotný',
    professionalRole: 'Psycholog',
    qualificationSummary:
      'Fiktivní údaj: studium psychologie a praxe v poradně. V prototypu nebylo nic ověřováno.',
    specializations: ['anxiety', 'life_changes'],
    languages: ['cs'],
    capacityPerMonth: 4,
    bio: 'Smyšlená postava pro ukázku aplikace. Profil je dočasně pozastavený administrací.',
    approach:
      'Konzultace vedu otevřeně a bez spěchu. Společně se zaměříme na to, co je pro tebe teď důležité.',
    approvedDaysAgo: 120,
    status: 'suspended',
    avatarTone: 5,
    pattern: { 4: [['12:00', 50]] },
  },
];

const PENDING_APPLICATIONS: Array<ApplicationFields & { key: string; submittedDaysAgo: number }> = [
  {
    key: 'katerina',
    professionalName: 'Kateřina Holubová',
    professionalRole: 'Psycholožka',
    qualificationSummary:
      'Fiktivní údaj: magisterské studium psychologie, praxe v poradně pro dospělé. Doklady se v prototypu nenahrávají.',
    specializations: ['anxiety', 'relationships'],
    languages: ['cs', 'en'],
    capacityPerMonth: 5,
    bio: 'Smyšlená žadatelka. Chtěla by nabídnout několik večerních konzultací měsíčně.',
    submittedDaysAgo: 2,
  },
  {
    key: 'jakub',
    professionalName: 'Jakub Sýkora',
    professionalRole: 'Psycholog',
    qualificationSummary:
      'Fiktivní údaj: studium psychologie a zkušenost s prací se studenty. Doklady se v prototypu nenahrávají.',
    specializations: ['young_adults', 'loneliness'],
    languages: ['cs', 'sk'],
    capacityPerMonth: 4,
    bio: 'Smyšlený žadatel se zájmem o konzultace pro mladé dospělé.',
    submittedDaysAgo: 1,
  },
];

export function createSeed(now: Date): DemoState {
  const today = dateKey(now);
  const at = (dayOffset: number, time: string): Date => {
    const [hour, minute] = time.split(':').map(Number);
    return zonedTimeToUtc({ ...parseDateKey(addDaysToKey(today, dayOffset)), hour: hour ?? 0, minute: minute ?? 0 });
  };
  const daysAgo = (days: number, time = '10:00'): string => toISO(at(-days, time));

  const users: User[] = [
    {
      id: DEMO_USER_IDS.clientA,
      role: 'client',
      displayName: 'Tereza Malá',
      email: 'tereza.demo@example.com',
      demoDescription: 'Má jednu naplánovanou konzultaci a několik záznamů v historii.',
      createdAt: daysAgo(40),
    },
    {
      id: DEMO_USER_IDS.clientB,
      role: 'client',
      displayName: 'Ondřej Král',
      email: 'ondrej.demo@example.com',
      demoDescription: 'Má naplánovanou večerní konzultaci a jednu zrušenou odborníkem.',
      createdAt: daysAgo(25),
    },
    {
      id: DEMO_USER_IDS.admin,
      role: 'admin',
      displayName: 'Provozní administrace',
      email: 'admin.demo@example.com',
      demoDescription: 'Posuzuje přihlášky, spravuje profily a vidí provozní přehled.',
      createdAt: daysAgo(200),
    },
    {
      id: DEMO_USER_IDS.applicantNew,
      role: 'professional',
      displayName: 'Lenka Dušková',
      email: 'lenka.demo@example.com',
      demoDescription: 'Nový žadatel. Přihlášku zatím nevyplnil.',
      createdAt: daysAgo(0, '08:00'),
    },
  ];

  const applications: PsychologistApplication[] = [];
  const profiles: PsychologistProfile[] = [];
  const slots: AvailabilitySlot[] = [];
  const auditEvents: AuditEvent[] = [];

  for (const seed of PROFILE_SEEDS) {
    const userId = `u-${seed.key}`;
    const applicationId = `app-${seed.key}`;
    const profileId = `p-${seed.key}`;
    const approvedAt = daysAgo(seed.approvedDaysAgo, '11:20');
    const fields: ApplicationFields = {
      professionalName: seed.professionalName,
      professionalRole: seed.professionalRole,
      qualificationSummary: seed.qualificationSummary,
      specializations: seed.specializations,
      languages: seed.languages,
      capacityPerMonth: seed.capacityPerMonth,
      bio: seed.bio,
    };
    users.push({
      id: userId,
      role: 'professional',
      displayName: seed.professionalName,
      email: `${seed.key}.demo@example.com`,
      demoDescription:
        seed.status === 'active'
          ? 'Schválený profil s vypsanými termíny a rezervacemi.'
          : 'Profil pozastavený administrací.',
      createdAt: daysAgo(seed.approvedDaysAgo + 6),
    });
    applications.push({
      ...fields,
      id: applicationId,
      userId,
      status: 'approved',
      createdAt: daysAgo(seed.approvedDaysAgo + 6),
      updatedAt: approvedAt,
      submittedAt: daysAgo(seed.approvedDaysAgo + 4),
      decidedAt: approvedAt,
      reviewerMessage: null,
      internalNote: 'Fiktivní kontrola údajů proběhla v rámci ukázky.',
      profileId,
    });
    const suspended = seed.status === 'suspended';
    profiles.push({
      ...fields,
      id: profileId,
      userId,
      applicationId,
      approach: seed.approach,
      status: seed.status,
      suspendedAt: suspended ? daysAgo(4, '09:15') : null,
      suspensionReason: suspended ? 'Odborník požádal o dočasné přerušení (fiktivní důvod).' : null,
      acceptingBookings: true,
      approvedAt,
      avatarTone: seed.avatarTone,
    });
    auditEvents.push({
      id: `audit-approve-${seed.key}`,
      at: approvedAt,
      actorId: DEMO_USER_IDS.admin,
      action: 'application_approved',
      targetType: 'application',
      targetId: applicationId,
      summary: `Schválena přihláška: ${seed.professionalName}.`,
    });
    if (suspended) {
      auditEvents.push({
        id: `audit-suspend-${seed.key}`,
        at: daysAgo(4, '09:15'),
        actorId: DEMO_USER_IDS.admin,
        action: 'profile_suspended',
        targetType: 'profile',
        targetId: profileId,
        summary: `Pozastaven profil: ${seed.professionalName}. Důvod: odborník požádal o dočasné přerušení (fiktivní důvod).`,
      });
    }

    // Budoucí termíny podle týdenního vzoru na příštích 14 dní.
    const earliest = earliestBookableTime(now).getTime();
    for (let offset = 0; offset < SEED_DAYS; offset++) {
      const key = addDaysToKey(today, offset);
      const { year, month, day } = parseDateKey(key);
      const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
      for (const [time, duration] of seed.pattern[weekday] ?? []) {
        const start = at(offset, time);
        if (start.getTime() < earliest) continue;
        slots.push({
          id: `s-${seed.key}-${key}-${time.replace(':', '')}`,
          profileId,
          startsAt: toISO(start),
          durationMinutes: duration,
          status: 'published',
          createdAt: daysAgo(Math.max(1, 7 - offset)),
          withdrawnAt: null,
        });
      }
    }
  }

  for (const app of PENDING_APPLICATIONS) {
    const { key, submittedDaysAgo, ...fields } = app;
    users.push({
      id: `u-${key}`,
      role: 'professional',
      displayName: fields.professionalName,
      email: `${key}.demo@example.com`,
      demoDescription: 'Odeslaná přihláška čeká na posouzení administrací.',
      createdAt: daysAgo(submittedDaysAgo + 1),
    });
    applications.push({
      ...fields,
      id: `app-${key}`,
      userId: `u-${key}`,
      status: 'submitted',
      createdAt: daysAgo(submittedDaysAgo + 1),
      updatedAt: daysAgo(submittedDaysAgo, '18:40'),
      submittedAt: daysAgo(submittedDaysAgo, '18:40'),
      decidedAt: null,
      reviewerMessage: null,
      internalNote: '',
      profileId: null,
    });
  }

  // Jedna historicky zamítnutá přihláška pro ukázku stavu v administraci.
  users.push({
    id: 'u-radek',
    role: 'professional',
    displayName: 'Radek Pešek',
    email: 'radek.demo@example.com',
    demoDescription: 'Zamítnutá přihláška (není v nabídce demo účtů).',
    createdAt: daysAgo(30),
  });
  applications.push({
    id: 'app-radek',
    userId: 'u-radek',
    status: 'rejected',
    professionalName: 'Radek Pešek',
    professionalRole: 'Kouč',
    qualificationSummary: 'Fiktivní údaj: kurz osobního rozvoje. Bez psychologického vzdělání.',
    specializations: ['life_changes'],
    languages: ['cs'],
    capacityPerMonth: 20,
    bio: 'Smyšlený žadatel pro ukázku zamítnuté přihlášky.',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(20, '13:05'),
    submittedAt: daysAgo(28),
    decidedAt: daysAgo(20, '13:05'),
    reviewerMessage: 'Služba je zatím určená pouze psychologům. Děkujeme za zájem.',
    internalNote: 'Neodpovídá požadavku na psychologické vzdělání (fiktivní případ).',
    profileId: null,
  });
  auditEvents.push({
    id: 'audit-reject-radek',
    at: daysAgo(20, '13:05'),
    actorId: DEMO_USER_IDS.admin,
    action: 'application_rejected',
    targetType: 'application',
    targetId: 'app-radek',
    summary: 'Zamítnuta přihláška: Radek Pešek. Služba je zatím určená pouze psychologům.',
  });

  // Ukázkové minulé a budoucí rezervace.
  const appointments: Appointment[] = [];
  const feedback: Feedback[] = [];

  const addPastSlot = (profileKey: string, dayOffset: number, time: string, duration: ConsultationDuration, withdrawn = false) => {
    const start = at(dayOffset, time);
    const slot: AvailabilitySlot = {
      id: `s-${profileKey}-past-${addDaysToKey(today, dayOffset)}-${time.replace(':', '')}`,
      profileId: `p-${profileKey}`,
      startsAt: toISO(start),
      durationMinutes: duration,
      status: withdrawn ? 'withdrawn' : 'published',
      createdAt: toISO(addMinutes(start, -10 * 24 * 60)),
      withdrawnAt: withdrawn ? toISO(addMinutes(start, -2 * 24 * 60)) : null,
    };
    slots.push(slot);
    return slot;
  };

  const book = (
    id: string,
    slot: AvailabilitySlot,
    clientId: string,
    status: Appointment['status'],
    createdDaysBefore = 3,
  ): Appointment => {
    const start = new Date(slot.startsAt);
    const appointment: Appointment = {
      id,
      slotId: slot.id,
      profileId: slot.profileId,
      clientId,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      status,
      createdAt: toISO(addMinutes(start, -createdDaysBefore * 24 * 60)),
      cancelledAt: status.startsWith('cancelled') ? toISO(addMinutes(start, -24 * 60)) : null,
    };
    appointments.push(appointment);
    return appointment;
  };

  const terezaPast1 = book('a-tereza-past-1', addPastSlot('alzbeta', -9, '09:00', 50), DEMO_USER_IDS.clientA, 'completed', 5);
  book('a-tereza-past-2', addPastSlot('vojtech', -6, '17:30', 50), DEMO_USER_IDS.clientA, 'cancelled_by_client');
  book('a-tereza-past-3', addPastSlot('hana', -3, '14:00', 50), DEMO_USER_IDS.clientA, 'completed', 4);
  book('a-ondrej-past-1', addPastSlot('marta', -7, '10:00', 50), DEMO_USER_IDS.clientB, 'completed', 6);
  book('a-ondrej-past-2', addPastSlot('alzbeta', -2, '16:00', 50, true), DEMO_USER_IDS.clientB, 'cancelled_by_psychologist');

  feedback.push({
    id: 'f-tereza-1',
    appointmentId: terezaPast1.id,
    clientId: DEMO_USER_IDS.clientA,
    createdAt: toISO(addMinutes(new Date(terezaPast1.startsAt), 26 * 60)),
    processClarity: 'clear',
    note: 'Rezervace byla jednoduchá. (Fiktivní ukázková zpětná vazba.)',
  });

  // Budoucí rezervace: klientka A u psycholožky A, klient B u psychologa B.
  const firstFutureSlot = (profileId: string, minDayOffset: number): AvailabilitySlot | undefined => {
    const from = startOfOffset(today, minDayOffset);
    return slots
      .filter((s) => s.profileId === profileId && s.status === 'published' && Date.parse(s.startsAt) >= from)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  };
  const terezaFuture = firstFutureSlot('p-alzbeta', 1);
  if (terezaFuture) book('a-tereza-next', terezaFuture, DEMO_USER_IDS.clientA, 'booked', 1);
  const ondrejFuture = firstFutureSlot('p-vojtech', 2);
  if (ondrejFuture) book('a-ondrej-next', ondrejFuture, DEMO_USER_IDS.clientB, 'booked', 1);

  auditEvents.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  slots.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));

  return {
    schemaVersion: SCHEMA_VERSION,
    seededAt: toISO(now),
    session: { userId: null },
    users,
    applications,
    profiles,
    slots,
    appointments,
    feedback,
    auditEvents,
  };
}

function startOfOffset(today: string, offset: number): number {
  return zonedTimeToUtc({ ...parseDateKey(addDaysToKey(today, offset)), hour: 0, minute: 0 }).getTime();
}
