import { CalendarClock, CircleSlash, Database, FileCheck2, HandHeart, Phone, PhoneCall, ShieldAlert, SlidersHorizontal, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { ResetDemoButton } from '../../components/layout/ResetDemoButton';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Button, ButtonLink, buttonClasses } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { appConfig } from '../../config/app';
import { DEMO_USER_IDS } from '../../data/seed';
import { formatTimestamp } from '../../domain/time';

export function UrgentHelpPage() {
  usePageTitle('Naléhavá pomoc');
  const { emergencyNumber, verifiedContacts } = appConfig.urgentHelp;
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <PageHeader title="Naléhavá pomoc" description="Tahle služba není určená pro akutní situace." />
      <div className="mt-8 space-y-6">
        <div className="rounded-[var(--radius-card)] border-2 border-danger-line bg-danger-soft p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-danger-strong">
            <ShieldAlert aria-hidden className="size-6" /> Při bezprostředním ohrožení života
          </h2>
          <p className="mt-3 leading-relaxed text-ink">
            Volej <a href={`tel:${emergencyNumber}`} className="font-semibold text-danger-strong underline underline-offset-2">{emergencyNumber}</a> (jednotné evropské číslo tísňového volání), nebo jdi na nejbližší pohotovost.
          </p>
          <a href={`tel:${emergencyNumber}`} className={buttonClasses('danger', 'lg', 'mt-5')}>
            <PhoneCall aria-hidden className="size-5" />
            Volat {emergencyNumber}
          </a>
        </div>

        <Card>
          <h2 className="text-lg font-semibold">Co tahle služba neumí</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink/90">
            <li>Zprávy ani rezervace tu nikdo průběžně nesleduje. Na nic, co sem napíšeš, nikdo hned nezareaguje.</li>
            <li>Rezervace konzultace není akutní služba. Nejbližší volný termín může být až za několik dní.</li>
            <li>Nejsme dostupní nepřetržitě a neslibujeme léčbu ani konkrétní výsledek.</li>
          </ul>
        </Card>

        <Card as="section" aria-labelledby="contacts-title">
          <h2 id="contacts-title" className="flex items-center gap-2 text-lg font-semibold">
            <Phone aria-hidden className="size-5 text-brand-700" /> Krizové linky a další pomoc
          </h2>
          {verifiedContacts.length === 0 ? (
            <Alert tone="info" className="mt-4" title="Seznam kontaktů zatím není doplněný">
              Prototyp záměrně neuvádí žádné krizové linky, aby nezobrazoval neověřené údaje. Před skutečným spuštěním doplní odborný garant
              ověřené kontakty do konfigurace aplikace (<code className="rounded bg-white/70 px-1">src/config/app.ts</code>).
            </Alert>
          ) : (
            <ul className="mt-4 space-y-3">
              {verifiedContacts.map((c) => (
                <li key={c.name} className="rounded-2xl border border-line p-4">
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5">{c.href ? <a href={c.href} className="link">{c.contact}</a> : c.contact}</p>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export function ForProfessionalsPage() {
  usePageTitle('Pro odborníky');
  const { session } = useServices();
  const navigate = useNavigate();
  const items = [
    { icon: <HandHeart aria-hidden />, title: 'Nabízíš jen část svého času', text: 'Sám nebo sama určuješ, kolik bezplatných konzultací měsíčně nabídneš.' },
    { icon: <CalendarClock aria-hidden />, title: 'Termíny podle sebe', text: 'Vypisuješ konkrétní termíny na 30 nebo 50 minut. Systém hlídá, aby se nepřekrývaly.' },
    { icon: <SlidersHorizontal aria-hidden />, title: 'Příjem můžeš pozastavit', text: 'Když nemáš kapacitu, jedním přepínačem přestaneš přijímat nové rezervace.' },
    { icon: <UserCheck aria-hidden />, title: 'Ruční schválení', text: 'Přihlášku posoudí člověk z provozního týmu. V prototypu je posouzení simulované.' },
    { icon: <CircleSlash aria-hidden />, title: 'Žádné hodnocení odborníků', text: 'Nezobrazujeme hvězdičky, recenze ani žebříčky. Klienti vybírají podle zaměření a termínu.' },
    { icon: <FileCheck2 aria-hidden />, title: 'Minimum údajů o klientech', text: 'Uvidíš jen rezervace ke svým termínům a nezbytné údaje. Klienti nevyplňují popis potíží.' },
  ];
  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader
        eyebrow="Pro psychology a psycholožky"
        title="Chci nabídnout svůj čas"
        description="Pokud máš volnou kapacitu, můžeš ji nabídnout lidem, kteří by si konzultaci jinak nemohli dovolit. Bez poplatků na obou stranách."
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <li key={i.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft">
            <span className="flex size-10 items-center justify-center rounded-full bg-sage-100 text-brand-800 [&_svg]:size-5">{i.icon}</span>
            <h2 className="mt-4 font-semibold">{i.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{i.text}</p>
          </li>
        ))}
      </ul>
      <Card className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <h2 className="font-display text-2xl font-semibold">Jak se zapojit</h2>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 leading-relaxed text-ink/90">
            <li>Vyplníš krátkou přihlášku: profesní jméno, roli, shrnutí kvalifikace, zaměření, jazyky a kapacitu.</li>
            <li>Provozní tým přihlášku posoudí, případně požádá o doplnění.</li>
            <li>Po schválení vypíšeš první termíny a tvůj profil se zobrazí klientům.</li>
          </ol>
          <p className="mt-4 text-sm text-muted">V prototypu se nenahrávají žádné doklady a všechny údaje jsou fiktivní.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            onClick={async () => {
              await session.signInAs(DEMO_USER_IDS.applicantNew);
              navigate('/odbornik/prihlaska');
            }}
          >
            Vyzkoušet přihlášku (demo)
          </Button>
          <ButtonLink to="/vyzkouset" variant="secondary" size="lg">
            Všechny demo účty
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

export function AboutPrototypePage() {
  usePageTitle('O prototypu');
  const snapshot = useDemoSnapshot();
  const persistenceLabel = {
    ok: 'Změny se ukládají do localStorage tohoto prohlížeče.',
    unavailable: 'Úložiště prohlížeče není dostupné, změny platí jen do obnovení stránky.',
    full: 'Úložiště prohlížeče je plné, nové změny se neukládají.',
  }[snapshot.persistence];
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <PageHeader
        eyebrow="Demonstrační prototyp"
        title={`O prototypu ${appConfig.name}`}
        description="Prototyp ukazuje, jak by mohla fungovat nezisková služba pro objednávání bezplatných konzultací. Nejde o skutečnou službu."
      />
      <div className="mt-8 space-y-6">
        <Card>
          <h2 className="text-lg font-semibold">Co je simulované</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink/90">
            <li>Všechny osoby, kvalifikace, termíny, rezervace i výsledky schvalování jsou fiktivní.</li>
            <li>Vstup do účtů je jen přepínač demo rolí. Neexistují hesla ani skutečné ověření identity.</li>
            <li>Kontroly oprávnění napodobují chování skutečné služby, ale data nijak nechrání.</li>
            <li>Neodesílají se žádné e-maily a nevznikají videohovory. Aplikace nepřistupuje k mikrofonu ani kameře.</li>
            <li>Bez serveru nelze zaručit ochranu proti souběžným rezervacím z různých zařízení.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Database aria-hidden className="size-5 text-brand-700" /> Data v tomto prohlížeči
          </h2>
          <p className="mt-3 leading-relaxed text-ink/90">{persistenceLabel}</p>
          <p className="mt-2 text-sm text-muted">
            Výchozí data vygenerována {formatTimestamp(snapshot.state.seededAt)}. Aplikace nesbírá analytická data, nepoužívá cookies ani
            externí služby.
          </p>
          <ResetDemoButton className="mt-5" />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Co bude potřeba před skutečným provozem</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink/90">
            <li>Backend s databází, skutečným přihlášením a autorizací na serveru.</li>
            <li>Právní a odborné posouzení: zpracování osobních údajů, podmínky služby, odborný garant.</li>
            <li>Ověřené krizové kontakty a postup pro situace, kdy klient potřebuje akutní pomoc.</li>
            <li>Bezpečné videohovory, e-mailová oznámení a ověřování dokladů odborníků.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  usePageTitle('Stránka nenalezena');
  return (
    <div className="container-page py-16">
      <EmptyState title="Tuhle stránku jsme nenašli" action={<ButtonLink to="/">Na úvodní stránku</ButtonLink>}>
        Odkaz je možná neplatný nebo zastaralý.
      </EmptyState>
    </div>
  );
}
