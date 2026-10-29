import {
  ArrowRight,
  BatteryLow,
  ChevronDown,
  CircleSlash,
  Flower2,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  MapPin,
  Hourglass,
  MessageCircleHeart,
  Search,
  ShieldCheck,
  Signpost,
  Siren,
  Sprout,
  Wind,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser, useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Avatar } from '../../components/ui/Avatar';
import { ButtonLink } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { HeroIllustration, TimeIllustration } from '../../components/ui/Illustrations';
import { LocationBar } from '../../components/location/LocationBar';
import { appConfig } from '../../config/app';
import { SPECIALIZATIONS } from '../../domain/catalog';
import { formatDistance } from '../../domain/places';
import { atTime, formatDateTime, formatRelativeDay, formatTimeRange } from '../../domain/time';
import type { SpecializationId } from '../../domain/types';

const TOPIC_ICONS: Record<SpecializationId, ReactNode> = {
  anxiety: <Wind aria-hidden />,
  relationships: <HeartHandshake aria-hidden />,
  grief: <Flower2 aria-hidden />,
  burnout: <BatteryLow aria-hidden />,
  life_changes: <Signpost aria-hidden />,
  self_esteem: <Sprout aria-hidden />,
  loneliness: <MessageCircleHeart aria-hidden />,
  young_adults: <GraduationCap aria-hidden />,
};
const TILE_TONES = ['bg-sage-100', 'bg-sun-soft', 'bg-peach-soft', 'bg-sky-soft'];

const FAQ = [
  {
    q: 'Kolik konzultace stojí?',
    a: 'Nic. Všechny konzultace jsou zdarma. Služba nemá předplatné, prémiové účty, kredity ani reklamy a nikdo si nemůže zaplatit přednost.',
  },
  {
    q: 'Kdo jsou odborníci?',
    a: 'Psychologové, kteří nabízejí část svého času zdarma. Každou přihlášku posuzuje člověk z provozního týmu. V tomto prototypu jsou všichni odborníci i jejich kvalifikace fiktivní a schvalování je jen simulované.',
  },
  {
    q: 'Musím popsat, co mě trápí?',
    a: 'Ne. K rezervaci nepotřebuješ diagnózu, doporučení ani popis potíží. Nemusíš mít všechno předem pojmenované, o tom, co řešíš, můžeš mluvit až na konzultaci.',
  },
  {
    q: 'Co když nejsou volné termíny?',
    a: 'Kapacita je omezená, protože odborníci nabízejí jen část svého času. Když teď nejsou vypsané volné termíny, zkus se podívat později. Pokud potřebuješ pomoc rychle, podívej se na stránku Naléhavá pomoc.',
  },
  {
    q: 'Můžu rezervaci zrušit?',
    a: 'Ano, budoucí rezervaci můžeš zrušit v přehledu svých termínů. Termín se tím uvolní pro někoho dalšího.',
  },
  {
    q: 'Je to krizová pomoc?',
    a: `Ne. Služba není určená pro akutní situace a nikdo tu průběžně nesleduje zprávy. Při ohrožení života volej ${appConfig.urgentHelp.emergencyNumber}.`,
  },
  {
    q: 'Pro koho je služba určená?',
    a: `Lidem od ${appConfig.minimumAge} let. Pokud je ti ${appConfig.minimumAge}–${appConfig.adultAge - 1}, ukážeme ti odborníky, kteří pracují s dospívajícími. Pravidla pro souhlas rodičů u nezletilých se před spuštěním služby ověří s právníky.`,
  },
  {
    q: 'Jsou údaje v aplikaci skutečné?',
    a: 'Ne. Jde o demonstrační prototyp. Všechny osoby, termíny a rezervace jsou smyšlené a změny se ukládají jen do tvého prohlížeče.',
  },
];

function SectionHead({ id, title, action }: { id: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-3">
      <h2 id={id} className="text-xl font-extrabold text-ink sm:text-2xl">
        {title}
      </h2>
      {action}
    </div>
  );
}

