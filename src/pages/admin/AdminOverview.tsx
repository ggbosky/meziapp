import { ArrowRight, CalendarCheck, CalendarClock, CalendarX2, CircleCheck, Gauge } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { ApplicationStatusBadge } from '../../components/ui/StatusBadge';
import { countLabel, percent } from '../../domain/text';
import { formatDate } from '../../domain/time';
import { AuditList } from './AuditList';

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft">
      <dt className="flex items-center gap-2 text-sm text-muted [&_svg]:size-4 [&_svg]:text-brand-700">
        {icon}
        {label}
      </dt>
      <dd>
        <span className="mt-2 block font-display text-4xl font-semibold tabular-nums text-ink">{value}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{hint}</span>
      </dd>
    </div>
  );
}

export function AdminOverview() {
  usePageTitle('Administrace');
  const { admin } = useServices();
  useDemoSnapshot();
  const stats = admin.getStats();
  const pending = admin.listApplications().filter((a) => a.status === 'submitted');
  const audit = admin.listAuditEvents().slice(0, 5);
  const cancelled = stats.cancelledByClient + stats.cancelledByPsychologist;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Provozní přehled"
        description="Statistiky se počítají z demo dat v tomto prohlížeči. Záměrně neukazujeme žádné metriky psychického stavu ani „zlepšení“."
      />

      <section aria-labelledby="stats-title">
        <SectionTitle id="stats-title">Celkem v demo datech</SectionTitle>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric icon={<CalendarClock aria-hidden />} label="Nabízené termíny" value={String(stats.offeredSlots)} hint="Vypsané termíny bez termínů stažených odborníky." />
          <Metric icon={<CalendarCheck aria-hidden />} label="Rezervace" value={String(stats.bookings)} hint="Všechny vytvořené rezervace včetně zrušených." />
          <Metric icon={<Gauge aria-hidden />} label="Obsazenost" value={percent(stats.occupancy)} hint="Podíl nabízených termínů s naplánovanou nebo proběhlou konzultací." />
          <Metric
            icon={<CalendarX2 aria-hidden />}
            label="Zrušené konzultace"
            value={String(cancelled)}
            hint={`Klientem ${stats.cancelledByClient}, odborníkem ${stats.cancelledByPsychologist}.`}
          />
          <Metric icon={<CircleCheck aria-hidden />} label="Dokončené konzultace" value={String(stats.completed)} hint="Naplánované konzultace, jejichž čas už uplynul." />
          <Metric
            icon={<CalendarClock aria-hidden />}
            label={`Příštích ${stats.upcoming.days} dní`}
            value={percent(stats.upcoming.occupancy)}
            hint={`Obsazeno ${stats.upcoming.bookedSlots} z ${countLabel(stats.upcoming.offeredSlots, 'nabízeného termínu', 'nabízených termínů', 'nabízených termínů')}.`}
          />
        </dl>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="pending-title">
          <SectionTitle id="pending-title" action={<Link to="/admin/zadosti" className="link text-sm">Všechny žádosti</Link>}>
            Ke zpracování
          </SectionTitle>
          {pending.length === 0 ? (
            <EmptyState title="Žádné přihlášky nečekají na posouzení" />
          ) : (
            <ul className="space-y-2.5">
              {pending.map((app) => (
                <li key={app.id}>
                  <Link to={`/admin/zadosti/${app.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-brand-300 hover:bg-sage-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{app.professionalName}</p>
                      <p className="text-sm text-muted">
                        {app.professionalRole} · odesláno {app.submittedAt ? formatDate(app.submittedAt) : '—'}
                      </p>
                      <div className="mt-1.5">
                        <ApplicationStatusBadge status={app.status} />
                      </div>
                    </div>
                    <ArrowRight aria-hidden className="size-5 text-brand-700" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Card as="section" aria-labelledby="audit-title">
          <SectionTitle id="audit-title" action={<ButtonLink to="/admin/historie" size="sm" variant="ghost">Celá historie</ButtonLink>}>
            Poslední změny
          </SectionTitle>
          <AuditList events={audit} actorName={admin.getUserName} />
        </Card>
      </div>
    </div>
  );
}
