import {
  ArrowRight,
  CalendarCheck,
  CircleSlash,
  Clock,
  HandHeart,
  Hourglass,
  Search,
  ShieldCheck,
  Siren,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Avatar } from '../../components/ui/Avatar';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { appConfig } from '../../config/app';
import { formatDateTime } from '../../domain/time';

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
    a: 'Ano, budoucí rezervaci můžeš zrušit ve svém přehledu. Termín se tím uvolní pro někoho dalšího.',
  },
  {
    q: 'Je to krizová pomoc?',
    a: 'Ne. Služba není určená pro akutní situace a nikdo tu průběžně nesleduje zprávy. Při ohrožení života volej 112.',
  },
  {
    q: 'Pro koho je služba určená?',
    a: `První verze je určená lidem od ${appConfig.minimumAge} let.`,
  },
  {
    q: 'Jsou údaje v aplikaci skutečné?',
    a: 'Ne. Jde o demonstrační prototyp. Všechny osoby, termíny a rezervace jsou smyšlené a změny se ukládají jen do tvého prohlížeče.',
  },
];

function UpcomingPreview() {
  const { profiles } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const items = profiles
    .listPublic({ sort: 'soonest' })
    .filter((s) => s.nextSlot)
    .slice(0, 3);
  return (
    <Card className="relative p-5 sm:p-6" aria-labelledby="preview-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="preview-title" className="text-sm font-semibold text-ink">
          Nejbližší volné termíny
        </h2>
        <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-brand-900">Zdarma</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Teď nejsou vypsané volné termíny.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map(({ profile, nextSlot }) => (
            <li key={profile.id}>
              <Link
                to={`/psychologove/${profile.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-3 transition-colors hover:border-brand-300 hover:bg-sage-50"
              >
                <Avatar name={profile.professionalName} tone={profile.avatarTone} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{profile.professionalName}</span>
                  <span className="block truncate text-xs text-muted first-letter:uppercase">
                    {nextSlot ? formatDateTime(nextSlot.startsAt, now) : ''} · {nextSlot?.durationMinutes} min
                  </span>
                </span>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-brand-700" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted">Fiktivní odborníci a termíny z ukázkových dat.</p>
    </Card>
  );
}

export function HomePage() {
  usePageTitle(null);
  return (
    <>
      {/* Úvod */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-sage-100/80" />
        <div aria-hidden className="pointer-events-none absolute -right-8 top-48 size-64 rounded-full border-[28px] border-sage-100/70" />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
          <div className="animate-enter">
            <p className="mb-5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted">
              <span className="font-medium text-brand-800">Bezplatné konzultace</span>
              <span aria-hidden>·</span>
              <span>pro lidi od {appConfig.minimumAge} let</span>
            </p>
            <h1 className="font-display text-[2.6rem] font-semibold leading-[1.08] text-ink sm:text-6xl">{appConfig.tagline}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Propojujeme dospělé, kteří hledají podporu, s psychology, kteří nabízejí část svého času zdarma. Nemusíš mít všechno předem
              pojmenované.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/psychologove" size="lg" icon={<Search aria-hidden className="size-5" />}>
                Prohlédnout psychology
              </ButtonLink>
              <ButtonLink to="/pro-odborniky" size="lg" variant="secondary" icon={<HandHeart aria-hidden className="size-5" />}>
                Chci nabídnout svůj čas
              </ButtonLink>
            </div>
            <p className="mt-6 flex items-start gap-2 text-sm text-muted">
              <Siren aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
              <span>
                Nejde o akutní pomoc. Při ohrožení života volej {appConfig.urgentHelp.emergencyNumber}.{' '}
                <Link to="/nalehava-pomoc" className="link">
                  Naléhavá pomoc
                </Link>
              </span>
            </p>
          </div>
          <div className="animate-enter [animation-delay:80ms]">
            <UpcomingPreview />
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section aria-labelledby="steps-title" className="border-y border-line bg-surface py-16 sm:py-20">
        <div className="container-page">
          <h2 id="steps-title" className="font-display text-3xl font-semibold sm:text-4xl">
            Jak to funguje
          </h2>
          <p className="mt-3 max-w-2xl text-muted">Tři kroky. Bez poplatků a bez vyplňování dotazníků o tom, co řešíš.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Search aria-hidden />,
                title: 'Vyber si odborníka',
                text: 'Projdi profily psychologů a filtruj podle zaměření, jazyka nebo nejbližšího volného termínu.',
              },
              {
                icon: <CalendarCheck aria-hidden />,
                title: 'Rezervuj termín',
                text: 'Vyber si termín bezplatné konzultace a potvrď ho. Nepotřebuješ diagnózu ani popis potíží.',
              },
              {
                icon: <Video aria-hidden />,
                title: 'Konzultace online',
                text: 'Ve smluvený čas se připojíš k videohovoru. Konzultace trvá 30 nebo 50 minut.',
              },
            ].map((step, i) => (
              <li key={step.title} className="relative rounded-[var(--radius-card)] bg-canvas p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-brand-800 text-white [&_svg]:size-5">{step.icon}</span>
                  <span className="font-display text-sm font-semibold text-brand-700">Krok {i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Principy */}
      <section aria-labelledby="principles-title" className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 id="principles-title" className="font-display text-3xl font-semibold sm:text-4xl">
              Zdarma a za stejných podmínek pro všechny
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Služba stojí na čase, který odborníci dobrovolně nabízejí. Proto je kapacita omezená a proto ji nechceme nikomu prodávat.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
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
              {
                icon: <ShieldCheck aria-hidden />,
                title: 'Ručně schválení odborníci',
                text: 'Každou přihlášku posoudí člověk. V prototypu je schvalování simulované.',
              },
            ].map((item) => (
              <li key={item.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft">
                <span className="flex size-10 items-center justify-center rounded-full bg-sage-100 text-brand-800 [&_svg]:size-5">{item.icon}</span>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="container-page mt-10">
          <div className="rounded-[var(--radius-card)] border border-amber-line bg-amber-soft p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-semibold text-amber-ink">
              <Clock aria-hidden className="size-5" />
              Co služba není
            </h3>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-ink/85 sm:grid-cols-3">
              <li>Není to akutní ani krizová pomoc. Zprávy tu nikdo průběžně nesleduje.</li>
              <li>Neslibujeme léčbu ani konkrétní výsledek. Konzultace je prostor pro rozhovor.</li>
              <li>Nejsme dostupní nepřetržitě. Termíny závisejí na volném čase odborníků.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pro odborníky */}
      <section aria-labelledby="pros-title" className="pb-16 sm:pb-20">
        <div className="container-page">
          <div className="grid gap-8 overflow-hidden rounded-[24px] bg-brand-900 p-7 text-white sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 id="pros-title" className="font-display text-3xl font-semibold">
                Jsi psycholog nebo psycholožka a máš trochu volného času?
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/80">
                Můžeš nabídnout několik bezplatných konzultací měsíčně. Sám nebo sama si určuješ termíny i jejich počet a příjem nových
                rezervací můžeš kdykoli pozastavit.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/pro-odborniky" variant="secondary" size="lg">
                  Chci nabídnout svůj čas
                </ButtonLink>
              </div>
            </div>
            <ol className="space-y-3 text-sm">
              {['Vyplníš krátkou přihlášku', 'Provozní tým ji ručně posoudí', 'Vypíšeš termíny, které ti vyhovují'].map((t, i) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-300 font-semibold text-brand-950">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 id="faq-title" className="font-display text-3xl font-semibold sm:text-4xl">
              Časté otázky
            </h2>
            <p className="mt-4 text-muted">
              Něco tu chybí? Napiš nám na {appConfig.contactEmail} (v prototypu fiktivní adresa).
            </p>
          </div>
          <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 sm:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sage-100 text-brand-800 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
