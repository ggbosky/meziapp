import { CalendarCheck, CalendarClock, CalendarPlus, CircleCheck, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { MeetingButton } from '../../components/booking/JoinCallDialog';
import { cityById, formatLabel } from '../../domain/places';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { WeekSchedule } from '../../components/schedule/WeekSchedule';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { addMinutes, formatDateTime, formatTimeRange } from '../../domain/time';
import { AcceptingToggle } from './AcceptingToggle';
import { ProfileNotices } from './ProfileNotices';

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint: string }) {
  return (
    <Card className="p-3.5 sm:p-5">
      <div className="flex items-start gap-2 text-xs font-semibold leading-tight text-muted sm:text-sm [&_svg]:hidden [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-brand-700 sm:[&_svg]:block">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-ink sm:text-4xl">{value}</p>
      <p className="mt-1 text-[0.7rem] leading-tight text-muted sm:text-xs">{hint}</p>
    </Card>
  );
}

export function ProDashboard() {
  usePageTitle('Přehled odborníka');
  const { profiles, availability, appointments } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const status = profiles.getOwnStatus();
  if (status?.kind !== 'approved') return null;
  const { profile } = status;
  const slots = availability.listOwn();
  const practice = appointments.listForMyPractice();
  const horizon = addMinutes(now, 14 * 24 * 60).getTime();
  const in14 = slots.filter((v) => Date.parse(v.slot.startsAt) > now.getTime() && Date.parse(v.slot.startsAt) <= horizon);
  const upcoming = practice.filter((v) => v.status === 'booked');
  const next = upcoming[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${profile.professionalName} · ${profile.professionalRole}`}
        title="Přehled"
        actions={
          <ButtonLink to="/odbornik/terminy" icon={<CalendarPlus aria-hidden className="size-4" />}>
            Přidat termín
          </ButtonLink>
        }
      />
      <ProfileNotices profile={profile} />

      <section aria-label="Počty termínů" className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <Stat icon={<CalendarClock aria-hidden />} label="Volné termíny" value={in14.filter((v) => v.state === 'open').length} hint="v příštích 14 dnech" />
        <Stat icon={<CalendarCheck aria-hidden />} label="Rezervované termíny" value={in14.filter((v) => v.state === 'booked').length} hint="v příštích 14 dnech" />
        <Stat icon={<CircleCheck aria-hidden />} label="Proběhlé konzultace" value={practice.filter((v) => v.status === 'completed').length} hint="celkem v demo datech" />
      </section>

      <section aria-labelledby="next-title">
        <SectionTitle id="next-title">Nejbližší konzultace</SectionTitle>
        {next ? (
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl font-extrabold first-letter:uppercase">{formatDateTime(next.appointment.startsAt, now)}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Clock aria-hidden className="size-4" />
                {formatTimeRange(next.appointment.startsAt, next.appointment.durationMinutes)} · {formatLabel(next.appointment.format, profile.cityId)} · klient {next.clientLabel}
              </p>
            </div>
            <MeetingButton format={next.appointment.format} cityName={cityById(profile.cityId)?.name ?? null} />
          </Card>
        ) : (
          <EmptyState title="Zatím nemáš žádnou rezervaci" icon={<CalendarCheck aria-hidden />}>
            Jakmile si klient rezervuje některý z tvých volných termínů, uvidíš ho tady.
          </EmptyState>
        )}
        {upcoming.length > 1 && (
          <p className="mt-3 text-sm text-muted">
            A další naplánované: {upcoming.length - 1}.{' '}
            <Link to="/odbornik/konzultace" className="link">
              Všechny konzultace
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="week-title">
        <SectionTitle id="week-title" description="Volné, rezervované i zrušené termíny v jednom týdnu.">
          Týdenní rozvrh
        </SectionTitle>
        <WeekSchedule slots={slots} now={now} />
      </section>

      <Card as="section" aria-label="Příjem rezervací">
        <AcceptingToggle profile={profile} />
      </Card>
    </div>
  );
}