function NextBooking() {
  const user = useCurrentUser();
  const { appointments } = useServices();
  const now = useNow();
  if (user?.role !== 'client') return null;
  const next = appointments.listMine().find((v) => v.status === 'booked');
  if (!next) return null;
  return (
    <section aria-labelledby="next-title">
      <SectionHead id="next-title" title="Tvoje příští konzultace" />
      <Link
        to={`/klient/rezervace/${next.appointment.id}`}
        className="flex items-center gap-4 rounded-[var(--radius-card)] bg-brand-800 p-4 text-white shadow-raised sm:p-5"
      >
        <Avatar name={next.profile.professionalName} tone={next.profile.avatarTone} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-round text-lg font-extrabold first-letter:uppercase">{formatDateTime(next.appointment.startsAt, now)}</span>
          <span className="block truncate text-sm text-white/80">
            {next.profile.professionalName} · {formatTimeRange(next.appointment.startsAt, next.appointment.durationMinutes)}
          </span>
        </span>
        <ArrowRight aria-hidden className="size-5 shrink-0" />
      </Link>
    </section>
  );
}

function NearbySection() {
  const { profiles, session } = useServices();
  const user = useCurrentUser();
  const now = useNow();
  const location = session.getLocation();
  const radius = appConfig.location.nearbyRadiusKm;
  const nearby = location
    ? profiles
        .listPublic({ nearCityId: location.id, sort: 'distance', youthOnly: user?.role === 'client' && user.ageGroup === 'youth' })
        .filter((s) => s.distanceKm !== null && s.distanceKm <= radius)
        .slice(0, 4)
    : [];
  return (
    <section aria-labelledby="nearby-title">
      <SectionHead
        id="nearby-title"
        title="Psychologové ve tvém okolí"
        action={
          location ? (
            <Link to="/psychologove" className="link shrink-0 text-sm">
              Zobrazit vše
            </Link>
          ) : undefined
        }
      />
      <LocationBar />
      {location &&
        (nearby.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-card)] bg-surface p-5 text-muted shadow-soft">
            Do {radius} km od města {location.name} teď nikoho nemáme. Konzultace online jsou ale dostupné odkudkoli.
          </p>
        ) : (
          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
            {nearby.map(({ profile, city, distanceKm: km, nextSlot }) => (
              <li key={profile.id} className="w-[15.5rem] shrink-0 snap-start sm:w-auto">
                <Link
                  to={`/psychologove/${profile.id}`}
                  className="flex h-full flex-col rounded-[var(--radius-card)] bg-surface p-4 shadow-soft transition-shadow hover:shadow-raised"
                >
                  <span className="flex items-center gap-3">
                    <Avatar name={profile.professionalName} tone={profile.avatarTone} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{profile.professionalName}</span>
                      <span className="flex items-center gap-1 truncate text-sm text-muted">
                        <MapPin aria-hidden className="size-3.5 shrink-0" />
                        {city?.name} · {km !== null ? formatDistance(km) : ''}
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-brand-900">{profile.offersInPerson ? 'Online i osobně' : 'Online'}</span>
                    {nextSlot && (
                      <span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-ink first-letter:uppercase">
                        {formatRelativeDay(nextSlot.startsAt, now)} {atTime(nextSlot.startsAt)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}

function YouthSection() {
  const youth = appConfig.urgentHelp.verifiedContacts.find((c) => c.audience === 'youth');
  return (
    <section aria-labelledby="youth-title" className="overflow-hidden rounded-[28px] bg-sun-soft">
      <div className="p-6 sm:p-8">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-ink">
          Je ti {appConfig.minimumAge}–{appConfig.adultAge - 1}?
        </p>
        <h2 id="youth-title" className="mt-3 text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
          Bojíš se o tom mluvit? To je úplně v pořádku.
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink/80">
          Nemusíš vědět, jak začít, ani mít všechno vymyšlené. Někteří naši psychologové pracují právě s dospívajícími a nikdo tě
          tu nebude soudit. Na začátku ti vysvětlí, co zůstane jen mezi vámi a kdy by bylo potřeba zapojit rodiče.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <ButtonLink to="/psychologove?mladi=1" size="lg" icon={<Sprout aria-hidden className="size-5" />}>
            Psychologové pro dospívající
          </ButtonLink>
          {youth && (
            <a
              href={youth.href}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[14px] border-2 border-amber-line bg-white px-5 text-center font-semibold text-ink"
            >
              {youth.name}: {youth.contact}
            </a>
          )}
        </div>
        {youth && <p className="mt-3 text-sm text-ink/70">Potřebuješ si promluvit hned? {youth.name} je nonstop, zdarma a anonymně.</p>}
      </div>
    </section>
  );
}

function SoonSlots() {
  const { profiles } = useServices();
  const user = useCurrentUser();
  const now = useNow();
  const items = profiles
    .listPublic({ sort: 'soonest', youthOnly: user?.role === 'client' && user.ageGroup === 'youth' })
    .filter((s) => s.nextSlot)
    .slice(0, 4);
  return (
    <section aria-labelledby="soon-title">
      <SectionHead
        id="soon-title"
        title="Volné termíny brzy"
        action={
          <Link to="/psychologove" className="link shrink-0 text-sm">
            Všichni psychologové
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-card)] bg-surface p-5 text-muted shadow-soft">Teď nejsou vypsané volné termíny.</p>
      ) : (
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
          {items.map(({ profile, nextSlot }) => (
            <li key={profile.id} className="w-[15.5rem] shrink-0 snap-start sm:w-auto">
              <Link
                to={`/psychologove/${profile.id}`}
                className="flex h-full flex-col rounded-[var(--radius-card)] bg-surface p-4 shadow-soft transition-shadow hover:shadow-raised"
              >
                <span className="flex items-center gap-3">
                  <Avatar name={profile.professionalName} tone={profile.avatarTone} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{profile.professionalName}</span>
                    <span className="block truncate text-sm text-muted">{profile.professionalRole}</span>
                  </span>
                </span>
                <span className="mt-4 inline-flex w-fit rounded-full bg-sage-100 px-3 py-1 text-sm font-bold text-brand-800 first-letter:uppercase">
                  {nextSlot ? `${formatRelativeDay(nextSlot.startsAt, now)} ${atTime(nextSlot.startsAt)}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">Fiktivní odborníci a termíny z ukázkových dat.</p>
    </section>
  );
}

export function HomePage() {
  usePageTitle(null);
  useDemoSnapshot();
  return (
    <div className="container-page space-y-10 py-5 sm:py-8">
      <section className="animate-enter overflow-hidden rounded-[28px] bg-sage-100 md:grid md:grid-cols-[1.1fr_1fr] md:items-end">
        <div className="p-6 pb-2 sm:p-9 sm:pb-9">
          <p className="inline-flex flex-wrap items-center gap-x-1.5 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-brand-800">
            Konzultace zdarma <span aria-hidden className="text-muted">·</span> <span className="font-medium text-muted">od {appConfig.minimumAge} let</span>
          </p>
          <h1 className="mt-4 font-display text-[2.2rem] font-extrabold leading-[1.08] text-brand-950 sm:text-5xl">{appConfig.tagline}</h1>
          <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-ink/80">
            Psychologové tu nabízejí část svého času zdarma. Vyber si termín bezplatné konzultace. Nemusíš mít všechno předem pojmenované.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <ButtonLink to="/psychologove" size="lg" icon={<Search aria-hidden className="size-5" />}>
              Prohlédnout psychology
            </ButtonLink>
            <ButtonLink to="/pro-odborniky" size="lg" variant="secondary" icon={<HandHeart aria-hidden className="size-5" />}>
              Chci nabídnout svůj čas
            </ButtonLink>
          </div>
        </div>
        <HeroIllustration className="mt-2 md:mt-0" />
      </section>

      <Link
        to="/nalehava-pomoc"
        className="-mt-4 flex items-center gap-3 rounded-[18px] bg-danger-soft px-4 py-3 text-sm text-danger-strong"
      >
        <Siren aria-hidden className="size-5 shrink-0" />
        <span className="flex-1">
          <strong className="font-bold">Nejde o akutní pomoc.</strong> Při ohrožení života volej {appConfig.urgentHelp.emergencyNumber}.
        </span>
        <ArrowRight aria-hidden className="size-4 shrink-0" />
      </Link>

      <NextBooking />

      <NearbySection />

      <section aria-labelledby="topics-title">
        <SectionHead id="topics-title" title="S čím ti můžeme pomoct?" />
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {SPECIALIZATIONS.map((s, i) => (
            <li key={s.id}>
              <Link
                to={`/psychologove?zamereni=${s.id}`}
                className={cn(
                  'flex h-full min-h-[6.5rem] flex-col justify-between gap-3 rounded-[20px] p-4 font-bold leading-snug text-ink transition-transform active:scale-[0.98]',
                  TILE_TONES[i % TILE_TONES.length],
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-white/80 text-brand-800 [&_svg]:size-5">{TOPIC_ICONS[s.id]}</span>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-sm text-muted">Nevíš, kam to zařadit? To je v pořádku. Můžeš si vybrat kohokoli.</p>
      </section>

      <SoonSlots />

      <YouthSection />

      <section aria-labelledby="steps-title">
        <SectionHead id="steps-title" title="Jak to funguje" />
        <ol className="grid gap-4 rounded-[var(--radius-card)] bg-surface p-5 shadow-soft sm:grid-cols-3 sm:p-6">
          {[
            { title: 'Vyber si odborníka', text: 'Podle zaměření, jazyka nebo nejbližšího volného termínu.' },
            { title: 'Rezervuj termín', text: 'Bez diagnózy, doporučení a popisování potíží.' },
            { title: 'Konzultace online', text: '30 nebo 50 minut přes videohovor, zdarma.' },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sun font-round text-lg font-extrabold text-ink">{i + 1}</span>
              <span>
                <span className="block font-bold">{step.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="fair-title">
        <SectionHead id="fair-title" title="Zdarma a za stejných podmínek" />
        <ul className="grid gap-x-6 gap-y-5 rounded-[var(--radius-card)] bg-surface p-5 shadow-soft sm:grid-cols-2 sm:p-6">
          {[
            { icon: <HandHeart aria-hidden />, title: 'Vždy zdarma', text: 'Žádné předplatné, prémiové účty, kredity ani reklamy.' },
            {
              icon: <CircleSlash aria-hidden />,
              title: 'Bez placeného předbíhání',
              text: 'Termíny jsou dostupné všem stejně. Najednou můžeš mít nejvýš dvě naplánované konzultace.',
            },
            {
              icon: <Hourglass aria-hidden />,
              title: 'Omezená kapacita',
              text: 'Volné termíny se mohou rychle obsadit a někdy nebudou žádné. Neslibujeme okamžitou dostupnost.',
            },
            { icon: <ShieldCheck aria-hidden />, title: 'Ručně schválení odborníci', text: 'Každou přihlášku posoudí člověk. V prototypu je schvalování simulované.' },
          ].map((item) => (
            <li key={item.title} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-sage-100 text-brand-800 [&_svg]:size-5">{item.icon}</span>
              <span>
                <span className="block font-bold">{item.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-[var(--radius-card)] bg-amber-soft p-5 text-sm leading-relaxed text-ink/85">
          <p className="font-bold text-amber-ink">Co služba není</p>
          <p className="mt-1">
            Není to akutní ani krizová pomoc a zprávy tu nikdo průběžně nesleduje. Neslibujeme léčbu ani konkrétní výsledek a nejsme dostupní
            nepřetržitě.
          </p>
        </div>
      </section>

      <section aria-labelledby="pros-title" className="overflow-hidden rounded-[28px] bg-brand-900 text-white sm:grid sm:grid-cols-[1.4fr_1fr] sm:items-center">
        <div className="p-6 sm:p-9">
          <h2 id="pros-title" className="text-2xl font-extrabold leading-tight sm:text-3xl">
            Jsi psycholog nebo psycholožka?
          </h2>
          <p className="mt-3 max-w-md leading-relaxed text-white/80">
            Nabídni pár bezplatných konzultací měsíčně. Termíny i jejich počet si určuješ sám nebo sama a příjem rezervací můžeš kdykoli
            pozastavit.
          </p>
          <ButtonLink to="/pro-odborniky" variant="secondary" size="lg" className="mt-6 border-transparent">
            Chci nabídnout svůj čas
          </ButtonLink>
        </div>
        <TimeIllustration className="mx-auto max-w-[15rem] px-6 pb-6 sm:max-w-none sm:pb-0" />
      </section>

      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20">
        <SectionHead id="faq-title" title="Časté otázky" />
        <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 font-bold text-ink hover:bg-sage-50 [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="pb-2 text-center text-xs leading-relaxed text-muted lg:hidden">
        Demonstrační prototyp. Všechny osoby, termíny a rezervace jsou fiktivní.{' '}
        <Link to="/o-prototypu" className="underline">
          O prototypu
        </Link>
      </p>
    </div>
  );
}
