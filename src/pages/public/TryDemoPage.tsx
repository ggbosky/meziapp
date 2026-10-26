import { ArrowRight, BriefcaseMedical, CircleCheck, FileClock, FilePlus2, ShieldUser, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useServices } from '../../app/AppContext';
import { ResetDemoButton } from '../../components/layout/ResetDemoButton';
import { homeFor } from '../../components/layout/roleHome';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { DEMO_USER_IDS } from '../../data/seed';
import type { User } from '../../domain/types';

interface RoleGroup {
  title: string;
  description: string;
  icon: ReactNode;
  accounts: Array<{ id: string; target: string; label: string }>;
}

const GROUPS: RoleGroup[] = [
  {
    title: 'Vstoupit jako klient',
    description: 'Hledání odborníků, rezervace termínu, zrušení a zpětná vazba.',
    icon: <UserRound aria-hidden />,
    accounts: [
      { id: DEMO_USER_IDS.clientA, target: '/klient', label: 'Klientka' },
      { id: DEMO_USER_IDS.clientB, target: '/klient', label: 'Klient' },
    ],
  },
  {
    title: 'Vstoupit jako schválený psycholog',
    description: 'Týdenní rozvrh, vypisování termínů, rezervace klientů a pozastavení příjmu.',
    icon: <BriefcaseMedical aria-hidden />,
    accounts: [
      { id: DEMO_USER_IDS.psychologistA, target: '/odbornik', label: 'Psycholožka' },
      { id: DEMO_USER_IDS.psychologistB, target: '/odbornik', label: 'Psycholog' },
    ],
  },
  {
    title: 'Vstoupit jako žadatel o schválení',
    description: 'Neschválený odborník vidí jen svou přihlášku. Termíny ani rezervace mu nejsou dostupné.',
    icon: <FileClock aria-hidden />,
    accounts: [
      { id: DEMO_USER_IDS.applicantPending, target: '/odbornik/prihlaska', label: 'Odeslaná přihláška' },
      { id: DEMO_USER_IDS.applicantNew, target: '/odbornik/prihlaska', label: 'Nová přihláška' },
    ],
  },
  {
    title: 'Vstoupit jako administrátor',
    description: 'Posuzování přihlášek, pozastavení profilů, přehled rezervací, statistiky a historie změn.',
    icon: <ShieldUser aria-hidden />,
    accounts: [{ id: DEMO_USER_IDS.admin, target: '/admin', label: 'Administrace' }],
  },
];

function AccountButton({ user, label, target, current }: { user: User; label: string; target: string; current: boolean }) {
  const { session } = useServices();
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/60 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={user.displayName} tone={user.displayName.length} size="sm" />
        <div className="min-w-0">
          <p className="font-medium">
            {user.displayName} <span className="text-sm font-normal text-muted">· {label}</span>
          </p>
          <p className="text-sm leading-snug text-muted">{user.demoDescription}</p>
        </div>
      </div>
      {current ? (
        <Button variant="subtle" size="sm" icon={<CircleCheck aria-hidden className="size-4" />} onClick={() => navigate(target)}>
          Aktivní · otevřít
        </Button>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          icon={<ArrowRight aria-hidden className="size-4" />}
          onClick={async () => {
            const result = await session.signInAs(user.id);
            if (result.ok) {
              toast(`Jsi v demo účtu: ${user.displayName}.`, 'info');
              navigate(target);
            }
          }}
        >
          Vstoupit
          <span className="sr-only"> jako {user.displayName}</span>
        </Button>
      )}
    </div>
  );
}

export function TryDemoPage() {
  usePageTitle('Vyzkoušet aplikaci');
  const { session } = useServices();
  const current = useCurrentUser();
  const navigate = useNavigate();
  const users = new Map(session.listDemoAccounts().map((u) => [u.id, u]));

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader
        eyebrow="Ukázkový režim"
        title="Vyzkoušet aplikaci"
        description="Vyber si fiktivní demo účet. Nejde o přihlášení: nezadáváš žádné heslo a mezi účty můžeš kdykoli přepnout."
      />
      <Alert tone="warning" className="mt-6" title="Přepínání účtů je jen nástroj prototypu">
        Nejde o zabezpečení. Všechna demo data jsou uložená ve tvém prohlížeči a technicky dostupná komukoli, kdo k němu má přístup. Nevkládej
        prosím osobní ani zdravotní informace.
      </Alert>

      {current && (
        <Card className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Teď jsi v demo účtu <strong className="font-semibold">{current.displayName}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate(homeFor(current))}>
              Otevřít můj přehled
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await session.signOut();
              }}
            >
              Odejít z demo účtu
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {GROUPS.map((group) => (
          <Card as="section" key={group.title} aria-labelledby={`g-${group.accounts[0]!.id}`}>
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage-100 text-brand-800 [&_svg]:size-5">{group.icon}</span>
              <div>
                <h2 id={`g-${group.accounts[0]!.id}`} className="text-lg font-semibold">
                  {group.title}
                </h2>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{group.description}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {group.accounts.map((a) => {
                const user = users.get(a.id);
                return user ? <AccountButton key={a.id} user={user} label={a.label} target={a.target} current={current?.id === a.id} /> : null;
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card as="section" aria-labelledby="walkthrough-title">
          <h2 id="walkthrough-title" className="flex items-center gap-2 text-lg font-semibold">
            <FilePlus2 aria-hidden className="size-5 text-brand-700" /> Doporučený průchod
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink/90">
            <li>Jako klient si v seznamu psychologů vyber termín a projdi rezervaci až k potvrzení.</li>
            <li>V přehledu klienta rezervaci otevři, vyzkoušej demo připojení k hovoru a rezervaci zruš. Termín se znovu nabídne.</li>
            <li>Jako psycholog přidej termín (zkus i překryv), zruš volný termín a pozastav příjem rezervací.</li>
            <li>Jako žadatel s odeslanou přihláškou ověř, že termíny ani rezervace nejsou dostupné.</li>
            <li>Jako administrátor přihlášku schval, vyžádej doplnění nebo zamítni a pozastav některý profil.</li>
            <li>Vrať se k žadateli: po schválení uvidí přehled psychologa a může vypisovat termíny.</li>
          </ol>
        </Card>
        <Card as="section" aria-labelledby="reset-title">
          <h2 id="reset-title" className="text-lg font-semibold">
            Začít znovu
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Změny se ukládají jen do tohoto prohlížeče. Obnovením vrátíš výchozí fiktivní data a termíny se vygenerují znovu od dnešního dne.
          </p>
          <ResetDemoButton className="mt-5" />
        </Card>
      </div>
    </div>
  );
}
