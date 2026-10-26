import { CalendarPlus, CalendarX2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAction, useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { DateBlock } from '../../components/booking/AppointmentRow';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { SlotStateBadge } from '../../components/schedule/SlotStateBadge';
import { WeekSchedule } from '../../components/schedule/WeekSchedule';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/cn';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { RadioCardGroup, TextField } from '../../components/ui/Field';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { appConfig } from '../../config/app';
import { addDaysToKey, dateKey, formatDateTime, formatDayLong, formatTimeRange, localInputToISO } from '../../domain/time';
import type { ConsultationDuration } from '../../domain/types';
import type { OwnSlotView } from '../../services/types';
import { ApprovedOnly } from './ProfessionalLayout';
import { CancelBookedDialog } from './CancelBookedDialog';
import { ProfileNotices } from './ProfileNotices';

export function AvailabilityPage() {
  return (
    <ApprovedOnly>
      <Availability />
    </ApprovedOnly>
  );
}

function AddSlotForm({ disabled }: { disabled: boolean }) {
  const { availability } = useServices();
  const toast = useToast();
  const now = useNow();
  const today = dateKey(now);
  const [date, setDate] = useState(addDaysToKey(today, 1));
  const [time, setTime] = useState('16:00');
  const [duration, setDuration] = useState<ConsultationDuration>(50);
  const [errors, setErrors] = useState<{ date?: string; time?: string; form?: string }>({});
  const [add, pending] = useAction(availability.addSlot);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const next: typeof errors = {};
        if (!date) next.date = 'Vyber datum.';
        if (!time) next.time = 'Zadej čas začátku.';
        const startsAt = localInputToISO(date, time);
        if (!next.date && !next.time && !startsAt) next.form = 'Datum nebo čas nemá platný formát.';
        setErrors(next);
        if (Object.keys(next).length > 0 || !startsAt) return;
        const result = await add({ startsAt, durationMinutes: duration });
        if (!result) return;
        if (result.ok) {
          toast(`Termín přidán: ${formatDateTime(result.value.startsAt)} (${result.value.durationMinutes} min).`);
          setErrors({});
        } else {
          setErrors({ form: result.error.message });
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Datum"
          type="date"
          value={date}
          min={today}
          max={addDaysToKey(today, appConfig.booking.planningHorizonDays)}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          disabled={disabled}
          required
        />
        <TextField
          label="Čas začátku"
          type="time"
          step={300}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          error={errors.time}
          hint="Český čas (Europe/Prague)."
          disabled={disabled}
          required
        />
      </div>
      <RadioCardGroup
        legend="Délka konzultace"
        name="duration"
        value={String(duration) as '30' | '50'}
        onChange={(v) => setDuration(Number(v) as ConsultationDuration)}
        options={[
          { value: '30', label: '30 minut', description: 'Kratší úvodní rozhovor' },
          { value: '50', label: '50 minut', description: 'Běžná délka konzultace' },
        ]}
      />
      {errors.form && (
        <Alert tone="error" live>
          {errors.form}
        </Alert>
      )}
      <Button type="submit" loading={pending} disabled={disabled} icon={<CalendarPlus aria-hidden className="size-4" />}>
        Přidat termín
      </Button>
    </form>
  );
}

function SlotList({ items, now, onWithdraw, onCancelBooked }: { items: OwnSlotView[]; now: Date; onWithdraw: (v: OwnSlotView) => void; onCancelBooked: (v: OwnSlotView) => void }) {
  return (
    <ul className="space-y-2.5">
      {items.map((view) => (
        <li key={view.slot.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <DateBlock iso={view.slot.startsAt} muted={view.state === 'withdrawn' || view.state === 'past'} />
            <div className="min-w-0">
              <p className="font-medium first-letter:uppercase">{formatDayLong(view.slot.startsAt)}</p>
              <p className="text-sm text-muted">
                {formatTimeRange(view.slot.startsAt, view.slot.durationMinutes)} · {view.slot.durationMinutes} minut
                {view.clientLabel && view.state !== 'open' ? ` · klient ${view.clientLabel}` : ''}
              </p>
              <div className="mt-1.5">
                <SlotStateBadge view={view} now={now} />
              </div>
            </div>
          </div>
          {view.canWithdraw && (
            <Button size="sm" variant="secondary" icon={<Trash2 aria-hidden className="size-4" />} onClick={() => onWithdraw(view)}>
              Zrušit volný termín
            </Button>
          )}
          {view.canCancelBooking && (
            <Button size="sm" variant="secondary" className="text-danger-strong" icon={<CalendarX2 aria-hidden className="size-4" />} onClick={() => onCancelBooked(view)}>
              Zrušit rezervovaný termín
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Availability() {
  usePageTitle('Termíny');
  const { availability, profiles } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const toast = useToast();
  const status = profiles.getOwnStatus();
  const slots = availability.listOwn();
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [withdrawTarget, setWithdrawTarget] = useState<OwnSlotView | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OwnSlotView | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdraw, withdrawing] = useAction(availability.withdrawSlot);

  if (status?.kind !== 'approved') return null;
  const suspended = status.profile.status === 'suspended';
  const upcoming = slots.filter((v) => Date.parse(v.slot.startsAt) > now.getTime() && v.state !== 'withdrawn');
  const history = slots.filter((v) => !(Date.parse(v.slot.startsAt) > now.getTime() && v.state !== 'withdrawn')).reverse();
  const items = tab === 'upcoming' ? upcoming : history;

  return (
    <div className="space-y-8">
      <PageHeader title="Termíny" description="Vypisuj termíny, které ti vyhovují. Klienti uvidí jen volné termíny v budoucnu." />
      <ProfileNotices profile={status.profile} />

      <Card as="section" aria-labelledby="add-title">
        <SectionTitle id="add-title" description="Nový termín se nesmí překrývat s jiným tvým vypsaným termínem.">
          Přidat termín
        </SectionTitle>
        <AddSlotForm disabled={suspended} />
      </Card>

      <section aria-labelledby="week-title">
        <SectionTitle id="week-title">Týdenní rozvrh</SectionTitle>
        <WeekSchedule slots={slots} now={now} />
      </section>

      <section aria-labelledby="list-title">
        <SectionTitle id="list-title">Seznam termínů</SectionTitle>
        <div role="tablist" aria-label="Filtr termínů" className="mb-4 inline-flex rounded-full bg-sage-100 p-1">
          {(
            [
              ['upcoming', `Nadcházející (${upcoming.length})`],
              ['history', `Proběhlé a zrušené (${history.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn('min-h-10 rounded-full px-4 text-sm font-medium transition-colors', tab === key ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {items.length === 0 ? (
            <EmptyState title={tab === 'upcoming' ? 'Nemáš vypsané žádné nadcházející termíny' : 'Historie je zatím prázdná'}>
              {tab === 'upcoming' ? 'Přidej první termín formulářem výše.' : 'Proběhlé termíny tu zůstávají jako historie a nelze je mazat.'}
            </EmptyState>
          ) : (
            <SlotList items={items} now={now} onWithdraw={setWithdrawTarget} onCancelBooked={setCancelTarget} />
          )}
          {tab === 'history' && items.length > 0 && <p className="mt-3 text-xs text-muted">Proběhlé konzultace zůstávají v historii a nelze je rušit.</p>}
        </div>
      </section>

      <ConfirmDialog
        open={withdrawTarget !== null}
        onCancel={() => {
          setWithdrawTarget(null);
          setWithdrawError(null);
        }}
        icon={<Trash2 aria-hidden />}
        title="Zrušit volný termín?"
        description={withdrawTarget ? `${formatDateTime(withdrawTarget.slot.startsAt, now)} (${withdrawTarget.slot.durationMinutes} minut)` : undefined}
        confirmLabel="Zrušit termín"
        cancelLabel="Ponechat"
        loading={withdrawing}
        onConfirm={async () => {
          if (!withdrawTarget) return;
          const result = await withdraw(withdrawTarget.slot.id);
          if (!result) return;
          if (result.ok) {
            toast('Volný termín je zrušený.');
            setWithdrawTarget(null);
            setWithdrawError(null);
          } else setWithdrawError(result.error.message);
        }}
      >
        Termín zatím nikdo nerezervoval. Po zrušení se klientům přestane nabízet.
        {withdrawError && (
          <Alert tone="error" live className="mt-3">
            {withdrawError}
          </Alert>
        )}
      </ConfirmDialog>

      <CancelBookedDialog
        now={now}
        target={
          cancelTarget?.appointment
            ? { appointmentId: cancelTarget.appointment.id, startsAt: cancelTarget.slot.startsAt, clientLabel: cancelTarget.clientLabel ?? '' }
            : null
        }
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
