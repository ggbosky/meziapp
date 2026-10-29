import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../app/AppContext';
import { DEMO_USER_IDS } from '../../data/seed';
import type { UserRole } from '../../domain/types';
import { Card } from '../ui/Card';
import { DemoAccountButtons } from './DemoAccountButtons';

const COPY: Record<UserRole, { title: string; text: string; accounts: string[] }> = {
  client: {
    title: 'Tahle část je pro demo účet klienta',
    text: 'Vstup do jednoho z fiktivních klientských účtů a uvidíš jeho rezervace.',
    accounts: [DEMO_USER_IDS.clientA, DEMO_USER_IDS.clientB, DEMO_USER_IDS.clientYouth],
  },
  professional: {
    title: 'Tahle část je pro odborníky',
    text: 'Vyzkoušej ji jako schválený psycholog nebo jako žadatel o schválení.',
    accounts: [DEMO_USER_IDS.psychologistA, DEMO_USER_IDS.psychologistB, DEMO_USER_IDS.applicantPending],
  },
  admin: {
    title: 'Tahle část je pro administraci',
    text: 'Vstup do demo účtu administrace a uvidíš přihlášky, profily a provozní přehled.',
    accounts: [DEMO_USER_IDS.admin],
  },
};

/**
 * Zobrazí obsah jen pro danou roli demo účtu. Jde o simulaci chování
 * aplikace, ne o zabezpečení — demo data jsou v prohlížeči dostupná celá.
 */
export function RequireRole({ role, children, redirectTo }: { role: UserRole; children: ReactNode; redirectTo?: string }) {
  const user = useCurrentUser();
  if (user?.role === role) return <>{children}</>;
  const copy = COPY[role];
  return (
    <div className="container-page py-12 sm:py-16">
      <Card className="mx-auto max-w-xl animate-enter text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sage-100 text-brand-800">
          <Lock aria-hidden className="size-5" />
        </div>
        <h1 className="font-display text-2xl font-extrabold">{copy.title}</h1>
        <p className="mt-2 text-muted">
          {user ? `Teď jsi v demo účtu ${user.displayName}. ` : ''}
          {copy.text}
        </p>
        <div className="mt-6 flex justify-center">
          <DemoAccountButtons userIds={copy.accounts} redirectTo={redirectTo} />
        </div>
        <p className="mt-5 text-sm text-muted">
          Všechny účty najdeš na stránce <Link to="/vyzkouset" className="link">Vyzkoušet aplikaci</Link>.
        </p>
      </Card>
    </div>
  );
}
