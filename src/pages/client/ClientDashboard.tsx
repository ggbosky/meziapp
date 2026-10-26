import { CalendarPlus, CalendarX2, Clock, Info, Search } from 'lucide-react';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { AppointmentRow } from '../../components/booking/AppointmentRow';
import { JoinCallButton } from '../../components/booking/JoinCallDialog';
import { RequireRole } from '../../components/layout/RequireRole';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Avatar } from '../../components/ui/Avatar';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { appConfig } from '../../config/app';
import { countLabel } from '../../domain/text';
import { formatDateTime, formatTimeRange } from '../../domain/time';

export function ClientDashboard() {
  return (
    <RequireRole role="client">
      <ClientOverview />
    </RequireRole>
  );
}

function ClientOverview() {
  usePageTitle('Moje konzultace');
  const { appointments, session } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const user = session.getCurrentUser();
  const all = appointments.listMine();
  const upcoming = all.filter((v) => v.status === 'booked');
  const history = all.filter((v) => v.status !== 'booked').reverse();
  const [next, ...later] = upcoming;
  const max = appConfig.booking.maxActiveBookingsPerClient;

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow={`Klientská část · ${user?.displayName ?? ''}`}
        title="Moje konzultace"
        description="Tady najdeš své ukázkové rezervace. Údaje vidíš jen ty (v rámci demo účtu)."
        actions={
          <ButtonLink to="/psychologove" icon={<Search aria-hidden className="size-4" />}>
            Najít termín
          </ButtonLink>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="next-title">
            <SectionTitle id="next-title">Nejbližší konzultace</SectionTitle>
            {next ? (
              <Card padded={false} className="overflow-hidden">
                <div className="bg-brand-900 p-5 text-white sm:p-6">
                  <p className="text-sm text-brand-200">Naplánováno</p>
                  <p className="mt-1 font-display text-2xl font-semibold first-letter:uppercase sm:text-3xl">
                    {formatDateTime(next.appointment.startsAt, now)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
                    <Clock aria-hidden className="size-4" />
                    {formatTimeRange(next.appointment.startsAt, next.appointment.durationMinutes)} · {next.appointment.durationMinutes} minut · online
                  </p>
                </div>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-3">
                    <Avatar name={next.profile.professionalName} tone={next.profile.avatarTone} size="sm" />
                    <div>
                      <p className="font-medium">{next.profile.professionalName}</p>
                      <p className="text-sm text-muted">{next.profile.professionalRole}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ButtonLink to={`/klient/rezervace/${next.appointment.id}`} variant="secondary">
                      Detail rezervace
                    </ButtonLink>
                    <JoinCallButton />
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={<CalendarPlus aria-hidden />}
                title="Zatím nemáš naplánovanou konzultaci"
                action={<ButtonLink to="/psychologove">Prohlédnout psychology</ButtonLink>}
              >
                Vyber si termín bezplatné konzultace. Nemusíš mít všechno předem pojmenované.
              </EmptyState>
            )}
          </section>

          {later.length > 0 && (
            <section aria-labelledby="later-title">
              <SectionTitle id="later-title">Další naplánované</SectionTitle>
              <ul className="space-y-3">
                {later.map((v) => (
                  <li key={v.appointment.id}>
                    <AppointmentRow
                      to={`/klient/rezervace/${v.appointment.id}`}
                      startsAt={v.appointment.startsAt}
                      durationMinutes={v.appointment.durationMinutes}
                      title={v.profile.professionalName}
                      status={v.status}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="history-title">
            <SectionTitle id="history-title" description="Proběhlé a zrušené konzultace.">
              Historie
            </SectionTitle>
            {history.length === 0 ? (
              <EmptyState icon={<CalendarX2 aria-hidden />} title="Historie je zatím prázdná" />
            ) : (
              <ul className="space-y-3">
                {history.map((v) => (
                  <li key={v.appointment.id}>
                    <AppointmentRow
                      to={`/klient/rezervace/${v.appointment.id}`}
                      startsAt={v.appointment.startsAt}
                      durationMinutes={v.appointment.durationMinutes}
                      title={v.profile.professionalName}
                      status={v.status}
                      feedbackPending={v.canGiveFeedback}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-semibold">Hledáš další termín?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Máš {countLabel(upcoming.length, 'naplánovanou konzultaci', 'naplánované konzultace', 'naplánovaných konzultací')} z {max} možných.
              Limit pomáhá, aby se omezená kapacita dostala k co nejvíce lidem.
            </p>
            <ButtonLink to="/psychologove" variant="subtle" className="mt-4 w-full">
              Vybrat termín
            </ButtonLink>
          </Card>
          <div className="flex gap-3 rounded-[var(--radius-card)] border border-line p-5 text-sm leading-relaxed text-muted">
            <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <p>Rezervace v ukázce jsou fiktivní a uložené jen v tomto prohlížeči. Žádný skutečný termín nevzniká.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
