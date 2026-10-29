import { CalendarX2 } from 'lucide-react';
import { CelebrateIllustration } from '../../components/ui/Illustrations';
import { formatLabel } from '../../domain/places';
import { useParams } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { RequireRole } from '../../components/layout/RequireRole';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Stepper } from '../../components/ui/Stepper';
import { formatDateTime, formatTimeRange } from '../../domain/time';

export function BookingConfirmedPage() {
  return (
    <RequireRole role="client">
      <Confirmed />
    </RequireRole>
  );
}

function Confirmed() {
  usePageTitle('Rezervace potvrzena');
  const { appointmentId = '' } = useParams();
  const { appointments } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const view = appointments.getMine(appointmentId);

  if (!view) {
    return (
      <div className="container-page py-14">
        <EmptyState icon={<CalendarX2 aria-hidden />} title="Rezervaci jsme nenašli" action={<ButtonLink to="/klient">Moje konzultace</ButtonLink>} />
      </div>
    );
  }
  const { appointment, profile } = view;

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <Stepper steps={['Termín', 'Souhrn', 'Potvrzení', 'Hotovo']} current={3} />
      <Card className="mt-6 animate-enter text-center">
        <CelebrateIllustration className="mx-auto w-44" />
        <h1 className="mt-3 font-display text-3xl font-extrabold">Termín je zarezervovaný</h1>
        <p className="mt-2 text-muted">V ukázkovém režimu. Rezervace je uložená jen v tomto prohlížeči.</p>
        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-sage-100 p-5 text-left">
          <p className="text-sm text-muted">Konzultace s odborníkem</p>
          <p className="font-semibold">{profile.professionalName}</p>
          <p className="mt-3 text-sm text-muted">Kdy</p>
          <p className="font-semibold first-letter:uppercase">{formatDateTime(appointment.startsAt, now)}</p>
          <p className="text-sm text-muted">
            {formatTimeRange(appointment.startsAt, appointment.durationMinutes)} · {appointment.durationMinutes} minut · {formatLabel(appointment.format, profile.cityId).toLowerCase()} · zdarma
          </p>
        </div>
        <div className="mx-auto mt-6 max-w-md text-left">
          <h2 className="font-semibold">Co bude dál</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
            <li>Ve skutečné službě by ti přišlo potvrzení e-mailem. Prototyp žádné e-maily neposílá.</li>
            <li>Ke konzultaci se připojíš z detailu rezervace. V ukázce se hovor jen simuluje.</li>
            <li>Když ti termín přestane vyhovovat, rezervaci zruš, ať se uvolní pro někoho dalšího.</li>
          </ul>
        </div>
        <Alert tone="info" className="mx-auto mt-6 max-w-md text-left">
          Rezervace není akutní pomoc. Pokud se tvoje situace zhorší, nečekej na termín a vyhledej naléhavou pomoc.
        </Alert>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <ButtonLink to="/klient">Moje konzultace</ButtonLink>
          <ButtonLink to={`/klient/rezervace/${appointment.id}`} variant="secondary">
            Detail rezervace
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
