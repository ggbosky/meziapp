import { CalendarCheck, CalendarX2 } from 'lucide-react';
import { useState } from 'react';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { AppointmentRow } from '../../components/booking/AppointmentRow';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import type { PracticeAppointmentView } from '../../services/types';
import { CancelBookedDialog } from './CancelBookedDialog';
import { ApprovedOnly } from './ProfessionalLayout';

export function ConsultationsPage() {
  return (
    <ApprovedOnly>
      <Consultations />
    </ApprovedOnly>
  );
}

function Consultations() {
  usePageTitle('Konzultace');
  const { appointments } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const all = appointments.listForMyPractice();
  const upcoming = all.filter((v) => v.status === 'booked');
  const history = all.filter((v) => v.status !== 'booked').reverse();
  const [target, setTarget] = useState<PracticeAppointmentView | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Konzultace"
        description="Rezervace k tvým termínům. Z údajů o klientovi vidíš jen to nezbytné: křestní jméno a iniciálu (fiktivní)."
      />
      <section aria-labelledby="upcoming-title">
        <SectionTitle id="upcoming-title">Naplánované</SectionTitle>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarCheck aria-hidden />} title="Žádné naplánované konzultace" />
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((v) => (
              <li key={v.appointment.id}>
                <AppointmentRow
                  startsAt={v.appointment.startsAt}
                  durationMinutes={v.appointment.durationMinutes}
                  title={`Klient ${v.clientLabel}`}
                  status={v.status}
                  extra={
                    v.canCancel ? (
                      <Button size="sm" variant="ghost" className="self-center text-danger-strong" icon={<CalendarX2 aria-hidden className="size-4" />} onClick={() => setTarget(v)}>
                        <span className="sr-only sm:not-sr-only">Zrušit</span>
                        <span className="sr-only"> konzultaci s klientem {v.clientLabel}</span>
                      </Button>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="history-title">
        <SectionTitle id="history-title" description="Proběhlé konzultace zůstávají v historii a nelze je rušit.">
          Historie
        </SectionTitle>
        {history.length === 0 ? (
          <EmptyState title="Historie je zatím prázdná" />
        ) : (
          <ul className="space-y-2.5">
            {history.map((v) => (
              <li key={v.appointment.id}>
                <AppointmentRow
                  startsAt={v.appointment.startsAt}
                  durationMinutes={v.appointment.durationMinutes}
                  title={`Klient ${v.clientLabel}`}
                  status={v.status}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <CancelBookedDialog
        now={now}
        target={target ? { appointmentId: target.appointment.id, startsAt: target.appointment.startsAt, clientLabel: target.clientLabel } : null}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
