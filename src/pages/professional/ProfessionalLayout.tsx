import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RequireRole } from '../../components/layout/RequireRole';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProDashboard } from './ProDashboard';

export function ProfessionalLayout() {
  return (
    <RequireRole role="professional">
      <DashboardLayout />
    </RequireRole>
  );
}

/** Funkce psychologa jsou dostupné až po schválení přihlášky (simulace). */
export function ApprovedOnly({ children }: { children: ReactNode }) {
  const { profiles } = useServices();
  useDemoSnapshot();
  if (profiles.getOwnStatus()?.kind === 'approved') return <>{children}</>;
  return (
    <Card className="text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sage-100 text-brand-800">
        <Lock aria-hidden className="size-5" />
      </div>
      <h1 className="font-display text-2xl font-extrabold">Dostupné po schválení přihlášky</h1>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Vypisovat termíny a vidět rezervace klientů mohou jen schválení odborníci. Stav své přihlášky najdeš na stránce Přihláška.
      </p>
      <ButtonLink to="/odbornik/prihlaska" className="mt-6">
        Moje přihláška
      </ButtonLink>
    </Card>
  );
}

export function ProfessionalIndex() {
  const { profiles } = useServices();
  useDemoSnapshot();
  if (profiles.getOwnStatus()?.kind !== 'approved') return <Navigate to="/odbornik/prihlaska" replace />;
  return <ProDashboard />;
}
